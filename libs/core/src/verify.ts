import assert from "node:assert/strict";
import { hasSlop } from "./slop.ts";
import { compileIntent } from "./compiler.ts";
import { buildModel, repairAnalysis } from "./repair.ts";
import { renderLockedAst, solveGalaxy } from "./galaxy.ts";
import { buildIntentLock, LockError, requiresNumericKill } from "./lock.ts";
import { specHash } from "../../protocol/src/jcs.ts";
import { SAMPLE_GALAXY } from "../../../apps/web/sample-galaxy.js";
import { NODE_IDS } from "../../protocol/src/index.ts";
import type { IntentAnalysisResponse, NodeId, Stance } from "../../protocol/src/index.ts";

assert.equal(hasSlop("提升用戶體驗"), true);
assert.equal(hasSlop("負載平衡器只留 2 台"), false);
const model = { version: "v1", feasibleVersion: "v1", validated: true as const, ids: ["N1", "N2", "N3"], feasibleMasks: [0, 2, 3, 4] };
const resA = compileIntent({ model, base: ["include", "include", "neutral"], overrides: new Map([[2, "include"]]) });
assert.equal(resA.status, "SAT");

// 修復管線：示範星系必須無 error、無 fix
const sample = repairAnalysis(SAMPLE_GALAXY);
assert.equal(sample.ok, true, JSON.stringify(sample.findings));
assert.deepEqual(sample.findings.filter(f => f.level !== "warning"), []);
const a = sample.analysis as IntentAnalysisResponse;

// V4 反轉律、V6 無向邊對稱化去重、V5 無效邊、V9 requires 閉包、V11 fatal 補入
const broken = structuredClone(SAMPLE_GALAXY) as any;
broken.nodes.N1.inverse_cell = broken.nodes.N1.cell;
broken.edges.push({ type: "excludes", from: "N5", to: "N4", why: "反向重複" }, { type: "requires", from: "N3", to: "N3", why: "自環" });
broken.archetypes.alpha.include = ["N1", "N3", "N4"];
const fixed = repairAnalysis(broken);
assert.equal(fixed.ok, true);
const codes = fixed.findings.filter(f => f.level === "fix").map(f => f.code);
for (const c of ["V4", "V5", "V6", "V9", "V11"]) assert.ok(codes.includes(c), `應產生 ${c} 修復：${codes}`);
assert.notEqual(fixed.analysis!.nodes.N1.inverse_cell, fixed.analysis!.nodes.N1.cell);
assert.equal(fixed.analysis!.edges.filter(e => e.type === "excludes" && e.from === "N4" && e.to === "N5").length, 1);
assert.deepEqual(fixed.analysis!.archetypes.alpha.include, ["N1", "N3", "N4", "N8", "N10"]);
assert.equal(SAMPLE_GALAXY.nodes.N1.inverse_cell !== SAMPLE_GALAXY.nodes.N1.cell, true, "repair 不可修改輸入");

// V10 alpha 內部互斥無法修復 → error
const unsat = structuredClone(SAMPLE_GALAXY) as any;
unsat.archetypes.alpha.include.push("N5");
unsat.archetypes.alpha.exclude = [];
assert.equal(repairAnalysis(unsat).ok, false);
assert.equal(repairAnalysis({ schema_version: "0.9" }).ok, false);

// V20 exclude 超過 3 顆：保留與 include 互斥的，其餘改為中立
const wide = structuredClone(SAMPLE_GALAXY) as any;
const inc = new Set(wide.archetypes.alpha.include);
wide.archetypes.alpha.exclude = NODE_IDS.filter((id) => !inc.has(id));
const clashing = wide.archetypes.alpha.exclude.filter((id: string) => wide.edges.some((e: any) => e.type === "excludes" && ((e.from === id && inc.has(e.to)) || (e.to === id && inc.has(e.from)))));
const trimmed = repairAnalysis(wide);
assert.ok(trimmed.ok && trimmed.findings.some((f) => f.code === "V20"));
assert.equal(trimmed.analysis!.archetypes.alpha.exclude.length, 3);
assert.ok(trimmed.analysis!.archetypes.alpha.exclude.every((id) => clashing.includes(id)) || clashing.length < 3, "優先保留真正互斥的節點");

// buildModel：excludes 與 requires 皆被遮罩空間遵守
const m = buildModel(a);
const bit = (id: string) => 1 << (Number(id.slice(1)) - 1);
assert.ok(m.feasibleMasks.every(x => !((x & bit("N4")) && (x & bit("N5")))));
assert.ok(m.feasibleMasks.every(x => !(x & bit("N1")) || (x & bit("N8"))));

// solveGalaxy：每張卡皆 SAT，且顯示立場與卡片一致
for (const key of ["alpha", "beta", "gamma"] as const) {
  const sol = solveGalaxy(a, key, new Map());
  assert.equal(sol.status, "SAT", key);
  for (const id of a.archetypes[key]!.include) assert.equal(sol.nodes[id].stance, "include", `${key} ${id}`);
}
// 用戶手動採納 N5 → 與預設 N1/N4 互斥時，預設讓位（derived exclude）
const remix = solveGalaxy(a, "alpha", new Map<NodeId, Stance>([["N5", "include"]]));
assert.equal(remix.status, "SAT");
assert.equal(remix.nodes.N5.stance, "include");
assert.deepEqual([remix.nodes.N1.stance, remix.nodes.N1.src], ["exclude", "derived"]);
// 兩個用戶決定互斥 → L3_UNSAT 並標出衝突核心
const clash = solveGalaxy(a, "alpha", new Map<NodeId, Stance>([["N4", "include"], ["N5", "include"]]));
assert.equal(clash.status, "L3_UNSAT");
assert.deepEqual([...clash.conflicts].sort(), ["N4", "N5"]);

// 極性映射：Q4 exclude → ACCEPTED RISK，絕不進 MUST NOT
const risk = solveGalaxy(a, "alpha", new Map<NodeId, Stance>([["N4", "neutral"], ["N10", "exclude"], ["N9", "exclude"]]));
const ast = renderLockedAst(a, risk, "alpha");
const section = (title: string) => ast.split("\n## ").find(s => s.includes(title)) ?? "";
assert.ok(section("ACCEPTED RISK").includes("[N10]"));
assert.ok(!section("MUST NOT").includes("[N10]"));
assert.ok(section("MUST NOT").includes("[N9]"));
assert.ok(section("MUST NOT").includes("[N5]"));
// .intent.lock.json：specHash = SHA-256(JCS(payload))；根欄位與 payload 一致；極性映射
const decidedAt = new Date("2026-10-16T00:00:00.400Z");
const lock = await buildIntentLock({ analysis: a, solution: solveGalaxy(a, "alpha", new Map()), baseKey: "alpha", goal: "週報", decidedAt, scopePaths: ["src"] });
assert.equal(lock.specHash, await specHash(lock.payload));
assert.equal(lock.decidedAt, "2026-10-16T00:00:00.000Z");
assert.equal(lock.auditDueAt, "2026-10-30T00:00:00.000Z");
assert.deepEqual(lock.payload.weldedKill, lock.weldedKill);
assert.equal(lock.withheldKill?.attackClass, "single_point_failure");
assert.equal(lock.weldedKill.falsifierId, "N10");
const riskLock = await buildIntentLock({ analysis: a, solution: solveGalaxy(a, "alpha", new Map<NodeId, Stance>([["N11", "exclude"]])), baseKey: "alpha", decidedAt });
assert.equal(riskLock.weldedKill.falsifierId, "N10");
assert.deepEqual(riskLock.payload.acceptedRisks.map((n) => n.id), ["N11"]);
assert.ok(!riskLock.payload.mustNot.some((n) => n.id === "N11"), "Q4 exclude 不可進 mustNot");
assert.notEqual(riskLock.specHash, lock.specHash);
assert.equal((await buildIntentLock({ analysis: a, solution: solveGalaxy(a, "alpha", new Map()), baseKey: "alpha", goal: "週報", decidedAt, scopePaths: ["src"] })).specHash, lock.specHash, "同輸入必須同雜湊");
await assert.rejects(buildIntentLock({ analysis: a, solution: solveGalaxy(a, null, new Map<NodeId, Stance>([["N1", "include"]])), baseKey: null }), LockError);
await assert.rejects(buildIntentLock({ analysis: a, solution: clash, baseKey: "alpha" }), LockError);
// 連續兩次 unobservable → 致死條件必須含數字
assert.equal(requiresNumericKill(["dead", "unobservable"]), false);
assert.equal(requiresNumericKill(["unobservable", "unobservable"]), true);
assert.equal(requiresNumericKill(["unobservable", "unobservable", "alive"]), false);
const vague = structuredClone(a); vague.nodes.N10.kill = "設定欄位太多即停";
const twice = { analysis: vague, solution: solveGalaxy(vague, "alpha", new Map()), baseKey: "alpha" as const, recentVerdicts: ["unobservable", "unobservable"] };
await assert.rejects(buildIntentLock(twice), LockError);
assert.ok((await buildIntentLock({ ...twice, analysis: a, solution: solveGalaxy(a, "alpha", new Map()) })).specHash);
console.log("✅ libs/core verified!");
