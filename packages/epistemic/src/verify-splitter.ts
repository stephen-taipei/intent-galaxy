import assert from "node:assert/strict";
import { IntentNdjsonSplitter } from "./splitter.ts";

const sample = JSON.stringify({
  schema_version: "1.0",
  _scratchpad: { secret: "never_leaked" },
  core: { decision: "你真正在決定的是：用開源換取開發者信任，還是用閉門邀請守住毛利", metric: "30天留存 > 35%" },
  quadrants: { Q1: { scar: "s1", sacred: "v1" }, Q2: { scar: "s2", sacred: "v2" }, Q3: { scar: "s3", sacred: "v3" }, Q4: { scar: "s4", sacred: "v4" } },
  nodes: Object.fromEntries(Array.from({ length: 12 }, (_, i) => ["N" + (i + 1), { label: "Node" + (i + 1) }])),
  edges: [{ type: "excludes", from: "N4", to: "N5", why: "免費與閉門互斥" }],
  archetypes: { alpha: { title: "啟動暗池·衝刺" }, beta: { title: "開源核心·槓桿" } },
  withheld_kill: { label: "隱藏第四刀" }
});

const sp = new IntentNdjsonSplitter(1);
const evs = [];
for (let i = 0; i < sample.length; i += 7) evs.push(...sp.push(sample.slice(i, i + 7)));
evs.push(...sp.end());

assert.equal(evs[0].t, "skeleton");
assert.equal(evs.filter(e => e.t === "node").length, 12);
assert.equal(evs.some(e => JSON.stringify(e).includes("never_leaked")), false, "_scratchpad must not leak");
assert.equal(evs.some(e => JSON.stringify(e).includes("隱藏第四刀")), false, "withheld_kill must not leak");
assert.equal(evs.at(-1)?.t, "done");
console.log("✅ Step 2 Epistemic Splitter Tests Passed: 12 nodes streamed, _scratchpad & withheld_kill sealed!");
