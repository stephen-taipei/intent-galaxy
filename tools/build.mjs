#!/usr/bin/env node
// npm 套件建置：Node 不會剝除 node_modules 內 .ts 的型別，所以發佈前把 CLI、Web UI 與 libs 轉成純 .js 放進 dist/。
// dist/ 保留與原始碼相同的相對結構，CLI 的 ../../../libs 路徑不必改寫。
import fs from "node:fs";
import path from "node:path";
import { ROOT, isMain, libSources, transpileTo } from "./transpile.mjs";

export function buildDist(outDir = path.join(ROOT, "dist")) {
  fs.rmSync(outDir, { recursive: true, force: true });
  const cli = ["bin", "src", "hooks"].flatMap((d) => {
    const dir = path.join(ROOT, "apps/cli", d);
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".mjs")).map((f) => `apps/cli/${d}/${f}`) : [];
  });
  const web = ["apps/web/index.html", "apps/web/galaxy-overlay.js", "apps/web/sample-galaxy.js"];
  const files = [...cli, ...web, ...libSources("protocol", "core", "epistemic")];
  for (const rel of files) transpileTo(outDir, rel);
  fs.chmodSync(path.join(outDir, "apps/cli/bin/intent-galaxy.mjs"), 0o755);
  return files.length;
}

if (isMain(import.meta.url)) console.error(`✅ built ${buildDist()} files → dist/`);
