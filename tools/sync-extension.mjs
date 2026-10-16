#!/usr/bin/env node
// 把 apps/web 星系元件與 libs/*.ts（剝除型別、.ts → .js）同步進 Chrome / Firefox 擴充功能目錄。
// apps/extension 是擴充功能原始碼唯一來源；Firefox 目錄只保留自己的 manifest.json，其餘由本腳本複製。
// --zip：另外在 dist-ext/ 產出可上傳 Chrome Web Store 與 Firefox AMO 的 zip。
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, isMain, libSources, transpileTo } from "./transpile.mjs";

const SOURCES = ["apps/web/galaxy-overlay.js", "apps/web/sample-galaxy.js", ...libSources("protocol", "core"), "libs/epistemic/src/prompt.ts"];
const SHARED = ["content.js", "background.js", "panel.html", "panel.js"];

export function buildGalaxyBundle(outDir) {
  fs.rmSync(path.join(outDir, "galaxy"), { recursive: true, force: true });
  for (const rel of SOURCES) transpileTo(path.join(outDir, "galaxy"), rel);
}

if (isMain(import.meta.url)) {
  const chrome = path.join(ROOT, "apps/extension"), firefox = path.join(ROOT, "apps/extension-firefox");
  buildGalaxyBundle(chrome);
  buildGalaxyBundle(firefox);
  for (const f of SHARED) fs.copyFileSync(path.join(chrome, f), path.join(firefox, f));
  fs.cpSync(path.join(chrome, "icons"), path.join(firefox, "icons"), { recursive: true });
  console.log(`✅ synced ${SOURCES.length} galaxy modules → apps/extension, apps/extension-firefox`);
  if (process.argv.includes("--zip")) {
    const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const out = path.join(ROOT, "dist-ext");
    fs.mkdirSync(out, { recursive: true });
    for (const [dir, name] of [[chrome, "chrome"], [firefox, "firefox"]]) {
      const zip = path.join(out, `intent-galaxy-${name}-${version}.zip`);
      fs.rmSync(zip, { force: true });
      execFileSync("zip", ["-qr", zip, "."], { cwd: dir });
      console.log(`📦 ${path.relative(ROOT, zip)}`);
    }
  }
}
