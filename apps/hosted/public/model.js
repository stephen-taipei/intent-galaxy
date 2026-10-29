export const THEME_POSITIONS = [
  [0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0],
];
export const SCHEMA_VERSION = 1;
export const LOCAL_CHARTS_KEY = "ig:mandala:charts:v1";

const cleanText = (value, max, field) => {
  if (typeof value !== "string") throw new TypeError(`${field} must be text`);
  if (value.length > max) throw new RangeError(`${field} is too long`);
  return value;
};
const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};
const toChartDto = (chart) => ({
  schemaVersion: chart.schemaVersion,
  title: chart.title,
  goal: chart.goal,
  themes: chart.themes.map((theme) => ({
    id: theme.id,
    title: theme.title,
    actions: theme.actions.map((action) => ({
      id: action.id,
      text: action.text,
      done: action.done,
      ...(action.dueDate ? { dueDate: action.dueDate } : {}),
      ...(action.notes ? { notes: action.notes } : {}),
    })),
  })),
});

export function createEmptyChart({ title = "", goal = "" } = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    title,
    goal,
    themes: Array.from({ length: 8 }, (_, ti) => ({
      id: `theme-${ti + 1}`,
      title: "",
      actions: Array.from({ length: 8 }, (_, ai) => ({
        id: `action-${ti + 1}-${ai + 1}`,
        text: "",
        done: false,
        dueDate: "",
        notes: "",
      })),
    })),
  };
}

/** Validate the single-source chart DTO. Mirror cells are always derived from themes. */
export function validateChart(chart) {
  if (!chart || typeof chart !== "object" || Array.isArray(chart)) throw new TypeError("Chart must be an object");
  if (chart.schemaVersion !== SCHEMA_VERSION) throw new RangeError("Unsupported chart schemaVersion");
  cleanText(chart.title, 160, "title");
  cleanText(chart.goal, 500, "goal");
  if (!Array.isArray(chart.themes) || chart.themes.length !== 8) throw new RangeError("A chart must contain exactly 8 themes");
  const ids = new Set();
  const addId = (id, field) => {
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,60}$/.test(id)) throw new TypeError(`${field} has an invalid id`);
    if (ids.has(id)) throw new RangeError(`Duplicate id: ${id}`);
    ids.add(id);
  };
  for (const [ti, theme] of chart.themes.entries()) {
    if (!theme || typeof theme !== "object" || Array.isArray(theme)) throw new TypeError(`theme ${ti + 1} must be an object`);
    addId(theme.id, `theme ${ti + 1}`);
    cleanText(theme.title, 200, `theme ${ti + 1} title`);
    if (!Array.isArray(theme.actions) || theme.actions.length !== 8) throw new RangeError(`theme ${ti + 1} must contain exactly 8 actions`);
    for (const [ai, action] of theme.actions.entries()) {
      if (!action || typeof action !== "object" || Array.isArray(action)) throw new TypeError(`action ${ti + 1}.${ai + 1} must be an object`);
      addId(action.id, `action ${ti + 1}.${ai + 1}`);
      cleanText(action.text, 500, `action ${ti + 1}.${ai + 1} text`);
      if (typeof action.done !== "boolean") throw new TypeError(`action ${ti + 1}.${ai + 1} done must be boolean`);
      if (action.dueDate !== undefined && action.dueDate !== "" && !validDate(action.dueDate)) throw new TypeError(`action ${ti + 1}.${ai + 1} dueDate must be a real YYYY-MM-DD date`);
      if (action.notes !== undefined) cleanText(action.notes, 1000, `action ${ti + 1}.${ai + 1} notes`);
    }
  }
  if (new TextEncoder().encode(JSON.stringify(toChartDto(chart))).byteLength > 80_000) throw new RangeError("Chart is too large");
  return chart;
}

export function parseChartJson(source) {
  if (typeof source !== "string" || new TextEncoder().encode(source).byteLength > 1_000_000) throw new RangeError("The JSON file is too large");
  return validateChart(JSON.parse(source));
}

export function chartDto(chart) {
  validateChart(chart);
  return toChartDto(chart);
}

export function chartMarkdown(chart) {
  validateChart(chart);
  const lines = [`# ${chart.title || "Mandala"}`, "", `**Goal:** ${chart.goal || ""}`, ""];
  for (const [i, theme] of chart.themes.entries()) {
    lines.push(`## ${i + 1}. ${theme.title || "Untitled theme"}`, "");
    for (const action of theme.actions) {
      const due = action.dueDate ? ` — due ${action.dueDate}` : "";
      lines.push(`- [${action.done ? "x" : " "}] ${action.text || "Untitled action"}${due}`);
      if (action.notes) lines.push(`  - ${action.notes}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function chartProgress(chart) {
  validateChart(chart);
  const actions = chart.themes.flatMap((theme) => theme.actions);
  return { done: actions.filter((action) => action.done).length, total: 64 };
}

export function buildWorkContract({ taskType, goal, input, requirements, selection }) {
  if (!["message", "weekly", "compare"].includes(taskType)) throw new RangeError("Unsupported task type");
  if (!selection || typeof selection !== "object" || (selection.baseKey !== null && !["alpha", "beta", "gamma"].includes(selection.baseKey))) throw new TypeError("Select a valid decision card first");
  if (!selection.baseKey && !Object.keys(selection.overrides ?? {}).length) throw new TypeError("Select or customize a decision first");
  return {
    taskType,
    goal: cleanText(goal, 2000, "goal"),
    input: cleanText(input, 20000, "input"),
    requirements: requirements.map((item) => cleanText(item, 1000, "requirement")).filter((item) => item.trim()),
    selection: {
      baseKey: selection.baseKey,
      overrides: { ...(selection.overrides ?? {}) },
      notes: typeof selection.notes === "string" ? selection.notes.slice(0, 4000) : "",
    },
  };
}

/** Build the exact Studio request envelopes consumed by the hosted job validator. */
/** Primary provider consent gates submission in the UI; OpenAI consent for its separate Decisions review is a distinct choice. */
export function studioCanSubmit(form) {
  return form?.providerConsent === true;
}

export function studioDecisionConsent({ provider = "openai", providerConsent = false, consentDecisions = false } = {}) {
  return consentDecisions === true || (provider === "openai" && providerConsent === true);
}

/** Build the exact Studio request envelopes consumed by the hosted job validator. */
export function buildStudioRequest({ operation, taskType, goal, input, requirements, provider = "openai", mode = "standard", providerConsent = false, consentDecisions = false, contract, analysis, selection, artifact, instruction }) {
  const common = { product: "studio", operation, provider, mode, consentDecisions: studioDecisionConsent({ provider, providerConsent, consentDecisions }) };
  if (operation === "analyze") return { ...common, payload: { taskType, goal, input, requirements } };
  const payload = { ...contract, contract, analysis, selection };
  if (artifact !== undefined) payload.artifact = artifact;
  if (instruction !== undefined) payload.instruction = instruction;
  return { ...common, payload };
}

/** Return only user-facing Studio fields; internal contract and solver keys stay out of the summary UI. */
export function studioSummarySections(contract, selectionSummary, labels) {
  const taskLabels = labels.taskTypes ?? {};
  const requirements = Array.isArray(contract?.requirements) ? contract.requirements.filter((value) => typeof value === "string" && value.trim()) : [];
  return [
    { label: labels.taskType, value: taskLabels[contract?.taskType] ?? "" },
    { label: labels.goal, value: typeof contract?.goal === "string" ? contract.goal : "" },
    { label: labels.background, value: typeof contract?.input === "string" ? contract.input : "" },
    { label: labels.requirements, items: requirements, emptyValue: labels.noRequirements },
    { label: labels.selection, value: typeof selectionSummary === "string" && selectionSummary.trim() ? selectionSummary : labels.noSelection },
  ].filter((section) => section.value || section.items?.length || section.emptyValue);
}

export function studioSummaryMarkdown(sections) {
  return sections.map((section) => {
    const body = section.items ? (section.items.length ? section.items.map((value) => `- ${value}`).join("\n") : section.emptyValue) : section.value;
    return `### ${section.label}\n\n${body ?? ""}`;
  }).join("\n\n");
}

export function studioTemplateSaveAccess(signedIn, authEnabled) {
  return { disabled: !signedIn, showSignIn: !signedIn && authEnabled, showLoginHint: !signedIn };
}

export const STUDIO_CONTINUATION_TTL_MS = 24 * 60 * 60 * 1000;
export const STUDIO_CONTINUATION_MAX_BYTES = 250_000;

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
function boundedClone(value, maxBytes) {
  let json;
  try { json = JSON.stringify(value); } catch { return null; }
  if (!json || new TextEncoder().encode(json).byteLength > maxBytes || /"(?:__proto__|prototype|constructor)"\s*:/.test(json)) return null;
  try { return JSON.parse(json); } catch { return null; }
}
function continuationForm(value) {
  if (!isRecord(value) || !["message", "weekly", "compare"].includes(value.taskType) || !["openai", "anthropic"].includes(value.provider) || !["standard", "deep"].includes(value.mode)) return null;
  const limits = { goal: 2000, input: 20000, requirements: 8000 };
  for (const [key, max] of Object.entries(limits)) if (typeof value[key] !== "string" || value[key].length > max) return null;
  const requirements = value.requirements.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (requirements.length > 12 || requirements.some((item) => item.length > 500)) return null;
  return { taskType: value.taskType, goal: value.goal, input: value.input, requirements: value.requirements, provider: value.provider, mode: value.mode, providerConsent: false, consentDecisions: false };
}
function continuationPicks(value) {
  if (!isRecord(value)) return null;
  const baseKey = value.baseKey === null ? null : ["alpha", "beta", "gamma"].includes(value.baseKey) ? value.baseKey : undefined;
  if (baseKey === undefined || (value.overrides !== undefined && !isRecord(value.overrides))) return null;
  const overrides = {};
  for (const [key, stance] of Object.entries(value.overrides ?? {})) {
    if (!/^N(?:[1-9]|1[0-2])$/.test(key) || !["include", "exclude", "neutral"].includes(stance)) continue;
    overrides[key] = stance;
  }
  if (Object.keys(overrides).length > 12 || typeof (value.notes ?? "") !== "string" || (value.notes ?? "").length > 4000) return null;
  return { baseKey, overrides, notes: value.notes ?? "" };
}
function continuationAnalysis(value) {
  if (!isRecord(value) || !isRecord(value.core) || !isRecord(value.nodes) || !isRecord(value.archetypes) || !Array.isArray(value.edges)) return null;
  if (!isRecord(value.nodes.N1) || !isRecord(value.nodes.N12) || value.edges.length > 66) return null;
  return boundedClone(value, 100_000);
}
function continuationArtifact(value) {
  if (!isRecord(value) || typeof value.content !== "string" || value.content.length > 24_000) return null;
  const version = Number.isSafeInteger(value.version) && value.version > 0 && value.version < 100_000 ? value.version : 1;
  return { ...(typeof value.id === "string" && value.id.length <= 100 ? { id: value.id } : {}), version, content: value.content,
    ...(typeof value.contractHash === "string" && value.contractHash.length <= 100 ? { contractHash: value.contractHash } : {}),
    ...(typeof value.contentHash === "string" && value.contentHash.length <= 100 ? { contentHash: value.contentHash } : {}) };
}
function continuationEvaluation(value) {
  if (!isRecord(value) || !["pass", "fail", "unknown"].includes(value.status) || !Array.isArray(value.checks) || value.checks.length > 20) return null;
  const checks = value.checks.filter(isRecord).map((check) => ({ id: typeof check.id === "string" ? check.id.slice(0, 100) : "",
    label: typeof check.label === "string" ? check.label.slice(0, 300) : "", status: ["pass", "fail", "unknown"].includes(check.status) ? check.status : "unknown",
    source: typeof check.source === "string" ? check.source.slice(0, 100) : "" }));
  return { status: value.status, checks,
    ...(typeof value.unavailableReason === "string" && value.unavailableReason.length <= 100 ? { unavailableReason: value.unavailableReason } : {}),
    ...(typeof value.artifactHash === "string" && value.artifactHash.length <= 100 ? { artifactHash: value.artifactHash } : {}),
    ...(typeof value.contractHash === "string" && value.contractHash.length <= 100 ? { contractHash: value.contractHash } : {}) };
}
function continuationSnapshot(value) {
  if (!isRecord(value)) return null;
  const form = continuationForm(value.form);
  if (!form) return null;
  const analysis = value.analysis == null ? null : continuationAnalysis(value.analysis);
  if (value.analysis != null && !analysis) return null;
  const selection = value.selection == null ? null : continuationPicks(value.selection);
  if (value.selection != null && !selection) return null;
  if (selection && (!analysis || (selection.baseKey && !analysis.archetypes[selection.baseKey]) || (!selection.baseKey && !Object.keys(selection.overrides).length))) return null;
  const rawDraft = value.selectionDraft;
  const selectionDraft = rawDraft == null ? null : (() => {
    const picks = continuationPicks(rawDraft);
    if (!picks) return null;
    if (!analysis || (picks.baseKey && !analysis.archetypes[picks.baseKey]) || (!picks.baseKey && !Object.keys(picks.overrides).length)) return null;
    return { ...picks, view: ["compare", "galaxy", "preview"].includes(rawDraft.view) ? rawDraft.view : "compare",
      focusedNode: typeof rawDraft.focusedNode === "string" && /^N(?:[1-9]|1[0-2])$/.test(rawDraft.focusedNode) ? rawDraft.focusedNode : null };
  })();
  if (rawDraft != null && !selectionDraft && (!analysis || !continuationPicks(rawDraft))) return null;
  const artifact = value.artifact == null ? null : continuationArtifact(value.artifact);
  if (value.artifact != null && !artifact) return null;
  const evaluation = value.evaluation == null ? null : continuationEvaluation(value.evaluation);
  if (value.evaluation != null && !evaluation) return null;
  const selectionText = value.selectionText ?? "";
  const workTitle = value.workTitle ?? "";
  if (typeof selectionText !== "string" || selectionText.length > 30_000 || typeof workTitle !== "string" || workTitle.length > 160) return null;
  return { form, formDirty: true, analysis, selection, selectionDraft, selectionText, contract: null, artifact, evaluation,
    artifactDirty: value.artifactDirty === true, confirmedContract: false, workTitle, step: artifact ? 4 : analysis && selection ? 3 : analysis ? 2 : 1 };
}

/** Serialize only bounded Studio state for the explicit sign-in continuation. */
export function createStudioContinuation(studio, now = Date.now()) {
  if (!isRecord(studio) || !isRecord(studio.form) || !Number.isFinite(now)) return null;
  const hasDraft = Boolean([studio.form.goal, studio.form.input, studio.form.requirements].some((value) => typeof value === "string" && value.trim()) || studio.analysis || studio.selection || studio.artifact);
  if (!hasDraft) return null;
  const snapshot = continuationSnapshot(studio);
  if (!snapshot) return null;
  const record = { version: 1, savedAt: now, expiresAt: now + STUDIO_CONTINUATION_TTL_MS, studio: snapshot };
  const json = JSON.stringify(record);
  return new TextEncoder().encode(json).byteLength <= STUDIO_CONTINUATION_MAX_BYTES ? json : null;
}

/** Parse and re-sanitize a sign-in continuation; expired, oversized, or malformed values are rejected. */
export function parseStudioContinuation(raw, now = Date.now()) {
  if (typeof raw !== "string" || !Number.isFinite(now) || new TextEncoder().encode(raw).byteLength > STUDIO_CONTINUATION_MAX_BYTES) return null;
  let record;
  try { record = JSON.parse(raw); } catch { return null; }
  if (!isRecord(record) || record.version !== 1 || !Number.isFinite(record.savedAt) || record.savedAt > now || record.savedAt < now - STUDIO_CONTINUATION_TTL_MS || !Number.isFinite(record.expiresAt) || record.expiresAt <= now || record.expiresAt > record.savedAt + STUDIO_CONTINUATION_TTL_MS) return null;
  const studio = continuationSnapshot(record.studio);
  return studio ? { version: 1, savedAt: record.savedAt, expiresAt: record.expiresAt, studio } : null;
}

/** URL templates are identifiers only; free-form query text is never treated as a prompt. */
export function studioTemplateFromSearch(search) {
  const values = new URLSearchParams(search ?? "").getAll("template");
  return values.length === 1 && ["message", "weekly", "compare"].includes(values[0]) ? values[0] : null;
}

/** Keep history browsing separate from the document currently being edited and saved. */
export function documentHistory(document, versions) {
  return document && typeof document.id === "string"
    ? { document, versions: Array.isArray(versions) ? versions : [] }
    : null;
}

export function documentSaveTarget(document) {
  return document && typeof document.id === "string" ? { id: document.id, revision: document.revision } : {};
}

export function historyVersionPair(history, leftIndex, rightIndex) {
  const versions = Array.isArray(history?.versions) ? history.versions : [];
  const snapshot = (index) => versions[index]?.data ?? {};
  return { left: snapshot(leftIndex), right: snapshot(rightIndex) };
}

/** Remove account-scoped cloud data from memory after logout while preserving manual local charts. */
export function clearHostedAccountState(state) {
  const studio = state?.studio;
  if (studio) Object.assign(studio, {
    step: 1, preflight: null,
    form: { taskType: "message", goal: "", input: "", requirements: "", provider: "openai", mode: "standard", providerConsent: false, consentDecisions: false },
    formDirty: false, analysis: null, selection: null, selectionDraft: null, selectionText: "", contract: null,
    artifact: null, evaluation: null, artifactDirty: false, currentDoc: null, history: null,
    templates: [], works: [], docsLoaded: false, confirmedContract: false, workTitle: "",
  });
  const mandala = state?.mandala;
  if (mandala) {
    const wasCloudBound = Boolean(mandala.cloudDoc);
    Object.assign(mandala, { cloudDoc: null, cloudHistory: null, cloudGoals: [], cloudLoaded: false, consent: false });
    if (wasCloudBound) Object.assign(mandala, {
      chart: createEmptyChart(), chartEpoch: (Number.isSafeInteger(mandala.chartEpoch) ? mandala.chartEpoch : 0) + 1,
      localId: null, proposal: null, proposalSnapshot: null, proposalText: "", proposalStale: false,
      reviewDate: new Date().toISOString().slice(0, 10), reviewNote: "", reviewFor: null,
    });
  }
  return state;
}

function hostedSessionPrincipal(session) {
  if (typeof session?.user?.id === "string" && session.user.id) return `user:${session.user.id}`;
  if (session?.entitlements?.studio?.plan === "guest") return "guest";
  return "anonymous";
}

export function captureHostedAccountScope(epoch, session) {
  return { epoch: Number.isSafeInteger(epoch) && epoch >= 0 ? epoch : 0, principal: hostedSessionPrincipal(session) };
}

export function hostedAccountScopeMatches(scope, context) {
  return !!scope && !!context && context.transitioning !== true && scope.epoch === context.epoch && scope.principal === hostedSessionPrincipal(context.session);
}

export async function applyHostedAccountResponse(promise, scope, getContext, apply) {
  const value = await promise;
  if (!hostedAccountScopeMatches(scope, getContext())) return false;
  apply(value);
  return true;
}

function mandalaTarget(value) {
  if (typeof value?.cloudDoc?.id === "string") return { kind: "cloud", id: value.cloudDoc.id, revision: value.cloudDoc.revision };
  if (typeof value?.localId === "string") return { kind: "local", id: value.localId };
  return { kind: "new", id: null };
}

/** Capture the exact chart and target to which an AI proposal belongs. */
export function createMandalaOperationSnapshot({ chart, localId = null, cloudDoc = null, epoch = 0 } = {}) {
  const copy = boundedClone(chart, 80_000);
  if (!copy || !Number.isSafeInteger(epoch) || epoch < 0) return null;
  return { version: 1, chartKey: JSON.stringify(copy), target: mandalaTarget({ localId, cloudDoc }), epoch };
}

export function mandalaOperationSnapshotMatches(snapshot, current) {
  if (!isRecord(snapshot) || snapshot.version !== 1 || typeof snapshot.chartKey !== "string" || snapshot.chartKey.length > 80_000 || !Number.isSafeInteger(snapshot.epoch)) return false;
  if (!isRecord(current)) return false;
  const currentEpoch = Number.isSafeInteger(current.chartEpoch) ? current.chartEpoch : Number.isSafeInteger(current.epoch) ? current.epoch : 0;
  if (snapshot.epoch !== currentEpoch) return false;
  let chart;
  try { chart = boundedClone(toChartDto(current.chart), 80_000); } catch { return false; }
  if (!chart || JSON.stringify(chart) !== snapshot.chartKey) return false;
  return JSON.stringify(snapshot.target) === JSON.stringify(mandalaTarget(current));
}

/** Re-check at Apply time so an in-flight/manual edit cannot replace a different chart. */
export function applyMandalaProposalIfCurrent(current, snapshot, proposal) {
  const applied = mandalaOperationSnapshotMatches(snapshot, current);
  return applied ? { applied: true, chart: proposal } : { applied: false, chart: current?.chart };
}

/** Compare readable JSON snapshots; no HTML is emitted. */
export function compareDocuments(before, after) {
  const left = JSON.stringify(before, null, 2).split("\n");
  const right = JSON.stringify(after, null, 2).split("\n");
  const rows = [];
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    if (left[i] === right[i]) rows.push({ type: "same", left: left[i] ?? "", right: right[i] ?? "" });
    else {
      if (left[i] !== undefined) rows.push({ type: "removed", left: left[i], right: "" });
      if (right[i] !== undefined) rows.push({ type: "added", left: "", right: right[i] });
    }
  }
  return rows;
}

export class LocalChartStore {
  constructor(storage = globalThis.localStorage, key = LOCAL_CHARTS_KEY) {
    this.storage = storage;
    this.key = key;
  }
  list() {
    try {
      const records = JSON.parse(this.storage?.getItem(this.key) ?? "[]");
      return Array.isArray(records) ? records.filter((item) => typeof item?.id === "string" && item?.data).filter((item) => { try { validateChart(item.data); return true; } catch { return false; } }) : [];
    } catch { return []; }
  }
  save(chart, id = crypto.randomUUID()) {
    validateChart(chart);
    const records = this.list();
    const now = new Date().toISOString();
    const at = records.findIndex((item) => item.id === id);
    const record = { id, data: structuredClone(chart), savedAt: now };
    if (at >= 0) records[at] = record;
    else records.unshift(record);
    this.storage?.setItem(this.key, JSON.stringify(records));
    return record;
  }
  remove(id) {
    const next = this.list().filter((item) => item.id !== id);
    this.storage?.setItem(this.key, JSON.stringify(next));
  }
}

export function filenameFor(value, fallback = "download") {
  const slug = String(value ?? "").normalize("NFKC").trim().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  return slug || fallback;
}
