// 通道 B：以本機已登入的 `claude -p` 訂閱制 CLI 串流生成 Stage 1 星系，經 IntentNdjsonSplitter 切成 NDJSON 事件。
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { IntentNdjsonSplitter, SPAWNER_SYSTEM_PROMPT, buildSpawnerUserMessage } from "../../../libs/epistemic/src/index.ts";
import { repairAnalysis } from "../../../libs/core/src/index.ts";

// Stage 1 拆解決定整個星系的品質，預設用 Opus；INTENT_GALAXY_MODEL 可改用其他模型別名或完整 ID。
export const DEFAULT_MODEL = "opus";

let runSeq = 0;

/** 從模型輸出中取出第一個完整的根物件：略過字串內的括號，忽略前後的說明文字或 ``` 圍欄。 */
export function extractRootObject(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === "\"") inStr = false; continue; }
    if (c === "\"") inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) { try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; } }
  }
  return null;
}

/**
 * 啟動一次生成。onEvent 依序收到 { t: "progress", thinkingTokens }（模型思考中）與 splitter 事件（skeleton/node/edges/archetype/done），
 * 最後收到 { t: "repaired", analysis, findings } 或 { t: "error" }。回傳 abort()。
 */
export function spawnGalaxy(goal, onEvent, { bin = process.env.INTENT_GALAXY_CLAUDE_BIN || "claude", model = process.env.INTENT_GALAXY_MODEL || DEFAULT_MODEL, effort = process.env.INTENT_GALAXY_EFFORT, timeoutMs = 300_000 } = {}) {
  const runId = ++runSeq;
  const splitter = new IntentNdjsonSplitter(runId);
  const args = ["-p", buildSpawnerUserMessage(goal), "--system-prompt", SPAWNER_SYSTEM_PROMPT,
    "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--tools", "", "--no-session-persistence"];
  if (model) args.push("--model", model);
  if (effort) args.push("--effort", effort);
  const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
  let text = "", sawDelta = false, finished = false, lineBuf = "", stderr = "", resultError = "";
  const finish = (ev) => { if (finished) return; finished = true; clearTimeout(timer); onEvent(ev); };
  // splitter 的 error 只代表串流形狀不完整；最終成敗以收尾時的完整 JSON 解析與修復管線為準。
  const forward = (evs) => { for (const ev of evs) if (ev.t !== "error") onEvent(ev); };
  const feed = (chunk) => { text += chunk; forward(splitter.push(chunk)); };
  const timer = setTimeout(() => { child.kill(); finish({ t: "error", runId, code: "timeout", retryable: true }); }, timeoutMs);

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (data) => {
    lineBuf += data;
    let nl;
    while ((nl = lineBuf.indexOf("\n")) >= 0) {
      const line = lineBuf.slice(0, nl).trim(); lineBuf = lineBuf.slice(nl + 1);
      if (!line) continue;
      let msg; try { msg = JSON.parse(line); } catch { continue; }
      const delta = msg.type === "stream_event" && msg.event?.type === "content_block_delta" && msg.event.delta?.type === "text_delta" ? msg.event.delta.text : null;
      if (delta) { sawDelta = true; feed(delta); }
      // Opus 會先思考數分鐘才輸出 JSON；把思考 token 數轉給 UI 當進度。
      else if (msg.type === "system" && msg.subtype === "thinking_tokens") onEvent({ t: "progress", runId, thinkingTokens: msg.estimated_tokens });
      else if (msg.type === "result" && (msg.is_error || msg.subtype !== "success")) resultError = String(msg.result ?? msg.subtype ?? "");
      else if (msg.type === "assistant" && !sawDelta && !msg.error) {
        // 沒有 partial 串流時退回整段 assistant 訊息。
        for (const block of msg.message?.content ?? []) if (block.type === "text") feed(block.text);
      }
    }
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (d) => { stderr = (stderr + d).slice(-2000); });
  child.on("error", (err) => finish({ t: "error", runId, code: "spawn_failed", retryable: false, detail: err.message }));
  child.on("close", (code) => {
    if (finished) return;
    forward(splitter.end());
    const parsed = extractRootObject(text);
    if (!parsed) {
      // 保留原始輸出供除錯：模型偶爾產出無法解析的 JSON。
      let rawFile = "";
      if (text) { rawFile = path.join(os.tmpdir(), `intent-galaxy-run-${Date.now()}.txt`); fs.writeFileSync(rawFile, text); }
      const detail = resultError || stderr.trim() || (rawFile ? `原始輸出已存到 ${rawFile}` : "模型沒有輸出文字");
      return finish({ t: "error", runId, code: code === 0 && !resultError ? "bad_json" : "cli_failed", retryable: true, detail: detail.slice(-500) });
    }
    const repaired = repairAnalysis(parsed);
    finish(repaired.ok
      ? { t: "repaired", runId, analysis: repaired.analysis, findings: repaired.findings }
      : { t: "error", runId, code: "repair_failed", retryable: true, findings: repaired.findings });
  });
  return () => { if (!finished) { child.kill(); finish({ t: "error", runId, code: "aborted", retryable: true }); } };
}
