#!/usr/bin/env node
// npx intent-engineering-galaxy：127.0.0.1 星系伺服器 + Stdio MCP Server（stdin 非 TTY 時啟用）。
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createGalaxyServer } from "../src/server.mjs";
import { startMcp } from "../src/mcp.mjs";
import { initHook } from "../src/init-hook.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
// 原始碼執行時 ROOT 是 repo 根目錄；npm 套件執行時 ROOT 是 dist/，package.json 在上一層。
const pkgFile = [path.join(ROOT, "package.json"), path.join(ROOT, "../package.json")].find((f) => fs.existsSync(f));
const { version } = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
const DEFAULT_PORT = 4787;

const argv = process.argv.slice(2);
if (argv[0] === "init-hook") {
  try { initHook(process.cwd()); process.exit(0); } catch (e) { console.error(`✗ ${e.message}`); process.exit(1); }
}
const flag = (name) => argv.includes(name);
const portArg = argv.indexOf("--port");
const preferredPort = Number(portArg >= 0 ? argv[portArg + 1] : process.env.INTENT_GALAXY_PORT ?? DEFAULT_PORT);
const standalone = flag("--standalone") || process.stdin.isTTY;
const log = (msg) => process.stderr.write(`[intent-galaxy] ${msg}\n`);

function openBrowser(url) {
  if (flag("--no-open") || process.env.INTENT_GALAXY_NO_OPEN) return;
  const [cmd, args] = process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  execFile(cmd, args, () => {});
}

const scopeArg = argv.indexOf("--scope");
// 鎖檔的 scopePaths：14 天後哪些路徑的 commit 必須先驗屍；預設整個 repo。
const scopePaths = scopeArg >= 0 ? argv[scopeArg + 1].split(",").map((s) => s.trim()).filter(Boolean) : ["*"];
const galaxy = createGalaxyServer({ root: ROOT, scopePaths, log });
const port = await galaxy.listen(Number.isInteger(preferredPort) ? preferredPort : DEFAULT_PORT);
const url = `http://127.0.0.1:${port}`;

if (standalone) {
  console.log(`🌌 intent-engineering-galaxy ${version} listening on ${url} (127.0.0.1 only, 0 dependencies)`);
  openBrowser(url);
} else {
  log(`MCP stdio ready · galaxy UI on ${url}`);
  const publish = galaxy.hub.publish;
  // MCP 灌入新星系時喚醒瀏覽器 UI。
  galaxy.hub.publish = (...args) => { const r = publish(...args); openBrowser(r.url); return r; };
  startMcp(galaxy.hub, { version });
}
