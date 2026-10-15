import type { Stance } from "../../protocol/src/index.ts";

export type Model = Readonly<{ version: string; feasibleVersion: string; validated: true; ids: readonly string[]; feasibleMasks: readonly number[] }>;
export type Input = Readonly<{ model: Model; base: readonly Stance[]; overrides: ReadonlyMap<number, Stance> }>;
export type L3 = Readonly<{ id: string; stance: Stance }>;
export type Result =
  | Readonly<{ status: "STALE_MODEL" | "INVALID_INPUT" | "BASE_UNSAT"; preconditions: string }>
  | Readonly<{ status: "L3_UNSAT"; core: readonly L3[]; preconditions: string }>
  | Readonly<{ status: "SAT"; chosenMask: number; forcedIn: readonly string[]; forcedOut: readonly string[]; droppedDefaults: readonly string[]; pending: readonly string[]; explicitL3: readonly L3[]; modelVersion: string }>;

const PRE = "CALLER_VALIDATES_INPUTS_AND_COMPLETE_CNF_BUDGET_BEFORE_MODEL_STABLE_ID_ORDER";
const pop = (x: number): number => x.toString(2).replaceAll("0", "").length;
const fits = (ms: readonly number[], es: readonly (readonly [number, Stance])[]): number[] =>
  ms.filter(mask => es.every(([i, s]) => Boolean(mask & (1 << i)) === (s === "include")));

export function compileIntent({ model: m, base, overrides }: Input): Result {
  const n = m.ids.length, all = (1 << n) - 1, preconditions = PRE;
  const invalid = !m.validated || n > 12 || base.length !== n ||
    m.ids.some((id, i) => !id || (i > 0 && id <= m.ids[i - 1])) ||
    base.some(s => !["include", "exclude", "neutral"].includes(s)) ||
    [...overrides].some(([i, s]) => !Number.isInteger(i) || i < 0 || i >= n || !["include", "exclude", "neutral"].includes(s)) ||
    m.feasibleMasks.some(x => !Number.isInteger(x) || x < 0 || x > all) ||
    new Set(m.feasibleMasks).size !== m.feasibleMasks.length;
  if (invalid) return { status: "INVALID_INPUT", preconditions };
  if (m.version !== m.feasibleVersion) return { status: "STALE_MODEL", preconditions };
  if (!m.feasibleMasks.length) return { status: "BASE_UNSAT", preconditions };
  const l3 = [...overrides].sort(([a], [b]) => a - b), compatible = fits(m.feasibleMasks, l3);
  if (!compatible.length) {
    let core = l3.slice(), i = 0;
    while (i < core.length) {
      const next = core.filter((_, j) => j !== i);
      if (!fits(m.feasibleMasks, next).length) core = next; else i++;
    }
    return { status: "L3_UNSAT", core: core.map(([i, stance]) => ({ id: m.ids[i], stance })), preconditions };
  }
  const and = compatible.reduce((a, x) => a & x, all), or = compatible.reduce((a, x) => a | x, 0);
  const score = (x: number): number =>
    base.reduce((s, d, i) => s + (!overrides.has(i) && d !== "neutral" && (Boolean(x & (1 << i)) === (d === "include")) ? 1 : 0), 0);
  let chosenMask = 0, bestScore = -1, bestCount = n + 1;
  for (const candidate of compatible) {
    const candidateScore = score(candidate), candidateCount = pop(candidate);
    if (candidateScore > bestScore || (candidateScore === bestScore && (candidateCount < bestCount || (candidateCount === bestCount && candidate < chosenMask)))) {
      chosenMask = candidate; bestScore = candidateScore; bestCount = candidateCount;
    }
  }
  const explicitL3 = l3.map(([i, stance]) => ({ id: m.ids[i], stance }));
  return {
    status: "SAT", chosenMask,
    forcedIn: m.ids.filter((_, i) => Boolean(and & (1 << i))),
    forcedOut: m.ids.filter((_, i) => !Boolean(or & (1 << i))),
    droppedDefaults: m.ids.filter((_, i) => !overrides.has(i) && base[i] !== "neutral" && (Boolean(chosenMask & (1 << i)) !== (base[i] === "include"))),
    pending: m.ids.filter((_, i) => Boolean(chosenMask & (1 << i)) && base[i] !== "include" && overrides.get(i) !== "include"),
    explicitL3, modelVersion: m.version,
  };
}
