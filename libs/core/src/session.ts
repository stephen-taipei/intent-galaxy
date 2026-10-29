import type { ArchetypeKey, IntentAnalysisResponse, NodeId, Stance } from "../../protocol/src/index.ts";
import { NODE_IDS } from "../../protocol/src/index.ts";
import { solveGalaxy, type GalaxySolution } from "./galaxy.ts";
import { repairAnalysis, type RepairResult } from "./repair.ts";

export type DecisionPicks = Readonly<{
  baseKey: ArchetypeKey | null;
  overrides: Partial<Record<NodeId, Stance>>;
}>;

export type DecisionSessionEvent = Readonly<{ type: "load" | "picks" | "restore" }>;
export type DecisionSessionListener = (event: DecisionSessionEvent) => void;

type Override = { stance: Stance; seq: number };
type Snapshot = { baseKey: ArchetypeKey | null; overrides: Map<NodeId, Override> };
type LoadOptions = { goal?: string; galaxyId?: number };

const STANCES: readonly Stance[] = ["include", "exclude", "neutral"];
const isNodeId = (value: string): value is NodeId => (NODE_IDS as readonly string[]).includes(value);

/** DOM-free mutable decision state. Solver and compiler output remain deterministic. */
export class DecisionSession {
  #analysis: IntentAnalysisResponse | null = null;
  #goal = "";
  #galaxyId = 0;
  #baseKey: ArchetypeKey | null = null;
  #overrides = new Map<NodeId, Override>();
  #seq = 0;
  #undo: Snapshot[] = [];
  #redo: Snapshot[] = [];
  #listeners = new Set<DecisionSessionListener>();

  get analysis(): IntentAnalysisResponse | null { return this.#analysis; }
  get goal(): string { return this.#goal; }
  get galaxyId(): number { return this.#galaxyId; }
  get baseKey(): ArchetypeKey | null { return this.#baseKey; }
  get solution(): GalaxySolution | null {
    return this.#analysis ? solveGalaxy(this.#analysis, this.#baseKey, this.#stanceOverrides()) : null;
  }
  get picks(): DecisionPicks {
    const overrides = Object.fromEntries([...this.#overrides].map(([id, override]) => [id, override.stance])) as Partial<Record<NodeId, Stance>>;
    return { baseKey: this.#baseKey, overrides };
  }
  get canUndo(): boolean { return this.#undo.length > 0; }
  get canRedo(): boolean { return this.#redo.length > 0; }
  get hasPicks(): boolean { return this.#baseKey !== null || this.#overrides.size > 0; }

  subscribe(listener: DecisionSessionListener): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  /** Repair and load an analysis. Invalid input leaves the current session intact. */
  load(analysis: unknown, { goal = "", galaxyId = 0 }: LoadOptions = {}): RepairResult {
    const repaired = repairAnalysis(analysis);
    if (!repaired.ok || !repaired.analysis) return repaired;
    this.#analysis = repaired.analysis;
    this.#goal = goal;
    this.#galaxyId = galaxyId;
    this.#baseKey = null;
    this.#overrides.clear();
    this.#undo = [];
    this.#redo = [];
    this.#emit("load");
    return repaired;
  }

  /** Select a card; Shift-style keepOverrides preserves manual decisions. */
  selectArchetype(key: ArchetypeKey, keepOverrides = false): boolean {
    if (!this.#analysis || !Object.hasOwn(this.#analysis.archetypes, key) || !this.#analysis.archetypes[key]) return false;
    const before = this.#copyCurrent();
    const next: Snapshot = {
      baseKey: key,
      overrides: keepOverrides ? before.overrides : new Map(),
    };
    if (this.#sameDecision(before, next)) return false;
    this.#snapshot(before);
    this.#baseKey = key;
    if (!keepOverrides) this.#overrides.clear();
    this.#emit("picks");
    return true;
  }

  /** Toggle a node stance using the overlay's legacy default/derived semantics. */
  setStance(id: NodeId, target: Stance): boolean {
    if (!this.#analysis || !isNodeId(id) || !STANCES.includes(target)) return false;
    const before = this.#copyCurrent();
    this.#snapshot();
    const view = this.solution?.nodes[id], shown = view?.stance;
    const next: Stance = shown === target ? "neutral" : target;
    const arch = this.#baseKey ? this.#analysis.archetypes[this.#baseKey] : null;
    const baseStance: Stance = arch?.include.includes(id) ? "include" : arch?.exclude.includes(id) ? "exclude" : "neutral";
    if (next === baseStance && view?.src !== "derived") this.#overrides.delete(id);
    else {
      // Map insertion order is the serialized tie-break used by restorePicks.
      this.#overrides.delete(id);
      this.#overrides.set(id, { stance: next, seq: ++this.#seq });
    }
    return this.#emitIfChanged(before, "picks");
  }

  /** Reset card and manual decisions. The preceding state remains undoable. */
  reset(): boolean {
    if (!this.#analysis || !this.hasPicks) return false;
    const before = this.#copyCurrent();
    this.#snapshot();
    this.#baseKey = null;
    this.#overrides.clear();
    return this.#emitIfChanged(before, "picks");
  }

  undo(): boolean { return this.#restore(this.#undo, this.#redo); }
  redo(): boolean { return this.#restore(this.#redo, this.#undo); }

  /** Drop the oldest user decision inside the conflict core until the graph is satisfiable. */
  resolveConflicts(): boolean {
    if (!this.solution?.conflicts.length) return false;
    const before = this.#copyCurrent();
    const originalOverrides = this.#overrides;
    this.#overrides = new Map([...before.overrides].map(([id, value]) => [id, { ...value }]));
    let guard = NODE_IDS.length;
    while (this.#solve()?.status === "L3_UNSAT" && guard--) {
      const core = this.#solve()?.conflicts ?? [];
      const oldest = core.filter((id) => this.#overrides.has(id))
        .sort((a, b) => this.#overrides.get(a)!.seq - this.#overrides.get(b)!.seq)[0];
      if (!oldest) break;
      this.#overrides.delete(oldest);
    }
    if (this.#sameDecision(before, this.#copyCurrent())) {
      this.#overrides = originalOverrides;
      return false;
    }
    this.#snapshot(before);
    this.#emit("picks");
    return true;
  }

  /** Restore the serialized card and valid legacy node picks; invalid entries are ignored. */
  restorePicks({ baseKey = null, overrides = {} }: { baseKey?: ArchetypeKey | null; overrides?: Record<string, unknown> } = {}): boolean {
    if (!this.#analysis) return false;
    this.#baseKey = baseKey && Object.hasOwn(this.#analysis.archetypes, baseKey) && this.#analysis.archetypes[baseKey] ? baseKey : null;
    this.#overrides = new Map(Object.entries(overrides ?? {})
      .filter(([id, stance]) => isNodeId(id) && STANCES.includes(stance as Stance))
      .map(([id, stance]) => [id as NodeId, { stance: stance as Stance, seq: ++this.#seq }]));
    this.#undo = [];
    this.#redo = [];
    this.#emit("restore");
    return true;
  }

  #solve(): GalaxySolution | null {
    return this.#analysis ? solveGalaxy(this.#analysis, this.#baseKey, this.#stanceOverrides()) : null;
  }

  #stanceOverrides(): Map<NodeId, Stance> {
    return new Map([...this.#overrides].map(([id, override]) => [id, override.stance]));
  }

  #copyCurrent(): Snapshot {
    return { baseKey: this.#baseKey, overrides: new Map([...this.#overrides].map(([id, value]) => [id, { ...value }])) };
  }

  #snapshot(snapshot = this.#copyCurrent()): void {
    this.#undo.push(snapshot);
    if (this.#undo.length > 100) this.#undo.shift();
    this.#redo = [];
  }

  #restore(from: Snapshot[], to: Snapshot[]): boolean {
    const snapshot = from.pop();
    if (!snapshot) return false;
    const before = this.#copyCurrent();
    to.push(before);
    this.#baseKey = snapshot.baseKey;
    this.#overrides = snapshot.overrides;
    return this.#emitIfChanged(before, "restore");
  }

  #sameDecision(a: Snapshot, b: Snapshot): boolean {
    if (a.baseKey !== b.baseKey || a.overrides.size !== b.overrides.size) return false;
    for (const [id, value] of a.overrides) {
      const other = b.overrides.get(id);
      if (!other || other.stance !== value.stance || other.seq !== value.seq) return false;
    }
    return true;
  }

  #emitIfChanged(before: Snapshot, type: "picks" | "restore"): boolean {
    if (this.#sameDecision(before, this.#copyCurrent())) return false;
    this.#emit(type);
    return true;
  }

  #emit(type: DecisionSessionEvent["type"]): void {
    const event: DecisionSessionEvent = Object.freeze({ type });
    for (const listener of [...this.#listeners]) listener(event);
  }
}
