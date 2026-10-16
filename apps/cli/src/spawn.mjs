// 通道 B：以本機 AI（Claude／Codex／Gemini／agy CLI，或各家 API）串流生成 Stage 1 星系，經 IntentNdjsonSplitter 切成 NDJSON 事件。
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { IntentNdjsonSplitter, SPAWNER_SYSTEM_PROMPT, buildSpawnerUserMessage } from "../../../libs/epistemic/src/index.ts";
import { repairAnalysis } from "../../../libs/core/src/index.ts";
import { binOf, cliArgs, getProvider, streamApi } from "./providers.mjs";

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
export function spawnGalaxy(goal, onEvent, { provider = process.env.INTENT_GALAXY_PROVIDER || "claude", model, effort = process.env.INTENT_GALAXY_EFFORT, timeoutMs = Number(process.env.INTENT_GALAXY_TIMEOUT_MS) || 600_000 } = {}) {
  const p = getProvider(provider);
  if (!p) { const runId = ++runSeq; queueMicrotask(() => onEvent({ t: "error", runId, code: "bad_provider", retryable: false, detail: `未知的供應商 ${provider}` })); return () => {}; }
  model ??= process.env.INTENT_GALAXY_MODEL || p.defaultModel || "";
  if (p.id === "claude") return spawnClaude(goal, onEvent, { bin: binOf(p), model, effort, timeoutMs });
  return spawnOther(p, goal, onEvent, { model, timeoutMs });
}

/** 收尾：取出完整 JSON → V1–V18 修復管線。Claude 與其他供應商共用。 */
function finalize(runId, text, { code = 0, failure = "" } = {}) {
  const parsed = extractRootObject(text);
  if (!parsed) {
    // 保留原始輸出供除錯：模型偶爾產出無法解析的 JSON。
    let rawFile = "";
    if (text) { rawFile = path.join(os.tmpdir(), `intent-galaxy-run-${Date.now()}.txt`); fs.writeFileSync(rawFile, text); }
    const detail = failure || (rawFile ? `原始輸出已存到 ${rawFile}` : "模型沒有輸出文字");
    return { t: "error", runId, code: code === 0 && !failure ? "bad_json" : "cli_failed", retryable: true, detail: detail.slice(-500) };
  }
  const repaired = repairAnalysis(parsed);
  return repaired.ok
    ? { t: "repaired", runId, analysis: repaired.analysis, findings: repaired.findings }
    : { t: "error", runId, code: "repair_failed", retryable: true, findings: repaired.findings };
}

/** Codex／Gemini／agy CLI 與 API 供應商：純文字輸出，邊收邊餵 splitter；沒有思考進度時每 5 秒回報已等待秒數。 */
function spawnOther(p, goal, onEvent, { model, timeoutMs }) {
  const runId = ++runSeq;
  const splitter = new IntentNdjsonSplitter(runId);
  const system = SPAWNER_SYSTEM_PROMPT, user = buildSpawnerUserMessage(goal);
  let text = "", finished = false, child = null;
  const started = Date.now();
  const controller = new AbortController();
  const finish = (ev) => { if (finished) return; finished = true; clearTimeout(timer); clearInterval(ticker); onEvent(ev); };
  // CLI 常在 JSON 前印說明文字；等到一行以 { 或 ```json 開頭才開始餵 splitter，避免把說明裡的引號當成 JSON。
  let streamed = -1;
  const feed = (chunk) => {
    text += chunk;
    if (streamed < 0) {
      const m = /(^|\n)\s*(?:```json\s*)?\{/.exec(text);
      if (!m) return;
      streamed = text.indexOf("{", m.index);
      chunk = text.slice(streamed);
    }
    for (const ev of splitter.push(chunk)) if (ev.t !== "error") onEvent(ev);
  };
  const timer = setTimeout(() => { controller.abort(); child?.kill(); finish({ t: "error", runId, code: "timeout", retryable: true }); }, timeoutMs);
  const ticker = setInterval(() => { if (!text) onEvent({ t: "progress", runId, elapsedSec: Math.round((Date.now() - started) / 1000), provider: p.label }); }, 5000);

  if (p.kind !== "cli") {
    streamApi(p.id, { system, user, model, signal: controller.signal, onText: feed })
      .then(() => finish(finalize(runId, text)))
      .catch((err) => finish({ t: "error", runId, code: controller.signal.aborted ? "aborted" : "api_failed", retryable: true, detail: String(err.message).slice(0, 500) }));
  } else {
    const outFile = path.join(os.tmpdir(), `intent-galaxy-${p.id}-${process.pid}-${runId}.txt`);
    const { args } = cliArgs(p.id, { system, user, model, outFile });
    let stderr = "";
    child = spawn(binOf(p), args, { stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.setEncoding("utf8");
    // codex 的 stdout 夾雜進度，最終答案以 -o 檔為準；其他 CLI 直接串流 stdout。
    child.stdout.on("data", (d) => { if (p.id === "codex") return; feed(d); });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (d) => { stderr = (stderr + d).slice(-2000); });
    child.on("error", (err) => finish({ t: "error", runId, code: "spawn_failed", retryable: false, detail: err.message }));
    child.on("close", (code) => {
      if (finished) return;
      if (p.id === "codex" && fs.existsSync(outFile)) { feed(fs.readFileSync(outFile, "utf8")); fs.rmSync(outFile, { force: true }); }
      finish(finalize(runId, text, { code, failure: code === 0 ? "" : stderr.trim() || `${p.bin} 結束代碼 ${code}` }));
    });
  }
  return () => { if (!finished) { controller.abort(); child?.kill(); finish({ t: "error", runId, code: "aborted", retryable: true }); } };
}

function spawnClaude(goal, onEvent, { bin, model, effort, timeoutMs }) {
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
    finish(finalize(runId, text, { code, failure: resultError || (code === 0 ? "" : stderr.trim()) }));
  });
  return () => { if (!finished) { child.kill(); finish({ t: "error", runId, code: "aborted", retryable: true }); } };
}
