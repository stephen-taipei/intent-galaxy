import assert from "node:assert/strict";
import { NODE_IDS, type NodeId } from "../../protocol/src/index.ts";
import { renderLockedAst } from "./galaxy.ts";
import { DecisionSession } from "./session.ts";
import { SAMPLE_GALAXY } from "../../../apps/web/sample-galaxy.js";

const session = new DecisionSession();
const events: string[] = [];
const unsubscribe = session.subscribe((event) => events.push(event.type));
const loaded = session.load(SAMPLE_GALAXY, { goal: "共用一份決策", galaxyId: 7 });
assert.equal(loaded.ok, true);
assert.equal(session.analysis?.core.decision, SAMPLE_GALAXY.core.decision);
assert.equal(session.goal, "共用一份決策");
assert.equal(session.galaxyId, 7);
assert.equal(session.solution?.status, "SAT");
assert.deepEqual(events, ["load"]);

// Multiple consumers can retain the same DOM-free session and observe the same decision state.
const secondView = session;
assert.equal(secondView, session);
assert.equal(session.selectArchetype("beta"), true);
assert.equal(secondView.baseKey, "beta");
assert.equal(secondView.solution?.status, "SAT");
assert.equal(session.setStance("N4", "include"), true);
assert.equal(secondView.solution?.status, "SAT");
assert.equal(session.setStance("N5", "include"), true);
assert.equal(secondView.solution?.status, "L3_UNSAT");
assert.equal(session.canUndo, true);
assert.equal(session.undo(), true);
assert.deepEqual(session.picks, { baseKey: "beta", overrides: { N4: "include" } });
assert.equal(session.canRedo, true);
assert.equal(session.redo(), true);
assert.equal(session.solution?.status, "L3_UNSAT");
assert.equal(session.canUndo, true);
assert.equal(session.reset(), true);
assert.deepEqual(session.picks, { baseKey: null, overrides: {} });
assert.equal(session.undo(), true);
assert.equal(session.solution?.status, "L3_UNSAT");

// Reselecting the active card is a true no-op: it must preserve redo and add no undo entry.
const history = new DecisionSession();
assert.equal(history.load(SAMPLE_GALAXY).ok, true);
assert.equal(history.selectArchetype("alpha"), true);
assert.equal(history.selectArchetype("beta"), true);
assert.equal(history.undo(), true);
assert.equal(history.baseKey, "alpha");
assert.equal(history.canRedo, true);
assert.equal(history.selectArchetype("alpha"), false);
assert.equal(history.canRedo, true);
assert.equal(history.redo(), true);
assert.equal(history.baseKey, "beta");
assert.equal(history.undo(), true);
assert.equal(history.baseKey, "alpha");
assert.equal(history.undo(), true);
assert.equal(history.baseKey, null);

// Runtime invalid ids and invalid cards are ignored without changing decisions or emitting events.
const beforeInvalid = session.picks;
const eventCountBeforeInvalid = events.length;
assert.equal(session.setStance("N99" as NodeId, "exclude"), false);
assert.equal(session.selectArchetype("unknown" as never), false);
assert.deepEqual(session.picks, beforeInvalid);
assert.equal(events.length, eventCountBeforeInvalid);
assert.deepEqual(NODE_IDS.length, 12);

// Legacy persisted picks are accepted; equal-age resolutions retain insertion sequence and are deterministic.
const conflict = new DecisionSession();
assert.equal(conflict.load(SAMPLE_GALAXY).ok, true);
assert.equal(conflict.restorePicks({ baseKey: null, overrides: { N4: "include", N5: "include", N99: "neutral", N6: "bad" } }), true);
assert.deepEqual(conflict.picks, { baseKey: null, overrides: { N4: "include", N5: "include" } });
assert.equal(conflict.solution?.status, "L3_UNSAT");
assert.deepEqual(conflict.solution?.conflicts, ["N4", "N5"]);
assert.equal(conflict.resolveConflicts(), true);
assert.equal(conflict.solution?.status, "SAT");
assert.deepEqual(conflict.picks, { baseKey: null, overrides: { N5: "include" } });
const resolvedAst = renderLockedAst(conflict.analysis!, conflict.solution!, conflict.baseKey);
assert.equal(renderLockedAst(conflict.analysis!, conflict.solution!, conflict.baseKey), resolvedAst);
assert.equal(conflict.undo(), true);
assert.equal(conflict.solution?.status, "L3_UNSAT");

// Reasserting a node makes it newer; that recency survives the serialized picks round-trip.
const recency = new DecisionSession();
assert.equal(recency.load(SAMPLE_GALAXY).ok, true);
assert.equal(recency.setStance("N4", "include"), true);
assert.equal(recency.setStance("N5", "include"), true);
assert.equal(recency.setStance("N4", "exclude"), true);
assert.equal(recency.setStance("N4", "include"), true);
assert.deepEqual(Object.keys(recency.picks.overrides), ["N5", "N4"]);
const roundTripped = new DecisionSession();
assert.equal(roundTripped.load(SAMPLE_GALAXY).ok, true);
assert.equal(roundTripped.restorePicks(recency.picks), true);
assert.equal(roundTripped.resolveConflicts(), true);
assert.deepEqual(roundTripped.picks, { baseKey: null, overrides: { N4: "include" } });

// Q1–Q3 exclusion remains MUST NOT; Q4 exclusion remains ACCEPTED RISK.
const polarity = new DecisionSession();
assert.equal(polarity.load(SAMPLE_GALAXY).ok, true);
assert.equal(polarity.restorePicks({ baseKey: "alpha", overrides: { N4: "neutral", N9: "exclude", N10: "exclude" } }), true);
assert.equal(polarity.solution?.status, "SAT");
const ast = renderLockedAst(polarity.analysis!, polarity.solution!, polarity.baseKey);
const mustNot = ast.split("\n## ").find((section) => section.includes("MUST NOT")) ?? "";
const acceptedRisk = ast.split("\n## ").find((section) => section.includes("ACCEPTED RISK")) ?? "";
assert.ok(mustNot.includes("[N9]"));
assert.ok(!mustNot.includes("[N10]"));
assert.ok(acceptedRisk.includes("[N10]"));

const preserved = session.picks;
const invalidLoad = session.load({ schema_version: "0.9" });
assert.equal(invalidLoad.ok, false);
assert.deepEqual(session.picks, preserved);
assert.deepEqual(events.filter((type) => type === "load"), ["load"]);
unsubscribe();
console.log("✅ libs/core session verified!");
