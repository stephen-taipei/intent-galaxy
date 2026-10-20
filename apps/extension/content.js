// Content Script：在 Claude / ChatGPT / Gemini / Grok / DeepSeek / Qwen / Perplexity / Copilot / Mistral / Kimi 輸入框工具列（或 Claude Code Mod 狀態列）掛載 `iG` logo 膠囊，
// 點擊或按 Cmd/Ctrl+Shift+G 於輸入框上方展開星系面板（擴充功能 iframe），Enter 鎖定後把 LOCKED INTENT AST 寫回輸入框。
//
// 每次「用網頁上的 AI 生成」都是一筆 run：提示詞結尾帶唯一識別碼 [ig:<nonce>]，記錄存在 storage（ig:run:<nonce>）。
// 哪個對話有哪些 run，一律由「頁面上看得到哪些識別碼」決定，不靠網址：換對話、專案頁、暫時對話、新對話換網址都不必特別處理。
(() => {
  // 擴充功能更新或重新載入後，舊的 content script 會失效（runtime 斷線）：那時由新的一份接手。
  if (window.__intentGalaxyMounted && window.__intentGalaxyAlive?.()) return;
  try { window.__intentGalaxyTeardown?.(); } catch { /* 舊版沒有提供，或已無法執行 */ }
  // 舊版留下的按鈕與面板（Firefox 會直接銷毀舊的 content script，來不及自己清）
  document.querySelectorAll("#intent-galaxy-mod-pill, intent-galaxy-frame").forEach((el) => el.remove());
  window.__intentGalaxyMounted = true;

  const api = globalThis.browser ?? globalThis.chrome;
  // 介面多語系（galaxy/apps/web/i18n.js）：載入前先回傳 key，載入後重畫膠囊與橫幅。
  let t = (key, vars) => key;
  const i18n = import(api.runtime.getURL("galaxy/apps/web/i18n.js")).then(async (m) => { await m.ready; t = m.t; m.onLocaleChange(() => { if (!dead) mountPill(true); }); }).catch(() => {});
  const escAttr = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const alive = () => { try { return !!api.runtime?.id; } catch { return false; } };
  window.__intentGalaxyAlive = alive;
  const INSTANCE = crypto.randomUUID(); // 這個分頁的 content script；只有送出提示詞的分頁能判定逾時
  const timers = [], unlisten = [];
  let dead = false;
  /** 擴充功能已失效：停掉所有計時器與監聽，移除按鈕與面板，讓重新注入的新版接手。 */
  function teardown() {
    if (dead) return;
    dead = true;
    timers.forEach(clearInterval);
    unlisten.forEach((off) => { try { off(); } catch { /* context 已失效 */ } });
    observer?.disconnect();
    document.getElementById(PILL_ID)?.remove();
    document.querySelector("intent-galaxy-frame")?.remove();
    hideCue();
    if (window.__intentGalaxyToggle === togglePanel) delete window.__intentGalaxyToggle;
    window.__intentGalaxyMounted = false;
  }
  window.__intentGalaxyTeardown = teardown;
  const every = (ms, fn) => timers.push(setInterval(() => { if (!alive()) return teardown(); fn(); }, ms));
  /** 掛在頁面（document、window）上的監聽：teardown 時一併移除，新版才不會被舊的攔截。 */
  const listen = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); unlisten.push(() => target.removeEventListener(type, fn, opts)); };
  const PILL_ID = "intent-galaxy-mod-pill";
  let cue = null; // 等使用者送出時的狀態：{ editor, nonce, send, anim, timer, restore }（見 showCue）

  // 各站輸入框選擇器，依序嘗試；全部失敗時退回頁面上最後一個可見的 contenteditable / textarea。
  const EDITOR_SELECTORS = {
    "claude.ai": ['div.ProseMirror[contenteditable="true"]', 'fieldset [contenteditable="true"]'],
    "chatgpt.com": ["#prompt-textarea", 'form [contenteditable="true"]', "form textarea"],
    "grok.com": ['form [contenteditable="true"]', "form textarea", "textarea"],
    "gemini.google.com": ['rich-textarea [contenteditable="true"]', ".ql-editor[contenteditable]"],
    "chat.deepseek.com": ["textarea#chat-input", "textarea"],
    "chat.qwen.ai": ["textarea#chat-input", "textarea"],
    "perplexity.ai": ['[contenteditable="true"]#ask-input', "textarea"],
    "copilot.microsoft.com": ["textarea#userInput", "textarea"],
    "chat.mistral.ai": ['[contenteditable="true"]', "textarea"],
    "kimi.com": ['.chat-input-editor[contenteditable="true"]', '[contenteditable="true"]'],
  };
  const SEND_BUTTON = 'button[aria-label*="Send" i], button[aria-label*="傳送"], button[aria-label*="送出"], button[data-testid*="send" i], button[type="submit"]';
  const MOD_PILLS = ["Recap", "gF", "Sub5"]; // Claude Code Mod（deckhand）狀態列上的既有膠囊

  const visible = (el) => !!el && el.getClientRects().length > 0;
  function findEditor() {
    if (cue?.editor.isConnected) return cue.editor; // 等送出時暫時唯讀的輸入框
    const site = Object.keys(EDITOR_SELECTORS).find((h) => location.hostname === h || location.hostname.endsWith("." + h));
    for (const sel of EDITOR_SELECTORS[site] ?? []) {
      const el = [...document.querySelectorAll(sel)].find(visible);
      if (el) return el;
    }
    return [...document.querySelectorAll('[contenteditable="true"], textarea')].filter(visible).at(-1) ?? null;
  }

  // 掛載點優先序：Claude Code Mod 狀態列 → 輸入框工具列（送出按鈕旁）→ 浮動按鈕。
  function findMount(editor) {
    for (const label of MOD_PILLS) {
      const pill = [...document.querySelectorAll("button, [role=button]")].find((b) => b.textContent.trim() === label && visible(b));
      if (pill) return { parent: pill.parentElement, before: pill.nextSibling, kind: "mod" };
    }
    const form = editor?.closest("form, fieldset") ?? editor?.parentElement?.parentElement;
    const send = form && [...form.querySelectorAll(SEND_BUTTON)].find(visible);
    if (send) return { parent: send.parentElement, before: send, kind: "toolbar" };
    return { parent: document.body, before: null, kind: "floating" };
  }

  // 品牌 logo（docs/brand/intent-galaxy-mark.svg）：用 createElementNS 建立，Trusted Types 網站（如 Gemini）也不會擋。
  // 按鈕是品牌藍紫實心底（淺色與深色網站上白字都清楚），logo 用白色。
  const MARK_PATHS = [
    "M162 215.6C338.5 215.8 510.9 275.4 660 368.3C739.1 417.6 820.3 464.8 908.3 496.6L892.9 512C812.7 500.5 737.1 481.4 660 453.6C498.5 395.6 334.1 365.9 162 374.4ZM162 885.4C338.5 885.2 510.9 825.5 660 732.7C739.1 683.4 820.3 636.2 908.3 604.4L892.9 589C812.7 600.5 737.1 619.6 660 647.4C498.5 705.4 334.1 735.1 162 726.6Z",
    "M162 476.4L877.4 533.6A48 48 0 0 0 877.4 567.4L162 624.6Z",
    "M995.9 448.7A20 20 0 0 1 1024.1 448.7L1111.8 536.4A20 20 0 0 1 1111.8 564.6L1024.1 652.3A20 20 0 0 1 995.9 652.3L908.2 564.6A20 20 0 0 1 908.2 536.4Z",
  ];
  function logoMark() {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "162 215.6 955.7 669.8");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = `all:unset; display:inline-block; vertical-align:-2px; height:1.05em; width:${(1.05 * 955.7 / 669.8).toFixed(2)}em; margin-right:5px;`;
    for (const d of MARK_PATHS) {
      const path = document.createElementNS(NS, "path");
      path.setAttribute("fill", "#fff");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return svg;
  }

  function makePill(kind) {
    const btn = document.createElement("button");
    btn.id = PILL_ID;
    btn.type = "button";
    // 掛不進輸入框工具列時改成右下角浮動按鈕：寫出全名，避免被當成頁面本身的小圖示。
    const status = current?.status;
    const badge = status === "done" && !frameVisible() ? t("ct.pillDone") : status === "waiting" ? (current.unsent ? t("ct.pillUnsent") : t("ct.pillGenerating")) : status === "failed" ? t("ct.pillFailed") : "";
    btn.append(logoMark(), (kind === "floating" ? "Intent Galaxy" : "iG") + badge);
    btn.title = t("ct.pillTitle");
    btn.dataset.kind = kind;
    btn.dataset.state = pillState();
    btn.dataset.owner = INSTANCE; // 舊版（已失效）留下的按鈕會被換掉
    btn.style.cssText = "all:unset; box-sizing:border-box; cursor:pointer; font:600 11.5px/1 -apple-system,BlinkMacSystemFont,sans-serif; padding:5px 9px; margin:0 4px; border-radius:6px; color:#fff;"
      + " background:linear-gradient(135deg,#0071FE,#7A3BF1); border:1px solid rgba(255,255,255,.18); box-shadow:0 1px 6px rgba(0,113,254,.3); white-space:nowrap;"
      + (kind === "floating" ? " position:fixed; bottom:18px; right:18px; z-index:2147483646; font-size:13px; padding:9px 14px; border-radius:999px;" : "");
    btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); togglePanel(); });
    return btn;
  }

  let lastMountCheck = 0;
  function mountPill(force = false) {
    if (dead) return;
    const current = document.getElementById(PILL_ID);
    // 串流時 DOM 每個畫格都在變：按鈕還在、狀態沒變時，最多每秒重新找一次掛載點。
    if (!force && current?.isConnected && current.dataset.state === pillState() && current.dataset.owner === INSTANCE && Date.now() - lastMountCheck < 1000) return;
    lastMountCheck = Date.now();
    const editor = findEditor();
    const mount = findMount(editor);
    const existing = document.getElementById(PILL_ID);
    if (existing && existing.dataset.owner === INSTANCE && existing.dataset.kind === mount.kind && existing.isConnected && existing.parentElement === mount.parent && existing.dataset.state === pillState()) return;
    existing?.remove();
    mount.parent.insertBefore(makePill(mount.kind), mount.before);
  }

  let scheduled = false, domDirty = true;
  const observer = new MutationObserver(() => {
    domDirty = true;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; if (!alive()) return teardown(); mountPill(); });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  // ── 狀態 ──
  // run 記錄：{ nonce, goal, status: "waiting" | "done" | "failed", startedAt, sentAt, owner, beat, unsent, analysis?, detail?, adopted? }
  let current = null;          // 這個頁面目前的 run（頁面上最新一個識別碼的記錄；剛送出的 run 在識別碼畫出前也算）
  let localRun = null;         // 這個分頁剛送出的 run（識別碼可能還在輸入框或還沒畫出）
  const cache = new Map();     // nonce → 記錄
  let frame = null, panel = null, panelId = "", panelPath = "", panelNonce = "", panelBusy = false, targetEditor = null, openGoal = "";
  const frameVisible = () => !!frame && !frame.hidden;
  const pillState = () => `${current?.status ?? "idle"}${current?.unsent ? "-unsent" : ""}-${frameVisible() ? "open" : "closed"}`;
  const UI_KEY = "ig:ui";
  const RUN_PREFIX = "ig:run:";
  const MAX_RUNS = 100;
  const runKey = (nonce) => `${RUN_PREFIX}${nonce}`;
  // 無痕視窗、ChatGPT 暫時對話：記錄只留在記憶體，不寫進磁碟。
  const ephemeral = () => !!api.extension?.inIncognitoContext || new URLSearchParams(location.search).has("temporary-chat");
  const store = api.storage?.local;
  const RUN_TTL_MS = 30 * 24 * 3600_000; // run 記錄保存 30 天
  let anyRuns = false;                    // storage 裡有沒有任何 run（沒有就不必掃描頁面）
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const selfWrites = new Map(); // 這個分頁自己剛寫的 key → 內容；storage.onChanged 看到時略過
  async function save(key, value) {
    selfWrites.set(key, JSON.stringify(value ?? null));
    try { await (value == null ? store.remove(key) : store.set({ [key]: value })); } catch { /* 無 storage 權限或配額已滿時只保留在記憶體 */ }
  }
  async function loadMany(keys) { try { return await store.get(keys); } catch { return {}; } }
  const saveRun = (run) => { cache.set(run.nonce, run); anyRuns = true; return run.ephemeral ? Promise.resolve() : save(runKey(run.nonce), run); };

  const PROBE = "INTENT-SPAWNER";     // 提示詞開頭的固定字串
  const AST_HEAD = "# LOCKED INTENT AST";
  const TAG_RE = /\[ig:([0-9a-f]{8})\]/g;
  const tagOf = (nonce) => `[ig:${nonce}]`;

  function editorText(el) { return el ? ("value" in el && el.tagName !== "DIV" ? el.value : el.innerText).trim() : ""; }
  let lastAst = ""; // 這個分頁上次填回的 AST 原文：再次鎖定時精確移除它，其餘都是使用者自己打的字
  // 填回的 AST 每一行的樣子（找不到上次原文時的備援判斷）
  // 填回時「補充：」這個前綴（依語系），再次鎖定時要去掉；繁中原文一併認得。
  const extraPrefix = () => new RegExp(`^(?:補充：|${t("ct.extraNote", { text: "" }).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s*`);
  const AST_LINE = /^(# LOCKED INTENT AST|> |## \d+\. |- \[N\d{1,2}\] |- 放棄|- .+·.+)/;
  // 白話版的開頭（「我的決定」那一行）與結尾（給 AI 的那一句）：找不到上次原文時用它們圈出填回的那一段。
  const plainHead = () => `${t("ast.title")}`;
  const plainTail = () => t("ast.closing", { must: t("ast.must"), mustNot: t("ast.mustNot"), guard: t("ast.guard") });
  /** 輸入框內容拆成：使用者的問題（AST 之前）、AST 之後另外打的字。擴充功能放進去的提示詞不算使用者的字。 */
  function userParts(el) {
    const t = editorText(el).replace(/\r/g, "");
    if (t.includes(PROBE)) return { before: "", after: "" };
    const exact = lastAst && t.indexOf(lastAst.trim());
    if (lastAst && exact >= 0) {
      return { before: t.slice(0, exact).trim(), after: t.slice(exact + lastAst.trim().length).trim().replace(extraPrefix(), "").trim() };
    }
    // 白話版：從標題行到結尾句之間都是填回的內容。
    const headAt = t.search(new RegExp(`^${plainHead().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"));
    const tailStr = plainTail(), tailAt = headAt >= 0 ? t.indexOf(tailStr, headAt) : -1;
    if (headAt >= 0 && tailAt >= 0) {
      return { before: t.slice(0, headAt).trim(), after: t.slice(tailAt + tailStr.length).trim().replace(extraPrefix(), "").trim() };
    }
    const at = t.indexOf(AST_HEAD);
    if (at < 0) return { before: t, after: "" };
    // 逐行判斷：AST 的行一直吃到第一個「不像 AST」的非空行為止，之後全部算使用者補打的。
    const lines = t.slice(at).split("\n");
    let i = 0;
    while (i < lines.length && (lines[i].trim() === "" || AST_LINE.test(lines[i].trim()))) i++;
    return { before: t.slice(0, at).trim(), after: lines.slice(i).join("\n").trim().replace(extraPrefix(), "").trim() };
  }
  const userText = (el) => userParts(el).before;

  // ── 星系面板：可拖曳、縮放、調透明度的浮動視窗；內容是擴充功能來源的 iframe（與頁面 CSS / CSP 隔離）──
  const FRAME_CSS = `
    :host { all: initial; box-sizing: border-box; position: fixed; z-index: 2147483647; display: flex; flex-direction: column; min-width: 420px; min-height: 300px;
      border: 1px solid #0071FE; border-radius: 14px; background: #080b11; box-shadow: 0 18px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(122,59,241,.25); overflow: hidden; resize: both; color-scheme: dark; }
    :host([hidden]) { display: none; }
    header { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 12px; background: #111723; border-bottom: 1px solid #1e293b; cursor: move; user-select: none;
      font: 600 12px/1 -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif; color: #e2e8f0; }
    header .title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; }
    header .title svg { height: 14px; width: auto; flex: none; }
    header label { display: flex; align-items: center; gap: 4px; color: #94a3b8; font-weight: 400; font-size: 11px; cursor: default; }
    header input { width: 70px; accent-color: #0071FE; cursor: pointer; }
    header button { all: unset; cursor: pointer; width: 24px; height: 24px; border-radius: 6px; display: grid; place-items: center; color: #cbd5e1; font-size: 14px; }
    header button:hover { background: #1e293b; color: #fff; }
    header button.close:hover { background: #be123c; }
    header button[aria-pressed="true"] { color: #60a5fa; background: rgba(0,113,254,.18); }
    iframe { flex: 1; width: 100%; border: 0; background: #080b11; }
    :host(.dragging) iframe { pointer-events: none; }`;

  const runInfo = (r) => r && { goal: r.goal, nonce: r.nonce, status: r.status, elapsedSec: Math.round((Date.now() - (r.sentAt ?? r.startedAt)) / 1000), analysis: r.analysis ?? null, detail: r.detail ?? "", unsent: !!r.unsent, picks: r.picks ?? null };
  const sendPanel = (msg) => { if (panel) api.runtime.sendMessage({ ...msg, id: panelId }).catch?.(() => {}); };
  /** 關於某個 run 的通知：只送給正在顯示這個 run（或還沒綁定 run）的面板。 */
  const toPanel = (nonce, msg) => { if (panel && (!panelNonce || panelNonce === nonce)) sendPanel({ ...msg, nonce }); };
  function panelState(reopen) {
    // 面板正綁著這個分頁剛放進輸入框、還在等的 run：繼續綁著它（即使提示詞被清掉、頁面上最後一個 run 是別的）。
    const run = localRun && localRun.nonce === panelNonce && localRun.status === "waiting" ? localRun : current;
    if (run) panelNonce = run.nonce;
    return { type: "ig-open", goal: openGoal, site: location.hostname.replace(/^www\./, ""), reopen,
      job: runInfo(run), pageGalaxy: run ? null : latestGalaxy() };
  }

  /** 面板屬於這個頁面嗎：同一個網址，或它顯示的 run 的識別碼在這個頁面上。 */
  /** 面板屬於這個頁面嗎：綁定 run 時以識別碼為準（頁面上、輸入框裡，或剛送出還沒畫出）；沒綁定時看網址。 */
  function panelBelongsHere() {
    if (!panelNonce) return panelPath === location.pathname;
    const t = tags();
    return t.page.some((x) => x.nonce === panelNonce) || t.editor.has(panelNonce)
      || (localRun?.nonce === panelNonce && localRun.unsent && localRun.pathFrom === location.pathname);
  }

  async function openPanel() {
    await i18n;
    if (frame && !panelBelongsHere() && !panelBusy) closePanel();
    await refresh(true); // 打開前先讀一次頁面：AI 可能在面板關著時已經回完
    // 縮小中的面板叫回來：iframe 一直活著（本機 CLI 生成、勾選中的方案都保留），把輸入框目前的問題交給面板決定要不要換題。
    if (frame) {
      frame.hidden = false;
      clampFrame();
      mountPill();
      panel?.focus();
      const text = userText(findEditor());
      if (text) openGoal = text;
      if (panelBelongsHere()) sendPanel(panelState(true));
      return;
    }
    targetEditor = findEditor();
    openGoal = userText(targetEditor);
    // 輸入框有新問題、這個對話也沒有在等的 run：面板會直接把提示詞放進輸入框（見 panel.js generate），
    // 所以先不顯示，等使用者按下送出才打開；面板若改顯示別的（例如本機 CLI 在線時的確認卡片）就稍後再顯示。
    const job = panelState(false).job;
    const quiet = !!openGoal && job?.status !== "waiting" && job?.goal !== openGoal;
    const spawnsBefore = spawns;
    panelId = crypto.randomUUID();
    panelPath = location.pathname;
    panelNonce = "";
    panelBusy = false;
    frame = document.createElement("intent-galaxy-frame");
    const root = frame.attachShadow({ mode: "closed" });
    root.innerHTML = `<style>${FRAME_CSS}</style><header><span class="title">Intent Galaxy</span>
      <label title="${escAttr(t("ct.opacityTitle"))}">${escAttr(t("ct.opacity"))} <input type="range" min="30" max="100" step="5"></label>
      <button type="button" class="lay-summary" aria-pressed="false" title="${escAttr(t("ct.toggleSummaryTitle"))}"><svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1" width="14" height="12" rx="2.5"/><rect x="9.5" y="3" width="3.5" height="8" rx="1" fill="currentColor" stroke="none"/></svg></button>
      <button type="button" class="lay-cards" aria-pressed="true" title="${escAttr(t("ct.toggleCardsTitle"))}"><svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1" width="14" height="12" rx="2.5"/><rect x="3" y="8" width="10" height="3" rx="1" fill="currentColor" stroke="none"/></svg></button>
      <button type="button" class="max" title="${escAttr(t("ct.maximizeTitle"))}">⤢</button>
      <button type="button" class="min" title="${escAttr(t("ct.minimizeTitle"))}">—</button>
      <button type="button" class="close" title="${escAttr(t("ct.closeTitle"))}">✕</button></header>`;
    const titleEl = root.querySelector(".title"), mark = logoMark();
    mark.style.cssText = "all:unset; display:inline-block; height:14px; width:20px;";
    mark.querySelectorAll("path").forEach((pth, i) => pth.setAttribute("fill", i === 0 ? "#0071FE" : "#7A3BF1"));
    titleEl.prepend(mark);
    panel = document.createElement("iframe");
    panel.src = api.runtime.getURL(`panel.html?id=${panelId}`);
    panel.allow = "clipboard-write";
    // 先掛上 load 監聽，等狀態算好再送 ig-open：長頁面掃描可能比 iframe 載入慢。
    let markLoaded;
    const loaded = new Promise((r) => { markLoaded = r; });
    panel.addEventListener("load", markLoaded, { once: true });
    root.appendChild(panel);
    const myPanel = panel, myFrame = frame;

    const ui = (await loadMany(UI_KEY))[UI_KEY] ?? {};
    const opacity = root.querySelector("input");
    opacity.value = String(ui.opacity ?? 100);
    frame.style.opacity = String(opacity.value / 100);
    opacity.addEventListener("input", () => { frame.style.opacity = String(opacity.value / 100); persistUi({ opacity: Number(opacity.value) }); });
    frame.hidden = quiet;
    document.documentElement.appendChild(frame);
    placeFrame(ui.rect);
    wireDrag(root.querySelector("header"));
    root.querySelector(".max").addEventListener("click", toggleMaximize);
    root.querySelector(".min").addEventListener("click", minimizePanel);
    // 版面切換（方案側欄、方案卡列）交給面板裡的星系元件；按下狀態由面板回報（intent-layout）。
    root.querySelector(".lay-summary").addEventListener("click", () => sendPanel({ type: "ig-layout", toggle: "summary" }));
    root.querySelector(".lay-cards").addEventListener("click", () => sendPanel({ type: "ig-layout", toggle: "cards" }));
    frameLayoutButtons = { summary: root.querySelector(".lay-summary"), cards: root.querySelector(".lay-cards") };
    root.querySelector(".close").addEventListener("click", closePanel);
    // 只記錄使用者拖右下角造成的大小變化：與程式最後設定的實際尺寸相同（初次、還原、自動夾回）就不算。
    new ResizeObserver((entries) => {
      if (myFrame !== frame || frame.hidden || frame.dataset.max) return;
      const box = entries[0]?.target.getBoundingClientRect();
      if (!box?.width || !box.height) return;
      if (Math.abs(box.width - lastSet.width) < 2 && Math.abs(box.height - lastSet.height) < 2) return;
      lastSet = { width: box.width, height: box.height };
      persistUi({ rect: true });
    }).observe(frame);
    mountPill();

    await loaded;
    if (panel !== myPanel) return; // 期間被關掉或重建
    sendPanel(panelState(false));
    if (quiet) setTimeout(() => { if (frame === myFrame && frame.hidden && spawns === spawnsBefore) showFrame(); }, 2000);
    else myPanel.focus();
  }
  function showFrame() {
    if (!frame) return;
    frame.hidden = false;
    clampFrame();
    mountPill();
    panel?.focus();
  }

  // 位置與大小：有記錄就沿用（夾在視窗內），否則貼在輸入框上方。lastSet 記錄實際尺寸（含 min-width/min-height 撐大後的）。
  let lastSet = { width: 0, height: 0 };
  function setRect(rect) {
    Object.assign(frame.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    const box = frame.isConnected && !frame.hidden ? frame.getBoundingClientRect() : rect;
    lastSet = { width: box.width, height: box.height };
  }
  function placeFrame(saved) {
    const vw = window.innerWidth, vh = window.innerHeight;
    let { left, top, width, height } = saved ?? {};
    if (!width || !height) {
      // 預設盡量大：星系要一眼看得全（12 個觀點＋3 張方案卡＋中心問題）。寬至少 1000（或視窗的 85%），高到輸入框上緣。
      const rect = (targetEditor?.isConnected ? targetEditor : findEditor())?.getBoundingClientRect();
      width = Math.min(Math.max(rect?.width ?? 0, 1000, vw * 0.85), vw - 24);
      const bottom = rect ? Math.max(12, vh - rect.top + 10) : 80;
      height = Math.max(420, vh - bottom - 12);
      left = (rect ? rect.left + rect.width / 2 : vw / 2) - width / 2;
      top = vh - bottom - height;
    }
    width = Math.min(width, vw - 16); height = Math.min(height, vh - 16);
    left = Math.min(Math.max(8, left), vw - width - 8); top = Math.min(Math.max(8, top), vh - height - 8);
    setRect({ left, top, width, height });
  }
  const fillViewport = () => setRect({ left: 16, top: 16, width: window.innerWidth - 32, height: window.innerHeight - 32 });
  const clampFrame = () => { if (frame && !frame.hidden) frame.dataset.max ? fillViewport() : placeFrame(frame.getBoundingClientRect()); };

  let persistTimer = 0, pendingUi = {};
  function persistUi(change) {
    Object.assign(pendingUi, change);
    clearTimeout(persistTimer);
    persistTimer = setTimeout(async () => {
      if (!frame) return;
      const ui = (await loadMany(UI_KEY))[UI_KEY] ?? {};
      if (pendingUi.opacity != null) ui.opacity = pendingUi.opacity;
      if (pendingUi.rect) {
        const r = frame.getBoundingClientRect();
        const rect = frame.dataset.max ? JSON.parse(frame.dataset.max) : { left: r.left, top: r.top, width: r.width, height: r.height };
        if (rect.width && rect.height) ui.rect = rect;
      }
      pendingUi = {};
      save(UI_KEY, ui);
    }, 300);
  }

  function wireDrag(handle) {
    let start = null;
    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, input, label")) return;
      const r = frame.getBoundingClientRect();
      start = { x: e.clientX, y: e.clientY, left: r.left, top: r.top };
      handle.setPointerCapture(e.pointerId);
      frame.classList.add("dragging");
    });
    handle.addEventListener("pointermove", (e) => {
      if (!start) return;
      const r = frame.getBoundingClientRect();
      const left = Math.min(Math.max(8 - r.width + 120, start.left + e.clientX - start.x), window.innerWidth - 120);
      const top = Math.min(Math.max(8, start.top + e.clientY - start.y), window.innerHeight - 40);
      Object.assign(frame.style, { left: `${left}px`, top: `${top}px` });
    });
    const end = () => { if (!start) return; start = null; frame.classList.remove("dragging"); persistUi({ rect: true }); };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
    handle.addEventListener("dblclick", (e) => { if (!e.target.closest("button, input, label")) toggleMaximize(); });
  }

  function toggleMaximize() {
    if (frame.dataset.max) {
      const prev = JSON.parse(frame.dataset.max);
      delete frame.dataset.max;
      placeFrame(prev);
    } else {
      const r = frame.getBoundingClientRect();
      frame.dataset.max = JSON.stringify({ left: r.left, top: r.top, width: r.width, height: r.height });
      fillViewport();
    }
    persistUi({ rect: true });
  }

  function minimizePanel() {
    if (!frame) return;
    frame.hidden = true;
    mountPill();
    targetEditor?.isConnected && targetEditor.focus();
  }

  function closePanel() {
    frame?.remove();
    frame = null; panel = null; panelPath = ""; panelNonce = ""; panelBusy = false; panelMissingSince = 0;
    mountPill();
    targetEditor?.isConnected && targetEditor.focus();
  }

  // 按鈕／快捷鍵：面板開著時縮小；但輸入框換了新問題，就把新問題交給面板（面板會問要不要換題）。
  function togglePanel() {
    if (frameVisible()) {
      const text = userText(findEditor());
      if (!panelBelongsHere() || !text || text === openGoal) return minimizePanel();
    }
    openPanel();
  }
  listen(window, "resize", clampFrame);

  // 寫入原生輸入框：<textarea> 用原生 setter + input 事件；ProseMirror / Quill / contenteditable 先模擬貼上，失敗再用 insertText。
  function writeToEditor(el, text, probe) {
    if (!el) return false;
    el.focus();
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const landed = () => el.innerText.includes(probe);
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    if (landed()) return true;
    el.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: text, bubbles: true, cancelable: true }));
    if (landed()) return true;
    document.execCommand("insertText", false, text);
    return landed();
  }

  // ── 從頁面讀星系 JSON ──

  /** 從 start 位置取出一個完整的 JSON 物件：略過字串內的括號（與 apps/cli/src/spawn.mjs 相同演算法）。 */
  function parseObjectAt(text, start) {
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === "\"") inStr = false; continue; }
      if (c === "\"") inStr = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) { try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; } }
    }
    return null;
  }

  /** 從 k 往前找包住它的那個 {：反向掃描時跳過字串內容（未跳脫的引號切換字串狀態），遇到同層的 { 就是外層物件的開頭。 */
  function enclosingStart(text, k) {
    let depth = 0, inStr = false;
    for (let i = k - 1; i >= 0; i--) {
      const c = text[i];
      if (c === "\"") {
        let j = i - 1;
        while (j >= 0 && text[j] === "\\") j--;
        if ((i - 1 - j) % 2 === 0) inStr = !inStr;
        continue;
      }
      if (inStr) continue;
      if (c === "}") depth++;
      else if (c === "{") { if (depth === 0) return i; depth--; }
    }
    return -1;
  }

  // 回覆裡的 JSON 會出現 "schema_version"（帶引號）；提示詞裡的 TypeScript schema 沒有引號，不會誤判。
  const KEY = '"schema_version"';
  const isGalaxy = (o) => o?.schema_version === "1.0" && o.nodes && typeof o.nodes === "object" && o.archetypes && typeof o.archetypes === "object";

  /** text 裡所有完整的星系 JSON（schema_version 不一定是第一個鍵）。 */
  function galaxiesIn(text) {
    const out = [];
    for (let k = text.indexOf(KEY); k >= 0; k = text.indexOf(KEY, k + KEY.length)) {
      const start = enclosingStart(text, k);
      const obj = start >= 0 ? parseObjectAt(text, start) : null;
      if (isGalaxy(obj)) out.push(obj);
    }
    return out;
  }

  // 不是對話內容的文字：網站的 script（常含 hydration 資料）、style 等，讀頁面時一律略過。
  const NON_CONTENT = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
  const contentText = { acceptNode: (t) => (NON_CONTENT.has(t.parentElement?.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) };
  const isEditorNode = (n) => !!n.parentElement?.closest('[contenteditable="true"], [data-ig-locked], textarea, intent-galaxy-frame');
  /** 頁面上的識別碼（依文件順序，每個只取第一次出現的文字節點）與輸入框裡的識別碼。 */
  function scanTags() {
    const page = [], seen = new Set(), editor = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, contentText);
    let n;
    while ((n = walker.nextNode())) {
      if (!n.data.includes("[ig:")) continue;
      for (const m of n.data.matchAll(TAG_RE)) {
        if (isEditorNode(n)) editor.add(m[1]);
        else if (!seen.has(m[1])) { seen.add(m[1]); page.push({ nonce: m[1], node: n }); }
      }
    }
    for (const el of document.querySelectorAll("textarea")) for (const m of el.value.matchAll(TAG_RE)) editor.add(m[1]);
    return { page, editor };
  }
  let tagCache = { page: [], editor: new Set() };
  /** 頁面沒有變動就沿用上次的掃描結果（輸入框 textarea 的值不會觸發 DOM 變動，所以另外比對）。 */
  let lastTextareas = "";
  function tags() {
    const ta = [...document.querySelectorAll("textarea")].map((el) => el.value.length).join(",");
    if (domDirty || ta !== lastTextareas) { domDirty = false; lastTextareas = ta; tagCache = scanTags(); }
    return tagCache;
  }
  const pageNonces = () => new Set(tags().page.map((t) => t.nonce));

  /** from 節點之後（到下一個 run 的識別碼之前）的星系。只讀這一段的文字節點（含收合的程式碼、不含 script），不讀整頁。 */
  function galaxiesBetween(from, to) {
    if (!from.isConnected) return [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, contentText);
    walker.currentNode = from;
    let text = "", n;
    while ((n = walker.nextNode()) && n !== to) text += isEditorNode(n) ? "" : n.data;
    return galaxiesIn(text);
  }
  function latestGalaxy() {
    const found = [];
    for (const el of document.querySelectorAll("pre, code:not(pre code)")) found.push(...galaxiesIn(el.textContent));
    found.push(...galaxiesIn(document.body.innerText));
    return found.at(-1) ?? null;
  }

  // ── 折疊對話裡的提示詞與 JSON 回覆 ──
  // 只折疊「這個擴充功能送出、storage 有記錄」的 run：它的提示詞那一則，以及緊接著的 AI 回覆。
  // 只加 data 屬性與 CSS，不改網站的 DOM 內容（React 管理的節點不能動）；認不出網站的訊息結構時一律不折疊（fail-open）。
  const ADAPTERS = [
    // ChatGPT（以及其他用同樣標記的網站）
    { match: () => !!document.querySelector("[data-message-author-role]"), turn: "[data-message-author-role]", role: (el) => el.getAttribute("data-message-author-role") },
    // Gemini
    { match: () => location.hostname === "gemini.google.com", turn: "user-query, model-response", role: (el) => (el.tagName === "USER-QUERY" ? "user" : "assistant") },
    // Claude
    { match: () => location.hostname === "claude.ai", turn: '[data-testid="user-message"], .font-claude-response, .font-claude-message', role: (el) => (el.matches('[data-testid="user-message"]') ? "user" : "assistant") },
  ];
  const CLOAK_CSS = `
    [data-ig-cloak] { position: relative !important; }
    [data-ig-cloak]:not([data-ig-expanded="true"]) { max-height: 46px !important; overflow: hidden !important; cursor: pointer !important; }
    [data-ig-cloak]:not([data-ig-expanded="true"]) { color: transparent !important; }
    [data-ig-cloak]:not([data-ig-expanded="true"]) > * { opacity: .03 !important; pointer-events: none !important; }
    [data-ig-cloak]::before { content: attr(data-ig-banner); position: absolute; left: 0; right: 0; top: 0; z-index: 3; box-sizing: border-box; height: 40px; display: flex; align-items: center;
      padding: 0 14px; border: 1px solid rgba(56,189,248,.55); border-radius: 12px; background: linear-gradient(135deg, rgba(14,165,233,.16), rgba(139,92,246,.16)), #0b1220;
      color: #e2e8f0; font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    [data-ig-cloak][data-ig-expanded="true"] { padding-top: 46px !important; }
    [data-ig-cloak="more"]:not([data-ig-expanded="true"]) { display: none !important; }
    [data-ig-cloak="more"]::before { content: none; }
    [data-ig-cloak="more"][data-ig-expanded="true"] { padding-top: 0 !important; }`;
  let cloakStyled = false;
  const shortGoal = (g) => (g.length > 30 ? `${g.slice(0, 30)}…` : g);
  function bannerFor(kind, run) {
    if (kind === "prompt") return t("ct.bannerPrompt", { goal: shortGoal(run.goal) });
    if (run.status === "done") return t("ct.bannerDone");
    if (run.status === "failed") return t("ct.bannerFailed");
    return t("ct.bannerWaiting");
  }
  function cloakRuns(onPage) {
    const adapter = ADAPTERS.find((a) => a.match());
    if (!adapter || !onPage.length) return;
    const turns = [...document.querySelectorAll(adapter.turn)].filter((el) => !el.parentElement?.closest(adapter.turn)); // 只取最外層的訊息節點
    if (!turns.length) return;
    for (const t of onPage) {
      const run = cache.get(t.nonce);
      if (!run) continue;
      const inner = t.node.parentElement?.closest(adapter.turn);
      const promptTurn = inner && turns.find((x) => x === inner || x.contains(inner));
      if (!promptTurn || adapter.role(promptTurn) !== "user") continue; // 認不出：不折疊
      setCloak(promptTurn, "prompt", run);
      // AI 的回覆可能分成好幾則（ChatGPT 跑程式、思考、最後的 JSON 各一則）：到下一則使用者訊息前全部收進同一條橫幅。
      for (let i = turns.indexOf(promptTurn) + 1, first = true; i < turns.length && adapter.role(turns[i]) !== "user"; i++, first = false) {
        setCloak(turns[i], first ? "response" : "more", run);
      }
    }
  }
  function setCloak(el, kind, run) {
    if (!cloakStyled) {
      cloakStyled = true;
      const style = document.createElement("style");
      style.textContent = CLOAK_CSS;
      (document.head ?? document.documentElement).appendChild(style);
    }
    const banner = bannerFor(kind, run);
    if (el.getAttribute("data-ig-cloak") !== kind) el.setAttribute("data-ig-cloak", kind);
    if (el.getAttribute("data-ig-run") !== run.nonce) el.setAttribute("data-ig-run", run.nonce);
    if (el.getAttribute("data-ig-banner") !== banner) el.setAttribute("data-ig-banner", banner);
  }
  // 點擊：收合時點一下展開（只在收合時攔截，展開後網站自己的按鈕照常運作）；展開時點最上面那條橫幅收合。
  listen(document, "click", (e) => {
    const el = e.target instanceof Element ? e.target.closest("[data-ig-cloak]") : null;
    if (!el) return;
    if (el.getAttribute("data-ig-cloak") === "more") return; // 跟著回覆的第一則一起展開／收合
    const expanded = el.getAttribute("data-ig-expanded") === "true";
    // 回覆的後續幾則（data-ig-cloak="more"）跟第一則同進退
    const group = el.getAttribute("data-ig-cloak") === "response"
      ? [el, ...document.querySelectorAll(`[data-ig-cloak="more"][data-ig-run="${CSS.escape(el.getAttribute("data-ig-run") ?? "")}"]`)] : [el];
    if (!expanded) { group.forEach((x) => x.setAttribute("data-ig-expanded", "true")); e.preventDefault(); e.stopPropagation(); return; }
    if (e.clientY - el.getBoundingClientRect().top <= 42) { group.forEach((x) => x.removeAttribute("data-ig-expanded")); e.preventDefault(); e.stopPropagation(); }
  }, true);

  // ── run 的生命週期 ──
  const MAX_WAIT_SEC = 30 * 60;   // 推理型模型（Pro / Thinking）常要 5–15 分鐘以上；從提示詞出現在對話裡時起算
  const UNSENT_GRACE_MS = 60_000; // 提示詞既不在輸入框也不在對話裡（被清掉）超過這麼久：判定沒有送出
  const RENDER_GRACE_MS = 10_000; // 剛送出、對話還沒畫出提示詞的寬限
  const STALE_OWNER_MS = 90_000;  // 送出的分頁沒有心跳超過這麼久（例如已關閉），其他分頁可以接手判定逾時
  let corePromise = null;         // 修復管線（擴充功能內的 galaxy/libs/core），用來在標記完成前確認 JSON 可用
  const core = () => (corePromise ??= import(api.runtime.getURL("galaxy/libs/core/src/index.js")));
  const isOwner = (r) => r.owner === INSTANCE || Date.now() - (r.beat ?? 0) > STALE_OWNER_MS;
  const lastSeen = new Map();     // nonce → 上一次讀到的 JSON（連續兩次相同才算完成）

  async function failRun(run, detail, failedKey = "") {
    if (run.status === "failed" && run.detail === detail && run.failedKey === failedKey) return; // 同樣的失敗不重複通知
    const wasUnsent = run.unsent;
    Object.assign(run, { status: "failed", detail, unsent: false, failedKey });
    await saveRun(run);
    // 提示詞沒送出就被清掉：把收起來的面板打開，讓使用者看到原因。
    if (wasUnsent && frame?.hidden && panelNonce === run.nonce) { frame.hidden = false; clampFrame(); mountPill(); }
    toPanel(run.nonce, { type: "ig-chat-error", detail, failed: true });
  }

  async function finishRun(run, analysis) {
    let repaired = null;
    try { repaired = (await core()).repairAnalysis(analysis); } catch { /* 載入失敗時交給面板再驗一次 */ }
    if (repaired && !repaired.ok) return failRun(run, t("ct.errIncompleteJson", { detail: repaired.findings.at(-1)?.msg ?? t("ct.errFormat") }), JSON.stringify(analysis));
    Object.assign(run, { status: "done", analysis, detail: "", unsent: false });
    await saveRun(run);
    toPanel(run.nonce, { type: "ig-galaxy", analysis, goal: run.goal });
  }

  /** 檢查一個 run。anchor：它的識別碼所在節點；next：下一個 run 的識別碼（範圍上限）。 */
  async function checkRun(run, anchor, next, editorHas, immediate) {
    const now = Date.now();
    if (run.unsent) {
      if (anchor) {
        // 已送出：從現在起算等待時間；送出網址只在識別碼畫出前用得到，之後不再保存。
        Object.assign(run, { unsent: false, sentAt: now });
        delete run.pathFrom;
        await saveRun(run);
        if (cue?.nonce === run.nonce) hideCue();
        // 送出前收起來的面板：送出了就自動打開，接著等 AI 回覆。
        if (frame?.hidden && panelNonce === run.nonce) showFrame();
        toPanel(run.nonce, { type: "ig-reopen", job: runInfo(run) });
      }
      else if (editorHas) run.lostSince = 0;
      else if (isOwner(run) && now - (run.lostSince ||= now) > UNSENT_GRACE_MS) return failRun(run, t("ct.errNotSent"));
      if (!anchor) return toPanel(run.nonce, { type: "ig-progress", elapsedSec: 0, unsent: true });
    }
    if (!anchor) return;
    const fresh = galaxiesBetween(anchor.node, next?.node).at(-1);
    if (fresh && run.status !== "done") {
      // 連續兩次讀到相同的 JSON 才視為回覆完成，避免拿到串流中途的片段（面板打開時或已判失敗的不必等）。
      // 已因這份 JSON 判定失敗的 run，只有讀到不同的 JSON（例如請 AI 修正後）才重試。
      const key = JSON.stringify(fresh);
      if (run.status === "failed" && key === run.failedKey) return;
      if (immediate || run.status === "failed" || lastSeen.get(run.nonce) === key) { lastSeen.delete(run.nonce); return finishRun(run, fresh); }
      lastSeen.set(run.nonce, key);
      return;
    }
    if (run.status !== "waiting") return;
    const elapsedSec = Math.round((now - (run.sentAt ?? run.startedAt)) / 1000);
    // 送出的分頁定期寫心跳；只有它（或心跳已過期時接手的分頁）能判定逾時，避免沒看到回覆的舊分頁誤判。
    if (run.owner === INSTANCE && now - (run.beat ?? 0) > 30_000) { run.beat = now; saveRun(run); }
    if (elapsedSec > MAX_WAIT_SEC && isOwner(run)) return failRun(run, t("ct.errTimeout", { minutes: MAX_WAIT_SEC / 60 }));
    toPanel(run.nonce, { type: "ig-progress", elapsedSec, unsent: !!run.unsent });
  }

  /** 讀頁面、更新 current、檢查等待中的 run。immediate：面板打開時，看到完整 JSON 就直接收下。 */
  let refreshing = null;
  const lastChecked = new Map(); // nonce → 上次檢查失敗 run 的時間
  let panelMissingSince = 0, panelSeen = ""; // panelSeen：面板綁定的 run 曾出現在這個頁面上（從沒出現過的不算「消失」）
  async function refresh(immediate = false) {
    if (refreshing) return refreshing;
    if (dead || (!immediate && document.hidden)) return; // 背景分頁不掃描；回到前景時補一次
    if (!anyRuns && !localRun) { if (current) { current = null; mountPill(); } return; } // 從沒用過：不必掃描頁面
    refreshing = (async () => {
      const { page, editor } = tags();
      const missing = page.map((t) => t.nonce).filter((n) => !cache.has(n));
      if (missing.length) {
        const got = await loadMany(missing.map(runKey));
        for (const n of missing) if (got[runKey(n)]) cache.set(n, got[runKey(n)]);
      }
      const onPage = page.filter((t) => cache.has(t.nonce));
      // 這個頁面的 run：頁面上最後一個有記錄的識別碼；這個分頁剛送出的 run 若還在輸入框或剛送出，優先。
      // 剛送出、識別碼還沒畫出的寬限只在送出的那個網址（或送出後新對話換成的網址）有效；使用者換到別的對話就不算。
      const atSendPath = localRun?.unsent && localRun.pathFrom === location.pathname;
      const local = localRun && (editor.has(localRun.nonce) || onPage.some((t) => t.nonce === localRun.nonce)
        || (atSendPath && Date.now() - (localRun.sentAt ?? localRun.startedAt) < RENDER_GRACE_MS)) ? localRun : null;
      current = local ?? (onPage.length ? cache.get(onPage.at(-1).nonce) : null);
      for (let i = 0; i < onPage.length; i++) {
        const run = cache.get(onPage[i].nonce);
        if (run.status === "done") continue;
        // 已失敗的 run 只在打開面板時或每 30 秒重查一次（AI 可能事後補了正確的 JSON）。
        if (run.status === "failed" && !immediate && Date.now() - (lastChecked.get(run.nonce) ?? 0) < 30_000) continue;
        lastChecked.set(run.nonce, Date.now());
        await checkRun(run, onPage[i], page[page.indexOf(onPage[i]) + 1], editor.has(run.nonce), immediate);
      }
      // 還沒送出（或送出後還沒畫出）的 run 不在頁面上：仍要檢查它是否被清掉。
      if (localRun?.unsent && !onPage.some((t) => t.nonce === localRun.nonce)) await checkRun(localRun, null, null, editor.has(localRun.nonce), immediate);
      // 這個分頁送出的 run 完成、失敗，或已送出但不在這個頁面上（使用者換了對話）：記錄留在 storage，回到那個對話時由識別碼帶出。
      if (localRun && (localRun.status !== "waiting" || (!localRun.unsent && !onPage.some((t) => t.nonce === localRun.nonce) && Date.now() - (localRun.sentAt ?? localRun.startedAt) > RENDER_GRACE_MS))) {
        localRun = null;
      }
      cloakRuns(onPage);
      // 網址沒變，面板顯示的 run 卻從頁面消失（例如 ChatGPT 暫時對話開了新對話，網址一直是 /）：
      // 超過寬限就關閉，避免把別的對話的方案填進來。換網址的情況由 onPathChange 處理。
      if (panelNonce && onPage.some((t) => t.nonce === panelNonce)) panelSeen = panelNonce;
      if (frame && panelNonce && panelSeen === panelNonce && !panelBusy && panelPath === location.pathname && !panelBelongsHere()) {
        if (Date.now() - (panelMissingSince ||= Date.now()) > RENDER_GRACE_MS) closePanel();
      } else panelMissingSince = 0;
      mountPill();
    })().finally(() => { refreshing = null; });
    return refreshing;
  }

  // 有等待中的 run 時每 1.5 秒讀一次頁面；沒有時每 5 秒輕量檢查（換對話、別的分頁送出的 run 出現在頁面上）。
  let lastRefresh = 0;
  every(1500, () => {
    const busy = current?.status === "waiting" || localRun;
    if (busy || Date.now() - lastRefresh > 5000) { lastRefresh = Date.now(); refresh(); }
  });
  listen(document, "visibilitychange", () => { if (!document.hidden && alive()) refresh(); });

  // ── 把提示詞放進輸入框（由使用者按送出；面板先隱藏、輸入框唯讀、送出鍵放大）──

  let spawns = 0; // 面板要求放進輸入框的次數（安靜打開的面板用來判斷要不要顯示自己）
  async function startRun(goal, prompt) {
    await refresh(true);
    if (current?.status === "waiting") { showFrame(); sendPanel({ type: "ig-chat-error", detail: t("ct.errBusy"), failed: true, nonce: "" }); return; }
    const editor = targetEditor?.isConnected ? targetEditor : findEditor();
    const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    spawns++;
    if (!writeToEditor(editor, `${prompt}\n${tagOf(nonce)}`, tagOf(nonce))) { showFrame(); sendPanel({ type: "ig-chat-error", detail: t("ct.errNoEditor"), failed: true, nonce: "" }); return; }
    const now = Date.now();
    const run = { nonce, goal, status: "waiting", startedAt: now, owner: INSTANCE, beat: now, unsent: true, pathFrom: location.pathname };
    if (ephemeral()) run.ephemeral = true; // 無痕視窗、暫時對話：不寫進 storage
    localRun = current = run;
    panelNonce = nonce;
    await saveRun(run);
    sendPanel({ type: "ig-started", nonce });
    // 由使用者自己按送出（自動送出可能違反各家網站的使用條款）。面板先隱藏（大小不變），不擋住送出鍵；
    // 輸入框暫時唯讀、送出鍵放大發光。送出後識別碼出現在對話裡，面板自動打開接著等。
    minimizePanel();
    showCue(editor, nonce);
    toPanel(nonce, { type: "ig-progress", elapsedSec: 0, unsent: true });
    refresh();
  }

  // ── 等使用者送出：輸入框暫時唯讀＋停用（避免改到提示詞），送出鍵放大發光；提示詞離開輸入框（送出或被清掉）就復原 ──
  function findSend(editor) {
    const scope = editor.closest("form, fieldset") ?? editor.parentElement?.parentElement?.parentElement ?? document;
    return [...scope.querySelectorAll(SEND_BUTTON)].find((b) => b.id !== PILL_ID && visible(b)) ?? null;
  }
  /** 把輸入框鎖成唯讀，回傳復原函式（只還原我們改過的屬性）。 */
  function lockEditor(el) {
    const attrs = ["contenteditable", "readonly", "aria-disabled", "aria-readonly", "data-ig-locked"].map((a) => [a, el.getAttribute(a)]);
    const style = { opacity: el.style.opacity, cursor: el.style.cursor, transition: el.style.transition };
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) el.readOnly = true;
    else el.setAttribute("contenteditable", "false");
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("aria-readonly", "true");
    el.setAttribute("data-ig-locked", ""); // 掃描識別碼時仍算輸入框，不會被當成已送出
    Object.assign(el.style, { opacity: "0.45", cursor: "not-allowed", transition: "opacity .2s" });
    el.blur();
    return () => {
      for (const [a, v] of attrs) v == null ? el.removeAttribute(a) : el.setAttribute(a, v);
      Object.assign(el.style, style);
    };
  }
  function showCue(editor, nonce) {
    hideCue();
    if (!editor?.isConnected) return;
    cue = { editor, nonce, send: null, anim: null, timer: 0, restore: lockEditor(editor) };
    syncCue();
    cue.timer = setInterval(() => { if (!alive()) return teardown(); syncCue(); }, 150);
  }
  function syncCue() {
    if (!cue) return;
    const { editor } = cue;
    if (!editor.isConnected || !editorText(editor).includes(tagOf(cue.nonce))) return hideCue();
    // 網站（例如 ProseMirror 重畫）把可編輯狀態改回來時再鎖一次。
    if (editor.getAttribute("aria-readonly") !== "true") { cue.restore(); cue.restore = lockEditor(editor); }
    const send = findSend(editor);
    if (send === cue.send) return;
    cue.anim?.cancel();
    cue.send = send;
    // 送出鍵放大發光（網站重畫按鈕時換到新的那顆）。只用動畫，不改網站的樣式。
    cue.anim = send?.animate([
      { transform: "scale(1.2)", boxShadow: "0 0 0 3px rgba(0,113,254,.9), 0 0 10px 2px rgba(122,59,241,.6)" },
      { transform: "scale(1.35)", boxShadow: "0 0 0 6px rgba(0,113,254,.55), 0 0 24px 8px rgba(122,59,241,.75)" },
    ], { duration: 700, direction: "alternate", iterations: Infinity, easing: "ease-in-out" }) ?? null;
  }
  function hideCue() {
    if (!cue) return;
    clearInterval(cue.timer);
    cue.anim?.cancel();
    if (cue.editor.isConnected) cue.restore();
    cue = null;
  }


  // ── 換對話 ──
  let lastPath = location.pathname;
  async function onPathChange() {
    lastPath = location.pathname;
    // 面板若顯示某個 run，就看新頁面上有沒有它的識別碼（剛送出的新對話換網址時會有）；DOM 可能晚一點才換好，多看幾次。
    // 第一次也等 500 毫秒：換頁瞬間舊對話的畫面可能還在，避免把它當成新頁面。
    for (let i = 0; i < 6; i++) {
      await sleep(500);
      if (location.pathname !== lastPath) return; // 又換頁了，交給下一次
      await refresh();
      if (!frame) return;
      if (panelBusy) { if (frameVisible() && panelPath !== location.pathname) minimizePanel(); return; } // 本機 CLI 生成中：縮小保留
      if (panelNonce && pageNonces().has(panelNonce)) { panelPath = location.pathname; return; }
      if (!panelNonce || (localRun?.nonce !== panelNonce)) break; // 面板沒有綁定 run，或不是剛送出的 run：不必等
    }
    if (frame && !panelBusy && panelPath !== location.pathname) closePanel();
  }
  every(1000, () => { if (location.pathname !== lastPath) onPathChange(); });
  // 支援 Navigation API 的瀏覽器：站內換頁一完成就處理，不必等下一次輪詢。
  if (globalThis.navigation?.addEventListener) listen(globalThis.navigation, "navigatesuccess", () => { if (location.pathname !== lastPath) onPathChange(); });

  // 其他分頁更新了 run（例如另一個分頁先讀到回覆）：同步並通知顯示它的面板。
  api.storage?.onChanged?.addListener((changes, area) => {
    if (area !== "local" || dead) return;
    if (!alive()) return teardown();
    let relevant = false;
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (!key.startsWith(RUN_PREFIX)) continue;
      const mine = selfWrites.get(key);
      if (mine !== undefined && mine === JSON.stringify(newValue ?? null)) { selfWrites.delete(key); continue; }
      if (newValue) anyRuns = true;
      relevant = true;
      const nonce = key.slice(RUN_PREFIX.length);
      // 只處理這個頁面相關的 run（頁面上看得到它的識別碼，或是這個分頁剛送出的）。
      if (!(pageNonces().has(nonce) || localRun?.nonce === nonce)) { if (cache.has(nonce)) { if (newValue) cache.set(nonce, newValue); else cache.delete(nonce); } continue; }
      const prev = cache.get(nonce);
      if (!newValue) {
        cache.delete(nonce);
        if (localRun?.nonce === nonce) localRun = null;
        // 只有等待中／失敗、還沒過期的 run 會被使用者取消；已完成或過期的是每日整理刪的，不必通知。
        if (prev && prev.status !== "done" && Date.now() - (prev.startedAt ?? 0) < RUN_TTL_MS) toPanel(nonce, { type: "ig-reset" });
        continue;
      }
      if (prev && prev.status === newValue.status && prev.unsent === newValue.unsent) { Object.assign(prev, { beat: newValue.beat, owner: newValue.owner }); continue; } // 只是心跳
      const run = prev ? Object.assign(prev, newValue) : newValue;
      cache.set(nonce, run);
      if (run.status === "done") toPanel(nonce, { type: "ig-galaxy", analysis: run.analysis, goal: run.goal });
      else if (run.status === "failed") toPanel(nonce, { type: "ig-chat-error", detail: run.detail, failed: true });
      else toPanel(nonce, { type: "ig-reopen", job: runInfo(run) });
    }
    if (relevant) refresh();
  });

  // 記錄整理：每天最多一次，刪掉超過 30 天或超過 MAX_RUNS 筆的 run，以及舊版（以網址為 key）的記錄。
  (async () => {
    try {
      const keys = store.getKeys ? await store.getKeys() : Object.keys(await store.get(null));
      anyRuns = keys.some((k) => k.startsWith(RUN_PREFIX));
      const { "ig:pruneAt": pruneAt = 0 } = await store.get("ig:pruneAt");
      if (Date.now() - pruneAt < 24 * 3600_000) return;
      await store.set({ "ig:pruneAt": Date.now() });
      const all = await store.get(keys.filter((k) => k.startsWith(RUN_PREFIX)));
      const runs = Object.entries(all).sort((a, b) => (b[1]?.startedAt ?? 0) - (a[1]?.startedAt ?? 0));
      const drop = [...keys.filter((k) => k.startsWith("ig:job:")), ...runs.filter(([, r], i) => i >= MAX_RUNS || Date.now() - (r?.startedAt ?? 0) > RUN_TTL_MS).map(([k]) => k)];
      if (drop.length) await store.remove(drop);
    } catch { /* 沒有 storage 權限 */ }
  })().finally(() => refresh());

  // ── 面板傳來的動作 ──
  // 面板經由擴充功能內部訊息（background.js 轉送到這個分頁）傳來；不用 window.postMessage，網頁腳本讀不到問題與星系。
  api.runtime.onMessage.addListener((m) => {
    if (m?.type !== "ig-to-content" || !panel || m.id !== panelId || !m.msg) return;
    if (!alive()) return teardown();
    onPanelMessage(m.msg);
  });
  let frameLayoutButtons = null;
  async function onPanelMessage(msg) {
    if (msg.type === "intent-layout" && frameLayoutButtons) {
      frameLayoutButtons.summary.setAttribute("aria-pressed", String(!!msg.summary));
      frameLayoutButtons.cards.setAttribute("aria-pressed", String(!!msg.cards));
    }
    if (msg.type === "intent-close") minimizePanel();
    if (msg.type === "intent-busy") {
      panelBusy = !!msg.busy;
      // 本機 CLI 跑完了，面板屬於別的對話：縮小中就關掉（結果仍留在本機 CLI，可再開）；
      // 使用者已在這個對話叫回來、正看著它，就留下，視為帶到這個對話。
      if (!panelBusy && frame && !panelBelongsHere()) {
        if (frame.hidden) closePanel();
        else { panelPath = location.pathname; panelNonce = ""; }
      }
    }
    if (msg.type === "intent-chat-spawn" && typeof msg.prompt === "string") {
      if (panelBelongsHere()) startRun(String(msg.goal ?? ""), msg.prompt);
      else sendPanel({ type: "ig-chat-error", detail: t("ct.errOtherChat"), failed: true, nonce: "" });
    }
    // 面板手動貼上：記成那個 run 的結果（頁面上的識別碼會帶出它）。沒有 run 的星系（頁面上找到的、本機 CLI 的）不另外記錄。
    if (msg.type === "intent-adopt" && isGalaxy(msg.analysis) && msg.nonce) {
      const run = cache.get(msg.nonce) ?? ((await loadMany(runKey(msg.nonce)))[runKey(msg.nonce)] ?? null);
      if (run) { Object.assign(run, { status: "done", analysis: msg.analysis, adopted: true, detail: "", unsent: false }); await saveRun(run); if (localRun?.nonce === run.nonce) localRun = null; refresh(); }
    }
    // 放棄：只取消面板看到的那一個等待中／失敗的 run；已完成的星系不會被刪。
    if (msg.type === "intent-reset" && msg.nonce) {
      const run = cache.get(msg.nonce);
      // 還沒送出：把輸入框裡的提示詞換回原本的問題，使用者才能直接打新問題。
      if (localRun?.nonce === msg.nonce && localRun.unsent) restoreEditor(localRun.nonce, localRun.goal);
      if (localRun?.nonce === msg.nonce) localRun = null;
      if (!run || run.status !== "done") {
        cache.delete(msg.nonce);
        if (current?.nonce === msg.nonce) current = null;
        if (panelNonce === msg.nonce) panelNonce = "";
        await save(runKey(msg.nonce), null);
      }
      refresh();
    }
    if (msg.type === "intent-lock") {
      // 星系所屬的問題在前、AST 在後；使用者另外打的補充（問題以外的字、上次 AST 之後補打的）接在最後。
      const editor = targetEditor?.isConnected ? targetEditor : findEditor();
      const goal = String(msg.goal ?? openGoal).trim();
      const { before, after } = userParts(editor);
      const extra = [before !== goal ? before : "", after].filter(Boolean).join("\n");
      // 填回的是白話版（沒有 AST／MUST／[N#] 這類記號）；工程師版 AST 只留在 CLI 與鎖檔。
      const body = String(msg.plain || msg.ast || "");
      const text = [goal, body, extra ? t("ct.extraNote", { text: extra }) : ""].filter(Boolean).join("\n\n");
      closePanel();
      lastAst = body;
      if (!writeToEditor(editor, text, body.split("\n")[0])) navigator.clipboard?.writeText(text).catch(() => {});
      // 記住這次的選擇：下次在同一個對話重開面板，方案卡與手動調整會還原。
      if (msg.nonce) {
        const run = cache.get(msg.nonce) ?? ((await loadMany(runKey(msg.nonce)))[runKey(msg.nonce)] ?? null);
        if (run) { run.picks = { baseKey: msg.baseKey ?? null, overrides: msg.overrides ?? {} }; await saveRun(run); }
      }
    }
  }

  /** 輸入框還有這個 run 的提示詞時，清掉並放回原本的問題。 */
  function restoreEditor(nonce, goal) {
    if (cue?.nonce === nonce) hideCue(); // 唯讀時寫不進去
    const editor = targetEditor?.isConnected ? targetEditor : findEditor();
    if (!editor || !editorText(editor).includes(tagOf(nonce))) return;
    if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) { writeToEditor(editor, goal, goal); return; }
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("delete");
    if (!goal) return;
    // 只插入一次：網站的貼上處理可能改掉空行，不能用原文比對是否成功，改看輸入框是否還是空的。
    const dt = new DataTransfer();
    dt.setData("text/plain", goal);
    editor.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    if (!editorText(editor)) document.execCommand("insertText", false, goal);
  }

  mountPill();
  i18n.then(() => { if (dead) return; mountPill(true); refresh(true).catch(() => {}); });

  // 工具列圖示（background.js）以 scripting.executeScript 在同一個 isolated world 呼叫；頁面腳本看不到這個全域。
  window.__intentGalaxyToggle = togglePanel;

  // Cmd/Ctrl+Shift+G：capture 階段攔截，避免被頁面快捷鍵吃掉；以 e.code 判斷，IME 開啟時同樣可用。
  listen(window, "keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyG") { e.preventDefault(); e.stopPropagation(); togglePanel(); }
  }, true);
})();
