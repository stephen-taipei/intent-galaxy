import assert from "node:assert/strict";
import { IntentNdjsonSplitter } from "./splitter.ts";
const sample = JSON.stringify({
  schema_version: "1.0", _scratchpad: { s: "hidden" },
  core: { decision: "D", metric: "M" }, quadrants: { Q1: {}, Q2: {}, Q3: {}, Q4: {} },
  nodes: Object.fromEntries(Array.from({ length: 12 }, (_, i) => ["N" + (i + 1), { label: "L" }])),
  edges: [], archetypes: { alpha: {} }, withheld_kill: { label: "K" }
});
const sp = new IntentNdjsonSplitter(1); const evs = [...sp.push(sample), ...sp.end()];
assert.equal(evs.filter(e => e.t === "node").length, 12);
console.log("✅ libs/epistemic verified!");
import { SPAWNER_SYSTEM_PROMPT, buildSpawnerUserMessage } from "./prompt.ts";
assert.ok(SPAWNER_SYSTEM_PROMPT.startsWith("You are INTENT-SPAWNER."));
assert.ok(SPAWNER_SYSTEM_PROMPT.includes("export interface IntentAnalysisResponse"));
assert.ok(buildSpawnerUserMessage("  要不要開源 ").includes("GOAL: 要不要開源\n"));
console.log("✅ libs/epistemic prompt verified!");
