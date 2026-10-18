// <intent-galaxy-overlay>：純正星系版 UI 的 Shadow DOM Web Component。
// 同一份元件用於 CLI 網頁（apps/web/index.html）與瀏覽器擴充功能（內嵌於 AI 網頁輸入框上方）。
// 事件：intent-lock {ast, baseKey, overrides, galaxyId}、intent-close、intent-synth-request {conflicts}。
import { renderLockedAst, renderSacrifice, repairAnalysis, solveGalaxy } from "../../libs/core/src/index.ts";
import { NODE_IDS, quadrantOf } from "../../libs/protocol/src/index.ts";
import { t, ready, locale, preference, LOCALES, chooseLocale, languageName, onLocaleChange } from "./i18n.js";

const astLabels = () => ({ must: t("ast.must"), guard: t("ast.guard"), mustNot: t("ast.mustNot"), risk: t("ast.risk"), sacrifice: t("ast.sacrifice"), forbid: t("ast.forbid"), accepted: t("ast.accepted") });

const COORDS = [
  { x: 35, y: 17 }, { x: 50, y: 12 }, { x: 65, y: 17 },
  { x: 84, y: 32 }, { x: 87, y: 50 }, { x: 84, y: 68 },
  { x: 65, y: 83 }, { x: 50, y: 88 }, { x: 35, y: 83 },
  { x: 16, y: 68 }, { x: 13, y: 50 }, { x: 16, y: 32 },
];
const QUADRANT_TAGS = () => ({
  Q1: t("ov.q1"), Q2: t("ov.q2"), Q3: t("ov.q3"), Q4: t("ov.q4"),
});
const ARCH = [["alpha", "1"], ["beta", "2"], ["gamma", "3"]];
const HINT_QUADRANT = { f: "Q1", d: "Q2", l: "Q3", p: "Q4" };
const DIST_BADGE = { 1: "· D1", 2: "◈ D2", 3: "⬥ D3", 4: "✦ D4" };
const KEY_HINTS = () => [
  [["1", "2", "3"], t("ov.keyCards"), t("ov.keyCardsTip")],
  [["h", "j", "k", "l"], t("ov.keyNav"), t("ov.keyNavTip")],
  [["Space"], t("ov.keyInclude"), t("ov.keyIncludeTip")],
  [["x"], t("ov.keyExclude"), t("ov.keyExcludeTip")],
  [["r"], t("ov.keyResolve"), t("ov.keyResolveTip")],
  [["u"], t("ov.keyUndo"), t("ov.keyUndoTip")],
];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
const clip = (s, n) => { const a = [...String(s ?? "")]; return a.length > n ? a.slice(0, n - 1).join("") + "…" : a.join(""); };

// 中文 IME 相容（CLAUDE.md 鐵律 3）：注音／倉頡開啟時 e.key 為 "Process" 或非 ASCII，改讀 e.code。
export function normalizeKey(e) {
  const fromCode = (code) => code.startsWith("Key") ? code.slice(3).toLowerCase() : code.startsWith("Digit") ? code.slice(5) : code === "Space" ? " " : code;
  if (e.code && (e.code.startsWith("Digit") && e.shiftKey)) return fromCode(e.code);
  if (e.key === "Process" || (e.key.length === 1 && !/^[\x20-\x7e]$/.test(e.key))) return fromCode(e.code ?? "");
  return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}

const STYLE = `
:host { --bg:#080b11; --panel:#111723; --border:#1e293b; --text:#e2e8f0; --muted:#64748b; --q1:#38bdf8; --q2:#10b981; --q3:#a855f7; --q4:#f43f5e; --gold:#f59e0b;
  display:block; position:relative; color:var(--text); background:var(--bg); font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang TC","Noto Sans TC",sans-serif; outline:none; overflow:hidden; }
* { box-sizing:border-box; margin:0; padding:0; }
.wrap { display:grid; grid-template-columns:1fr 360px; grid-template-rows:1fr auto auto; height:100%; }
:host([embedded]) .wrap { grid-template-columns:1fr; }
:host([embedded]) aside { display:none; }
:host([embedded]) #cards, :host([embedded]) #bar { grid-column:1 / -1; }
/* 嵌入模式（擴充功能）的方案側欄：跟星系並排，星系仍可捲動、可邊看邊調；方案卡列可收合。 */
:host([embedded]) .wrap.summary-open { grid-template-columns:1fr min(340px,45%); }
:host([embedded]) .wrap.summary-open aside { display:flex; grid-column:2; grid-row:1; overflow:auto; border-left:1px solid #38bdf8; }
.wrap.cards-hidden #cards { display:none; }
#canvas { position:relative; width:100%; height:100%; min-width:720px; min-height:360px; }
#stage { position:relative; min-height:200px; overflow:auto; background:radial-gradient(circle at 50% 50%, rgba(30,41,59,.45) 0%, rgba(8,11,17,1) 72%); }
svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
.q-tag { position:absolute; font-size:10.5px; font-weight:600; padding:3px 8px; border-radius:6px; background:rgba(17,23,35,.92); border:1px solid var(--border); pointer-events:none; }
.q-tag.Q1 { top:6px; left:50%; transform:translateX(-50%); color:var(--q1); }
.q-tag.Q2, .q-tag.Q4 { top:34px; }
.q-tag.Q2 { right:8px; color:var(--q2); }
.q-tag.Q3 { bottom:6px; left:50%; transform:translateX(-50%); color:#c084fc; }
.q-tag.Q4 { left:8px; color:#fb7185; }
.q-tag small { color:var(--muted); font-weight:400; }
#core { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:min(250px,34%); padding:10px 14px; border-radius:14px; background:rgba(15,23,42,.96); border:2px solid #475569; text-align:center; box-shadow:0 0 35px rgba(56,189,248,.14); z-index:10; }
#core .sub { font-size:9.5px; letter-spacing:1px; color:var(--q1); margin-bottom:3px; }
#core .goal { font-size:12.5px; font-weight:700; color:#fff; }
#core .metric { font-size:10.5px; color:var(--gold); margin-top:4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; cursor:help; }
.node { position:absolute; transform:translate(-50%,-50%); padding:6px 10px; border-radius:9px; background:rgba(17,23,35,.94); border:1.5px solid #334155; color:var(--text); font:inherit; font-size:11.5px; font-weight:600; cursor:pointer; transition:opacity .15s, border-color .15s, background .15s; z-index:5; min-width:118px; max-width:180px; text-align:left; }
.node:hover, .node.focused { border-color:#fff; box-shadow:0 0 0 3px rgba(255,255,255,.2); z-index:20; }
.node .nid { font-size:10px; opacity:.65; margin-right:4px; font-family:ui-monospace,monospace; }
.node .blind { float:right; font-size:10px; color:var(--gold); margin-left:4px; }
.node .chip { display:block; font-size:9.5px; font-weight:400; color:#94a3b8; margin-top:2px; }
.node.ghost { border-style:dashed; color:var(--muted); cursor:default; animation:pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 50% { opacity:.45; } }
.node.dimmed { opacity:.4; }
.node[data-stance="include"] { background:rgba(16,185,129,.16); border-color:var(--q2); color:#ecfdf5; opacity:1; }
.node[data-stance="exclude"] { background:rgba(244,63,94,.14); border-color:var(--q4); color:#ffe4e6; opacity:1; }
.node[data-stance="exclude"] .lbl { text-decoration:line-through; }
.node[data-q="Q4"][data-stance="exclude"] .lbl { text-decoration:none; }
.node[data-src="user"] { outline:2px solid #fff; outline-offset:2px; }
.node[data-src="derived"] { border-style:dashed; }
.node.conflict { border-color:var(--q4) !important; background:rgba(244,63,94,.32) !important; }
#cards { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:8px 10px; background:var(--panel); border-top:1px solid var(--border); }
.card { background:#0b101b; border:1.5px solid var(--border); border-radius:9px; padding:7px 10px; cursor:pointer; font:inherit; color:inherit; text-align:left; }
.card.active { border-color:var(--q1); background:rgba(56,189,248,.07); }
.card.rec { border-color:rgba(245,158,11,.75); box-shadow:0 0 0 1px rgba(245,158,11,.2), 0 0 18px rgba(245,158,11,.12); }
.card.rec.active { border-color:var(--q1); }
.card .badges { display:flex; gap:4px; }
.card .rec-badge { font-size:9.5px; padding:1px 6px; border-radius:4px; background:rgba(245,158,11,.2); color:#fcd34d; font-weight:700; white-space:nowrap; }
.card .why { font-size:10.5px; color:#fcd34d; margin-top:2px; }
.card.ghost { border-style:dashed; color:var(--muted); cursor:default; }
.card .head { display:flex; justify-content:space-between; gap:6px; align-items:center; }
.card .title { font-size:12px; font-weight:700; color:#fff; }
.card .badge { font-size:9.5px; padding:1px 5px; border-radius:4px; background:rgba(168,85,247,.18); color:#d8b4fe; white-space:nowrap; }
.card .row { font-size:10.5px; color:#cbd5e1; margin-top:2px; }
.card .kill { font-size:10.5px; color:#fda4af; margin-top:2px; }
#bar { display:flex; align-items:center; gap:10px; padding:6px 10px; background:#0c111d; border-top:1px solid var(--border); font-size:11px; color:var(--muted); }
#bar .status { white-space:nowrap; flex-shrink:0; font-weight:600; padding:2px 8px; border-radius:6px; }
.status.sat { color:#34d399; background:rgba(16,185,129,.12); }
.status.unsat { color:#fb7185; background:rgba(244,63,94,.16); }
.status.wait { color:var(--q1); background:rgba(56,189,248,.12); }
#bar .keys { margin-left:auto; }
kbd { background:#1e293b; color:#cbd5e1; padding:0 5px; border-radius:4px; font-size:10px; border:1px solid #334155; font-family:inherit; }
#bar button { white-space:nowrap; flex-shrink:0; font:inherit; font-weight:700; padding:4px 10px; border-radius:6px; border:none; background:var(--q1); color:#080b11; cursor:pointer; }
#bar button#reset { background:transparent; color:var(--text); border:1px solid #475569; font-weight:600; }
#bar button#reset:hover { border-color:#fff; }
#bar button#reset:disabled { opacity:.35; cursor:default; }
#bar select#lang { flex-shrink:0; max-width:9em; font:inherit; padding:3px 4px; border-radius:6px; border:1px solid #475569; background:#0c111d; color:var(--text); cursor:pointer; }
aside { grid-column:2; grid-row:1 / 4; display:flex; flex-direction:column; padding:12px; gap:8px; background:#0c111d; border-left:1px solid var(--border); min-height:0; }
aside .head { display:flex; align-items:center; justify-content:space-between; }
aside h2 { font-size:11px; letter-spacing:.8px; color:var(--q1); }
aside .head button { font:inherit; font-size:10.5px; padding:2px 8px; border-radius:5px; border:1px solid #334155; background:#111723; color:#94a3b8; cursor:pointer; }
#summary { flex:1; overflow:auto; display:flex; flex-direction:column; gap:10px; min-height:0; }
#summary .empty { color:var(--muted); font-size:11.5px; line-height:1.7; padding:6px 2px; }
#summary .empty.unsat { color:#fb7185; }
#summary .plan { padding:9px 11px; border-radius:9px; background:rgba(56,189,248,.07); border:1px solid rgba(56,189,248,.25); }
#summary .plan b { display:block; font-size:13px; color:#fff; }
#summary .plan span { display:block; font-size:11px; color:#94a3b8; margin-top:2px; }
#summary section { border-left:3px solid var(--c); padding:2px 0 2px 10px; }
#summary h3 { font-size:11.5px; color:var(--c); margin-bottom:5px; font-weight:700; }
#summary h3 small { color:var(--muted); font-weight:400; margin-left:4px; }
#summary .item { margin-bottom:6px; }
#summary .item b { font-size:12px; color:#f1f5f9; }
#summary .item .nid { font:10px ui-monospace,monospace; color:var(--muted); margin-right:5px; }
#summary .item .tag { font-size:9.5px; color:#94a3b8; border:1px dashed #475569; border-radius:4px; padding:0 4px; margin-left:5px; }
#summary .item p { font-size:11px; color:#94a3b8; margin-top:1px; }
#summary .chips { display:flex; flex-wrap:wrap; gap:5px; }
#summary .chips span { font-size:11px; padding:2px 7px; border-radius:5px; background:#1e293b; color:#cbd5e1; }
#tip { position:absolute; z-index:100; max-width:300px; padding:8px 10px; border-radius:8px; background:#1e293b; border:1px solid #475569; color:#e2e8f0; font-size:11.5px; line-height:1.55; box-shadow:0 8px 24px rgba(0,0,0,.45); pointer-events:none; opacity:0; transition:opacity .12s; }
#tip.on { opacity:1; }
#tip b { color:#fff; }
#tip .dim { color:#94a3b8; }
#tip .k { color:#fda4af; }
#tip .g { color:#fcd34d; }
#bar .keys > span { cursor:help; }
aside pre { flex:1; overflow:auto; background:#070a10; border:1px solid var(--border); border-radius:8px; padding:10px; font:11px/1.5 ui-monospace,monospace; color:#cbd5e1; white-space:pre-wrap; }
aside .findings { font-size:10.5px; color:var(--gold); max-height:80px; overflow:auto; }
`;

export class IntentGalaxyOverlay extends HTMLElement {
  #analysis = null; #draft = null; #galaxyId = 0; #findings = [];
  #baseKey = null; #overrides = new Map(); #seq = 0; #focus = 0;
  #undo = []; #redo = []; #hint = ""; #message = ""; #solution = null; #showRaw = false;
  // 嵌入模式（擴充功能）的版面：方案側欄、方案卡列。summaryPref 為 null 時「第一次選策略卡自動打開一次」；使用者切換過就照他的。
  #summaryOpen = false; #summaryShown = false; #summaryPref = null; #cardsOpen = true;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>${STYLE}</style><div class="wrap">
      <main id="stage"><div id="canvas"><svg viewBox="0 0 1000 600" preserveAspectRatio="none"></svg><div id="tags"></div>
        <div id="core"><div class="sub"></div><div class="goal"></div><div class="metric"></div></div><div id="nodes"></div></div></main>
      <section id="cards"></section>
      <footer id="bar"><span class="status"></span><span class="msg"></span>
        <span class="keys"></span>
        <select id="lang"></select><button type="button" id="reset"></button><button type="button" id="lock"></button></footer>
      <aside><div class="head"><h2></h2><button type="button" id="raw-toggle"></button></div><div class="findings"></div><div id="summary"></div><pre hidden></pre></aside></div><div id="tip" role="tooltip"></div>`;
    const root = this.shadowRoot;
    // 每次 render 都重建節點按鈕；點擊後把焦點拉回 host，鍵盤流才不會掉到 document.body。
    root.addEventListener("click", () => this.focus({ preventScroll: true }));
    root.getElementById("nodes").addEventListener("click", (e) => this.#onNodeClick(e, "include"));
    root.getElementById("nodes").addEventListener("contextmenu", (e) => { e.preventDefault(); this.#onNodeClick(e, "exclude"); });
    root.getElementById("cards").addEventListener("click", (e) => { const k = e.target.closest("[data-arch]")?.dataset.arch; if (k) this.selectArchetype(k, e.shiftKey); }); // 點卡片＝還原成卡片原始選擇；Shift 保留手動調整
    root.getElementById("lock").addEventListener("click", () => this.lock());
    root.getElementById("reset").addEventListener("click", () => this.reset());
    root.getElementById("raw-toggle").addEventListener("click", () => { this.#showRaw = !this.#showRaw; this.#render(); });
    // 統一 tooltip：任何帶 data-tip 的元素（節點、策略卡、按鍵說明、按鈕）滑過或鍵盤聚焦時顯示。
    const showTip = (e) => { const el = e.target.closest?.("[data-tip]"); if (el) this.#showTip(el); else this.#hideTip(); };
    root.addEventListener("pointerover", showTip);
    root.addEventListener("focusin", showTip);
    root.addEventListener("pointerleave", () => this.#hideTip(), true);
    root.addEventListener("pointerdown", () => this.#hideTip());
    this.addEventListener("keydown", (e) => this.#onKey(e));
    root.getElementById("lang").addEventListener("change", (e) => chooseLocale(e.target.value));
    ready.then(() => this.#render()); // 語系載入後重畫一次（載入前先用英文）
    onLocaleChange(() => this.#render()); // 手動切換語系時重畫
  }

  /** 不隨狀態改變、只隨語系改變的文字：換語系時才重建。 */
  #textLocale = "";
  #localizeStatic(root) {
    if (this.#textLocale === locale) return;
    this.#textLocale = locale;
    const sub = root.querySelector("#core .sub");
    sub.textContent = t("ov.coreSub"); sub.title = t("ov.coreTip");
    root.querySelector("#bar .keys").innerHTML = KEY_HINTS().map(([keys, label, tip]) => `<span data-tip="${esc(tip)}">${keys.map((k) => `<kbd>${k}</kbd>`).join("")} ${esc(label)}</span>`).join(" · ");
    root.querySelector("aside h2").textContent = t("ov.summaryTitle");
    root.getElementById("raw-toggle").dataset.tip = t("ov.rawTip");
    const lang = root.getElementById("lang");
    lang.title = t("ov.langTitle");
    lang.setAttribute("aria-label", t("ov.langTitle"));
    lang.innerHTML = `<option value="">${esc(t("ov.langAuto"))}</option>` + LOCALES.map((l) => `<option value="${l}" lang="${l}">${esc(languageName(l))}</option>`).join("");
  }

  connectedCallback() { if (!this.hasAttribute("tabindex")) this.tabIndex = 0; this.#render(); }

  /** 完整星系（IntentAnalysisResponse）。會先經 V1–V18 修復管線。 */
  get analysis() { return this.#analysis; }
  set analysis(value) { this.setGalaxy(value); }

  setGalaxy(value, { galaxyId = 0, goal = "" } = {}) {
    const repaired = repairAnalysis(value);
    this.#findings = repaired.findings;
    if (!repaired.ok) { this.#message = t("ov.cannotCompile", { detail: repaired.findings.at(-1)?.msg ?? "" }); this.#render(); return false; }
    this.#analysis = repaired.analysis; this.#draft = null; this.#galaxyId = galaxyId; this.goal = goal;
    this.#baseKey = null; this.#overrides.clear(); this.#undo = []; this.#redo = []; this.#message = ""; this.#summaryOpen = this.#summaryPref === true; this.#summaryShown = false;
    this.#render();
    return true;
  }

  /** 進入串流等待狀態：中心顯示命題，四周 12 個 Ghost Slots。 */
  beginStream(goal) {
    this.#analysis = null; this.#findings = []; this.goal = goal;
    this.#draft = { core: { decision: goal, metric: "" }, nodes: {}, archetypes: {} };
    this.#message = t("ov.expanding"); this.#render();
  }

  /** 套用 /api/spawn 的 NDJSON 事件，逐顆點亮節點。 */
  applyStreamEvent(ev) {
    if (ev.t === "repaired") { this.setGalaxy(ev.analysis, { galaxyId: ev.galaxyId ?? 0, goal: this.goal }); return; }
    if (ev.t === "error") { this.#message = ev.detail ? t("ov.genFailedDetail", { code: ev.code, detail: ev.detail }) : t("ov.genFailed", { code: ev.code }); this.#render(); return; }
    if (!this.#draft) this.beginStream(this.goal ?? "");
    if (ev.t === "progress") { this.#message = ev.thinkingTokens != null ? t("ov.thinking", { tokens: Number(ev.thinkingTokens).toLocaleString() }) : t("ov.generating", { provider: ev.provider ?? t("ov.model"), sec: ev.elapsedSec ?? 0 }); this.#render(); return; }
    if (ev.t === "skeleton") this.#message = "";
    if (ev.t === "skeleton" && ev.core) this.#draft.core = ev.core;
    else if (ev.t === "node") this.#draft.nodes[ev.id] = ev.node;
    else if (ev.t === "archetype") this.#draft.archetypes[ev.key] = ev.archetype;
    this.#render();
  }

  /** 在狀態列顯示一則訊息（例如鎖檔被伺服器拒絕的原因）。 */
  showMessage(text) { this.#message = text; this.#render(); }

  /** 選策略卡＝還原成這張卡的原始選擇（清掉手動調整）；keepOverrides（Shift）才保留手動調整。 */
  selectArchetype(key, keepOverrides = false) {
    if (!this.#analysis?.archetypes[key]) return;
    this.#snapshot();
    this.#baseKey = key;
    if (!keepOverrides) this.#overrides.clear();
    if (!this.#summaryShown && this.#summaryPref === null) { this.#summaryShown = true; this.#summaryOpen = true; this.#emitLayout(); }
    this.#render();
  }

  /** 重設：清掉策略卡與所有手動調整，回到剛發散的星系（u 可復原）。 */
  reset() {
    if (!this.#analysis || (!this.#baseKey && !this.#overrides.size)) return;
    this.#snapshot();
    this.#baseKey = null; this.#overrides.clear();
    this.#message = t("ov.resetDone");
    this.#render();
  }

  /** 版面：方案側欄、方案卡列。open 省略時切換；使用者主動切換的結果會記住（layout 事件通知外層保存）。 */
  setLayout({ summary, cards } = {}, { user = false } = {}) {
    if (summary !== undefined) { this.#summaryOpen = summary === "toggle" ? !this.#summaryOpen : !!summary; if (user) this.#summaryPref = this.#summaryOpen; }
    if (cards !== undefined) this.#cardsOpen = cards === "toggle" ? !this.#cardsOpen : !!cards;
    this.#render();
    this.#emitLayout();
  }
  /** 外層（擴充功能面板）帶入記住的偏好。 */
  restoreLayout({ summary = null, cards = true } = {}) {
    this.#summaryPref = summary; this.#cardsOpen = cards !== false;
    if (summary !== null) this.#summaryOpen = summary;
    this.#render();
  }
  get layout() { return { summary: this.#summaryOpen, cards: this.#cardsOpen, summaryPref: this.#summaryPref }; }
  #emitLayout() { this.dispatchEvent(new CustomEvent("intent-layout", { bubbles: true, composed: true, detail: this.layout })); }

  setStance(id, target) {
    if (!this.#analysis) return;
    this.#snapshot();
    // 再按一次同一立場即切回忽略；結果等於策略卡預設時移除覆寫，
    // 但預設已被互斥推導讓位（derived）時必須保留覆寫，用戶的明確決定才會生效。
    const view = this.#solution?.nodes[id], shown = view?.stance;
    const next = shown === target ? "neutral" : target;
    const arch = this.#baseKey ? this.#analysis.archetypes[this.#baseKey] : null;
    const baseStance = arch?.include.includes(id) ? "include" : arch?.exclude.includes(id) ? "exclude" : "neutral";
    if (next === baseStance && view?.src !== "derived") this.#overrides.delete(id);
    else this.#overrides.set(id, { stance: next, seq: ++this.#seq });
    this.#render();
  }

  /** r：衝突核心中依序撤銷較舊的手動決定，直到 SAT（保留較新決定）。 */
  resolveConflicts() {
    if (!this.#solution?.conflicts.length) return;
    this.#snapshot();
    let guard = 12;
    while (this.#solve().status === "L3_UNSAT" && guard--) {
      const core = this.#solve().conflicts;
      const oldest = core.filter((id) => this.#overrides.has(id)).sort((a, b) => this.#overrides.get(a).seq - this.#overrides.get(b).seq)[0];
      if (!oldest) break;
      this.#overrides.delete(oldest);
    }
    this.#message = t("ov.resolved"); this.#render();
  }

  lock() {
    const sol = this.#solution;
    if (!sol || !this.#analysis) return;
    if (sol.status !== "SAT") { this.#message = t("ov.resolveFirst"); this.#render(); return; }
    const ast = renderLockedAst(this.#analysis, sol, this.#baseKey, astLabels());
    const overrides = Object.fromEntries([...this.#overrides].map(([id, o]) => [id, o.stance]));
    this.dispatchEvent(new CustomEvent("intent-lock", { bubbles: true, composed: true, detail: { ast, baseKey: this.#baseKey, overrides, galaxyId: this.#galaxyId } }));
  }

  #solve() {
    const overrides = new Map([...this.#overrides].map(([id, o]) => [id, o.stance]));
    return solveGalaxy(this.#analysis, this.#baseKey, overrides);
  }

  #snapshot() {
    this.#undo.push({ baseKey: this.#baseKey, overrides: new Map(this.#overrides) });
    if (this.#undo.length > 100) this.#undo.shift();
    this.#redo = [];
  }

  #restore(from, to) {
    const snap = from.pop();
    if (!snap) return;
    to.push({ baseKey: this.#baseKey, overrides: new Map(this.#overrides) });
    this.#baseKey = snap.baseKey; this.#overrides = snap.overrides; this.#render();
  }

  #onNodeClick(e, stance) {
    const id = e.target.closest("[data-node]")?.dataset.node;
    if (!id || !this.#analysis) return;
    this.#focus = NODE_IDS.indexOf(id);
    this.setStance(id, stance);
  }

  #move(dir) {
    const from = COORDS[this.#focus];
    let best = -1, bestCost = Infinity;
    COORDS.forEach((p, i) => {
      const dx = p.x - from.x, dy = p.y - from.y;
      const [along, across] = dir === "h" ? [-dx, dy] : dir === "l" ? [dx, dy] : dir === "k" ? [-dy, dx] : [dy, dx];
      if (i === this.#focus || along <= 0) return; // 半平面過濾
      const cost = along + 2 * Math.abs(across);
      if (cost < bestCost) { bestCost = cost; best = i; }
    });
    if (best >= 0) { this.#focus = best; this.#render(); }
  }

  #onKey(e) {
    const t = e.composedPath()[0];
    if (t?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t?.tagName)) return;
    if (e.metaKey || e.altKey) return;
    const k = normalizeKey(e);
    const handled = () => { e.preventDefault(); e.stopPropagation(); };
    if (k === "Escape") { handled(); this.dispatchEvent(new CustomEvent("intent-close", { bubbles: true, composed: true })); return; }
    if (e.ctrlKey) { if (k === "r") { handled(); this.#restore(this.#redo, this.#undo); } return; }
    if (this.#hint) {
      handled();
      if (this.#hint === "g" && HINT_QUADRANT[k]) { this.#hint = HINT_QUADRANT[k]; return; }
      if (/^Q[1-4]$/.test(this.#hint) && /^[1-3]$/.test(k)) { this.#focus = (Number(this.#hint[1]) - 1) * 3 + Number(k) - 1; }
      this.#hint = ""; this.#render(); return;
    }
    const focused = NODE_IDS[this.#focus];
    if (/^[1-3]$/.test(k)) { handled(); this.selectArchetype(ARCH[Number(k) - 1][0], e.shiftKey); }
    else if ("hjkl".includes(k) && k.length === 1) { handled(); this.#move(k); }
    else if (k === "Tab") { handled(); this.#focus = (this.#focus + (e.shiftKey ? 11 : 1)) % 12; this.#render(); }
    else if (k === " " || k === "i") { handled(); this.setStance(focused, "include"); }
    else if (k === "x") { handled(); this.setStance(focused, "exclude"); }
    else if (k === "0" || k === "n") { handled(); this.setStance(focused, "neutral"); }
    else if (k === "c") { handled(); const c = this.#solution?.conflicts[0]; if (c) { this.#focus = NODE_IDS.indexOf(c); this.#render(); } }
    else if (k === "r") { handled(); this.resolveConflicts(); }
    else if (k === "s") {
      handled();
      const conflicts = this.#solution?.conflicts ?? [];
      this.dispatchEvent(new CustomEvent("intent-synth-request", { bubbles: true, composed: true, detail: { conflicts } }));
      this.#message = conflicts.length ? t("ov.trizPending") : t("ov.noConflict");
      this.#render();
    }
    else if (k === "u") { handled(); this.#restore(this.#undo, this.#redo); }
    else if (k === "g") { handled(); this.#hint = "g"; }
    else if (k === "Enter") { handled(); this.lock(); }
  }

  #render() {
    const root = this.shadowRoot;
    if (!root) return;
    const a = this.#analysis, draft = this.#draft;
    const core = a?.core ?? draft?.core ?? { decision: this.goal || t("ov.waitingData"), metric: "" };
    const nodes = a?.nodes ?? draft?.nodes ?? {};
    const archetypes = a?.archetypes ?? draft?.archetypes ?? {};
    const quadrants = a?.quadrants ?? {};
    this.#localizeStatic(root);
    root.getElementById("lang").value = preference;
    const sol = this.#solution = a ? this.#solve() : null;
    const conflicts = new Set(sol?.conflicts ?? []);

    root.getElementById("tags").innerHTML = Object.entries(QUADRANT_TAGS()).map(([q, label]) =>
      `<div class="q-tag ${q}" title="${esc(quadrants[q]?.scar)}">${label}${quadrants[q]?.sacred ? ` <small>· ${esc(quadrants[q].sacred)}</small>` : ""}</div>`).join("");
    root.querySelector("#core .goal").textContent = String(core.decision ?? "").replace(/^你真正在[決决]定的是[:：]\s*/, "");
    const metricEl = root.querySelector("#core .metric");
    metricEl.textContent = core.metric ? `🎯 ${core.metric}` : "";
    if (core.metric) metricEl.dataset.tip = `<b>${t("ov.metric")}</b><br>${esc(core.metric)}`; else delete metricEl.dataset.tip;

    // ✦ 盲區最多標 3 顆，才看得出重點：優先 Q3 越界者（跨界的點子最常是原話沒想到的），再來 Q4、Q1、Q2。
    const blindShown = new Set(["Q3", "Q4", "Q1", "Q2"].flatMap((q) => NODE_IDS.filter((id) => quadrantOf(id) === q && nodes[id]?.blind)).slice(0, 3));
    root.getElementById("nodes").innerHTML = NODE_IDS.map((id, i) => {
      const n = nodes[id], pos = COORDS[i], q = quadrantOf(id);
      const style = `left:${pos.x}%;top:${pos.y}%`;
      if (!n) return `<button type="button" class="node ghost" style="${style}" tabindex="-1"><span class="nid">${id}</span>…</button>`;
      const view = sol?.nodes[id] ?? { stance: "neutral", src: "none" };
      const dimmed = this.#baseKey && view.stance === "neutral";
      const chip = view.src === "derived" ? `<span class="chip">${view.stance === "include" ? t("ov.chipDerivedIn") : t("ov.chipDerivedOut")}</span>`
        : view.src === "user" ? `<span class="chip">${t("ov.chipPinned")}</span>`
        : q === "Q4" && view.stance === "exclude" ? `<span class="chip">${t("ov.chipRisk")}</span>` : "";
      const cls = ["node", dimmed && "dimmed", i === this.#focus && "focused", conflicts.has(id) && "conflict"].filter(Boolean).join(" ");
      const blind = blindShown.has(id) ? `<span class="blind" title="${esc(n.blind)}">${t("ov.blind")}</span>` : "";
      return `<button type="button" class="${cls}" style="${style}" data-node="${id}" data-q="${q}" data-stance="${view.stance}" data-src="${view.src}" data-tip="${esc(this.#nodeTip(id, n, q, view))}"><span class="nid">${id}</span>${blind}<span class="lbl">${esc(clip(n.label, 15))}</span>${chip}</button>`;
    }).join("");

    // Anti-Spaghetti Rule：未選 3 選 1 前不畫任何連線。選了之後只畫「說明取捨」的線：
    // 綠線＝採納的節點連回中心；紅色虛線＝被排除的節點和與它互斥的採納節點；橘色點線＝採納節點依賴的另一顆。
    root.querySelector("svg").innerHTML = !sol || !this.#baseKey ? "" : NODE_IDS.map((id, i) => {
      if (sol.nodes[id].stance !== "include") return "";
      const p = COORDS[i], x = p.x * 10, y = p.y * 6;
      return `<path d="M ${x} ${y} Q ${(x + 500) / 2} ${y} 500 300" stroke="#10b981" stroke-width="2.2" fill="none" stroke-dasharray="${sol.nodes[id].src === "derived" ? "5,5" : "none"}" opacity=".78"/>`;
    }).join("") + this.#reasons(sol).map(({ from, to, kind }) => {
      const p = COORDS[NODE_IDS.indexOf(from)], q = COORDS[NODE_IDS.indexOf(to)];
      const color = kind === "excludes" ? "#f43f5e" : "#f59e0b", dash = kind === "excludes" ? "7,5" : "2,4";
      return `<line x1="${p.x * 10}" y1="${p.y * 6}" x2="${q.x * 10}" y2="${q.y * 6}" stroke="${color}" stroke-width="1.8" stroke-dasharray="${dash}" opacity=".85"/>`;
    }).join("");

    const rec = a?.recommend?.key;
    root.getElementById("cards").innerHTML = ARCH.map(([key, num]) => {
      const c = archetypes[key], isRec = rec === key;
      if (!c) return `<div class="card ghost"><div class="title">[${num}] ${draft ? t("ov.cardGenerating") : "—"}</div></div>`;
      const dist = Math.max(0, ...(c.include ?? []).map((id) => nodes[id]?.lateral?.dist ?? 0));
      const fatalKill = nodes[c.fatal]?.kill ?? "";
      const cls = ["card", this.#baseKey === key && "active", isRec && "rec"].filter(Boolean).join(" ");
      const tip = `<b>[${num}] ${esc(c.title)}</b>${c.thesis ? `<br>${esc(c.thesis)}` : ""}`
        + (isRec && a.recommend.why ? `<br><span class=g>${t("ov.recWhy", { why: esc(a.recommend.why) })}</span>` : "")
        + `<br>${t("ov.cardInclude", { list: (c.include ?? []).map((id) => esc(nodes[id]?.label ?? id)).join(t("ov.listSep")) })}`
        + (c.exclude?.length ? `<br>${t("ov.cardExclude", { list: c.exclude.map((id) => esc(nodes[id]?.label ?? id)).join(t("ov.listSep")) })}` : "")
        + `<br>${t("ov.cost", { cost: esc(renderSacrifice(c.sacrifice)) })}`
        + (fatalKill ? `<br><span class=k>${t("ov.fatalTip", { kill: esc(fatalKill) })}</span>` : "")
        + `<br><span class=dim>${t("ov.cardHow", { num })}</span>`;
      return `<button type="button" class="${cls}" data-arch="${key}" data-tip="${esc(tip)}">
        <div class="head"><span class="title">[${num}] ${esc(clip(c.title, 16))}</span><span class="badges">${isRec ? `<span class="rec-badge" title="${esc(t("ov.recBadgeTip"))}">${t("ov.recBadge")}</span>` : ""}${DIST_BADGE[dist] ? `<span class="badge">${DIST_BADGE[dist]}</span>` : ""}</span></div>
        ${isRec && a.recommend.why ? `<div class="why">★ ${esc(clip(a.recommend.why, 30))}</div>` : ""}
        <div class="row">${t("ov.cost", { cost: esc(clip(renderSacrifice(c.sacrifice), 40)) })}</div>
        <div class="kill">${t("ov.fatal", { kill: esc(clip(fatalKill, 30)) })}</div></button>`;
    }).join("");

    const status = root.querySelector("#bar .status");
    if (!sol) { status.className = "status wait"; status.textContent = draft ? t("ov.streaming", { n: Object.keys(nodes).length }) : t("ov.waitingGalaxy"); }
    else if (sol.status === "SAT") { status.className = "status sat"; status.textContent = this.#baseKey ? t("ov.statusOk") : rec ? t("ov.statusPickRec", { num: ARCH.find(([k]) => k === rec)[1] }) : t("ov.statusPick"); }
    else { status.className = "status unsat"; status.textContent = t("ov.statusConflict", { list: [...conflicts].join(" ⊗ ") }); }
    status.dataset.tip = !sol ? t("ov.tipNoData") : sol.status === "SAT"
      ? (this.#baseKey ? t("ov.tipOk") : t("ov.tipPick"))
      : t("ov.tipConflict", { status: esc(sol.status) });
    const resetBtn = root.getElementById("reset");
    resetBtn.textContent = t("ov.reset");
    resetBtn.disabled = !a || (!this.#baseKey && !this.#overrides.size);
    resetBtn.dataset.tip = t("ov.resetTip");
    const lockBtn = root.getElementById("lock"), embedded = this.hasAttribute("embedded");
    // 嵌入模式沒有固定的右側欄：方案側欄由外層（面板標題列的按鈕）開關，回填前可以核對「最後選了什麼」。
    const wrap = root.querySelector(".wrap");
    wrap.classList.toggle("summary-open", embedded && this.#summaryOpen);
    wrap.classList.toggle("cards-hidden", !this.#cardsOpen);
    lockBtn.textContent = embedded ? t("ov.lockEmbedded") : t("ov.lockWeb");
    lockBtn.dataset.tip = embedded ? t("ov.lockTipEmbedded") : t("ov.lockTipWeb");
    root.querySelector("#bar .msg").textContent = this.#hint ? t("ov.jump", { hint: this.#hint }) : this.#message;
    const pre = root.querySelector("aside pre"), summary = root.getElementById("summary");
    pre.textContent = sol?.status === "SAT" ? renderLockedAst(a, sol, this.#baseKey, astLabels()) : "";
    pre.hidden = !this.#showRaw; summary.hidden = this.#showRaw;
    root.getElementById("raw-toggle").textContent = this.#showRaw ? t("ov.summaryView") : t("ov.rawView");
    summary.innerHTML = this.#summaryHtml(a, sol, conflicts);
    root.querySelector("aside .findings").textContent = this.#findings.filter((f) => f.level !== "fix").map((f) => `${f.code} ${f.msg}`).join("\n");
  }

  /** 解釋目前取捨的邊：被排除的節點 ⊗ 與它互斥的採納節點；採納節點 → 它依賴、因此被一起加入的節點。 */
  #reasons(sol) {
    const edges = this.#analysis?.edges ?? [], st = (id) => sol.nodes[id]?.stance;
    return edges.flatMap((e) => {
      if (e.type === "excludes") {
        const [x, inc] = st(e.from) === "exclude" && st(e.to) === "include" ? [e.from, e.to] : st(e.to) === "exclude" && st(e.from) === "include" ? [e.to, e.from] : [];
        return x ? [{ from: x, to: inc, kind: "excludes", why: e.why }] : [];
      }
      if (e.type === "requires" && st(e.from) === "include" && st(e.to) === "include" && sol.nodes[e.to].src === "derived") return [{ from: e.from, to: e.to, kind: "requires", why: e.why }];
      return [];
    });
  }

  #nodeTip(id, n, q, view) {
    const state = view.stance === "include" ? (q === "Q4" ? t("ov.stGuard") : t("ov.stIncluded")) : view.stance === "exclude" ? (q === "Q4" ? t("ov.stRisk") : t("ov.stExcluded")) : t("ov.stNone");
    const why = view.src === "derived" ? (view.stance === "include" ? t("ov.whyPulled") : t("ov.whyGaveWay")) : view.src === "user" ? t("ov.whyUser") : view.src === "default" ? t("ov.whyCard") : "";
    return `<b>${esc(id)} ${esc(n.label)}</b><br>${esc(n.claim)}`
      + (n.kill ? `<br><span class=k>${t("ov.killCond", { kill: esc(n.kill) })}</span>` : "")
      + (n.blind ? `<br><span class=g>${t("ov.blindTip", { blind: esc(n.blind) })}</span>` : "")
      + (this.#solution && this.#baseKey ? this.#reasons(this.#solution).filter((r) => r.from === id || r.to === id).map((r) => {
        const other = r.from === id ? r.to : r.from, label = esc(this.#analysis.nodes[other]?.label ?? other);
        const text = t(r.kind === "excludes" ? "ov.relConflict" : r.from === id ? "ov.relNeeds" : "ov.relNeededBy", { id: esc(other), label });
        return `<br><span class=k>${text}${r.why ? `：${esc(r.why)}` : ""}</span>`;
      }).join("") : "")
      + `<br><span class=dim>${t("ov.nodeState", { state: state + why })}<br>${t("ov.nodeHow")}</span>`;
  }

  #tipTimer = 0;
  #showTip(el) {
    clearTimeout(this.#tipTimer);
    this.#tipTimer = setTimeout(() => {
      const tip = this.shadowRoot.getElementById("tip"), host = this.getBoundingClientRect(), r = el.getBoundingClientRect();
      tip.innerHTML = el.dataset.tip;
      tip.classList.add("on");
      const w = tip.offsetWidth, h = tip.offsetHeight;
      const left = Math.min(Math.max(8, r.left - host.left + r.width / 2 - w / 2), host.width - w - 8);
      const above = r.top - host.top - h - 8;
      tip.style.left = `${left}px`;
      tip.style.top = `${above >= 8 ? above : Math.min(r.bottom - host.top + 8, host.height - h - 8)}px`;
    }, 220);
  }
  #hideTip() { clearTimeout(this.#tipTimer); this.shadowRoot.getElementById("tip")?.classList.remove("on"); }

  /** 右側摘要：把 LOCKED INTENT AST 的五個區塊改寫成人看得懂的分組卡片（極性規則同 renderLockedAst）。 */
  #summaryHtml(a, sol, conflicts) {
    if (!sol) return `<div class="empty">${t("ov.waitingData")}</div>`;
    if (sol.status !== "SAT") return `<div class="empty unsat">${t("ov.sumConflict", { list: [...conflicts].join(" ⊗ ") })}</div>`;
    const picked = NODE_IDS.filter((id) => sol.nodes[id].stance !== "neutral");
    if (!this.#baseKey && !picked.length) return `<div class="empty">${t("ov.sumEmpty")}</div>`;
    const arch = this.#baseKey ? a.archetypes[this.#baseKey] : null;
    const pick = (q4, stance) => NODE_IDS.filter((id) => (quadrantOf(id) === "Q4") === q4 && sol.nodes[id].stance === stance);
    const item = (id, desc) => { const n = a.nodes[id]; return `<div class="item"><span class="nid">${id}</span><b>${esc(n.label)}</b>${sol.nodes[id].src === "derived" ? `<span class="tag">${t("ov.tagDerived")}</span>` : sol.nodes[id].src === "user" ? `<span class="tag">${t("ov.tagUser")}</span>` : ""}<p>${esc(desc(n))}</p></div>`; };
    const group = (icon, name, hint, color, ids, desc) => ids.length ? `<section style="--c:${color}"><h3>${icon} ${name}<small>${hint}</small></h3>${ids.map((id) => item(id, desc)).join("")}</section>` : "";
    const sacrifice = arch ? ["p", "v", "t", "l", "x"].map((k) => arch.sacrifice?.[k]).filter(Boolean) : [];
    return `<div class="plan"><b>${esc(arch?.title ?? t("ov.customPlan"))}</b>${arch?.thesis ? `<span>${esc(arch.thesis)}</span>` : ""}</div>`
      + group("✅", t("ov.gDo"), t("ov.gDoCount", { n: pick(false, "include").length }), "#10b981", pick(false, "include"), (n) => n.claim)
      + group("🛡", t("ov.gGuard"), t("ov.gGuardSub"), "#f59e0b", pick(true, "include"), (n) => n.kill || n.claim)
      + group("⛔", t("ov.gDont"), t("ov.gDontSub"), "#f43f5e", pick(false, "exclude"), (n) => n.claim)
      + group("⚠", t("ov.gRisk"), t("ov.gRiskSub"), "#fb923c", pick(true, "exclude"), (n) => n.claim)
      + (sacrifice.length ? `<section style="--c:#a855f7"><h3>${t("ov.gCost")}<small>${t("ov.gCostSub")}</small></h3><div class="chips">${sacrifice.map((x) => `<span>${esc(x)}</span>`).join("")}</div></section>` : "");
  }
}

if (!customElements.get("intent-galaxy-overlay")) customElements.define("intent-galaxy-overlay", IntentGalaxyOverlay);
