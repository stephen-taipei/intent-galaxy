// 通道 B：以本機已登入的 `claude -p` 訂閱制 CLI 串流生成 Stage 1 星系，經 IntentNdjsonSplitter 切成 NDJSON 事件。
import { spawn } from "node:child_process";
import { IntentNdjsonSplitter, SPAWNER_SYSTEM_PROMPT, buildSpawnerUserMessage } from "../../../libs/epistemic/src/index.ts";
import { repairAnalysis } from "../../../libs/core/src/index.ts";

let runSeq = 0;

/**
 * 啟動一次生成。onEvent 依序收到 splitter 事件（skeleton/node/edges/archetype/done/error），
 * 最後收到 { t: "repaired", analysis, findings } 或 { t: "error" }。回傳 abort()。
 */
export function spawnGalaxy(goal, onEvent, { bin = process.env.INTENT_GALAXY_CLAUDE_BIN || "claude", model = process.env.INTENT_GALAXY_MODEL, timeoutMs = 180_000 } = {}) {
  const runId = ++runSeq;
  const splitter = new IntentNdjsonSplitter(runId);
  const args = ["-p", buildSpawnerUserMessage(goal), "--system-prompt", SPAWNER_SYSTEM_PROMPT,
    "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--tools", "", "--no-session-persistence"];
  if (model) args.push("--model", model);
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
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    let parsed = null;
    try { if (start >= 0 && end > start) parsed = JSON.parse(text.slice(start, end + 1)); } catch { /* 交給下方回報 */ }
    if (!parsed) return finish({ t: "error", runId, code: code === 0 && !resultError ? "bad_json" : "cli_failed", retryable: true, detail: (resultError || stderr.trim()).slice(-500) });
    const repaired = repairAnalysis(parsed);
    finish(repaired.ok
      ? { t: "repaired", runId, analysis: repaired.analysis, findings: repaired.findings }
      : { t: "error", runId, code: "repair_failed", retryable: true, findings: repaired.findings });
  });
  return () => { if (!finished) { child.kill(); finish({ t: "error", runId, code: "aborted", retryable: true }); } };
}
