import type { ArchetypeKey, AttackClass, IntentAnalysisResponse, NodeId, Q4NodeId } from "../../protocol/src/index.ts";
import { NODE_IDS, quadrantOf, specHash } from "../../protocol/src/index.ts";
import type { GalaxySolution } from "./galaxy.ts";
import { renderLockedAst } from "./galaxy.ts";

// .intent.lock.json：{ specHash, ...kill-gate 讀取的根欄位, payload }。
// specHash = SHA-256(JCS(payload))；根欄位是 payload 內同名欄位的副本，供 kill-gate.mjs 直接讀取（Grok 審查 §2.6）。
export const LOCK_PROTOCOL_VERSION = "1.0.0";
export const AUDIT_WINDOW_SECONDS = 1_209_600; // 14 天

export interface WeldedKill { falsifierId: Q4NodeId; fatalPremise: string; killCondition14d: string }
export interface WithheldKill { attackClass: AttackClass; label: string; fatalPremise: string; killCondition14d: string; whyWithheld: string }
export interface LockNode { id: NodeId; claim: string; kill?: string }
export interface IntentLockPayload {
  protocolVersion: string;
  goal: string;
  decision: string;
  metric: string;
  archetype: { key: ArchetypeKey; title: string; thesis: string } | null;
  mustHave: LockNode[];
  mustNot: LockNode[];
  guardrails: LockNode[];
  acceptedRisks: LockNode[];
  omittedNodeIds: NodeId[];
  acceptedTradeOffs: Record<string, unknown> | null;
  killMetrics14d: LockNode[];
  decidedAt: string;
  auditDueAt: string;
  scopePaths: string[];
  weldedKill: WeldedKill;
  withheldKill: WithheldKill | null;
  ast: string;
}
export interface IntentLock {
  specHash: string;
  decidedAt: string;
  auditDueAt: string;
  scopePaths: string[];
  weldedKill: WeldedKill;
  withheldKill: WithheldKill | null;
  hookInstalled: boolean;
  payload: IntentLockPayload;
}

export class LockError extends Error {}

export async function buildIntentLock({ analysis: a, solution: sol, baseKey, goal = "", decidedAt = new Date(), scopePaths = ["*"], hookInstalled = false }: {
  analysis: IntentAnalysisResponse; solution: GalaxySolution; baseKey: ArchetypeKey | null;
  goal?: string; decidedAt?: Date; scopePaths?: string[]; hookInstalled?: boolean;
}): Promise<IntentLock> {
  if (sol.status !== "SAT") throw new LockError(`星系目前是 ${sol.status}，先解除衝突才能簽署`);
  const arch = baseKey ? a.archetypes[baseKey] : undefined;
  const pick = (q4: boolean, stance: string): LockNode[] => NODE_IDS
    .filter((id) => (quadrantOf(id) === "Q4") === q4 && sol.nodes[id].stance === stance)
    .map((id) => q4 ? { id, claim: a.nodes[id].claim, kill: a.nodes[id].kill } : { id, claim: a.nodes[id].claim });
  const included = NODE_IDS.filter((id) => sol.nodes[id].stance === "include");

  // 焊在牌上的致死前提：策略卡的 fatal（仍被採納時）優先，否則取第一顆被採納的 Q4 節點。
  const fatalId = (arch && included.includes(arch.fatal) ? arch.fatal : included.find((id) => quadrantOf(id) === "Q4")) as Q4NodeId | undefined;
  if (!fatalId) throw new LockError("至少要採納一顆 Q4 證偽節點，14 天後才有可驗屍的致死前提");
  const weldedKill: WeldedKill = { falsifierId: fatalId, fatalPremise: a.nodes[fatalId].claim, killCondition14d: a.nodes[fatalId].kill };
  const w = a.withheld_kill;
  const withheldKill: WithheldKill | null = w ? {
    attackClass: w.attack, label: w.label, fatalPremise: w.claim, killCondition14d: w.kill,
    whyWithheld: "Stage 1 扣留的第四種攻擊類型，判決 dead 之後才揭露",
  } : null;

  const decided = new Date(Math.floor(decidedAt.getTime() / 1000) * 1000);
  const decidedIso = decided.toISOString(), dueIso = new Date(decided.getTime() + AUDIT_WINDOW_SECONDS * 1000).toISOString();
  const scope = scopePaths.length ? [...scopePaths] : ["*"];
  const payload: IntentLockPayload = {
    protocolVersion: LOCK_PROTOCOL_VERSION,
    goal,
    decision: a.core.decision,
    metric: a.core.metric,
    archetype: arch && baseKey ? { key: baseKey, title: arch.title, thesis: arch.thesis } : null,
    mustHave: pick(false, "include"),
    mustNot: pick(false, "exclude"),
    guardrails: pick(true, "include"),
    acceptedRisks: pick(true, "exclude"),
    omittedNodeIds: NODE_IDS.filter((id) => sol.nodes[id].stance === "neutral"),
    acceptedTradeOffs: arch?.sacrifice ? { ...arch.sacrifice } : null,
    killMetrics14d: included.map((id) => ({ id, claim: a.nodes[id].claim, kill: a.nodes[id].kill })),
    decidedAt: decidedIso,
    auditDueAt: dueIso,
    scopePaths: scope,
    weldedKill,
    withheldKill,
    ast: renderLockedAst(a, sol, baseKey),
  };
  return { specHash: await specHash(payload), decidedAt: decidedIso, auditDueAt: dueIso, scopePaths: scope, weldedKill, withheldKill, hookInstalled, payload };
}
