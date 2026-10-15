import assert from "node:assert/strict";
import { hasSlop } from "./slop.ts";
import { compileIntent } from "./compiler.ts";
assert.equal(hasSlop("提升用戶體驗"), true);
assert.equal(hasSlop("負載平衡器只留 2 台"), false);
const model = { version: "v1", feasibleVersion: "v1", validated: true as const, ids: ["N1", "N2", "N3"], feasibleMasks: [0, 2, 3, 4] };
const resA = compileIntent({ model, base: ["include", "include", "neutral"], overrides: new Map([[2, "include"]]) });
assert.equal(resA.status, "SAT");
console.log("✅ libs/core verified!");
