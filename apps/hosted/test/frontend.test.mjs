import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ApiError, GUEST_TURNSTILE_ACTION, guestTurnstileOptions, HostedApi } from "../public/api.js";
import { applyHostedAccountResponse, applyMandalaProposalIfCurrent, buildStudioRequest, buildWorkContract, captureHostedAccountScope, chartDto, chartMarkdown, chartProgress, clearHostedAccountState, compareDocuments, createEmptyChart, createMandalaOperationSnapshot, createStudioContinuation, documentHistory, documentSaveTarget, historyVersionPair, LocalChartStore, mandalaOperationSnapshotMatches, parseChartJson, parseStudioContinuation, studioCanSubmit, studioSummaryMarkdown, studioSummarySections, studioTemplateSaveAccess, studioTemplateFromSearch, STUDIO_CONTINUATION_TTL_MS, THEME_POSITIONS, validateChart } from "../public/model.js";
import { MODEL_REGISTRY, validateJobRequest } from "../domain/index.mjs";
import { demoAnalysis } from "../domain/fixtures.mjs";
import { resolveCopyOverride } from "../../web/decision-copy.js";

test("Mandala data has one goal, eight themes, sixty-four actions, and mirrored theme positions", () => {
  const chart = createEmptyChart({ title: "Plan", goal: "Finish the plan" });
  assert.equal(chart.schemaVersion, 1);
  assert.equal(chart.themes.length, 8);
  assert.equal(chart.themes.flatMap((theme) => theme.actions).length, 64);
  assert.equal(THEME_POSITIONS.length, 8);
  assert.equal(new Set(THEME_POSITIONS.map(([r, c]) => `${r},${c}`)).size, 8);
  assert.equal(validateChart(chart), chart);
});

test("Mandala imports validate the full chart and preserve stable action ids", () => {
  const chart = createEmptyChart({ title: "Goal", goal: "Ship a useful feature" });
  const restored = parseChartJson(JSON.stringify(chart));
  assert.deepEqual(restored, chart);
  restored.themes[0].actions.pop();
  assert.throws(() => validateChart(restored), /exactly 8 actions/);
  assert.throws(() => parseChartJson("not json"), SyntaxError);
  assert.deepEqual(parseChartJson(JSON.stringify(chart) + " ".repeat(90_000)), chart);
  assert.throws(() => parseChartJson("x".repeat(1_000_001)), /too large/);
  const oversized = createEmptyChart();
  for (const theme of oversized.themes) for (const action of theme.actions) { action.text = "a".repeat(500); action.notes = "n".repeat(1000); }
  assert.throws(() => validateChart(oversized), /too large/);
  const duplicate = createEmptyChart();
  duplicate.themes[1].actions[0].id = duplicate.themes[0].actions[0].id;
  assert.throws(() => validateChart(duplicate), /Duplicate id/);
});

test("Mandala client validation matches the hosted API limits and ID format", () => {
  const chart = createEmptyChart();
  chart.title = "t".repeat(161);
  assert.throws(() => validateChart(chart), /title is too long/);
  chart.title = "";
  chart.goal = "g".repeat(501);
  assert.throws(() => validateChart(chart), /goal is too long/);
  chart.goal = "";
  chart.themes[0].actions[0].text = "a".repeat(501);
  assert.throws(() => validateChart(chart), /text is too long/);
  chart.themes[0].actions[0].text = "";
  chart.themes[0].id = "theme.one";
  assert.throws(() => validateChart(chart), /invalid id/);
  chart.themes[0].id = "t".repeat(61);
  assert.throws(() => validateChart(chart), /invalid id/);
});

test("Mandala API DTO omits blank optional action fields and exports readable Markdown", () => {
  const chart = createEmptyChart({ title: "Quarter", goal: "Ship v2" });
  chart.themes[0].title = "Research";
  chart.themes[0].actions[0] = { ...chart.themes[0].actions[0], text: "Interview three users", done: true, dueDate: "2026-11-01", notes: "Keep the sample small" };
  const dto = chartDto(chart);
  assert.equal("id" in dto, false);
  assert.deepEqual(dto.themes[0].actions[0], { id: "action-1-1", text: "Interview three users", done: true, dueDate: "2026-11-01", notes: "Keep the sample small" });
  assert.equal("dueDate" in dto.themes[0].actions[1], false);
  assert.equal(chartProgress(chart).done, 1);
  assert.match(chartMarkdown(chart), /- \[x\] Interview three users — due 2026-11-01/);
  assert.match(chartMarkdown(chart), /Keep the sample small/);
});

test("Studio contract accepts a custom DecisionSession selection and copies only contract fields", () => {
  const contract = buildWorkContract({
    taskType: "compare", goal: "Choose a path", input: "Two options", requirements: ["Preserve dates", ""],
    selection: { baseKey: null, overrides: { N1: "include" }, notes: "Check dates" }, provider: "openai", mode: "deep",
  });
  assert.deepEqual(contract, {
    taskType: "compare", goal: "Choose a path", input: "Two options", requirements: ["Preserve dates"],
    selection: { baseKey: null, overrides: { N1: "include" }, notes: "Check dates" },
  });
  assert.throws(() => buildWorkContract({ taskType: "message", goal: "", input: "x", requirements: [], selection: { baseKey: null, overrides: {} } }), /customize a decision/);
});

test("Studio request summary exposes readable fields and preserves user line breaks", () => {
  const sections = studioSummarySections({ taskType: "weekly", goal: "Goal line one\nGoal line two", input: "Background\nwith context", requirements: ["Keep names", "Do not invent dates"] }, "Selected plan\nAdditional note", {
    taskType: "Work type", taskTypes: { weekly: "Weekly update" }, goal: "Goal", background: "Background", requirements: "Requirements", selection: "Selection summary", noRequirements: "No requirements", noSelection: "No selection",
  });
  assert.deepEqual(sections.map(({ label }) => label), ["Work type", "Goal", "Background", "Requirements", "Selection summary"]);
  assert.equal(sections[0].value, "Weekly update");
  assert.equal(sections[1].value, "Goal line one\nGoal line two");
  assert.equal(sections[2].value, "Background\nwith context");
  assert.deepEqual(sections[3].items, ["Keep names", "Do not invent dates"]);
  assert.equal(sections[4].value, "Selected plan\nAdditional note");
  assert.doesNotMatch(JSON.stringify(sections), /baseKey|overrides|taskType|contract/);
  const markdown = studioSummaryMarkdown(sections);
  assert.match(markdown, /### Goal\n\nGoal line one\nGoal line two/);
  assert.doesNotMatch(markdown, /baseKey|overrides|taskType|contract/);
});

test("DecisionView accepts hosted context copy and keeps extension action defaults", () => {
  const hostedContext = { previewTitle: () => "Confirm the selected plan", sendNote: "Review the request summary before generating." };
  const translate = (key) => ({ "v2.previewTitle": "Take your decision back to the conversation", "v2.userSend": "After filling, you press Send on the AI website.", "v2.fill": "Put in the conversation input" })[key];
  assert.equal(resolveCopyOverride(hostedContext, "previewTitle", () => translate("v2.previewTitle")), "Confirm the selected plan");
  assert.equal(resolveCopyOverride(hostedContext, "sendNote", () => translate("v2.userSend")), "Review the request summary before generating.");
  assert.equal(resolveCopyOverride({}, "fill", () => translate("v2.fill")), "Put in the conversation input");
});

test("Studio cloud template controls disable guest saves and offer localized sign-in entry", () => {
  assert.deepEqual(studioTemplateSaveAccess(false, true), { disabled: true, showSignIn: true, showLoginHint: true });
  assert.deepEqual(studioTemplateSaveAccess(false, false), { disabled: true, showSignIn: false, showLoginHint: true });
  assert.deepEqual(studioTemplateSaveAccess(true, true), { disabled: false, showSignIn: false, showLoginHint: false });
});

test("Studio sign-in continuation is bounded, sanitized, one-day, and restores only local work state", () => {
  const now = 1_800_000_000_000;
  const analysis = demoAnalysis("Choose a workflow", "compare");
  const serialized = createStudioContinuation({
    form: { taskType: "compare", goal: "Choose a workflow", input: "Option A\nOption B", requirements: "Keep dates\nMark unknowns", provider: "openai", mode: "standard", providerConsent: true, consentDecisions: true },
    formDirty: true, analysis, selection: { baseKey: "alpha", overrides: { N1: "include" }, notes: "Do not invent dates" },
    selectionDraft: { baseKey: "alpha", overrides: { N1: "include" }, notes: "Keep the numbers", view: "galaxy", focusedNode: "N2" },
    selectionText: "Selected plan\nNotes stay on a separate line", contract: { taskType: "compare", selection: { ast: "internal" } },
    artifact: { id: "artifact-1", version: 2, content: "Editable draft", contentHash: "hash" },
    evaluation: { status: "unknown", checks: [], unavailableReason: "synthetic_demo" }, workTitle: "Workflow", step: 3,
  }, now);
  assert.equal(typeof serialized, "string");
  assert.ok(new TextEncoder().encode(serialized).byteLength < 250_000);
  assert.doesNotMatch(serialized, /internal|ast|__proto__/);
  const restored = parseStudioContinuation(serialized, now + 1);
  assert.equal(restored.expiresAt, now + STUDIO_CONTINUATION_TTL_MS);
  assert.equal(restored.studio.form.input, "Option A\nOption B");
  assert.equal(restored.studio.form.providerConsent, false, "the user must consent to the selected provider again after sign-in");
  assert.equal(restored.studio.form.consentDecisions, false, "secondary OpenAI review consent is not restored");
  assert.equal(studioCanSubmit(restored.studio.form), false, "a restored job cannot run before the user consents again");
  assert.equal(restored.studio.selectionDraft.view, "galaxy");
  assert.equal(restored.studio.selectionText, "Selected plan\nNotes stay on a separate line");
  assert.deepEqual(restored.studio.artifact, { id: "artifact-1", version: 2, content: "Editable draft", contentHash: "hash" });
  assert.equal(restored.studio.step, 4);
  assert.equal(restored.studio.contract, null, "the user-facing contract is rebuilt from validated form and selection data");
  assert.equal("currentDoc" in restored.studio, false, "restoring a draft never claims or saves a cloud document");
  assert.equal(parseStudioContinuation(serialized, now + STUDIO_CONTINUATION_TTL_MS), null);
  assert.equal(parseStudioContinuation("not-json", now), null);
  const futureDated = JSON.parse(serialized);
  futureDated.savedAt = now + 2;
  futureDated.expiresAt = futureDated.savedAt + STUDIO_CONTINUATION_TTL_MS;
  assert.equal(parseStudioContinuation(JSON.stringify(futureDated), now + 1), null);
  const tooManyRequirements = { form: { taskType: "message", goal: "Goal", input: "Input", requirements: Array.from({ length: 13 }, (_, i) => `R${i}`).join("\n"), provider: "openai", mode: "standard" } };
  assert.equal(createStudioContinuation(tooManyRequirements, now), null, "saved data stays within the server's request limits");
});

test("Studio request builder produces DTOs accepted by the real domain validator", () => {
  const goal = "Choose a support workflow";
  const input = "Option A keeps the current queue. Option B adds triage. Staffing is not confirmed.";
  const requirements = ["Do not invent staffing commitments"];
  const analysis = demoAnalysis(goal, "compare");
  const selection = { baseKey: "alpha", overrides: {}, notes: "Keep staffing unconfirmed" };
  const contract = buildWorkContract({ taskType: "compare", goal, input, requirements, selection });

  for (const provider of Object.keys(MODEL_REGISTRY)) for (const mode of Object.keys(MODEL_REGISTRY[provider])) {
    const analyze = buildStudioRequest({ operation: "analyze", taskType: "compare", goal, input, requirements, provider, mode, consentDecisions: true });
    const acceptedAnalyze = validateJobRequest(analyze);
    assert.equal(acceptedAnalyze.provider, provider);
    assert.equal(acceptedAnalyze.mode, mode);
    assert.equal("model" in analyze, false, "model IDs are selected server-side from provider→mode registry entries");
    assert.ok(MODEL_REGISTRY[acceptedAnalyze.provider][acceptedAnalyze.mode].id);

    for (const operation of ["generate", "revise", "evaluate"]) {
      const request = buildStudioRequest({ operation, provider, mode, consentDecisions: true, contract, analysis, selection,
        ...(operation === "revise" || operation === "evaluate" ? { artifact: { content: "Reviewable draft", version: 1 } } : {}),
        ...(operation === "revise" ? { instruction: "Keep the facts unchanged" } : {}) });
      const accepted = validateJobRequest(request);
      assert.equal(accepted.operation, operation);
      assert.equal(accepted.provider, provider);
      assert.equal(accepted.mode, mode);
      assert.match(accepted.payload.contract.selection.ast, /LOCKED INTENT AST/);
      if (operation !== "generate") assert.equal(accepted.payload.artifact.content, "Reviewable draft");
      if (operation === "revise") assert.equal(accepted.payload.instruction, "Keep the facts unchanged");
    }
  }
});

test("Studio Anthropic consent gates primary work separately from OpenAI Decisions transfer", () => {
  const goal = "Choose a support workflow";
  const input = "Option A keeps the current queue. Option B adds triage.";
  const analysis = demoAnalysis(goal, "compare");
  const selection = { baseKey: "alpha", overrides: {}, notes: "Keep staffing unconfirmed" };
  const contract = buildWorkContract({ taskType: "compare", goal, input, requirements: [], selection });
  const primaryOnlyForm = { provider: "anthropic", providerConsent: true, consentDecisions: false };
  assert.equal(studioCanSubmit(primaryOnlyForm), true, "primary provider consent permits Claude work");
  const primaryOnlyRequest = buildStudioRequest({ operation: "generate", provider: "anthropic", providerConsent: true, consentDecisions: false, contract, analysis, selection });
  const primaryOnlyEnvelope = validateJobRequest(primaryOnlyRequest);
  assert.equal(primaryOnlyEnvelope.provider, "anthropic");
  assert.equal(primaryOnlyEnvelope.consentDecisions, false, "Claude work does not imply consent to send data to OpenAI Decisions");
  assert.equal("providerConsent" in primaryOnlyRequest, false, "UI-only primary consent is not sent as an unrelated DTO field");
  assert.equal(studioCanSubmit({ ...primaryOnlyForm, providerConsent: false }), false, "secondary consent cannot replace primary-provider consent");

  const optedInRequest = buildStudioRequest({ operation: "generate", provider: "anthropic", providerConsent: true, consentDecisions: true, contract, analysis, selection });
  assert.equal(validateJobRequest(optedInRequest).consentDecisions, true, "the explicit OpenAI review choice is carried in the fixed DTO");
  const openAiPrimaryRequest = buildStudioRequest({ operation: "analyze", taskType: "compare", goal, input, requirements: [], provider: "openai", providerConsent: true });
  assert.equal(validateJobRequest(openAiPrimaryRequest).consentDecisions, true, "the OpenAI provider consent also covers its OpenAI review");
});

test("Studio and Mandala history browsing never changes the current document save target", () => {
  const docA = { id: "doc-A", revision: 7, title: "Work A" };
  const docB = { id: "doc-B", revision: 3, title: "Work B" };
  const versionsB = [{ revision: 1, data: { title: "B version 1" } }, { revision: 3, data: { title: "B version 3" } }];
  const studio = { currentDoc: docA, history: documentHistory(docB, versionsB) };
  assert.deepEqual(documentSaveTarget(studio.currentDoc), { id: "doc-A", revision: 7 }, "viewing B history leaves A as the PUT destination");
  assert.deepEqual(historyVersionPair(studio.history, 0, 1), { left: { title: "B version 1" }, right: { title: "B version 3" } }, "the comparison reads only B versions");

  const goalA = { id: "goal-A", revision: 4, title: "Goal A" };
  const goalB = { id: "goal-B", revision: 2, title: "Goal B" };
  const mandala = { cloudDoc: goalA, cloudHistory: documentHistory(goalB, versionsB) };
  assert.deepEqual(documentSaveTarget(mandala.cloudDoc), { id: "goal-A", revision: 4 }, "viewing Goal B history leaves Goal A as the PUT destination");
  assert.deepEqual(historyVersionPair(mandala.cloudHistory, 0, 1), { left: { title: "B version 1" }, right: { title: "B version 3" } });
});

test("Mandala proposal cannot replace a manually edited chart or a different goal", () => {
  const sentChart = createEmptyChart({ title: "Goal A", goal: "Finish goal A" });
  const snapshot = createMandalaOperationSnapshot({ chart: chartDto(sentChart), epoch: 4 });
  assert.ok(snapshot);

  const editedChart = structuredClone(sentChart);
  editedChart.themes[0].actions[0].text = "My manual edit";
  editedChart.themes[0].actions[0].done = true;
  const afterManualEdit = { chart: editedChart, localId: null, cloudDoc: null, chartEpoch: 6 };
  assert.equal(mandalaOperationSnapshotMatches(snapshot, afterManualEdit), false, "response arrival detects action and completion edits made in flight");
  const candidate = structuredClone(sentChart);
  candidate.themes[0].actions[0].text = "Old AI proposal";
  const applyAfterResponse = applyMandalaProposalIfCurrent(afterManualEdit, snapshot, candidate);
  assert.equal(applyAfterResponse.applied, false, "Apply performs its own current-state guard");
  assert.equal(applyAfterResponse.chart.themes[0].actions[0].text, "My manual edit");
  assert.equal(applyAfterResponse.chart.themes[0].actions[0].done, true);

  const otherGoal = createEmptyChart({ title: "Goal B", goal: "Finish goal B" });
  const switchedGoal = { chart: otherGoal, localId: null, cloudDoc: null, chartEpoch: 4 };
  assert.equal(mandalaOperationSnapshotMatches(snapshot, switchedGoal), false, "a goal switch cannot accept the earlier response");
  assert.equal(applyMandalaProposalIfCurrent(switchedGoal, snapshot, candidate).applied, false);
});

test("Mandala proposals remain applicable for untouched new and opened charts using app state fields", () => {
  const newState = { chart: createEmptyChart({ title: "New", goal: "Plan a new goal" }), localId: null, cloudDoc: null, chartEpoch: 1 };
  const newSnapshot = createMandalaOperationSnapshot({ chart: chartDto(newState.chart), localId: newState.localId, cloudDoc: newState.cloudDoc, epoch: newState.chartEpoch });
  assert.equal(mandalaOperationSnapshotMatches(newSnapshot, newState), true);
  const newCandidate = structuredClone(newState.chart);
  newCandidate.themes[0].actions[0].text = "First proposal";
  assert.equal(applyMandalaProposalIfCurrent(newState, newSnapshot, newCandidate).applied, true);

  const openedDoc = { id: "goal-cloud-1", revision: 5 };
  const openedState = { chart: createEmptyChart({ title: "Opened", goal: "Continue the saved goal" }), localId: null, cloudDoc: openedDoc, chartEpoch: 2 };
  const openedSnapshot = createMandalaOperationSnapshot({ chart: chartDto(openedState.chart), localId: null, cloudDoc: openedDoc, epoch: openedState.chartEpoch });
  assert.equal(mandalaOperationSnapshotMatches(openedSnapshot, openedState), true, "the app's chartEpoch field matches after openCloudGoal increments it");
  assert.equal(applyMandalaProposalIfCurrent(openedState, openedSnapshot, structuredClone(openedState.chart)).applied, true);
});

test("deferred account-scoped responses apply only while epoch and user still match", async () => {
  const state = { accountEpoch: 8, session: { user: { id: "user-A" }, entitlements: {} }, accountTransition: false };
  const scope = captureHostedAccountScope(state.accountEpoch, state.session);
  const applied = [];
  let resolveCurrent;
  const currentPromise = new Promise((resolve) => { resolveCurrent = resolve; });
  const currentResult = applyHostedAccountResponse(currentPromise, scope, () => ({ epoch: state.accountEpoch, session: state.session, transitioning: state.accountTransition }), (value) => applied.push(value));
  resolveCurrent({ documents: [{ id: "owned-by-A" }] });
  assert.equal(await currentResult, true);
  assert.equal(applied[0].documents[0].id, "owned-by-A");

  let resolveStale;
  const stalePromise = new Promise((resolve) => { resolveStale = resolve; });
  const staleResult = applyHostedAccountResponse(stalePromise, scope, () => ({ epoch: state.accountEpoch, session: state.session, transitioning: state.accountTransition }), (value) => applied.push(value));
  state.accountEpoch++;
  state.session = null;
  state.accountTransition = true;
  resolveStale({ documents: [{ id: "old-account" }] });
  assert.equal(await staleResult, false, "logout's epoch change and transition block a delayed response");
  assert.equal(applied.length, 1);

  state.accountTransition = false;
  state.session = { user: { id: "user-B" }, entitlements: {} };
  assert.equal(await applyHostedAccountResponse(Promise.resolve({ documents: [{ id: "wrong-user" }] }), scope, () => ({ epoch: state.accountEpoch, session: state.session, transitioning: state.accountTransition }), (value) => applied.push(value)), false, "same request epoch cannot cross to another user");
  assert.equal(applied.length, 1);
});

test("logout clears cloud account bindings while preserving independent manual Mandala work", () => {
  const localChart = createEmptyChart({ title: "Local plan", goal: "Keep editing locally" });
  localChart.themes[0].actions[0].text = "Manual action";
  const state = {
    studio: { step: 4, form: { providerConsent: true }, currentDoc: { id: "work-A" }, history: { document: { id: "work-B" } }, templates: [{ id: "template-A" }], works: [{ id: "work-A" }], artifact: { content: "private account artifact" }, analysis: { private: true }, docsLoaded: true },
    mandala: { chart: createEmptyChart({ goal: "Cloud goal" }), chartEpoch: 2, cloudDoc: { id: "goal-A" }, cloudGoals: [{ id: "goal-A" }], cloudHistory: { document: { id: "goal-B" } }, cloudLoaded: true },
  };
  clearHostedAccountState(state);
  assert.equal(state.studio.currentDoc, null);
  assert.equal(state.studio.history, null);
  assert.deepEqual(state.studio.works, []);
  assert.deepEqual(state.studio.templates, []);
  assert.equal(state.studio.artifact, null);
  assert.equal(state.studio.analysis, null);
  assert.equal(state.mandala.cloudDoc, null);
  assert.equal(state.mandala.cloudHistory, null);
  assert.deepEqual(state.mandala.cloudGoals, []);
  assert.equal(state.mandala.chart.goal, "", "cloud-bound chart content is cleared at logout");
  assert.equal(state.mandala.consent, false);

  const localState = { studio: {}, mandala: { chart: localChart, chartEpoch: 5, localId: "local-A", cloudDoc: null, cloudGoals: [], cloudHistory: null } };
  clearHostedAccountState(localState);
  assert.equal(localState.mandala.chart.goal, "Keep editing locally");
  assert.equal(localState.mandala.chart.themes[0].actions[0].text, "Manual action");
  assert.equal(localState.mandala.localId, "local-A");
});

test("Studio request-summary and artifact stages expose the restored provider consent controls", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /box\.append\(renderStudioConsent\(studio\.form, updateGenerateAvailability\)\)/, "step 3 can regain primary and optional secondary consent");
  assert.match(source, /artifactCard\.append\(renderStudioConsent\(studio\.form, updateArtifactAiAvailability\)\)/, "step 4 can regain consent without discarding the artifact");
  assert.match(source, /我另外同意把此工作資料交給 OpenAI 做 AI 檢查/);
});

test("Mandala chart DTO is accepted and sanitized by the real domain validator", () => {
  const chart = createEmptyChart({ title: "Quarter", goal: "Complete a focused reading plan" });
  chart.themes[0].title = "Research";
  chart.themes[0].actions[0].text = "Read one chapter";
  chart.themes[0].actions[0].notes = "";
  const dto = chartDto(chart);
  const accepted = validateJobRequest({ product: "mandala", operation: "expand", provider: "anthropic", mode: "deep", consentDecisions: true, payload: { chart: dto } });
  assert.deepEqual(accepted.payload.chart, dto);
  assert.deepEqual(accepted.payload, { chart: dto, instruction: "" });
  assert.equal(accepted.provider, "anthropic");
  assert.equal(accepted.mode, "deep");
});

test("guest Turnstile options carry the server-required action", () => {
  const onToken = () => {};
  const onError = () => {};
  const options = guestTurnstileOptions("public-site-key", { onToken, onError });
  assert.equal(GUEST_TURNSTILE_ACTION, "guest_trial");
  assert.equal(options.sitekey, "public-site-key");
  assert.equal(options.action, "guest_trial");
  assert.equal(options.callback, onToken);
  assert.equal(options["error-callback"], onError);
  assert.equal(options["expired-callback"], onError);
});

test("Studio template query accepts only one known identifier, never free-form text", () => {
  assert.equal(studioTemplateFromSearch("?template=message"), "message");
  assert.equal(studioTemplateFromSearch("?template=weekly"), "weekly");
  assert.equal(studioTemplateFromSearch("?template=compare"), "compare");
  assert.equal(studioTemplateFromSearch("?template=write+an+email"), null);
  assert.equal(studioTemplateFromSearch("?template=message&template=compare"), null);
  assert.equal(studioTemplateFromSearch("?prompt=write+an+email"), null);
});

test("document comparison returns text rows without rendering markup", () => {
  const rows = compareDocuments({ title: "Before" }, { title: "After" });
  assert.ok(rows.some((row) => row.type === "removed" && row.left.includes("Before")));
  assert.ok(rows.some((row) => row.type === "added" && row.right.includes("After")));
});

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

test("local Mandala saves update by local record id and delete only that record", () => {
  const storage = new MemoryStorage();
  const store = new LocalChartStore(storage, "charts");
  const first = createEmptyChart({ title: "First", goal: "A" });
  const second = createEmptyChart({ title: "Second", goal: "B" });
  const savedFirst = store.save(first, "local-a");
  store.save(second, "local-b");
  first.goal = "Updated";
  store.save(first, "local-a");
  assert.equal(store.list().length, 2);
  assert.equal(store.list().find((item) => item.id === "local-a").data.goal, "Updated");
  store.remove(savedFirst.id);
  assert.deepEqual(store.list().map((item) => item.id), ["local-b"]);
});

test("API bootstrap reads session before config and unsafe jobs carry CSRF plus idempotency", async () => {
  const calls = [];
  const mockFetch = async (path, init) => {
    calls.push({ path, init });
    if (path === "/api/session") return new Response(JSON.stringify({ csrfToken: "csrf-value", user: null, entitlements: {} }), { status: 200 });
    if (path === "/api/config") return new Response(JSON.stringify({ mode: "demo", authEnabled: true, billingEnabled: false, turnstileSiteKey: "", models: {} }), { status: 200 });
    if (path === "/api/jobs") return new Response(JSON.stringify({ job: { id: "job-1", status: "queued" } }), { status: 202 });
    throw new Error("unexpected request");
  };
  const api = new HostedApi(mockFetch);
  await api.bootstrap();
  await api.submitJob({ product: "studio", operation: "analyze" }, "once-key");
  assert.deepEqual(calls.map((call) => call.path), ["/api/session", "/api/config", "/api/jobs"]);
  assert.equal(calls[0].init.cache, "no-store");
  assert.equal(calls[2].init.headers["X-CSRF-Token"], "csrf-value");
  assert.equal(calls[2].init.headers["Idempotency-Key"], "once-key");
  assert.equal(calls[2].init.credentials, "same-origin");
});

test("API refuses unsafe calls without a session token and reports network outcome distinctly", async () => {
  const api = new HostedApi(async () => { throw new Error("offline"); });
  await assert.rejects(api.request("/api/guest", { method: "POST", body: {} }), (error) => error instanceof ApiError && error.code === "session_required");
  api.csrfToken = "csrf";
  await assert.rejects(api.submitJob({ product: "studio", operation: "analyze" }, "retry-never"), (error) => error instanceof ApiError && error.code === "network_error");
});

test("document updates send only the fixed PUT DTO", async () => {
  let call;
  const api = new HostedApi(async (path, init) => {
    call = { path, init };
    return new Response(JSON.stringify({ document: { id: "doc-1" } }), { status: 200 });
  });
  api.csrfToken = "csrf";
  await api.saveDocument({ product: "studio", kind: "work", title: "Updated", data: { text: "body" }, id: "doc-1", revision: 3 });
  assert.equal(call.path, "/api/documents/doc-1");
  assert.deepEqual(JSON.parse(call.init.body), { title: "Updated", data: { text: "body" }, revision: 3 });
});
