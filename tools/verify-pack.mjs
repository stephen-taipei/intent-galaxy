// npm 套件端到端測試：npm pack → 安裝到空專案 → 從 node_modules 啟動 CLI（MCP stdio + HTTP）。
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT } from "./transpile.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "intent-galaxy-pack-"));
const npm = (args, cwd) => execFileSync("npm", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
try {
  const [{ filename, files }] = JSON.parse(npm(["pack", "--json", "--pack-destination", tmp], ROOT));
  const names = files.map((f) => f.path);
  assert.ok(names.includes("dist/apps/cli/bin/intent-galaxy.mjs") && names.includes("LICENSE") && names.includes("README.md"));
  assert.ok(!names.some((n) => /^(reviews|libs|apps|tools)\//.test(n) || n.endsWith(".ts")), `不該打包：${names.filter((n) => !n.startsWith("dist/"))}`);
  fs.writeFileSync(path.join(tmp, "package.json"), '{"name":"pack-test","private":true}');
  npm(["install", "--no-audit", "--no-fund", "--ignore-scripts", path.join(tmp, filename)], tmp);

  const child = spawn(path.join(tmp, "node_modules/.bin/intent-galaxy"), ["--port", "0"], { cwd: tmp, env: { ...process.env, INTENT_GALAXY_NO_OPEN: "1" } });
  let stderr = "", stdout = "";
  child.stderr.on("data", (d) => { stderr += d; });
  child.stdout.on("data", (d) => { stdout += d; });
  const port = await new Promise((resolve, reject) => {
    child.stderr.on("data", () => { const m = stderr.match(/127\.0\.0\.1:(\d+)/); if (m) resolve(Number(m[1])); });
    child.on("exit", () => reject(new Error(`安裝後的 CLI 無法啟動：\n${stderr}`)));
  });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) + "\n");
  for (let i = 0; i < 100 && !stdout.includes("\n"); i++) await new Promise((r) => setTimeout(r, 20));
  const tools = JSON.parse(stdout.split("\n")[0]).result.tools.map((t) => t.name);
  assert.ok(tools.includes("intent_open_galaxy"), tools.join());
  for (const p of ["/", "/galaxy-overlay.js", "/libs/core/src/index.js"]) {
    assert.equal((await fetch(`http://127.0.0.1:${port}${p}`)).status, 200, p);
  }
  child.kill();
  assert.ok(!/Error|Warning/.test(stderr), stderr);
  // init-hook 必須能從已安裝的套件找到 kill-gate.mjs 範本
  const repo = path.join(tmp, "repo");
  fs.mkdirSync(repo);
  const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
  execFileSync("git", ["init", "-q"], { cwd: repo, env: gitEnv });
  execFileSync(path.join(tmp, "node_modules/.bin/intent-galaxy"), ["init-hook"], { cwd: repo, env: gitEnv, stdio: "ignore" });
  assert.ok(fs.existsSync(path.join(repo, ".intent/hooks/kill-gate.mjs")));
  console.log(`✅ npm package verified (${names.length} files)`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
