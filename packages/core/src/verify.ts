import assert from "node:assert/strict";
import { hasSlop } from "./slop.ts";
import { compileIntent } from "./compiler.ts";

// Test 1: Anti-Slop Filter
assert.equal(hasSlop("提升用戶體驗"), true, "Should block slop");
assert.equal(hasSlop("負載平衡器只留 2 台"), false, "Should allow technical term");
assert.equal(hasSlop("砍註冊欄位到 2 個，放棄驗證"), false, "Should allow sharp node");

// Test 2: Bitmask Compiler (N1 requires N2; N2 excludes N3)
// Valid masks for (N1, N2, N3): 0(000), 2(010: N2), 3(011: N1+N2), 4(100: N3)
const model = { version: "v1", feasibleVersion: "v1", validated: true as const, ids: ["N1", "N2", "N3"], feasibleMasks: [0, 2, 3, 4] };
const base = ["include", "include", "neutral"] as const; // Default: N1 + N2 (mask 3)

// Case A: User overrides N3 = include -> should drop N1 & N2 defaults and pick mask 4 (only N3)
const resA = compileIntent({ model, base, overrides: new Map([[2, "include"]]) });
assert.equal(resA.status, "SAT");
if (resA.status === "SAT") {
  assert.equal(resA.chosenMask, 4);
  assert.deepEqual(resA.droppedDefaults, ["N1", "N2"]);
}

// Case B: User overrides both N1=include and N3=include -> L3_UNSAT
const resB = compileIntent({ model, base, overrides: new Map([[0, "include"], [2, "include"]]) });
assert.equal(resB.status, "L3_UNSAT");

console.log("✅ Phase 1 Core Smoke Tests Passed: Anti-Slop Filter & Bitmask Compiler verified!");
