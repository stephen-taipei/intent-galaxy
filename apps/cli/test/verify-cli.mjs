// apps/cli 整合測試：HTTP 防護、/api/spawn 串流（假 claude）、Stdio MCP 灌入 → /api/lock 回傳 AST。
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { extractRootObject } from "../src/spawn.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const BIN = path.join(ROOT, "apps/cli/bin/intent-galaxy.mjs");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "intent-galaxy-"));
const fakeClaude = path.join(tmp, "fake-claude.mjs");
fs.writeFileSync(fakeClaude, `#!/usr/bin/env node
const { SAMPLE_GALAXY } = await import(${JSON.stringify(path.join(ROOT, "apps/web/sample-galaxy.js"))});
const text = "\`\`\`json\\n" + JSON.stringify(SAMPLE_GALAXY) + "\\n\`\`\`";
const out = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
out({ type: "system", subtype: "thinking_tokens", estimated_tokens: 150 });
for (let i = 0; i < text.length; i += 97) out({ type: "stream_event", event: { type: "content_block_delta", delta: { type: "text_delta", text: text.slice(i, i + 97) } } });
out({ type: "result", subtype: "success" });
`, { mode: 0o755 });

const child = spawn(process.execPath, [BIN, "--port", "0"], {
  cwd: tmp, stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, INTENT_GALAXY_CLAUDE_BIN: fakeClaude, INTENT_GALAXY_NO_OPEN: "1" },
});
let stderr = "";
child.stderr.setEncoding("utf8");
const port = await new Promise((resolve, reject) => {
  child.stderr.on("data", (d) => { stderr += d; const m = stderr.match(/127\.0\.0\.1:(\d+)/); if (m) resolve(Number(m[1])); });
  child.on("exit", () => reject(new Error(`CLI exited early:\n${stderr}`)));
});
const base = `http://127.0.0.1:${port}`;

// MCP：逐行讀取 JSON-RPC 回應
const pending = new Map();
let out = "";
child.stdout.setEncoding("utf8");
child.stdout.on("data", (d) => {
  out += d;
  let nl;
  while ((nl = out.indexOf("\n")) >= 0) {
    const msg = JSON.parse(out.slice(0, nl)); out = out.slice(nl + 1);
    pending.get(msg.id)?.(msg); pending.delete(msg.id);
  }
});
let rpcId = 0;
const rpc = (method, params) => new Promise((resolve) => {
  const id = ++rpcId; pending.set(id, resolve);
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
});
const post = (p, body, headers = {}) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
const rawGet = (p, headers = {}) => new Promise((resolve) => http.get({ host: "127.0.0.1", port, path: p, headers }, (res) => { res.resume(); resolve(res.statusCode); }));

// 模型輸出擷取：略過 ``` 圍欄、尾端說明文字與字串內的括號
assert.deepEqual(extractRootObject('```json\n{"a":"}{","b":{"c":1}}\n```\n補充 {x}'), { a: "}{", b: { c: 1 } });
assert.equal(extractRootObject("沒有 JSON"), null);
assert.equal(extractRootObject('{"a":'), null);

try {
  // HTTP 防護
  for (const p of ["/libs/../package.json", "/%2e%2e/package.json", "/..%2f..%2fpackage.json", "/%2e%2e/libs/core/src/verify.ts/../../../../package.json"]) assert.equal(await rawGet(p), 404, p);
  assert.equal(await rawGet("/"), 200);
  assert.equal(await rawGet("/", { Host: "evil.example:80" }), 421);
  assert.equal((await post("/api/spawn", { goal: "x" }, { Origin: "https://evil.example" })).status, 403);
  assert.equal((await fetch(base + "/api/spawn", { method: "POST", body: "goal=x" })).status, 400);
  const lib = await (await fetch(base + "/libs/core/src/galaxy.ts")).text();
  assert.ok(lib.includes("export function solveGalaxy") && !lib.includes(": GalaxySolution"), "libs/*.ts 必須剝除型別");

  // 通道 B：/api/spawn 串流
  const lines = (await (await post("/api/spawn", { goal: "開源還是閉源" })).text()).trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual([lines[0].t, lines[0].thinkingTokens], ["progress", 150]);
  assert.equal(lines[1].t, "skeleton");
  assert.equal(lines.filter((e) => e.t === "node").length, 12);
  assert.equal(lines.at(-1).t, "repaired");
  assert.equal(lines.at(-1).analysis.nodes.N7.label, "暗池工單賞金撮合板");

  // 通道 A：MCP 反向灌入
  const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
  assert.equal(init.result.serverInfo.name, "intent-galaxy");
  const tools = (await rpc("tools/list")).result.tools.map((t) => t.name);
  assert.deepEqual(tools, ["intent_spawner_prompt", "intent_open_galaxy"]);
  const prompt = await rpc("tools/call", { name: "intent_spawner_prompt", arguments: { goal: "要不要開源" } });
  assert.ok(prompt.result.content[0].text.includes("INTENT-SPAWNER"));
  const rejected = await rpc("tools/call", { name: "intent_open_galaxy", arguments: { analysis: { schema_version: "0" } } });
  assert.equal(rejected.result.isError, true);

  const { SAMPLE_GALAXY } = await import(path.join(ROOT, "apps/web/sample-galaxy.js"));
  const opened = rpc("tools/call", { name: "intent_open_galaxy", arguments: { goal: "要不要開源", analysis: JSON.stringify(SAMPLE_GALAXY) } });
  let galaxy;
  for (let i = 0; i < 50 && !(galaxy?.goal === "要不要開源"); i++) { await new Promise((r) => setTimeout(r, 20)); galaxy = await (await fetch(base + "/api/galaxy")).json(); }
  assert.equal(galaxy.source, "mcp");
  const lock = await post("/api/lock", { galaxyId: galaxy.id, baseKey: "alpha", overrides: {}, ast: "# LOCKED INTENT AST (test)" });
  assert.equal(lock.status, 200);
  const result = await opened;
  assert.equal(result.result.content[0].text, "# LOCKED INTENT AST (test)");
  const lockFile = JSON.parse(fs.readFileSync(path.join(tmp, ".intent.lock.json"), "utf8"));
  assert.equal(lockFile.base, "alpha");
  assert.equal(lockFile.goal, "要不要開源");
  assert.ok(!/ExperimentalWarning/.test(stderr), stderr);
  console.log("✅ apps/cli verified!");
} finally {
  child.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
}
