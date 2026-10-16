// 多供應商生成：OpenAI 相容 SSE、Anthropic SSE、Gemini／Codex CLI 轉接層，全部以本機假端點驗證，不打真實 API。
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { SAMPLE_GALAXY } = await import(path.join(ROOT, "apps/web/sample-galaxy.js"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "intent-providers-"));
const answer = "好的，以下是星系：\n```json\n" + JSON.stringify(SAMPLE_GALAXY) + "\n```";
const chunks = answer.match(/[\s\S]{1,200}/g);

// 假 API：/chat/completions（OpenAI 相容）與 /messages（Anthropic），都以 SSE 分段回傳；/models 回傳模型清單。
const seen = [];
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => { body += c; });
  req.on("end", () => {
    seen.push({ url: req.url, headers: req.headers, body: body && JSON.parse(body) });
    if (req.url.endsWith("/models")) { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ data: [{ id: "models/b-model" }, { id: "a-model" }] })); }
    res.writeHead(200, { "content-type": "text/event-stream" });
    if (req.url.endsWith("/chat/completions")) {
      for (const c of chunks) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`);
      res.end("data: [DONE]\n\n");
    } else {
      res.write(`event: message_start\ndata: ${JSON.stringify({ type: "message_start" })}\n\n`);
      for (const c of chunks) res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: c } })}\n\n`);
      res.end(`event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`);
    }
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

// 假 CLI：gemini 把答案印到 stdout；codex 把答案寫到 -o 指定的檔案、stdout 只印進度。
const fakeCli = (name, script) => { const f = path.join(tmp, name); fs.writeFileSync(f, `#!/usr/bin/env node\n${script}`, { mode: 0o755 }); return f; };
const answerFile = path.join(tmp, "answer.txt");
fs.writeFileSync(answerFile, answer);
const argsLog = path.join(tmp, "args.json");
Object.assign(process.env, {
  INTENT_GALAXY_OPENAI_BASE_URL: `${base}/v1`, INTENT_GALAXY_OPENAI_API_KEY: "test-key",
  INTENT_GALAXY_ANTHROPIC_BASE_URL: `${base}/v1`, ANTHROPIC_API_KEY: "test-anthropic",
  INTENT_GALAXY_GEMINI_BIN: fakeCli("gemini", `require("fs").appendFileSync(${JSON.stringify(argsLog)}, JSON.stringify(process.argv.slice(2)) + "\\n"); process.stdout.write(require("fs").readFileSync(${JSON.stringify(answerFile)}, "utf8"));`),
  INTENT_GALAXY_CODEX_BIN: fakeCli("codex", `const a = process.argv.slice(2); require("fs").appendFileSync(${JSON.stringify(argsLog)}, JSON.stringify(a) + "\\n"); console.log("thinking…"); require("fs").copyFileSync(${JSON.stringify(answerFile)}, a[a.indexOf("-o") + 1]);`),
});
delete process.env.OPENAI_API_KEY;

const { spawnGalaxy } = await import(path.join(ROOT, "apps/cli/src/spawn.mjs"));
const { detectProviders, listModels } = await import(path.join(ROOT, "apps/cli/src/providers.mjs"));
const run = (provider, model) => new Promise((resolve) => {
  const events = [];
  spawnGalaxy("要不要做多主題", (ev) => { events.push(ev); if (ev.t === "repaired" || ev.t === "error") resolve(events); }, { provider, model });
});

try {
  for (const [provider, model] of [["custom", "a-model"], ["anthropic", "claude-test"], ["gemini", ""], ["codex", "gpt-test"]]) {
    const events = await run(provider, model);
    const last = events.at(-1);
    assert.equal(last.t, "repaired", `${provider}: ${JSON.stringify(last)}`);
    assert.equal(last.analysis.archetypes.alpha.title, SAMPLE_GALAXY.archetypes.alpha.title);
    assert.equal(events.filter((e) => e.t === "node").length, 12, `${provider} 應逐顆串流 12 顆節點`);
  }
  const openaiReq = seen.find((r) => r.url === "/v1/chat/completions");
  assert.equal(openaiReq.headers.authorization, "Bearer test-key");
  assert.deepEqual([openaiReq.body.model, openaiReq.body.stream, openaiReq.body.messages[0].role], ["a-model", true, "system"]);
  const anthropicReq = seen.find((r) => r.url === "/v1/messages");
  assert.equal(anthropicReq.headers["x-api-key"], "test-anthropic");
  assert.ok(anthropicReq.body.system.startsWith("You are INTENT-SPAWNER."));
  const [geminiArgs, codexArgs] = fs.readFileSync(argsLog, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.ok(geminiArgs.includes("--approval-mode") && geminiArgs[geminiArgs.indexOf("--approval-mode") + 1] === "plan", "gemini 必須以唯讀 plan 模式執行");
  assert.ok(geminiArgs[geminiArgs.indexOf("-p") + 1].startsWith("You are INTENT-SPAWNER."), "非 Claude CLI 要把 system prompt 併入提示詞");
  assert.ok(codexArgs.includes("read-only") && codexArgs.includes("gpt-test"));

  // API 供應商沒有指定模型 → 明確錯誤，不送出請求
  const noModel = (await run("custom", "")).at(-1);
  assert.equal(noModel.t, "error");
  assert.match(noModel.detail, /需要指定模型/);
  assert.equal((await run("nope")).at(-1).code, "bad_provider");

  const detected = Object.fromEntries((await detectProviders()).map((p) => [p.id, p]));
  assert.equal(detected.openai.available, false);
  assert.match(detected.openai.hint, /OPENAI_API_KEY/);
  assert.equal(detected.anthropic.available, true);
  assert.equal(detected.gemini.available, true);
  assert.deepEqual(await listModels("custom"), ["a-model", "b-model"]);
  console.log("✅ multi-provider generation verified!");
} finally {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
