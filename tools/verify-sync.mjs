// tools/sync-extension.mjs 測試：產出的擴充功能模組不得殘留 .ts import，且可直接以 ESM 載入並求解。
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGalaxyBundle } from "./sync-extension.mjs";

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
  for (const file of fs.readdirSync(path.join(ROOT_DIR, "apps/extension/samples"))) {
    const galaxy = Object.values(await import(path.join(ROOT_DIR, "apps/extension/samples", file)))[0];
    const repaired = core.repairAnalysis(galaxy);
    assert.deepEqual(repaired.findings, [], `${file}: ${JSON.stringify(repaired.findings)}`);
    for (const key of ["alpha", "beta", "gamma"]) assert.equal(core.solveGalaxy(repaired.analysis, key, new Map()).status, "SAT", `${file} ${key}`);
  }
  console.log("✅ tools/sync-extension verified!");
} finally {
  fs.rmSync(out, { recursive: true, force: true });
}
