import type { ArchetypeKey, IntentAnalysisResponse, NodeId, Stance } from "../../protocol/src/index.ts";
import { NODE_IDS, quadrantOf } from "../../protocol/src/index.ts";
import { compileIntent, type Result } from "./compiler.ts";
import { archetypeBase, buildModel } from "./repair.ts";

// 星系狀態 → compileIntent → 每顆節點的顯示立場與 LOCKED INTENT AST。純函式、零 LLM。
export type NodeSrc = "user" | "default" | "derived" | "none";
export type NodeView = Readonly<{ stance: Stance; src: NodeSrc }>;
export type GalaxySolution = Readonly<{
  status: Result["status"];
  result: Result;
  nodes: Readonly<Record<NodeId, NodeView>>;
  conflicts: readonly NodeId[];
}>;

const toNodeId = (paddedId: string): NodeId => ("N" + Number(paddedId.slice(1))) as NodeId;

export function solveGalaxy(a: IntentAnalysisResponse, baseKey: ArchetypeKey | null, overrides: ReadonlyMap<NodeId, Stance>): GalaxySolution {
  const model = buildModel(a);
  const base = archetypeBase(baseKey ? a.archetypes[baseKey] : undefined);
  const l3 = new Map<number, Stance>();
  for (const [id, s] of overrides) l3.set(NODE_IDS.indexOf(id), s);
  const result = compileIntent({ model, base, overrides: l3 });
  const nodes = {} as Record<NodeId, NodeView>;
  if (result.status !== "SAT") {
    // 無解時只顯示用戶與預設立場，衝突節點另行標紅。
    NODE_IDS.forEach((id, i) => {
      nodes[id] = overrides.has(id) ? { stance: overrides.get(id)!, src: "user" } : base[i] !== "neutral" ? { stance: base[i], src: "default" } : { stance: "neutral", src: "none" };
    });
    const conflicts = result.status === "L3_UNSAT" ? result.core.map(c => toNodeId(c.id)) : [];
    return { status: result.status, result, nodes, conflicts };
  }
  NODE_IDS.forEach((id, i) => {
    const inMask = Boolean(result.chosenMask & (1 << i));
    const declared = overrides.get(id) ?? (base[i] !== "neutral" ? base[i] : undefined);
    const src: NodeSrc = overrides.has(id) ? "user" : base[i] !== "neutral" ? "default" : "none";
    if (inMask) nodes[id] = { stance: "include", src: declared === "include" ? src : "derived" };
    else if (declared === "exclude") nodes[id] = { stance: "exclude", src };
    else if (declared === "include") nodes[id] = { stance: "exclude", src: "derived" };
    else nodes[id] = { stance: "neutral", src: "none" };
  });
  return { status: "SAT", result, nodes, conflicts: [] };
}

/**
 * 極性映射（Polarity Table，CLAUDE.md 鐵律 2）：
 * Q1–Q3 include → MUST；Q1–Q3 exclude → MUST NOT；
 * Q4 include → GUARDRAILS；Q4 exclude → ACCEPTED RISK（明示承擔風險，絕不渲染為 MUST NOT）。
 */
/** AST 各段標題的在地語言說明（英文關鍵字 MUST / GUARDRAILS… 固定不變，給 AI 與 kill-gate 辨識）。預設繁體中文。 */
export type AstLabels = Readonly<{ must: string; guard: string; mustNot: string; risk: string; sacrifice: string; forbid: string; accepted: string;
  /** 白話版（renderPlainIntent）才用到：標題、「我真正在決定的是」、「目標」、結尾給 AI 的一句話。 */
  title?: string; deciding?: string; goal?: string; closing?: string }>;
export const AST_LABELS_ZH: AstLabels = { must: "要做的事", guard: "停下來的條件", mustNot: "不做的事", risk: "接受的風險", sacrifice: "要付出的代價", forbid: "禁止", accepted: "知道風險仍接受",
  title: "我的決定", deciding: "我真正在決定的是", goal: "目標", closing: "請照這些決定回答：做「要做的事」、避開「不做的事」；碰到「停下來的條件」就先停下來告訴我。" };

export function renderLockedAst(a: IntentAnalysisResponse, sol: GalaxySolution, baseKey: ArchetypeKey | null, L: AstLabels = AST_LABELS_ZH): string {
  const arch = baseKey ? a.archetypes[baseKey] : undefined;
  const pick = (q4: boolean, stance: Stance) => NODE_IDS.filter(id => (quadrantOf(id) === "Q4") === q4 && sol.nodes[id].stance === stance);
  const tag = (id: NodeId) => sol.nodes[id].src === "derived" ? " (derived)" : "";
  const must = pick(false, "include"), guard = pick(true, "include"), mustNot = pick(false, "exclude"), risk = pick(true, "exclude");
  const n = (id: NodeId) => a.nodes[id];
  return [
    `# LOCKED INTENT AST (${arch?.title ?? "Custom"})`,
    `> ${a.core.decision}`,
    a.core.metric ? `> 🎯 ${a.core.metric}` : "",
    `\n## 1. MUST ${L.must} (${must.length})`, ...must.map(id => `- [${id}] ${n(id).claim ?? n(id).label}${tag(id)}`),
    `\n## 2. GUARDRAILS ${L.guard} (${guard.length})`, ...guard.map(id => `- [${id}] ${n(id).claim ?? n(id).label} (kill: ${n(id).kill ?? "-"})${tag(id)}`),
    `\n## 3. MUST NOT ${L.mustNot} (${mustNot.length})`, ...mustNot.map(id => `- [${id}] ${L.forbid}: ${n(id).claim ?? n(id).label}${tag(id)}`),
    `\n## 4. ACCEPTED RISK ${L.risk} (${risk.length})`, ...risk.map(id => `- [${id}] ${L.accepted}: ${n(id).claim ?? n(id).label} (kill: ${n(id).kill ?? "-"})`),
    arch ? `\n## 5. SACRIFICE ${L.sacrifice}\n- ${renderSacrifice(arch.sacrifice)}` : "",
  ].filter(line => line !== "").join("\n");
}

/** 星系 JSON 的 core.decision 常帶「你真正在決定的是：」前綴（提示詞規定的寫法）；顯示時去掉。 */
export const stripDecisionPrefix = (s: string) => String(s ?? "").replace(/^你真正在[決决]定(?:的是|嘅係)[:：]\s*/, "");

/**
 * 白話版（給一般大眾、填回聊天網站輸入框）：極性映射與 renderLockedAst 相同，但沒有 MUST／AST／[N#]／kill: 這類記號，
 * 空的段落不輸出，結尾附一句給 AI 的指示。工程師版（CLI、.intent.lock.json）仍用 renderLockedAst。
 */
export function renderPlainIntent(a: IntentAnalysisResponse, sol: GalaxySolution, baseKey: ArchetypeKey | null, L: AstLabels = AST_LABELS_ZH): string {
  const arch = baseKey ? a.archetypes[baseKey] : undefined;
  const pick = (q4: boolean, stance: Stance) => NODE_IDS.filter(id => (quadrantOf(id) === "Q4") === q4 && sol.nodes[id].stance === stance);
  const n = (id: NodeId) => a.nodes[id];
  const text = (id: NodeId) => n(id).claim ?? n(id).label;
  const section = (icon: string, label: string, ids: NodeId[], line: (id: NodeId) => string) =>
    ids.length ? [`${icon} ${label}`, ...ids.map((id, i) => `${i + 1}. ${line(id)}`), ""] : [];
  const cost = arch ? renderSacrifice(arch.sacrifice).split("·").map(s => s.trim()).filter(Boolean) : [];
  return [
    `${L.title ?? AST_LABELS_ZH.title}${arch ? `：${arch.title}` : ""}`,
    `${L.deciding ?? AST_LABELS_ZH.deciding}：${stripDecisionPrefix(a.core.decision)}`,
    a.core.metric ? `${L.goal ?? AST_LABELS_ZH.goal}：${a.core.metric}` : "",
    "",
    ...section("✅", L.must, pick(false, "include"), text),
    ...section("🛡", L.guard, pick(true, "include"), id => n(id).kill ? `${text(id)}（${n(id).kill}）` : text(id)),
    ...section("⛔", L.mustNot, pick(false, "exclude"), text),
    ...section("⚠️", L.risk, pick(true, "exclude"), text),
    ...(cost.length ? [`💸 ${L.sacrifice}`, ...cost.map((c, i) => `${i + 1}. ${c}`), ""] : []),
    L.closing ?? AST_LABELS_ZH.closing,
  ].filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== "")).join("\n");
}

/** 策略卡代價列（<=40 字顯示用）：物件版 p/v/t/l/x 以「·」串接，舊版字串原樣輸出。 */
export function renderSacrifice(s: unknown): string {
  if (typeof s === "string") return s;
  if (typeof s !== "object" || s === null) return "";
  const o = s as Record<string, unknown>;
  return ["p", "v", "t", "l", "x"].map(k => o[k]).filter(v => typeof v === "string" && v).join("·");
}
