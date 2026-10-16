import type { Archetype, ArchetypeKey, Edge, IntentAnalysisResponse, NodeId, Stance } from "../../protocol/src/index.ts";
import { ARCHETYPE_KEYS, NODE_IDS, quadrantOf } from "../../protocol/src/index.ts";
import { hasSlop } from "./slop.ts";
import type { Model } from "./compiler.ts";

// Stage 1 → Stage 2 的確定性修復管線（V1–V18）。純函式、零 LLM、不修改輸入。
// fix = 已自動修復；warning = 違反 Spawner 規則但不影響編譯；error = 無法編譯。
export type Finding = Readonly<{ code: string; level: "fix" | "warning" | "error"; msg: string }>;
export type RepairResult = Readonly<{ ok: boolean; analysis: IntentAnalysisResponse | null; findings: readonly Finding[] }>;

const ATTACKS = new Set(["sunk_cost", "unit_economics", "dark_incentive", "single_point_failure"]);
const EDGE_TYPES = new Set(["excludes", "requires", "before"]);
const isNodeId = (x: unknown): x is NodeId => typeof x === "string" && (NODE_IDS as readonly string[]).includes(x);
const idx = (id: NodeId): number => NODE_IDS.indexOf(id);
const isObj = (x: unknown): x is Record<string, any> => typeof x === "object" && x !== null && !Array.isArray(x);
const isCell = (x: unknown): x is 0 | 1 | 2 => x === 0 || x === 1 || x === 2;

export function repairAnalysis(input: unknown): RepairResult {
  const findings: Finding[] = [];
  const fix = (code: string, msg: string) => findings.push({ code, level: "fix", msg });
  const warn = (code: string, msg: string) => findings.push({ code, level: "warning", msg });
  const fail = (code: string, msg: string): RepairResult => {
    findings.push({ code, level: "error", msg });
    return { ok: false, analysis: null, findings };
  };

  if (!isObj(input)) return fail("V1", "根節點必須是 JSON 物件");
  const a = structuredClone(input) as any;
  delete a._scratchpad;
  // V1 schema_version
  if (a.schema_version !== "1.0") return fail("V1", `schema_version 必須是 "1.0"，收到 ${JSON.stringify(a.schema_version)}`);
  // V2 core 與 12 顆節點齊全
  if (!isObj(a.core) || typeof a.core.decision !== "string") return fail("V2", "缺少 core.decision");
  if (!isObj(a.nodes)) return fail("V2", "缺少 nodes");
  const missing = NODE_IDS.filter(id => !isObj(a.nodes[id]) || typeof a.nodes[id].label !== "string");
  if (missing.length) return fail("V2", `缺少節點或 label：${missing.join(", ")}`);
  for (const k of Object.keys(a.nodes)) if (!isNodeId(k)) { delete a.nodes[k]; fix("V2", `移除未知節點 ${k}`); }

  for (const id of NODE_IDS) {
    const n = a.nodes[id], q = quadrantOf(id);
    // V3 象限專屬欄位：Q3 lateral、Q4 falsifier
    if (q === "Q3" && !isObj(n.lateral)) warn("V3", `${id} 缺少 lateral（Q3 跨界錨點）`);
    if (q === "Q4" && !isObj(n.falsifier)) warn("V3", `${id} 缺少 falsifier（Q4 證偽攻擊）`);
    // V4 反轉律：inverse_cell 必須與 cell 不同
    if (isCell(n.cell) && n.inverse_cell === n.cell) {
      n.inverse_cell = ((n.cell + 1) % 3) as 0 | 1 | 2;
      fix("V4", `${id} inverse_cell 與 cell 相同，改為 ${n.inverse_cell}`);
    } else if (n.cell !== undefined && (!isCell(n.cell) || !isCell(n.inverse_cell))) {
      warn("V4", `${id} cell / inverse_cell 必須是 0、1 或 2`);
    }
    // V16 Anti-Slop
    if (typeof n.claim === "string" && hasSlop(n.claim)) warn("V16", `${id} claim 含 Anti-Slop 黑名單詞：${n.claim}`);
    // V17 label 長度（<=15 字）
    if ([...n.label].length > 15) warn("V17", `${id} label 超過 15 字`);
  }

  // V5 邊端點合法、無自環、型別合法
  const rawEdges: unknown[] = Array.isArray(a.edges) ? a.edges : [];
  if (!Array.isArray(a.edges)) fix("V5", "edges 缺少或非陣列，視為空陣列");
  const edges: Edge[] = [];
  const seen = new Set<string>();
  for (const e of rawEdges) {
    if (!isObj(e) || !EDGE_TYPES.has(e.type) || !isNodeId(e.from) || !isNodeId(e.to) || e.from === e.to) {
      fix("V5", `移除無效邊 ${JSON.stringify(e)}`); continue;
    }
    let { from, to } = e as Edge;
    // V6 excludes 是無向邊：對稱化為 (較小索引, 較大索引) 並去重
    if (e.type === "excludes" && idx(from) > idx(to)) { [from, to] = [to, from]; }
    const key = `${e.type}:${from}:${to}`;
    if (seen.has(key)) { fix("V6", `移除重複邊 ${key}`); continue; }
    seen.add(key);
    edges.push({ type: e.type, from, to, why: typeof e.why === "string" ? e.why : "" });
  }
  // V7 同一對節點同時 excludes 與 requires 自相矛盾：保留 excludes
  const excl = new Set(edges.filter(e => e.type === "excludes").map(e => `${e.from}:${e.to}`));
  const pairKey = (x: NodeId, y: NodeId) => idx(x) < idx(y) ? `${x}:${y}` : `${y}:${x}`;
  a.edges = edges.filter(e => {
    if (e.type === "requires" && excl.has(pairKey(e.from, e.to))) { fix("V7", `${e.from}→${e.to} 同時 requires 與 excludes，移除 requires`); return false; }
    return true;
  });
  // V15 至少 4 組象限對共享 excludes 邊
  const qPairs = new Set(a.edges.filter((e: Edge) => e.type === "excludes" && quadrantOf(e.from) !== quadrantOf(e.to))
    .map((e: Edge) => [quadrantOf(e.from), quadrantOf(e.to)].sort().join("-")));
  if (qPairs.size < 4) warn("V15", `只有 ${qPairs.size} 組象限對共享 excludes 邊（規則要求 >= 4）`);

  // V12 Q3 跨界距離：至少 2 種不同值，且至少 1 個 >= 2
  const dists = (["N7", "N8", "N9"] as const).map(id => a.nodes[id].lateral?.dist).filter((d: unknown) => typeof d === "number");
  if (dists.length === 3 && (new Set(dists).size < 2 || !dists.some((d: number) => d >= 2))) warn("V12", "Q3 lateral.dist 必須至少 2 種值且至少 1 個 >= 2");
  // V13 Q4 攻擊類型互不相同；V14 withheld_kill 使用第 4 種
  const attacks = (["N10", "N11", "N12"] as const).map(id => a.nodes[id].falsifier?.attack).filter((x: unknown) => ATTACKS.has(x as string));
  if (attacks.length === 3 && new Set(attacks).size !== 3) warn("V13", "N10–N12 falsifier.attack 必須互不相同");
  if (isObj(a.withheld_kill) && attacks.includes(a.withheld_kill.attack)) warn("V14", "withheld_kill.attack 必須是 N10–N12 未使用的攻擊類型");

  // V8–V11 預設組合（archetypes）自洽
  if (!isObj(a.archetypes)) return fail("V8", "缺少 archetypes");
  const requires = a.edges.filter((e: Edge) => e.type === "requires");
  for (const key of ARCHETYPE_KEYS) {
    const arch = a.archetypes[key];
    if (arch === undefined) continue;
    const err = repairArchetype(key, arch, a.edges, requires, fix, warn);
    if (err) {
      if (key === "alpha") return fail("V10", err);
      delete a.archetypes[key]; warn("V10", `${err}，已移除 ${key}`);
    }
  }
  for (const k of Object.keys(a.archetypes)) if (!(ARCHETYPE_KEYS as readonly string[]).includes(k)) { delete a.archetypes[k]; fix("V8", `移除未知策略卡 ${k}`); }
  if (!a.archetypes.alpha) return fail("V8", "缺少 archetypes.alpha");
  // V19 recommend 必須指向現存策略卡；無效時移除（UI 只是不標示推薦）
  if (a.recommend !== undefined && !(isObj(a.recommend) && a.archetypes[a.recommend.key])) { delete a.recommend; warn("V19", "recommend 未指向現存策略卡，已移除"); }
  else if (a.recommend && typeof a.recommend.why !== "string") a.recommend.why = "";

  // V18 每張卡的 include/exclude 在可行解空間內可同時成立
  const model = buildModel(a as IntentAnalysisResponse);
  for (const key of ARCHETYPE_KEYS) {
    const arch: Archetype | undefined = a.archetypes[key];
    if (!arch) continue;
    const inc = arch.include.reduce((m, id) => m | (1 << idx(id)), 0), exc = arch.exclude.reduce((m, id) => m | (1 << idx(id)), 0);
    if (!model.feasibleMasks.some(m => (m & inc) === inc && (m & exc) === 0)) warn("V18", `${key} 的 include/exclude 無可行解`);
  }
  return { ok: true, analysis: a as IntentAnalysisResponse, findings };
}

function repairArchetype(key: ArchetypeKey, arch: any, edges: Edge[], requires: Edge[],
  fix: (c: string, m: string) => void, warn: (c: string, m: string) => void): string | null {
  if (!isObj(arch) || !Array.isArray(arch.include)) return `${key}.include 缺少或非陣列`;
  const clean = (list: unknown, field: string): NodeId[] => {
    const arr = Array.isArray(list) ? list : [];
    const out = [...new Set(arr.filter(isNodeId))].sort((x, y) => idx(x) - idx(y));
    if (out.length !== arr.length) fix("V8", `${key}.${field} 移除無效或重複節點`);
    return out;
  };
  arch.include = clean(arch.include, "include");
  arch.exclude = clean(arch.exclude, "exclude");
  // V11 fatal 必須是 Q4 節點且被 include
  if (!isNodeId(arch.fatal) || quadrantOf(arch.fatal) !== "Q4") warn("V11", `${key}.fatal 必須是 N10–N12`);
  else if (!arch.include.includes(arch.fatal)) { arch.include.push(arch.fatal); fix("V11", `${key}.fatal ${arch.fatal} 未被 include，已補入`); }
  // V9 include 必須 requires-closed：補入被依賴的節點（遞移閉包）
  for (let changed = true; changed;) {
    changed = false;
    for (const e of requires) if (arch.include.includes(e.from) && !arch.include.includes(e.to)) {
      arch.include.push(e.to); changed = true; fix("V9", `${key} include ${e.from} 依賴 ${e.to}，已補入`);
    }
  }
  arch.include.sort((x: NodeId, y: NodeId) => idx(x) - idx(y));
  // V8 include 與 exclude 不可重疊：include 優先
  const overlap = arch.exclude.filter((id: NodeId) => arch.include.includes(id));
  if (overlap.length) { arch.exclude = arch.exclude.filter((id: NodeId) => !overlap.includes(id)); fix("V8", `${key} 同時 include/exclude ${overlap.join(",")}，保留 include`); }
  // V10 include 內部不可有 excludes 邊（無法確定性修復）
  const bad = edges.find(e => e.type === "excludes" && arch.include.includes(e.from) && arch.include.includes(e.to));
  if (bad) return `${key} include 內部互斥：${bad.from} ⊗ ${bad.to}`;
  if (arch.include.length < 4 || arch.include.length > 6) warn("V10", `${key} include 有 ${arch.include.length} 顆（規則 4–6）`);
  return null;
}

/** 由 excludes / requires 邊枚舉 12 節點全部可行遮罩（4096 種），產生 compileIntent 的 Model。 */
export function buildModel(a: Pick<IntentAnalysisResponse, "edges">, version = "v1"): Model {
  const ex = a.edges.filter(e => e.type === "excludes").map(e => (1 << idx(e.from)) | (1 << idx(e.to)));
  const rq = a.edges.filter(e => e.type === "requires").map(e => [1 << idx(e.from), 1 << idx(e.to)] as const);
  const feasibleMasks: number[] = [];
  for (let m = 0; m < 1 << NODE_IDS.length; m++) {
    if (ex.some(p => (m & p) === p)) continue;
    if (rq.some(([f, t]) => (m & f) && !(m & t))) continue;
    feasibleMasks.push(m);
  }
  // compileIntent 要求 ids 嚴格遞增：以補零 ID 排序，與 NODE_IDS 索引一一對應。
  return { version, feasibleVersion: version, validated: true, ids: NODE_IDS.map(id => "N" + id.slice(1).padStart(2, "0")), feasibleMasks };
}

/** 把策略卡轉為 compileIntent 的 base（L2 預設立場）。 */
export function archetypeBase(arch: Archetype | undefined): Stance[] {
  return NODE_IDS.map(id => arch?.include.includes(id) ? "include" : arch?.exclude.includes(id) ? "exclude" : "neutral");
}
