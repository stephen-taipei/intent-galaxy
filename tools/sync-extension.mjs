#!/usr/bin/env node
// 把 apps/web 星系元件與 libs/*.ts（剝除型別、.ts → .js）同步進 Chrome / Firefox 擴充功能目錄。
// apps/extension 是擴充功能原始碼唯一來源；Firefox 目錄只保留自己的 manifest.json，其餘由本腳本複製。
import fs from "node:fs";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = [
  "apps/web/galaxy-overlay.js",
  "apps/web/sample-galaxy.js",
  "libs/protocol/src/index.ts",
  ...fs.readdirSync(path.join(ROOT, "libs/core/src")).filter((f) => f.endsWith(".ts") && !f.startsWith("verify")).map((f) => `libs/core/src/${f}`),
];
const SHARED = ["content.js", "panel.html", "panel.js"];

const emitWarning = process.emitWarning;
process.emitWarning = (w, ...rest) => String(w?.message ?? w).includes("stripTypeScriptTypes") ? undefined : emitWarning.call(process, w, ...rest);

export function buildGalaxyBundle(outDir) {
  fs.rmSync(path.join(outDir, "galaxy"), { recursive: true, force: true });
  for (const rel of SOURCES) {
    let code = fs.readFileSync(path.join(ROOT, rel), "utf8");
    if (rel.endsWith(".ts")) code = stripTypeScriptTypes(code);
    code = code.replace(/(from\s+["'][^"']+)\.ts(["'])/g, "$1.js$2");
    const dest = path.join(outDir, "galaxy", rel.replace(/\.ts$/, ".js"));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, code);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const chrome = path.join(ROOT, "apps/extension"), firefox = path.join(ROOT, "apps/extension-firefox");
  buildGalaxyBundle(chrome);
  buildGalaxyBundle(firefox);
  for (const f of SHARED) fs.copyFileSync(path.join(chrome, f), path.join(firefox, f));
  console.log(`✅ synced ${SOURCES.length} galaxy modules → apps/extension, apps/extension-firefox`);
}
