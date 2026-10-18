// tools/sync-extension.mjs 測試：產出的擴充功能模組不得殘留 .ts import，且可直接以 ESM 載入並求解。
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGalaxyBundle, packageVersion } from "./sync-extension.mjs";
import { LOCALES } from "./i18n.mjs";
import { sampleSuffix } from "../apps/web/i18n.js";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const out = fs.mkdtempSync(path.join(os.tmpdir(), "intent-galaxy-ext-"));
try {
  buildGalaxyBundle(out);
  const files = fs.readdirSync(path.join(out, "galaxy"), { recursive: true }).filter((f) => f.endsWith(".js"));
  assert.ok(files.length >= 8, files.join());
  for (const f of files) assert.ok(!/from\s+["'][^"']+\.ts["']/.test(fs.readFileSync(path.join(out, "galaxy", f), "utf8")), `${f} 殘留 .ts import`);
  const core = await import(path.join(out, "galaxy/libs/core/src/index.js"));
  const { SAMPLE_GALAXY } = await import(path.join(out, "galaxy/apps/web/sample-galaxy.js"));
  assert.equal(core.solveGalaxy(core.repairAnalysis(SAMPLE_GALAXY).analysis, "beta", new Map()).status, "SAT");
  // 擴充功能的生活題型示範：修復管線零發現、三張卡都可行
  for (const file of fs.readdirSync(path.join(ROOT_DIR, "apps/extension/samples")).filter((f) => f.endsWith(".js"))) {
    const galaxy = Object.values(await import(path.join(ROOT_DIR, "apps/extension/samples", file)))[0];
    const repaired = core.repairAnalysis(galaxy);
    assert.deepEqual(repaired.findings, [], `${file}: ${JSON.stringify(repaired.findings)}`);
    for (const key of ["alpha", "beta", "gamma"]) assert.equal(core.solveGalaxy(repaired.analysis, key, new Map()).status, "SAT", `${file} ${key}`);
  }
  // 示範星系的各語系版本：每個語系都要有，結構（節點、邊、策略卡）必須與繁中原版一致，只有文字不同
  const KEEP = new Set(["schema_version", "dim", "type", "from", "to", "fatal", "key", "attack", "hits"]);
  const shape = (v, k) => Array.isArray(v) ? v.map((x) => shape(x)) : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, shape(x, kk)])) : typeof v === "string" && !KEEP.has(k) ? "" : v;
  const suffixes = [...new Set(LOCALES.map((code) => sampleSuffix(code)))].filter(Boolean);
  const groups = ["apps/web/sample-galaxy", "apps/extension/samples/dishwasher", "apps/extension/samples/sweet-sour"].map((b) => [b, ".js", ...suffixes.map((s) => `${s}.js`)]);
  for (const [base, ...exts] of groups) {
    const [orig, ...variants] = await Promise.all(exts.map(async (e) => Object.values(await import(path.join(ROOT_DIR, base + e)))[0]));
    for (const [i, g] of variants.entries()) {
      assert.deepEqual(shape(g), shape(orig), `${base}${exts[i + 1]} 結構與繁中版不同`);
      assert.deepEqual(core.repairAnalysis(g).findings, [], `${base}${exts[i + 1]}`);
    }
  }
  // 擴充功能版號必須與 npm 套件一致（npm run build:ext 會自動對齊）
  for (const dir of ["apps/extension", "apps/extension-firefox"]) {
    const { version } = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, dir, "manifest.json"), "utf8"));
    assert.equal(version, packageVersion(), `${dir}/manifest.json version ${version} ≠ package.json；請執行 npm run build:ext`);
  }
  console.log("✅ tools/sync-extension verified!");
} finally {
  fs.rmSync(out, { recursive: true, force: true });
}
