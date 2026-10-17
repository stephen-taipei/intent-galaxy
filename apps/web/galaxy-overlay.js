// <intent-galaxy-overlay>：純正星系版 UI 的 Shadow DOM Web Component。
// 同一份元件用於 CLI 網頁（apps/web/index.html）與瀏覽器擴充功能（內嵌於 AI 網頁輸入框上方）。
// 事件：intent-lock {ast, baseKey, overrides, galaxyId}、intent-close、intent-synth-request {conflicts}。
import { renderLockedAst, renderSacrifice, repairAnalysis, solveGalaxy } from "../../libs/core/src/index.ts";
import { NODE_IDS, quadrantOf } from "../../libs/protocol/src/index.ts";

const COORDS = [
  { x: 35, y: 17 }, { x: 50, y: 12 }, { x: 65, y: 17 },
  { x: 84, y: 32 }, { x: 87, y: 50 }, { x: 84, y: 68 },
  { x: 65, y: 83 }, { x: 50, y: 88 }, { x: 35, y: 83 },
  { x: 16, y: 68 }, { x: 13, y: 50 }, { x: 16, y: 32 },
];
const QUADRANT_TAGS = {
  Q1: "▲ Q1 歸零者（第一性原理）", Q2: "▶ Q2 老兵（實戰槓桿）",
  Q3: "▼ Q3 越界者（跨界同構）", Q4: "◀ Q4 驗屍官（波普爾證偽）",
};
const ARCH = [["alpha", "1"], ["beta", "2"], ["gamma", "3"]];
const HINT_QUADRANT = { f: "Q1", d: "Q2", l: "Q3", p: "Q4" };
const DIST_BADGE = { 1: "· D1", 2: "◈ D2", 3: "⬥ D3", 4: "✦ D4" };
const KEY_HINTS = [
  [["1", "2", "3"], "主幹", "套用第 1／2／3 張策略卡，一次點亮它採納的節點。<br><span class=dim>Shift+數字：先清掉你的手動調整再套用。</span>"],
  [["h", "j", "k", "l"], "導航", "在 12 顆節點間移動焦點：h 左、j 下、k 上、l 右。<br><span class=dim>Tab 依序切換，g＋象限鍵＋數字可直達。</span>"],
  [["Space"], "採納", "把目前焦點的節點加入方案（再按一次取消）。<br><span class=dim>滑鼠：左鍵點節點。</span>"],
  [["x"], "排除", "明確標記「不做」這個節點（再按一次取消）。<br><span class=dim>Q4 驗屍官節點被排除時，代表你知道這個風險並選擇承擔。滑鼠：右鍵點節點。</span>"],
  [["r"], "解除互斥", "有些節點彼此互斥（例如「零算力」與「API 帳單熔斷」不能同時成立）。同時選了互斥節點時，狀態會變紅。<br>按 r 會自動撤銷<b>較早</b>的手動選擇，保留你最新的決定，直到方案沒有矛盾。"],
  [["u"], "復原", "復原上一步操作。<br><span class=dim>Ctrl+R 重做。</span>"],
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
:host([embedded]) aside { display:none; position:absolute; top:0; right:0; bottom:0; width:min(340px,50%); z-index:30; border-left:1px solid #38bdf8; box-shadow:-12px 0 30px rgba(0,0,0,.5); overflow:auto; }
:host([embedded]) .summary-open aside { display:flex; }
#bar button#summary-toggle { display:none; background:transparent; color:var(--text); border:1px solid #475569; font-weight:600; }
:host([embedded]) #bar button#summary-toggle { display:inline-block; }
#bar button#summary-toggle[aria-pressed="true"] { border-color:var(--q1); color:var(--q1); }
#stage { position:relative; min-height:300px; overflow:hidden; background:radial-gradient(circle at 50% 50%, rgba(30,41,59,.45) 0%, rgba(8,11,17,1) 72%); }
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
  #summaryOpen = false; #summaryShown = false; // 嵌入模式（擴充功能）的「已選方案」抽屜：第一次選策略卡時自動打開一次

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>${STYLE}</style><div class="wrap">
      <main id="stage"><svg viewBox="0 0 1000 600" preserveAspectRatio="none"></svg><div id="tags"></div>
        <div id="core"><div class="sub" title="這是 AI 對你問題的解讀，不一定正確">AI 理解你要決定的是</div><div class="goal"></div><div class="metric"></div></div><div id="nodes"></div></main>
      <section id="cards"></section>
      <footer id="bar"><span class="status"></span><span class="msg"></span>
        <span class="keys">${KEY_HINTS.map(([keys, label, tip]) => `<span data-tip="${esc(tip)}">${keys.map((k) => `<kbd>${k}</kbd>`).join("")} ${label}</span>`).join(" · ")}</span>
        <button type="button" id="summary-toggle"></button><button type="button" id="reset"></button><button type="button" id="lock"></button></footer>
      <aside><div class="head"><h2>收斂結果</h2><button type="button" id="raw-toggle" data-tip="切換檢視：摘要 ↔ 實際送給 AI 的原始指令文字（LOCKED INTENT AST）">原始 AST</button></div><div class="findings"></div><div id="summary"></div><pre hidden></pre></aside></div><div id="tip" role="tooltip"></div>`;
    const root = this.shadowRoot;
    // 每次 render 都重建節點按鈕；點擊後把焦點拉回 host，鍵盤流才不會掉到 document.body。
    root.addEventListener("click", () => this.focus({ preventScroll: true }));
    root.getElementById("nodes").addEventListener("click", (e) => this.#onNodeClick(e, "include"));
    root.getElementById("nodes").addEventListener("contextmenu", (e) => { e.preventDefault(); this.#onNodeClick(e, "exclude"); });
    root.getElementById("cards").addEventListener("click", (e) => { const k = e.target.closest("[data-arch]")?.dataset.arch; if (k) this.selectArchetype(k, e.shiftKey); });
    root.getElementById("lock").addEventListener("click", () => this.lock());
    root.getElementById("reset").addEventListener("click", () => this.reset());
    root.getElementById("summary-toggle").addEventListener("click", () => { this.#summaryOpen = !this.#summaryOpen; this.#render(); });
    root.getElementById("raw-toggle").addEventListener("click", () => { this.#showRaw = !this.#showRaw; this.#render(); });
    // 統一 tooltip：任何帶 data-tip 的元素（節點、策略卡、按鍵說明、按鈕）滑過或鍵盤聚焦時顯示。
    const showTip = (e) => { const el = e.target.closest?.("[data-tip]"); if (el) this.#showTip(el); else this.#hideTip(); };
    root.addEventListener("pointerover", showTip);
    root.addEventListener("focusin", showTip);
    root.addEventListener("pointerleave", () => this.#hideTip(), true);
    root.addEventListener("pointerdown", () => this.#hideTip());
    this.addEventListener("keydown", (e) => this.#onKey(e));
  }

  connectedCallback() { if (!this.hasAttribute("tabindex")) this.tabIndex = 0; this.#render(); }

  /** 完整星系（IntentAnalysisResponse）。會先經 V1–V18 修復管線。 */
  get analysis() { return this.#analysis; }
  set analysis(value) { this.setGalaxy(value); }

  setGalaxy(value, { galaxyId = 0, goal = "" } = {}) {
    const repaired = repairAnalysis(value);
    this.#findings = repaired.findings;
    if (!repaired.ok) { this.#message = `星系資料無法編譯：${repaired.findings.at(-1)?.msg ?? ""}`; this.#render(); return false; }
    this.#analysis = repaired.analysis; this.#draft = null; this.#galaxyId = galaxyId; this.goal = goal;
    this.#baseKey = null; this.#overrides.clear(); this.#undo = []; this.#redo = []; this.#message = ""; this.#summaryOpen = false; this.#summaryShown = false;
    this.#render();
    return true;
  }

  /** 進入串流等待狀態：中心顯示命題，四周 12 個 Ghost Slots。 */
  beginStream(goal) {
    this.#analysis = null; this.#findings = []; this.goal = goal;
    this.#draft = { core: { decision: goal, metric: "" }, nodes: {}, archetypes: {} };
    this.#message = "正在展開星系…"; this.#render();
  }

  /** 套用 /api/spawn 的 NDJSON 事件，逐顆點亮節點。 */
  applyStreamEvent(ev) {
    if (ev.t === "repaired") { this.setGalaxy(ev.analysis, { galaxyId: ev.galaxyId ?? 0, goal: this.goal }); return; }
    if (ev.t === "error") { this.#message = `生成失敗（${ev.code}）${ev.detail ? "：" + ev.detail : ""}`; this.#render(); return; }
    if (!this.#draft) this.beginStream(this.goal ?? "");
    if (ev.t === "progress") { this.#message = ev.thinkingTokens != null ? `模型思考中 · 約 ${Number(ev.thinkingTokens).toLocaleString()} tokens` : `${ev.provider ?? "模型"} 生成中 · 已等待 ${ev.elapsedSec ?? 0} 秒`; this.#render(); return; }
    if (ev.t === "skeleton") this.#message = "";
    if (ev.t === "skeleton" && ev.core) this.#draft.core = ev.core;
    else if (ev.t === "node") this.#draft.nodes[ev.id] = ev.node;
    else if (ev.t === "archetype") this.#draft.archetypes[ev.key] = ev.archetype;
    this.#render();
  }

  /** 在狀態列顯示一則訊息（例如鎖檔被伺服器拒絕的原因）。 */
  showMessage(text) { this.#message = text; this.#render(); }

  selectArchetype(key, clearOverrides = false) {
    if (!this.#analysis?.archetypes[key]) return;
    this.#snapshot();
    this.#baseKey = key;
    if (clearOverrides) this.#overrides.clear();
    if (!this.#summaryShown) { this.#summaryShown = true; this.#summaryOpen = true; }
    this.#render();
  }

  /** 重設：清掉策略卡與所有手動調整，回到剛發散的星系（u 可復原）。 */
  reset() {
    if (!this.#analysis || (!this.#baseKey && !this.#overrides.size)) return;
    this.#snapshot();
    this.#baseKey = null; this.#overrides.clear();
    this.#message = "已清空選擇（按 u 可復原）";
    this.#render();
  }

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
    this.#message = "已保留較新決定解除衝突"; this.#render();
  }

  lock() {
    const sol = this.#solution;
    if (!sol || !this.#analysis) return;
    if (sol.status !== "SAT") { this.#message = "請先按 r 解除衝突（或 s 申請 TRIZ 合成）"; this.#render(); return; }
    const ast = renderLockedAst(this.#analysis, sol, this.#baseKey);
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
      this.#message = conflicts.length ? "TRIZ 矛盾合成尚未接上 Stage 3 管線，先按 r 解除" : "目前沒有衝突";
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
    const core = a?.core ?? draft?.core ?? { decision: this.goal || "等待星系資料…", metric: "" };
    const nodes = a?.nodes ?? draft?.nodes ?? {};
    const archetypes = a?.archetypes ?? draft?.archetypes ?? {};
    const quadrants = a?.quadrants ?? {};
    const sol = this.#solution = a ? this.#solve() : null;
    const conflicts = new Set(sol?.conflicts ?? []);

    root.getElementById("tags").innerHTML = Object.entries(QUADRANT_TAGS).map(([q, label]) =>
      `<div class="q-tag ${q}" title="${esc(quadrants[q]?.scar)}">${label}${quadrants[q]?.sacred ? ` <small>· ${esc(quadrants[q].sacred)}</small>` : ""}</div>`).join("");
    root.querySelector("#core .goal").textContent = String(core.decision ?? "").replace(/^你真正在決定的是[:：]\s*/, "");
    const metricEl = root.querySelector("#core .metric");
    metricEl.textContent = core.metric ? `🎯 ${core.metric}` : "";
    if (core.metric) metricEl.dataset.tip = `<b>成功指標</b><br>${esc(core.metric)}`; else delete metricEl.dataset.tip;

    // ✦ 盲區最多標 3 顆，才看得出重點：優先 Q3 越界者（跨界的點子最常是原話沒想到的），再來 Q4、Q1、Q2。
    const blindShown = new Set(["Q3", "Q4", "Q1", "Q2"].flatMap((q) => NODE_IDS.filter((id) => quadrantOf(id) === q && nodes[id]?.blind)).slice(0, 3));
    root.getElementById("nodes").innerHTML = NODE_IDS.map((id, i) => {
      const n = nodes[id], pos = COORDS[i], q = quadrantOf(id);
      const style = `left:${pos.x}%;top:${pos.y}%`;
      if (!n) return `<button type="button" class="node ghost" style="${style}" tabindex="-1"><span class="nid">${id}</span>…</button>`;
      const view = sol?.nodes[id] ?? { stance: "neutral", src: "none" };
      const dimmed = this.#baseKey && view.stance === "neutral";
      const chip = view.src === "derived" ? `<span class="chip">${view.stance === "include" ? "← 依賴推導" : "⊘ 互斥讓位"}</span>`
        : view.src === "user" ? `<span class="chip">📌 手動釘選</span>`
        : q === "Q4" && view.stance === "exclude" ? `<span class="chip">⚠ 明示承擔風險</span>` : "";
      const cls = ["node", dimmed && "dimmed", i === this.#focus && "focused", conflicts.has(id) && "conflict"].filter(Boolean).join(" ");
      const blind = blindShown.has(id) ? `<span class="blind" title="${esc(n.blind)}">✦ 盲區</span>` : "";
      return `<button type="button" class="${cls}" style="${style}" data-node="${id}" data-q="${q}" data-stance="${view.stance}" data-src="${view.src}" data-tip="${esc(this.#nodeTip(id, n, q, view))}"><span class="nid">${id}</span>${blind}<span class="lbl">${esc(clip(n.label, 15))}</span>${chip}</button>`;
    }).join("");

    // Anti-Spaghetti Rule：未選 3 選 1 前不畫任何連線。
    root.querySelector("svg").innerHTML = !sol || !this.#baseKey ? "" : NODE_IDS.map((id, i) => {
      if (sol.nodes[id].stance !== "include") return "";
      const p = COORDS[i], x = p.x * 10, y = p.y * 6;
      return `<path d="M ${x} ${y} Q ${(x + 500) / 2} ${y} 500 300" stroke="#10b981" stroke-width="2.2" fill="none" stroke-dasharray="${sol.nodes[id].src === "derived" ? "5,5" : "none"}" opacity=".78"/>`;
    }).join("");

    const rec = a?.recommend?.key;
    root.getElementById("cards").innerHTML = ARCH.map(([key, num]) => {
      const c = archetypes[key], isRec = rec === key;
      if (!c) return `<div class="card ghost"><div class="title">[${num}] ${draft ? "生成中…" : "—"}</div></div>`;
      const dist = Math.max(0, ...(c.include ?? []).map((id) => nodes[id]?.lateral?.dist ?? 0));
      const fatalKill = nodes[c.fatal]?.kill ?? "";
      const cls = ["card", this.#baseKey === key && "active", isRec && "rec"].filter(Boolean).join(" ");
      const tip = `<b>[${num}] ${esc(c.title)}</b>${c.thesis ? `<br>${esc(c.thesis)}` : ""}`
        + (isRec && a.recommend.why ? `<br><span class=g>★ 依目前條件推薦（AI 的判斷）：${esc(a.recommend.why)}</span>` : "")
        + `<br>採納：${(c.include ?? []).map((id) => esc(nodes[id]?.label ?? id)).join("、")}`
        + (c.exclude?.length ? `<br>排除：${c.exclude.map((id) => esc(nodes[id]?.label ?? id)).join("、")}` : "")
        + `<br>💸 代價：${esc(renderSacrifice(c.sacrifice))}`
        + (fatalKill ? `<br><span class=k>⚡ 致死前提：${esc(fatalKill)}</span>` : "")
        + `<br><span class=dim>點擊或按 ${num} 套用 · Shift+${num} 清掉手動調整後套用</span>`;
      return `<button type="button" class="${cls}" data-arch="${key}" data-tip="${esc(tip)}">
        <div class="head"><span class="title">[${num}] ${esc(clip(c.title, 16))}</span><span class="badges">${isRec ? `<span class="rec-badge" title="依目前條件推薦：AI 的判斷，請自行確認">★ 依目前條件推薦</span>` : ""}${DIST_BADGE[dist] ? `<span class="badge">${DIST_BADGE[dist]}</span>` : ""}</span></div>
        ${isRec && a.recommend.why ? `<div class="why">★ ${esc(clip(a.recommend.why, 30))}</div>` : ""}
        <div class="row">💸 代價：${esc(clip(renderSacrifice(c.sacrifice), 40))}</div>
        <div class="kill">⚡ 致死：${esc(clip(fatalKill, 30))}</div></button>`;
    }).join("");

    const status = root.querySelector("#bar .status");
    if (!sol) { status.className = "status wait"; status.textContent = draft ? `⋯ 串流中 ${Object.keys(nodes).length}/12` : "⋯ 等待星系"; }
    else if (sol.status === "SAT") { status.className = "status sat"; status.textContent = this.#baseKey ? "✓ 已選條件相容" : `✦ 先發散：按 1/2/3 選主幹${rec ? `（★ 推薦 ${ARCH.find(([k]) => k === rec)[1]}）` : ""}`; }
    else { status.className = "status unsat"; status.textContent = `✗ 有互斥${conflicts.size ? "：" + [...conflicts].join(" ⊗ ") : ""}（按 r 解除）`; }
    status.dataset.tip = !sol ? "星系資料還沒到齊。" : sol.status === "SAT"
      ? (this.#baseKey ? "已選的條件彼此沒有互斥、依賴也都補齊。這只檢查條件之間的關係，不保證內容正確或可行。" : "先瀏覽 12 顆節點與 ✦ 盲區，再選一張策略卡收斂。")
      : `選取的節點彼此矛盾（${esc(sol.status)}），方案無法成立。按 r 自動撤銷較早的手動選擇，或自己取消其中一個。`;
    const resetBtn = root.getElementById("reset");
    resetBtn.textContent = "↺ 重設";
    resetBtn.disabled = !a || (!this.#baseKey && !this.#overrides.size);
    resetBtn.dataset.tip = "清掉選好的策略卡與所有手動調整，回到剛展開的星系。<br><span class=dim>按 u 可以復原。</span>";
    const lockBtn = root.getElementById("lock"), embedded = this.hasAttribute("embedded");
    // 嵌入模式沒有右側欄：收斂結果改成蓋在星系右側的抽屜，回填前可以核對「最後選了什麼」。
    const aside = root.querySelector("aside"), stage = root.getElementById("stage");
    if (embedded && aside.parentElement !== stage) stage.append(aside);
    stage.classList.toggle("summary-open", embedded && this.#summaryOpen);
    const toggle = root.getElementById("summary-toggle");
    toggle.textContent = this.#summaryOpen ? "✕ 收起方案" : "📋 已選方案";
    toggle.setAttribute("aria-pressed", String(this.#summaryOpen));
    toggle.dataset.tip = "打開／收起「已選方案」：要做、護欄、不做、承擔風險與代價。填回對話框前先核對。";
    lockBtn.textContent = embedded ? "↵ 把方案填進對話框" : "📋 產生 AI 執行指令";
    lockBtn.dataset.tip = `<b>選好方案後按這裡（或 Enter）</b><br>把右側的方案轉成一段給 AI 的指令，`
      + (embedded ? "直接填進這個 AI 網頁的輸入框，你檢查後按送出即可。" : "複製到剪貼簿，貼給 Claude Code 或 ChatGPT，AI 就會照「要做／不做／護欄」動手。")
      + `<br><span class=dim>${embedded ? "" : "同時寫入 .intent.lock.json，14 天後提醒你驗收護欄。"}</span>`;
    root.querySelector("#bar .msg").textContent = this.#hint ? `g 直達：${this.#hint}` : this.#message;
    const pre = root.querySelector("aside pre"), summary = root.getElementById("summary");
    pre.textContent = sol?.status === "SAT" ? renderLockedAst(a, sol, this.#baseKey) : "";
    pre.hidden = !this.#showRaw; summary.hidden = this.#showRaw;
    root.getElementById("raw-toggle").textContent = this.#showRaw ? "摘要" : "原始 AST";
    summary.innerHTML = this.#summaryHtml(a, sol, conflicts);
    root.querySelector("aside .findings").textContent = this.#findings.filter((f) => f.level !== "fix").map((f) => `${f.code} ${f.msg}`).join("\n");
  }

  #nodeTip(id, n, q, view) {
    const state = view.stance === "include" ? (q === "Q4" ? "🛡 已設為護欄" : "✅ 已採納") : view.stance === "exclude" ? (q === "Q4" ? "⚠ 已承擔此風險" : "⛔ 已排除") : "尚未選擇";
    const why = view.src === "derived" ? (view.stance === "include" ? "（因其他節點依賴它而自動加入）" : "（與已選節點互斥而自動讓位）") : view.src === "user" ? "（你手動設定）" : view.src === "default" ? "（來自策略卡）" : "";
    return `<b>${esc(id)} ${esc(n.label)}</b><br>${esc(n.claim)}`
      + (n.kill ? `<br><span class=k>⚡ 失效條件：${esc(n.kill)}</span>` : "")
      + (n.blind ? `<br><span class=g>✦ 盲區：${esc(n.blind)}</span>` : "")
      + `<br><span class=dim>狀態：${state}${why}<br>左鍵（Space）採納 · 右鍵（x）排除 · 再按一次取消</span>`;
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
    if (!sol) return `<div class="empty">等待星系資料…</div>`;
    if (sol.status !== "SAT") return `<div class="empty unsat">有互斥衝突${conflicts.size ? `：${[...conflicts].join(" ⊗ ")}` : ""}<br>按 <kbd>r</kbd> 保留較新決定，或改選其他節點。</div>`;
    const picked = NODE_IDS.filter((id) => sol.nodes[id].stance !== "neutral");
    if (!this.#baseKey && !picked.length) return `<div class="empty">先看完 12 顆節點，再按 <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> 選一條主幹（或用 <kbd>Space</kbd> / <kbd>x</kbd> 自己挑）。<br><br>這裡會整理成：<br>✅ 要做　🛡 護欄　⛔ 不做　⚠ 承擔風險　💸 代價</div>`;
    const arch = this.#baseKey ? a.archetypes[this.#baseKey] : null;
    const pick = (q4, stance) => NODE_IDS.filter((id) => (quadrantOf(id) === "Q4") === q4 && sol.nodes[id].stance === stance);
    const item = (id, desc) => { const n = a.nodes[id]; return `<div class="item"><span class="nid">${id}</span><b>${esc(n.label)}</b>${sol.nodes[id].src === "derived" ? `<span class="tag">推導</span>` : sol.nodes[id].src === "user" ? `<span class="tag">手動</span>` : ""}<p>${esc(desc(n))}</p></div>`; };
    const group = (icon, name, hint, color, ids, desc) => ids.length ? `<section style="--c:${color}"><h3>${icon} ${name}<small>${hint}</small></h3>${ids.map((id) => item(id, desc)).join("")}</section>` : "";
    const sacrifice = arch ? ["p", "v", "t", "l", "x"].map((k) => arch.sacrifice?.[k]).filter(Boolean) : [];
    return `<div class="plan"><b>${esc(arch?.title ?? "自訂組合")}</b>${arch?.thesis ? `<span>${esc(arch.thesis)}</span>` : ""}</div>`
      + group("✅", "要做", `${pick(false, "include").length} 項`, "#10b981", pick(false, "include"), (n) => n.claim)
      + group("🛡", "護欄", "出現就停", "#f59e0b", pick(true, "include"), (n) => n.kill || n.claim)
      + group("⛔", "不做", "明確排除", "#f43f5e", pick(false, "exclude"), (n) => n.claim)
      + group("⚠", "承擔風險", "已知但接受", "#fb923c", pick(true, "exclude"), (n) => n.claim)
      + (sacrifice.length ? `<section style="--c:#a855f7"><h3>💸 代價<small>選這條必然失去</small></h3><div class="chips">${sacrifice.map((x) => `<span>${esc(x)}</span>`).join("")}</div></section>` : "");
  }
}

if (!customElements.get("intent-galaxy-overlay")) customElements.define("intent-galaxy-overlay", IntentGalaxyOverlay);
