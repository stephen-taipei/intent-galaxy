// The extension's consumer views share the live galaxy session. Switching views
// never regenerates an analysis or reloads choices into a second state container.
import { renderLockedAst, renderPlainIntent, renderSacrifice, stripDecisionPrefix } from "./galaxy/libs/core/src/index.js";
import { NODE_IDS, quadrantOf } from "./galaxy/libs/protocol/src/index.js";
import { t, ready, onLocaleChange, LOCALES, preference, chooseLocale, languageName } from "./galaxy/apps/web/i18n.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = (name) => `<img class="v2-icon" src="icons/ui/${name}.svg" alt="" aria-hidden="true">`;
const button = (action, label, { cls = "", attrs = "", glyph = "" } = {}) => `<button type="button" data-action="${action}" class="${cls}" ${attrs}>${glyph ? icon(glyph) : ""}<span>${esc(label)}</span></button>`;
const VIEW_KEY = "ig:v2:galaxy-first";
const labels = () => ({ must: t("ast.must"), guard: t("ast.guard"), mustNot: t("ast.mustNot"), risk: t("ast.risk"), sacrifice: t("ast.sacrifice"), forbid: t("ast.forbid"), accepted: t("ast.accepted"),
  title: t("ast.title"), deciding: t("ast.deciding"), goal: t("ast.goal"), closing: t("ast.closing", { must: t("ast.must"), mustNot: t("ast.mustNot"), guard: t("ast.guard") }) });

export class DecisionView {
  constructor(galaxy, { onDraft = () => {}, onFill = async () => {} } = {}) {
    this.galaxy = galaxy;
    this.onDraft = onDraft;
    this.onFill = onFill;
    this.view = "compare";
    this.focusedNode = null;
    this.notes = "";
    this.editing = false;
    this.full = false;
    this.source = "chat";
    this.restoring = false;
    this.busy = false;
    this.active = false;
    this.defaultGalaxy = false;
    try { this.defaultGalaxy = localStorage.getItem(VIEW_KEY) === "true"; } catch { /* optional preference */ }
    this.root = document.createElement("main");
    this.root.className = "decision-v2";
    this.root.hidden = true;
    this.root.innerHTML = `<header class="v2-service"><span id="v2-source"></span><select id="v2-language"></select></header>
      <div id="v2-status" class="v2-status" role="status" aria-live="polite" hidden></div>
      <section id="v2-compare" class="v2-scroll"><div class="v2-heading"><p id="v2-eyebrow" class="v2-eyebrow"></p><h1 id="v2-title" tabindex="-1"></h1><p id="v2-question" class="v2-question"></p></div>
        <div id="v2-options" class="v2-options" role="group"></div><div id="v2-current-summary"></div><div id="v2-watch"></div><div id="v2-more"></div>
        <label class="v2-notes" for="v2-notes"><span id="v2-notes-label"></span><textarea id="v2-notes" rows="2" maxlength="4000"></textarea><small id="v2-notes-hint"></small></label>
      </section>
      <section id="v2-galaxy" class="v2-scroll" hidden><div id="v2-galaxy-back"></div><h1 id="v2-galaxy-title" tabindex="-1"></h1><p id="v2-current" class="v2-question"></p>
        <div class="v2-graph"><div class="v2-graph-head"><strong id="v2-graph-label"></strong><div id="v2-graph-toggle"></div></div><div id="v2-canvas"></div></div>
        <div id="v2-node-detail" class="v2-node-detail"></div><div id="v2-edit-tools"></div>
        <label class="v2-preference"><input id="v2-galaxy-first" type="checkbox"><span id="v2-preference-label"></span></label>
      </section>
      <section id="v2-preview" class="v2-scroll" hidden><div id="v2-preview-back"></div><h1 id="v2-preview-title" tabindex="-1"></h1><p id="v2-preview-lead" class="v2-question"></p>
        <div class="v2-chosen">${icon("check-circle")}<div><small id="v2-chosen-label"></small><strong id="v2-chosen-title"></strong></div></div>
        <label class="v2-output-label" for="v2-output" id="v2-output-label"></label><textarea id="v2-output" readonly spellcheck="false"></textarea>
        <p class="v2-send-note">${icon("info")}<span id="v2-send-note"></span></p>
      </section><footer class="v2-footer"><div id="v2-footer-actions"></div><small id="v2-footer-hint"></small></footer>`;
    galaxy.before(this.root);
    this.root.querySelector("#v2-canvas").append(galaxy);
    galaxy.setAttribute("v2", "");
    galaxy.readOnly = true;
    galaxy.compact = true;
    galaxy.setLayout({ summary: false, cards: false });
    this.root.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (el && !el.disabled) this.action(el.dataset.action, el);
    });
    this.root.querySelector("#v2-notes").addEventListener("input", (e) => { this.notes = e.target.value.slice(0, 4000); this.emitDraft(); });
    this.root.querySelector("#v2-galaxy-first").addEventListener("change", (e) => {
      this.defaultGalaxy = e.target.checked;
      try { localStorage.setItem(VIEW_KEY, String(this.defaultGalaxy)); } catch { /* optional preference */ }
    });
    this.root.querySelector("#v2-language").addEventListener("change", (e) => chooseLocale(e.target.value));
    galaxy.addEventListener("intent-change", (e) => {
      if (e.detail.type === "load") {
        this.view = this.defaultGalaxy ? "galaxy" : "compare";
        this.notify("");
        this.notes = ""; this.focusedNode = null; this.editing = false; this.full = false;
        this.root.querySelector("#v2-notes").value = "";
      }
      if (this.active) this.render();
      if (e.detail.type === "picks" || e.detail.type === "restore") this.emitDraft();
    });
    galaxy.addEventListener("intent-node-focus", (e) => {
      this.focusedNode = e.detail.id;
      this.renderDetail();
      // Focus moves alone are not persisted; the next pick or view change carries focusedNode.
    });
    // Native controls retain their Enter/Space behavior. Only Escape navigates back.
    this.root.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.isComposing) return;
      if (this.view !== "compare") { e.preventDefault(); e.stopPropagation(); this.setView("compare"); }
    });
    ready.then(() => this.render());
    onLocaleChange(() => this.render());
  }

  get session() { return this.galaxy.session; }
  get draft() { return { ...this.session.picks, view: this.view, focusedNode: this.focusedNode, notes: this.notes }; }
  emitDraft() { if (this.active && !this.restoring && this.session.analysis) this.onDraft(this.draft); }

  show(source = "chat") {
    this.active = true; this.source = source; this.root.hidden = false;
    this.render();
  }

  hide() { this.active = false; this.root.hidden = true; }

  restoreDraft(draft, legacyPicks) {
    this.restoring = true;
    try {
      if (draft || legacyPicks) this.session.restorePicks(draft ?? legacyPicks);
      this.notes = typeof draft?.notes === "string" ? draft.notes.slice(0, 4000) : "";
      this.focusedNode = NODE_IDS.includes(draft?.focusedNode) ? draft.focusedNode : null;
      this.view = ["compare", "galaxy", "preview"].includes(draft?.view) ? draft.view : this.defaultGalaxy ? "galaxy" : "compare";
      if (this.view === "preview" && !this.output()) this.view = "compare";
      this.editing = false;
      this.root.querySelector("#v2-notes").value = this.notes;
      if (this.focusedNode) this.galaxy.focusNode(this.focusedNode);
      this.render();
    } finally { this.restoring = false; }
  }

  title() {
    const { analysis, baseKey, hasPicks } = this.session;
    if (Object.keys(this.session.picks.overrides).length) return t("v2.custom");
    return analysis?.archetypes?.[baseKey]?.title || t(hasPicks ? "v2.custom" : "v2.unselected");
  }

  output() {
    const s = this.session, a = s.analysis, sol = s.solution;
    if (!a || !s.hasPicks || sol?.status !== "SAT") return null;
    const wording = labels();
    const custom = Object.keys(s.picks.overrides).length > 0;
    // A changed plan must not inherit a preset title or costs that may no longer apply.
    if (custom) wording.title = `${wording.title}：${t("v2.custom")}`;
    const titleKey = custom ? null : s.baseKey;
    let plain = renderPlainIntent(a, sol, titleKey, wording);
    // Notes remain inside the decision boundary when a refreshed page replaces it.
    if (this.notes.trim()) {
      const closingAt = plain.lastIndexOf(wording.closing);
      const note = `${t("v2.noteTitle")}\n${this.notes.trim()}\n\n`;
      plain = closingAt < 0 ? `${plain}\n\n${note.trim()}` : `${plain.slice(0, closingAt)}${note}${plain.slice(closingAt)}`;
    }
    return { ast: renderLockedAst(a, sol, titleKey, labels()), plain, ...s.picks, galaxyId: s.galaxyId, goal: this.galaxy.goal || s.goal };
  }

  setView(view, { focus = true } = {}) {
    if (view === "preview" && !this.output()) {
      this.notify(t(this.session.solution?.status !== "SAT" ? "v2.unsat" : "v2.empty"));
      return;
    }
    this.notify("");
    this.view = view;
    if (view !== "galaxy") this.editing = false;
    if (view === "galaxy" && !this.focusedNode) {
      this.focusedNode = this.session.analysis?.archetypes?.[this.session.baseKey]?.include?.[0] ?? NODE_IDS[0];
      this.galaxy.focusNode(this.focusedNode);
    }
    this.render();
    this.emitDraft();
    if (focus) this.root.querySelector(view === "compare" ? "#v2-title" : view === "galaxy" ? "#v2-galaxy-title" : "#v2-preview-title")?.focus({ preventScroll: true });
  }

  notify(message) { const el = this.root.querySelector("#v2-status"); el.textContent = message; el.hidden = !message; }

  async action(action, el) {
    if (this.busy) return;
    switch (action) {
      case "select": this.session.selectArchetype(el.dataset.key); break;
      case "why": case "galaxy": this.setView("galaxy"); break;
      case "back": this.setView("compare"); break;
      case "preview": this.setView("preview"); break;
      case "full": this.full = !this.full; this.render(); break;
      case "edit": this.editing = !this.editing; if (this.editing) this.full = true; this.render(); break;
      case "focus": this.galaxy.focusNode(el.dataset.node); break;
      case "stance": if (this.editing && this.focusedNode) this.session.setStance(this.focusedNode, el.dataset.stance); break;
      case "undo": this.session.undo(); break;
      case "redo": this.session.redo(); break;
      case "resolve": this.session.resolveConflicts(); break;
      case "conflict": {
        this.full = true; this.editing = true;
        this.focusedNode = this.session.solution?.conflicts[0] ?? this.focusedNode;
        this.setView("galaxy");
        if (this.focusedNode) this.galaxy.focusNode(this.focusedNode);
        break;
      }
      case "copy": {
        const value = this.root.querySelector("#v2-output").value;
        try { await navigator.clipboard.writeText(value); this.notify(t("web.copied")); }
        catch { this.root.querySelector("#v2-output").focus(); this.root.querySelector("#v2-output").select(); this.notify(t("web.copyFailed")); }
        break;
      }
      case "fill": {
        const output = this.output();
        if (!output) { this.setView("compare"); return; }
        this.busy = true; this.render();
        try { await this.onFill(output); }
        catch (err) { this.notify(err.message || t("web.copyFailed")); }
        finally { this.busy = false; this.render(); }
        break;
      }
    }
  }

  render() {
    const a = this.session.analysis;
    if (!a) return;
    const active = document.activeElement;
    const focusAction = this.root.contains(active) && active?.dataset.action;
    const focusKey = focusAction ? ["key", "stance", "node"].map((k) => active.dataset[k] ? `[data-${k}="${CSS.escape(active.dataset[k])}"]` : "").join("") : "";
    const q = (id) => this.root.querySelector(`#${id}`);
    q("v2-source").textContent = t(this.source === "demo" ? "v2.sample" : this.session.galaxyId ? "v2.localAi" : "v2.currentAi");
    q("v2-language").setAttribute("aria-label", t("ov.langTitle"));
    q("v2-language").innerHTML = `<option value="">${esc(t("ov.langAuto"))}</option>${LOCALES.map(code => `<option value="${code}">${esc(languageName(code))}</option>`).join("")}`;
    q("v2-language").value = preference;
    for (const view of ["compare", "galaxy", "preview"]) q(`v2-${view}`).hidden = view !== this.view;
    this.galaxy.readOnly = !this.editing;
    this.galaxy.compact = !this.full && !this.editing;
    this.galaxy.setLayout({ summary: false, cards: false });
    this.root.dataset.full = String(this.full || this.editing);
    q("v2-eyebrow").textContent = t("v2.compare");
    q("v2-title").textContent = t("v2.title");
    q("v2-question").textContent = this.galaxy.goal || stripDecisionPrefix(a.core.decision);
    q("v2-options").setAttribute("aria-label", t("v2.compare"));
    const entries = Object.entries(a.archetypes).filter(([, c]) => c);
    q("v2-options").innerHTML = entries.length ? entries.map(([key, c]) => {
      const selected = this.session.baseKey === key;
      const cost = renderSacrifice(c.sacrifice);
      const rec = a.recommend?.key === key;
      const first = c.include.find(id => quadrantOf(id) !== "Q4");
      return `<article class="v2-option ${selected ? "is-selected" : ""}">
        <button type="button" data-action="select" data-key="${esc(key)}" aria-pressed="${selected}" class="v2-option-pick"><span class="v2-radio" aria-hidden="true"></span><span><strong>${esc(c.title)}</strong><span class="v2-thesis">${esc(c.thesis)}</span>${rec ? `<span class="v2-recommended">${esc(t("v2.recommended"))}${a.recommend.why ? ` · ${esc(a.recommend.why)}` : ""}</span>` : ""}</span></button>
        <div class="v2-option-cost"><b>${esc(t("ov.gCost"))}</b><span>${esc(cost)}</span></div>
        ${selected ? `<div class="v2-option-detail">${first ? `<b>${esc(t("v2.includes"))}</b><p>${esc(a.nodes[first].claim)}</p>` : ""}${button("why", t("v2.why"), { cls: "v2-link" })}</div>` : ""}</article>`;
    }).join("") : `<p class="v2-empty">${esc(t("v2.noCard"))}</p>`;
    const sol = this.session.solution;
    const custom = Object.keys(this.session.picks.overrides).length > 0;
    q("v2-current-summary").innerHTML = custom ? `<p class="v2-custom">${esc(t("v2.custom"))} · ${esc(NODE_IDS.filter(id => sol.nodes[id].stance === "include").map(id => a.nodes[id].label).join(" · "))}</p>` : "";
    const risks = NODE_IDS.filter(id => quadrantOf(id) === "Q4" && sol.nodes[id].stance !== "neutral");
    q("v2-watch").innerHTML = sol.status !== "SAT" ? `<div class="v2-warning is-conflict" role="alert">${icon("info")}<div><strong>${esc(t("v2.unsat"))}</strong>${button("conflict", t("v2.reviewConflict"), { cls: "v2-link" })}</div></div>`
      : risks.length ? `<div class="v2-warning">${icon("info")}<div><strong>${esc(t("v2.guard"))}</strong>${risks.map(id => `<p><b>${esc(sol.nodes[id].stance === "exclude" ? t("v2.acceptRisk") : a.nodes[id].label)}</b> · ${esc(sol.nodes[id].stance === "exclude" ? a.nodes[id].claim : a.nodes[id].kill || a.nodes[id].claim)}</p>`).join("")}</div></div>` : "";
    q("v2-more").innerHTML = button("galaxy", t("v2.more"), { cls: "v2-explore", glyph: "git-branch" });
    q("v2-notes-label").textContent = t("v2.notes");
    q("v2-notes").placeholder = t("v2.notesPlaceholder");
    q("v2-notes-hint").textContent = t("v2.notesHint");
    q("v2-galaxy-back").innerHTML = button("back", t("v2.back"), { cls: "v2-link", glyph: "arrow-left" });
    q("v2-galaxy-title").textContent = t("v2.galaxyTitle");
    q("v2-current").textContent = t("v2.current", { title: this.title() });
    q("v2-graph-label").textContent = t(this.full || this.editing ? "v2.fullGalaxy" : "v2.focused");
    q("v2-graph-toggle").innerHTML = button("full", t(this.full ? "v2.focused" : "v2.fullGalaxy"), { cls: "v2-link", attrs: this.editing ? "disabled" : "" });
    q("v2-edit-tools").innerHTML = `${button("edit", t(this.editing ? "v2.readonly" : "v2.edit"), { cls: "v2-link", glyph: "edit-3", attrs: `aria-pressed="${this.editing}"` })}<div class="v2-history">${button("undo", t("v2.undo"), { glyph: "rotate-ccw", attrs: this.session.canUndo ? "" : "disabled" })}${button("redo", t("v2.redo"), { glyph: "rotate-cw", attrs: this.session.canRedo ? "" : "disabled" })}</div>${sol.status !== "SAT" ? `<p class="v2-conflict-text" role="alert">${esc(t("v2.unsat"))}</p>${button("resolve", t("v2.resolve"), { cls: "v2-secondary" })}` : ""}`;
    q("v2-preference-label").textContent = t("v2.defaultGalaxy"); q("v2-galaxy-first").checked = this.defaultGalaxy;
    this.renderDetail();
    q("v2-preview-back").innerHTML = button("back", t("v2.back"), { cls: "v2-link", glyph: "arrow-left" });
    q("v2-preview-title").textContent = t("v2.previewTitle");
    q("v2-preview-lead").textContent = t("v2.previewLead");
    q("v2-chosen-label").textContent = t("v2.chosen"); q("v2-chosen-title").textContent = this.title();
    q("v2-output-label").textContent = t("v2.previewBody"); q("v2-send-note").innerHTML = `${esc(t("v2.userSend"))}<br>${esc(t("v2.extraNote"))}`;
    const output = this.output();
    q("v2-output").value = output ? [output.goal, output.plain].filter(Boolean).join("\n\n") : "";
    if (this.view === "preview") {
      q("v2-footer-actions").innerHTML = button("fill", t("v2.fill"), { cls: "v2-primary", glyph: "corner-down-left", attrs: this.busy || !output ? "disabled" : "" }) + button("copy", t("v2.copy"), { cls: "v2-link", glyph: "copy" });
      q("v2-footer-hint").textContent = t("v2.preserve");
    } else {
      q("v2-footer-actions").innerHTML = (this.view === "galaxy" ? button("back", t("v2.back"), { cls: "v2-secondary", glyph: "arrow-left" }) : "") + button("preview", t("v2.preview"), { cls: "v2-primary", glyph: "arrow-right", attrs: !output ? "disabled" : "" });
      q("v2-footer-hint").textContent = t(sol.status !== "SAT" ? "v2.unsat" : output ? "v2.previewHint" : "v2.empty");
    }
    if (focusAction) {
      const selector = `[data-action="${CSS.escape(focusAction)}"]${focusKey}`;
      const next = this.root.querySelector(selector);
      // The control may be gone or disabled now (undo stack empty, relation list rebuilt): keep focus inside the panel.
      (next && !next.disabled ? next : this.root.querySelector(`#v2-${this.view === "compare" ? "title" : this.view === "galaxy" ? "galaxy-title" : "preview-title"}`))?.focus({ preventScroll: true });
    }
  }

  renderDetail() {
    const a = this.session.analysis, n = a?.nodes?.[this.focusedNode];
    const target = this.root.querySelector("#v2-node-detail");
    if (!n) { target.innerHTML = `<p>${esc(t("v2.readCondition"))}</p>`; return; }
    const sol = this.session.solution;
    const edges = a.edges.filter(e => e.from === this.focusedNode || e.to === this.focusedNode);
    target.innerHTML = `<h2>${esc(n.label)}</h2><p>${esc(n.claim)}</p>${n.blind ? `<p class="v2-blind">${icon("info")}${esc(n.blind)}</p>` : ""}
      ${quadrantOf(this.focusedNode) === "Q4" && n.kill ? `<p class="v2-warning-text"><b>${esc(t("v2.guard"))}</b> · ${esc(n.kill)}</p>` : ""}
      ${edges.length ? `<h3>${esc(t("v2.relations"))}</h3><ul class="v2-relations">${edges.map(e => { const other = e.from === this.focusedNode ? e.to : e.from; return `<li>${button("focus", a.nodes[other].label, { cls: "v2-link", attrs: `data-node="${other}"` })}<p>${esc(e.why)}</p></li>`; }).join("")}</ul>` : ""}
      ${this.editing ? `<div class="v2-stances">${[["include", "v2.keep"], ["exclude", quadrantOf(this.focusedNode) === "Q4" ? "v2.acceptRisk" : "v2.avoid"], ["neutral", "v2.ignore"]].map(([s, key]) => button("stance", t(key), { attrs: `data-stance="${s}" aria-pressed="${sol.nodes[this.focusedNode].stance === s}"` })).join("")}</div>` : `<small>${esc(t("v2.viewHint"))}</small>`}`;
  }
}
