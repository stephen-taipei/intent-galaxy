import { repairAnalysis, solveGalaxy, renderLockedAst } from '../../../libs/core/src/index.ts';

export class DomainError extends Error {
  constructor(code, message, status = 400, definitiveFailure = true) {
    super(message); Object.assign(this, { code, status, definitiveFailure });
  }
}
export const fail = (message, code = 'invalid_input') => { throw new DomainError(code, message); };
export const object = (v) => v && typeof v === 'object' && !Array.isArray(v);
export function text(v, name, max = 2000, allowEmpty = false) {
  if (typeof v !== 'string' || v.length > max || (!allowEmpty && !v.trim())) fail(`${name} is required (maximum ${max} characters).`);
  return v.trim();
}
export function boundedJson(value, max = 160000) {
  let encoded;
  try { encoded = JSON.stringify(value); } catch { fail('Invalid JSON.'); }
  if (!encoded || new TextEncoder().encode(encoded).length > max) fail('Input is too large.');
  if (/"(?:__proto__|prototype|constructor)"\s*:/.test(encoded)) fail('Reserved JSON property.');
  return JSON.parse(encoded);
}
export const oneOf = (v, values, label) => values.includes(v) ? v : fail(`Invalid ${label}.`);
export function strings(value, name, limit = 12, max = 500) {
  if (!Array.isArray(value) || value.length > limit) fail(`Invalid ${name}.`);
  return value.map(v => text(v, name, max));
}
export const TASK_TYPES = ['message', 'weekly', 'compare'];

export function validateChart(raw) {
  const c = boundedJson(raw, 80000);
  if (!object(c) || c.schemaVersion !== 1 || !Array.isArray(c.themes) || c.themes.length !== 8) fail('A chart requires eight themes.');
  const ids = new Set();
  const id = (value) => {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,60}$/.test(value) || ids.has(value)) fail('Chart IDs must be unique.');
    ids.add(value); return value;
  };
  return {
    schemaVersion: 1, title: text(c.title ?? '', 'title', 160, true), goal: text(c.goal ?? '', 'goal', 500, true),
    themes: c.themes.map(t => {
      if (!object(t) || !Array.isArray(t.actions) || t.actions.length !== 8) fail('Each theme requires eight actions.');
      return { id: id(t.id), title: text(t.title ?? '', 'theme', 200, true), actions: t.actions.map(a => {
        if (!object(a) || typeof a.done !== 'boolean') fail('Invalid action.');
        if (a.dueDate) {
          const date = new Date(`${a.dueDate}T00:00:00Z`);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(a.dueDate) || !Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== a.dueDate) fail('Invalid due date.');
        }
        return { id: id(a.id), text: text(a.text ?? '', 'action', 500, true), done: a.done,
          ...(a.dueDate ? { dueDate: a.dueDate } : {}), ...(a.notes ? { notes: text(a.notes, 'notes', 1000) } : {}) };
      }) };
    }),
  };
}

export function validateAnalysis(raw) {
  const a = boundedJson(raw, 80000);
  if (!object(a) || !object(a.core) || !object(a.nodes) || !object(a.archetypes)) fail('Invalid analysis.');
  text(a.core.decision, 'decision', 1000); text(a.core.metric ?? '', 'metric', 1000, true);
  for (let n = 1; n <= 12; n++) {
    const node = a.nodes[`N${n}`];
    if (!object(node)) fail('Missing analysis node.');
    text(node.label, 'node label', 160); text(node.claim, 'node claim', 1600);
    text(node.kill ?? '', 'node boundary', 1000, true);
    if (!object(node.scores) || !['i', 'v', 'r'].every(k => Number.isInteger(node.scores[k]) && Math.abs(node.scores[k]) <= 2)) fail('Invalid node scores.');
  }
  if (!Array.isArray(a.edges) || a.edges.length > 66) fail('Invalid analysis edges.');
  for (const key of ['alpha', 'beta', 'gamma']) if (a.archetypes[key]) {
    text(a.archetypes[key].title, 'option title', 300);
    if (!Array.isArray(a.archetypes[key].include) || a.archetypes[key].include.length > 12) fail('Invalid option.');
  }
  const result = repairAnalysis(a);
  if (!result.ok) fail('Analysis cannot be compiled.');
  return result.analysis;
}

export function validateSelection(raw, analysis) {
  if (!object(raw)) fail('Confirm a direction first.');
  const baseKey = raw.baseKey === null ? null : oneOf(raw.baseKey, ['alpha', 'beta', 'gamma'], 'direction');
  if (baseKey && !analysis.archetypes[baseKey]) fail('Direction does not exist.');
  if (raw.overrides != null && !object(raw.overrides)) fail('Invalid node choices.');
  const overrides = {};
  for (const [key, value] of Object.entries(raw.overrides ?? {})) {
    if (!/^N(?:[1-9]|1[0-2])$/.test(key)) fail('Invalid node ID.');
    overrides[key] = oneOf(value, ['include', 'exclude', 'neutral'], 'node choice');
  }
  if (!baseKey && !Object.keys(overrides).length) fail('Confirm a direction first.');
  const solution = solveGalaxy(analysis, baseKey, new Map(Object.entries(overrides)));
  if (solution.status !== 'SAT') fail('Resolve the conflicting choices first.', 'conflicting_choices');
  return { baseKey, overrides, notes: text(raw.notes ?? '', 'notes', 4000, true), ast: renderLockedAst(analysis, solution, baseKey) };
}

export function validateContract(raw) {
  if (!object(raw)) fail('Missing work contract.');
  const c = { taskType: oneOf(raw.taskType, TASK_TYPES, 'task type'), goal: text(raw.goal, 'goal', 2000),
    input: text(raw.input, 'input', 20000), requirements: strings(raw.requirements ?? [], 'requirements') };
  if (raw.rules != null) {
    if (!object(raw.rules)) fail('Invalid rules.');
    c.rules = { requiredStrings: strings(raw.rules.requiredStrings ?? [], 'required text', 8, 200),
      forbiddenStrings: strings(raw.rules.forbiddenStrings ?? [], 'forbidden text', 8, 200) };
    if (raw.rules.maxChars != null) {
      if (!Number.isInteger(raw.rules.maxChars) || raw.rules.maxChars < 20 || raw.rules.maxChars > 20000) fail('Invalid length limit.');
      c.rules.maxChars = raw.rules.maxChars;
    }
  }
  return c;
}

export function validateJobRequest(raw) {
  const r = boundedJson(raw, 180000);
  if (!object(r) || !object(r.payload)) fail('Invalid job request.');
  const result = { product: oneOf(r.product, ['studio', 'mandala'], 'product'),
    operation: r.operation, provider: oneOf(r.provider ?? 'openai', ['openai', 'anthropic'], 'provider'),
    mode: oneOf(r.mode ?? 'standard', ['standard', 'deep'], 'mode'), consentDecisions: r.consentDecisions === true, payload: {} };
  if (result.product === 'mandala') {
    oneOf(r.operation, ['expand', 'review'], 'operation');
    result.payload = { chart: validateChart(r.payload.chart), instruction: text(r.payload.instruction ?? '', 'instruction', 2000, true) };
    text(result.payload.chart.goal, 'goal', 500);
  } else {
    oneOf(r.operation, ['analyze', 'generate', 'revise', 'evaluate'], 'operation');
    const c = validateContract(r.payload.contract ?? r.payload);
    result.payload = { ...c };
    if (r.operation !== 'analyze') {
      const analysis = validateAnalysis(r.payload.analysis);
      const selection = validateSelection(r.payload.selection ?? r.payload.contract?.selection, analysis);
      result.payload = { ...c, analysis, selection, contract: { ...c, selection } };
    }
    if (['revise', 'evaluate'].includes(r.operation)) {
      const a = r.payload.artifact;
      result.payload.artifact = { content: text(typeof a === 'string' ? a : a?.content, 'artifact', 24000),
        version: Number.isSafeInteger(a?.version) && a.version > 0 && a.version < 100000 ? a.version : 1 };
    }
    if (r.operation === 'revise') result.payload.instruction = text(r.payload.instruction, 'revision instruction', 4000);
  }
  return result;
}

export function validateDocument(raw) {
  const d = boundedJson(raw, 220000);
  if (!object(d)) fail('Invalid document.');
  const product = oneOf(d.product, ['studio', 'mandala'], 'product');
  const kind = oneOf(d.kind, product === 'studio' ? ['work', 'template'] : ['goal'], 'document kind');
  const title = text(d.title, 'title', 160);
  if (!object(d.data)) fail('Invalid document data.');
  if (product === 'mandala') {
    const nested = object(d.data.chart);
    const chart = validateChart(nested ? d.data.chart : d.data);
    const reviews = Array.isArray(d.data.reviews) ? d.data.reviews.slice(-52).map(r => ({ date: text(r.date, 'review date', 40), notes: text(r.notes ?? '', 'review', 4000, true) })) : [];
    return { product, kind, title, data: nested ? { chart, reviews } : chart };
  }
  // Saved documents cannot acquire billing, ownership, or model permissions from their body.
  const data = boundedJson(d.data, 200000);
  return { product, kind, title, data };
}

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : canonical(value));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
}
