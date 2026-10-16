export type QuadrantKey = "Q1" | "Q2" | "Q3" | "Q4";
export type NodeId = "N1"|"N2"|"N3"|"N4"|"N5"|"N6"|"N7"|"N8"|"N9"|"N10"|"N11"|"N12";
export type Q4NodeId = "N10" | "N11" | "N12";
export type DimId = "D1" | "D2" | "D3" | "D4";
export type AssumptionId = "A1" | "A2" | "A3" | "A4";
export type Cause = "final" | "formal" | "efficient" | "material";
export type Score = -2 | -1 | 0 | 1 | 2;
export type Cell = 0 | 1 | 2;
export type LateralDistance = 1 | 2 | 3 | 4;
export type AttackClass = "sunk_cost" | "unit_economics" | "dark_incentive" | "single_point_failure";
export type Stance = "include" | "exclude" | "neutral";

export interface Dim { id: DimId; name: string; values: [string, string, string]; }
export interface Persona { scar: string; sacred: string; }
export interface BaseNodeFields {
  dim: DimId; cell: Cell; inverse_cell: Cell; inverse_pos: string;
  claim: string; kill: string; blind: string | null;
  scores: { i: Score; v: Score; r: Score }; label: string;
}
export type PlainNode = BaseNodeFields;
export interface LateralNode extends BaseNodeFields { lateral: { src: string; dist: LateralDistance; drop: string }; }
export interface FalsifierNode extends BaseNodeFields { falsifier: { attack: AttackClass; hits: AssumptionId; wound: string }; }
export interface Edge { type: "excludes" | "requires" | "before"; from: NodeId; to: NodeId; why: string; }
export interface Archetype {
  include: NodeId[]; exclude: NodeId[];
  sacrifice: { nodes: NodeId[]; p: string; v: string; t: string; l: string; x: string };
  fatal: Q4NodeId; thesis: string; title: string;
}
export interface IntentAnalysisResponse {
  schema_version: "1.0";
  _scratchpad?: unknown;
  core: { decision: string; metric: string };
  quadrants: { Q1: Persona; Q2: Persona; Q3: Persona; Q4: Persona };
  nodes: {
    N1: PlainNode; N2: PlainNode; N3: PlainNode;
    N4: PlainNode; N5: PlainNode; N6: PlainNode;
    N7: LateralNode; N8: LateralNode; N9: LateralNode;
    N10: FalsifierNode; N11: FalsifierNode; N12: FalsifierNode;
  };
  edges: Edge[];
  archetypes: { alpha: Archetype; beta?: Archetype; gamma?: Archetype };
  /** 主 Agent 的預設推薦（Stage 1 產出；舊資料可缺）。只標示，不自動套用。 */
  recommend?: { key: ArchetypeKey; why: string };
  withheld_kill?: { attack: AttackClass; hits: AssumptionId; claim: string; kill: string; label: string };
}
export type ArchetypeKey = "alpha" | "beta" | "gamma";
export const NODE_IDS: readonly NodeId[] = ["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8", "N9", "N10", "N11", "N12"];
export const ARCHETYPE_KEYS: readonly ArchetypeKey[] = ["alpha", "beta", "gamma"];
export const quadrantOf = (id: NodeId): QuadrantKey => (["Q1", "Q2", "Q3", "Q4"] as const)[Math.floor((Number(id.slice(1)) - 1) / 3)];
export * from "./jcs.ts";
