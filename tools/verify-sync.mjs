// tools/sync-extension.mjs 測試：產出的擴充功能模組不得殘留 .ts import，且可直接以 ESM 載入並求解。
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildGalaxyBundle } from "./sync-extension.mjs";

const out = fs.mkdtempSync(path.join(os.tmpdir(), "intent-galaxy-ext-"));
try {
  buildGalaxyBundle(out);
  const files = fs.readdirSync(path.join(out, "galaxy"), { recursive: true }).filter((f) => f.endsWith(".js"));
  assert.ok(files.length >= 8, files.join());
  for (const f of files) assert.ok(!/from\s+["'][^"']+\.ts["']/.test(fs.readFileSync(path.join(out, "galaxy", f), "utf8")), `${f} 殘留 .ts import`);
  const core = await import(path.join(out, "galaxy/libs/core/src/index.js"));
  const { SAMPLE_GALAXY } = await import(path.join(out, "galaxy/apps/web/sample-galaxy.js"));
  assert.equal(core.solveGalaxy(core.repairAnalysis(SAMPLE_GALAXY).analysis, "beta", new Map()).status, "SAT");
  console.log("✅ tools/sync-extension verified!");
} finally {
  fs.rmSync(out, { recursive: true, force: true });
}
