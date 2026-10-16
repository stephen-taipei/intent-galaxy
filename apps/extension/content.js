// Content Script：在 Claude / ChatGPT / Gemini / Grok / DeepSeek / Qwen / Perplexity / Copilot / Mistral / Kimi 輸入框工具列（或 Claude Code Mod 狀態列）掛載 `🌌 iG` 膠囊，
// 點擊或按 Cmd/Ctrl+Shift+G 於輸入框上方展開星系面板（擴充功能 iframe），Enter 鎖定後把 LOCKED INTENT AST 寫回輸入框。
(() => {
  if (window.__intentGalaxyMounted) return;
  window.__intentGalaxyMounted = true;

  const api = globalThis.browser ?? globalThis.chrome;
  const EXT_ORIGIN = new URL(api.runtime.getURL("")).origin;
  const PILL_ID = "intent-galaxy-mod-pill";
  const PANEL_ID = "intent-galaxy-panel";

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

  function makePill(kind) {
    const btn = document.createElement("button");
    btn.id = PILL_ID;
    btn.type = "button";
    // 掛不進輸入框工具列時改成右下角浮動按鈕：寫出全名，避免被當成頁面本身的小圖示。
    const status = jobHere()?.status;
    const badge = status === "done" && !frameVisible() ? " ✓ 星系完成" : status === "waiting" ? " ⋯ 生成中" : status === "failed" ? " ⚠" : "";
    btn.textContent = (kind === "floating" ? "🌌 Intent Galaxy" : "🌌 iG") + badge;
    btn.title = "Intent Galaxy：把輸入框裡的目標展開成星系，選好方案後填回對話框（Cmd/Ctrl+Shift+G）";
    btn.dataset.kind = kind;
    btn.dataset.state = pillState();
    btn.style.cssText = "all:unset; box-sizing:border-box; cursor:pointer; font:600 11.5px/1 -apple-system,BlinkMacSystemFont,sans-serif; padding:5px 9px; margin:0 4px; border-radius:6px; color:#fff;"
      + " background:linear-gradient(135deg,rgba(56,189,248,.35),rgba(168,85,247,.35)); border:1px solid #38bdf8; box-shadow:0 0 10px rgba(56,189,248,.25); white-space:nowrap;"
      + (kind === "floating" ? " position:fixed; bottom:18px; right:18px; z-index:2147483646; font-size:13px; padding:9px 14px; border-radius:999px; background:linear-gradient(135deg,#0ea5e9,#8b5cf6);" : "");
    btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); togglePanel(); });
    return btn;
  }

  function mountPill() {
    const editor = findEditor();
    const mount = findMount(editor);
    const existing = document.getElementById(PILL_ID);
    if (existing && existing.dataset.kind === mount.kind && existing.isConnected && existing.parentElement === mount.parent && existing.dataset.state === pillState()) return;
    existing?.remove();
    mount.parent.insertBefore(makePill(mount.kind), mount.before);
  }

  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; mountPill(); });
  }).observe(document.body, { childList: true, subtree: true });

  // ── 星系面板：可拖曳、縮放、調透明度的浮動視窗；內容是擴充功能來源的 iframe（與頁面 CSS / CSP 隔離）──
  // 面板綁定打開時的對話（panelPath）：換對話就關閉（本機 CLI 生成中除外），按鈕動作只作用在它自己的對話。
  let frame = null, panel = null, panelId = "", panelPath = "", panelBusy = false, targetEditor = null, openGoal = "";
  // 這個對話的生成工作：{ goal, nonce, status: "waiting" | "done" | "failed", startedAt, path, owner, beat, unsent?, analysis?, detail?, adopted? }
  let job = null;
  const INSTANCE = crypto.randomUUID(); // 這個分頁的 content script；只有送出提示詞的分頁能把工作判為失敗
  const frameVisible = () => !!frame && !frame.hidden;
  const pillState = () => `${jobHere()?.status ?? "idle"}-${frameVisible() ? "open" : "closed"}`;
  const UI_KEY = "ig:ui";
  const JOB_PREFIX = "ig:job:";
  const MAX_JOBS = 50;
  const jobKey = (path = location.pathname) => `${JOB_PREFIX}${location.host}${path}`;
  const store = api.storage?.local;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const load = async (key) => { try { return (await store.get(key))[key] ?? null; } catch { return null; } };
  const save = async (key, value) => { try { await (value == null ? store.remove(key) : store.set({ [key]: value })); } catch { /* 無 storage 權限或配額已滿時只保留在記憶體 */ } };
  const saveJob = () => job && save(jobKey(job.path), job);
  const PROBE = "INTENT-SPAWNER"; // 提示詞開頭的固定字串
  const AST_HEAD = "# LOCKED INTENT AST";

  function editorText(el) { return el ? ("value" in el && el.tagName !== "DIV" ? el.value : el.innerText).trim() : ""; }
  /** 輸入框裡「使用者自己的問題」：擴充功能放進去的提示詞不算，之前填回的 AST 也去掉。 */
  function userText(el) {
    const t = editorText(el);
    if (t.includes(PROBE)) return "";
    const at = t.indexOf(AST_HEAD);
    return (at >= 0 ? t.slice(0, at) : t).trim();
  }

  const FRAME_CSS = `
    :host { all: initial; box-sizing: border-box; position: fixed; z-index: 2147483647; display: flex; flex-direction: column; min-width: 420px; min-height: 300px;
      border: 1px solid #38bdf8; border-radius: 14px; background: #080b11; box-shadow: 0 18px 60px rgba(0,0,0,.55); overflow: hidden; resize: both; color-scheme: dark; }
    :host([hidden]) { display: none; }
    header { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 12px; background: #111723; border-bottom: 1px solid #1e293b; cursor: move; user-select: none;
      font: 600 12px/1 -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif; color: #e2e8f0; }
    header .title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    header label { display: flex; align-items: center; gap: 4px; color: #94a3b8; font-weight: 400; font-size: 11px; cursor: default; }
    header input { width: 70px; accent-color: #38bdf8; cursor: pointer; }
    header button { all: unset; cursor: pointer; width: 24px; height: 24px; border-radius: 6px; display: grid; place-items: center; color: #cbd5e1; font-size: 14px; }
    header button:hover { background: #1e293b; color: #fff; }
    header button.close:hover { background: #be123c; }
    iframe { flex: 1; width: 100%; border: 0; background: #080b11; }
    :host(.dragging) iframe { pointer-events: none; }`;

  /** 面板目前要顯示的狀態：輸入框的問題、這個對話的工作、頁面上已有的星系。 */
  function panelState(reopen) {
    const j = jobHere();
    return { type: "ig-open", id: panelId, goal: openGoal, site: location.hostname.replace(/^www\./, ""), reopen,
      job: j && { goal: j.goal, nonce: j.nonce ?? "", status: j.status, elapsedSec: Math.round((Date.now() - j.startedAt) / 1000), analysis: j.analysis ?? null, detail: j.detail ?? "", unsent: !!j.unsent },
      pageGalaxy: j ? null : latestGalaxy() };
  }
  const sendPanel = (msg) => { if (panel) api.runtime.sendMessage({ ...msg, id: panelId }).catch?.(() => {}); };

  async function openPanel() {
    await syncPath();
    if (frame && panelPath !== location.pathname && !panelBusy) closePanel();
    // 縮小中的面板叫回來：iframe 一直活著（本機 CLI 生成、勾選中的方案都保留）。
    // 回來前先檢查 AI 是否已回完，並把輸入框目前的問題交給面板決定要不要換題。
    if (frame) {
      frame.hidden = false;
      clampFrame();
      mountPill();
      panel?.focus();
      if (jobHere() && job.status !== "done") await checkReply(true);
      const text = userText(findEditor());
      if (text) openGoal = text;
      if (panelPath === location.pathname) sendPanel(panelState(true));
      return;
    }
    targetEditor = findEditor();
    openGoal = userText(targetEditor);
    panelId = crypto.randomUUID();
    panelPath = location.pathname;
    panelBusy = false;
    frame = document.createElement("intent-galaxy-frame");
    const root = frame.attachShadow({ mode: "closed" });
    root.innerHTML = `<style>${FRAME_CSS}</style><header><span class="title">🌌 Intent Galaxy</span>
      <label title="面板透明度">透明度 <input type="range" min="30" max="100" step="5"></label>
      <button type="button" class="max" title="放大／還原（也可雙擊標題列）">⤢</button>
      <button type="button" class="min" title="縮小到按鈕（生成會繼續）">—</button>
      <button type="button" class="close" title="關閉">✕</button></header>`;
    panel = document.createElement("iframe");
    panel.src = api.runtime.getURL(`panel.html?id=${panelId}`);
    panel.allow = "clipboard-write";
    // 先掛上 load 監聽，等狀態算好再送 ig-open：長頁面掃描可能比 iframe 載入慢。
    let markLoaded;
    const loaded = new Promise((r) => { markLoaded = r; });
    panel.addEventListener("load", markLoaded, { once: true });
    root.appendChild(panel);
    const myPanel = panel, myFrame = frame;

    const ui = (await load(UI_KEY)) ?? {};
    const opacity = root.querySelector("input");
    opacity.value = String(ui.opacity ?? 100);
    frame.style.opacity = String(opacity.value / 100);
    opacity.addEventListener("input", () => { frame.style.opacity = String(opacity.value / 100); persistUi({ opacity: Number(opacity.value) }); });
    placeFrame(ui.rect);
    document.documentElement.appendChild(frame);
    wireDrag(root.querySelector("header"));
    root.querySelector(".max").addEventListener("click", toggleMaximize);
    root.querySelector(".min").addEventListener("click", minimizePanel);
    root.querySelector(".close").addEventListener("click", closePanel);
    // 只記錄使用者拖右下角造成的大小變化：與程式最後設定的尺寸相同（初次、還原、自動夾回）就不算。
    new ResizeObserver((entries) => {
      if (myFrame !== frame || frame.hidden || frame.dataset.max) return;
      const box = entries[0]?.target.getBoundingClientRect();
      if (!box?.width || !box.height) return;
      if (Math.abs(box.width - lastSet.width) < 2 && Math.abs(box.height - lastSet.height) < 2) return;
      lastSet = { width: box.width, height: box.height };
      persistUi({ rect: true });
    }).observe(frame);
    mountPill();

    // 等待中或失敗的工作：打開前先檢查一次，AI 可能在面板關著時已經回完。
    if (jobHere() && job.status !== "done") await checkReply(true);
    await loaded;
    if (panel !== myPanel) return; // 期間被關掉或重建
    sendPanel(panelState(false));
    myPanel.focus();
  }

  // 位置與大小：有記錄就沿用（夾在視窗內），否則貼在輸入框上方。
  let lastSet = { width: 0, height: 0 };
  function setRect(rect) {
    lastSet = { width: rect.width, height: rect.height };
    Object.assign(frame.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  }
  function placeFrame(saved) {
    const vw = window.innerWidth, vh = window.innerHeight;
    let { left, top, width, height } = saved ?? {};
    if (!width || !height) {
      const rect = (targetEditor?.isConnected ? targetEditor : findEditor())?.getBoundingClientRect();
      width = Math.min(Math.max(rect?.width ?? 0, 780), vw - 24);
      const bottom = rect ? Math.max(12, vh - rect.top + 10) : 80;
      height = Math.max(360, Math.min(600, vh - bottom - 12));
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
      const ui = (await load(UI_KEY)) ?? {};
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
    frame = null; panel = null; panelPath = ""; panelBusy = false;
    mountPill();
    targetEditor?.isConnected && targetEditor.focus();
  }

  // 按鈕／快捷鍵：面板開著時縮小；但輸入框換了新問題，就把新問題交給面板（面板會問要不要換題）。
  function togglePanel() {
    if (frameVisible() && panelPath === location.pathname) {
      const text = userText(findEditor());
      if (!text || text === openGoal) return minimizePanel();
    }
    openPanel();
  }
  window.addEventListener("resize", clampFrame);

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

  // ── 用當前網頁的 AI 生成：送出提示詞，從頁面中找出回覆的星系 JSON ──

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

  const isEditorText = (n) => !!n.parentElement?.closest('[contenteditable="true"], textarea, intent-galaxy-frame');
  /** 頁面上（輸入框以外）第一個含 needle 的文字節點。每次生成的提示詞都帶唯一識別碼，用它找到「這次送出的那則訊息」。 */
  function findTextNode(needle) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) if (n.data.includes(needle) && !isEditorText(n)) return n;
    return null;
  }
  const tagOf = (nonce) => `[ig:${nonce}]`;
  let probeCache = { at: 0, needle: "", has: false };
  /** 頁面上有沒有這次生成送出的提示詞（快取 1 秒，避免按鈕重繪時一直走訪 DOM）。 */
  function pageHasTag(nonce) {
    const needle = tagOf(nonce);
    if (Date.now() - probeCache.at > 1000 || probeCache.needle !== needle) probeCache = { at: Date.now(), needle, has: !!findTextNode(needle) };
    return probeCache.has;
  }

  /** 頁面上的星系（依文件順序）；after 指定時只取該節點之後的。程式碼區塊讀 textContent（收合的部分也讀得到），再以整頁文字補漏。 */
  function pageGalaxies(after = null, tag = "") {
    const follows = (el) => !after || !!(after.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
    const found = [];
    for (const el of document.querySelectorAll("pre, code:not(pre code)")) if (follows(el)) found.push(...galaxiesIn(el.textContent));
    let text = document.body.innerText;
    if (tag) { const at = text.indexOf(tag); text = at < 0 ? "" : text.slice(at); }
    found.push(...galaxiesIn(text));
    return found;
  }
  const latestGalaxy = () => pageGalaxies().at(-1) ?? null;

  function clickSend(editor) {
    const form = editor.closest("form, fieldset") ?? editor.parentElement?.parentElement?.parentElement;
    const send = [...(form ?? document).querySelectorAll(SEND_BUTTON)].find((b) => visible(b) && !b.disabled);
    if (send) send.click();
    else editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true, cancelable: true }));
  }

  /** 送給「屬於目前對話」的面板（關於目前對話工作的通知）。 */
  const toPanel = (msg) => { if (panel && panelPath === location.pathname) sendPanel(msg); };
  const MAX_WAIT_SEC = 30 * 60; // 推理型模型（Pro / Thinking）常要 5–15 分鐘以上；從真正送出時起算
  const STALE_OWNER_MS = 90_000; // 送出的分頁沒有心跳超過這麼久（例如已關閉），其他分頁可以接手
  const FRESH_SEND_MS = 60_000; // 剛送出、頁面可能還沒畫出提示詞的寬限
  let corePromise = null; // 修復管線（擴充功能內的 galaxy/libs/core），用來在標記完成前確認 JSON 可用
  const core = () => (corePromise ??= import(api.runtime.getURL("galaxy/libs/core/src/index.js")));

  /**
   * 目前網址的工作。頁面上必須找得到這次帶識別碼的提示詞（剛送出、還沒送出、或是貼上／本機 CLI 收下的除外），
   * 避免共用網址（例如停在 / 的暫時對話）把別的對話的工作顯示在每個新對話。
   */
  function jobHere() {
    if (!job || job.path !== location.pathname) return null;
    if (job.adopted || job.unsent) return job;
    if (job.status === "waiting" && Date.now() - job.startedAt < FRESH_SEND_MS) return job;
    return pageHasTag(job.nonce) ? job : null;
  }
  const isOwner = () => job?.owner === INSTANCE || Date.now() - (job?.beat ?? 0) > STALE_OWNER_MS;
  const jobInfo = (j) => j && { goal: j.goal, nonce: j.nonce ?? "", status: j.status, elapsedSec: Math.round((Date.now() - j.startedAt) / 1000), analysis: j.analysis ?? null, detail: j.detail ?? "", unsent: !!j.unsent };

  async function failJob(detail) {
    stopWatch();
    Object.assign(job, { status: "failed", detail });
    await saveJob(); mountPill();
    toPanel({ type: "ig-chat-error", detail, failed: true, nonce: job.nonce });
  }

  async function finishJob(analysis) {
    stopWatch();
    let repaired = null;
    try { repaired = (await core()).repairAnalysis(analysis); } catch { /* 載入失敗時交給面板再驗一次 */ }
    if (repaired && !repaired.ok) return failJob(`AI 回覆的星系 JSON 不完整（${repaired.findings.at(-1)?.msg ?? "格式錯誤"}）。可以重新生成，或請 AI 修正後貼上。`);
    Object.assign(job, { status: "done", analysis, detail: "", unsent: false });
    await saveJob(); mountPill();
    toPanel({ type: "ig-galaxy", analysis, goal: job.goal });
  }

  let watchTimer = 0, lastSeen = "", lastBeat = 0;
  function stopWatch() { clearInterval(watchTimer); watchTimer = 0; lastSeen = ""; }

  /** 檢查一次回覆。immediate：面板打開時，看到完整 JSON 就直接收下（不等第二次讀取）。 */
  async function checkReply(immediate = false) {
    if (!job || job.path !== location.pathname || job.status === "done") return;
    // 只接受「這次送出的提示詞」之後的星系：用這次的識別碼找到那則訊息，舊的或別的回覆都在它前面。
    const tag = tagOf(job.nonce);
    const anchor = findTextNode(tag);
    const fresh = anchor ? pageGalaxies(anchor, tag).at(-1) : null;
    if (fresh) {
      // 連續兩次讀到相同的 JSON 才視為回覆完成，避免拿到串流中途的片段。
      const key = JSON.stringify(fresh);
      if (immediate || key === lastSeen || job.status === "failed") return finishJob(fresh);
      lastSeen = key;
      return;
    }
    if (anchor && (job.unsent || job.status === "failed")) {
      // 提示詞現在才出現在對話裡（使用者手動送出），或失敗後 AI 仍在回覆：重新開始等待，從現在起算。
      const now = Date.now();
      Object.assign(job, { status: "waiting", unsent: false, detail: "", startedAt: now, owner: INSTANCE, beat: now });
      lastBeat = now;
      await saveJob(); mountPill();
      if (!watchTimer) watchReply();
      toPanel({ type: "ig-reopen", job: jobInfo(job) });
      return;
    }
    if (job.status !== "waiting") return;
    const elapsedSec = Math.round((Date.now() - job.startedAt) / 1000);
    // 送出的分頁定期寫心跳；只有它（或心跳已過期時接手的分頁）能判定逾時，避免沒看到回覆的舊分頁誤判。
    if (job.owner === INSTANCE && Date.now() - lastBeat > 30_000) { lastBeat = Date.now(); job.beat = lastBeat; saveJob(); }
    if (elapsedSec > MAX_WAIT_SEC && isOwner()) {
      return failJob(job.unsent
        ? "提示詞一直沒有送出。可以重新生成，或在對話框自己按送出後再按 iG。"
        : "等了 30 分鐘仍沒有讀到星系 JSON。若 AI 已經回覆，請複製它的 JSON 後按「貼上 JSON」；也可以重新生成。");
    }
    toPanel({ type: "ig-progress", elapsedSec, unsent: !!job.unsent, nonce: job.nonce });
  }

  // 生成工作獨立於面板：縮小或關閉面板後仍持續等待，完成時按鈕顯示「✓ 星系完成」。
  function watchReply() {
    stopWatch();
    watchTimer = setInterval(() => checkReply(), 1500);
  }

  let jobGen = 0; // 送出期間（約 2–3 秒）使用者若放棄或貼上，作廢這次送出
  let pending = null; // 送出中、工作還沒建立：{ nonce, from, to? }。網址可能在這段時間就從 / 變成 /c/<id>
  async function startJob(goal, prompt) {
    if (jobHere()?.status === "waiting") { sendPanel({ type: "ig-chat-error", detail: "上一個問題還在等 AI 回覆。請等它完成，或先按「放棄等待」。" }); return; }
    const gen = ++jobGen;
    const editor = targetEditor?.isConnected ? targetEditor : findEditor();
    const nonce = crypto.randomUUID().slice(0, 8);
    const tagged = `${prompt}\n${tagOf(nonce)}`;
    if (!writeToEditor(editor, tagged, tagOf(nonce))) { sendPanel({ type: "ig-chat-error", detail: "找不到這個網頁的輸入框，無法送出提示詞。", failed: true, nonce: "" }); return; }
    pending = { nonce, from: location.pathname };
    sendPanel({ type: "ig-started", nonce });
    const alive = () => gen === jobGen;
    // 送出按鈕通常在輸入後才出現或啟用：稍等再按，並確認提示詞真的離開了輸入框。
    await sleep(400); if (!alive()) return void (pending = null);
    clickSend(editor);
    // 送出後網址可能立刻從新對話變成對話網址：每 100 毫秒看一次，記下帶這次識別碼的新網址（使用者可能緊接著切到別的對話）。
    for (let t = 0; t < 1500; t += 100) {
      await sleep(100); if (!alive()) return void (pending = null);
      if (!pending.to && location.pathname !== pending.from && isNewChatPath(pending.from) && findTextNode(tagOf(nonce))) pending.to = location.pathname;
    }
    if (editorText(editor).includes(tagOf(nonce))) { clickSend(editor); await sleep(1200); if (!alive()) return void (pending = null); }
    const now = Date.now();
    // 工作屬於送出時的對話；送出期間網址從新對話變成對話網址時，跟著搬到新網址。
    const path = pending.to ?? pending.from;
    const created = { goal, nonce, status: "waiting", startedAt: now, path, owner: INSTANCE, beat: now, unsent: editorText(editor).includes(tagOf(nonce)) };
    pending = null;
    if (path !== location.pathname) { await save(jobKey(path), created); return; } // 使用者已切到別的對話：只記錄，回來時接續
    job = created;
    lastBeat = now;
    await saveJob();
    if (!alive() || job !== created) return;
    mountPill();
    if (job.unsent) toPanel({ type: "ig-chat-error", detail: "提示詞已放進輸入框，但網站沒有自動送出（AI 可能還在回覆上一則）。請在對話框按一下送出，這裡會自動接著等。", nonce });
    watchReply();
  }

  // ── 對話切換（站內導覽不會重新載入 content script）：每個網址各自有自己的工作 ──
  async function loadJobForPath() {
    const path = location.pathname;
    stopWatch();
    const saved = await load(jobKey(path));
    if (location.pathname !== path) return; // 讀取期間又換頁了
    job = saved;
    if (job?.status === "waiting") watchReply();
    mountPill();
  }

  // 「新對話」網址：送出第一則訊息後會換成對話網址（ChatGPT / → /c/<id>、Claude /new → /chat/<id>、Gemini /app → /app/<id>）。
  const isNewChatPath = (p) => p === "/" || /^\/(new|app|chat)\/?$/.test(p);
  let lastPath = location.pathname, pathTask = null;
  /** 把網址變化處理完（多個呼叫者共用同一個處理）。打開面板與處理面板訊息前都會先呼叫，避免用到換頁前的狀態。 */
  async function syncPath() {
    while (location.pathname !== lastPath) await (pathTask ??= onPathChange().finally(() => { pathTask = null; }));
  }
  async function onPathChange() {
    const from = lastPath, to = location.pathname;
    // 同一個對話換網址：只限「新對話 → 對話網址」，而且是剛送出（或送出中）的這次提示詞；等它畫出來最多 5 秒。
    if (pending?.to && pending.to === to && frame && panelPath === from) { lastPath = to; panelPath = to; probeCache.at = 0; mountPill(); return; }
    const nonce = pending?.from === from && !pending.to ? pending.nonce
      : job?.status === "waiting" && job.path === from && Date.now() - job.startedAt < 120_000 ? job.nonce : null;
    if (nonce && isNewChatPath(from) && !isNewChatPath(to)) {
      for (let i = 0; i < 10 && !findTextNode(tagOf(nonce)); i++) { await sleep(500); if (location.pathname !== to) break; }
      // 識別碼每次生成都不同：新網址上找得到它，就證明是同一個對話（即使該網址有舊記錄，也是這個對話自己的）。
      if (location.pathname === to && findTextNode(tagOf(nonce))) {
        lastPath = to;
        probeCache.at = 0;
        if (pending?.nonce === nonce) pending.to = to;
        if (job?.nonce === nonce && job.path === from) { await save(jobKey(from), null); job.path = to; await saveJob(); }
        if (frame && panelPath === from) panelPath = to;
        mountPill();
        return;
      }
    }
    lastPath = location.pathname;
    probeCache.at = 0;
    if (pending && pending.from === from) pending.to ??= from; // 送出中換到別的對話：工作仍屬於送出的那個對話
    // 面板屬於上一個對話：關閉。本機 CLI 生成中則保留（縮小），完成時結果寫回它自己的對話。
    if (frame && panelPath === from && !panelBusy) closePanel();
    await loadJobForPath();
  }
  setInterval(() => { if (location.pathname !== lastPath) syncPath(); }, 1000);
  // 支援 Navigation API 的瀏覽器：站內換頁一完成就處理，不必等下一次輪詢。
  globalThis.navigation?.addEventListener?.("navigatesuccess", () => { if (location.pathname !== lastPath) syncPath(); });

  // 其他分頁更新了同一個對話的工作（例如另一個分頁先讀到回覆）：同步過來並通知面板。
  api.storage?.onChanged?.addListener((changes, area) => {
    if (area !== "local" || !(jobKey() in changes) || location.pathname !== lastPath) return;
    const next = changes[jobKey()].newValue ?? null;
    if (next && job && next.nonce === job.nonce && next.status === job.status) { job.beat = next.beat; job.owner = next.owner; return; } // 只是心跳
    const prev = job;
    job = next;
    if (job?.status === "waiting") { if (!watchTimer) watchReply(); } else stopWatch();
    if (job?.status === "done") toPanel({ type: "ig-galaxy", analysis: job.analysis, goal: job.goal });
    else if (job?.status === "failed") toPanel({ type: "ig-chat-error", detail: job.detail, failed: true, nonce: job.nonce });
    else if (job?.status === "waiting" && job.nonce !== prev?.nonce) toPanel({ type: "ig-reopen", job: jobInfo(job) });
    else if (!job && prev) toPanel({ type: "ig-reset" });
    mountPill();
  });

  // 只保留最近 MAX_JOBS 個對話的記錄。
  (async () => {
    try {
      const all = await store.get(null);
      const jobs = Object.entries(all).filter(([k]) => k.startsWith(JOB_PREFIX)).sort((a, b) => (b[1]?.startedAt ?? 0) - (a[1]?.startedAt ?? 0));
      if (jobs.length > MAX_JOBS) await store.remove(jobs.slice(MAX_JOBS).map(([k]) => k));
    } catch { /* 沒有 storage 權限 */ }
  })();
  loadJobForPath();

  window.addEventListener("message", async (e) => {
    if (e.origin !== EXT_ORIGIN || !panel || e.source !== panel.contentWindow || e.data?.id !== panelId) return;
    const msg = e.data, source = panel;
    await syncPath();
    if (panel !== source) return; // 換頁時面板已關閉
    const here = panelPath === location.pathname; // 面板屬於目前的對話嗎（本機 CLI 生成中的面板可能跟著到別的對話）
    if (msg.type === "intent-close") minimizePanel();
    if (msg.type === "intent-busy") panelBusy = !!msg.busy;
    if (msg.type === "intent-chat-spawn" && typeof msg.prompt === "string") {
      if (here) startJob(String(msg.goal ?? ""), msg.prompt);
      else sendPanel({ type: "ig-chat-error", detail: "這個面板屬於另一個對話。請按 ✕ 關閉後，在這個對話重新按 iG。", failed: true, nonce: "" });
    }
    // 面板手動貼上、本機 CLI 生成或載入頁面上的星系：記成面板所屬對話的結果，下次打開直接顯示。
    if (msg.type === "intent-adopt" && isGalaxy(msg.analysis)) {
      const adopted = { goal: String(msg.goal ?? ""), status: "done", startedAt: Date.now(), path: panelPath, analysis: msg.analysis, adopted: true, owner: INSTANCE, beat: Date.now() };
      if (here) { jobGen++; pending = null; stopWatch(); job = adopted; }
      await save(jobKey(panelPath), adopted);
      mountPill();
    }
    // 放棄：只取消面板看到的那個等待中／失敗的工作；已完成的星系不會被刪。
    if (msg.type === "intent-reset") {
      if (here) jobGen++, pending = null;
      const target = here ? job : await load(jobKey(panelPath));
      const matches = target && target.status !== "done" && (!msg.nonce || target.nonce === msg.nonce);
      if (matches) {
        await save(jobKey(panelPath), null);
        if (here) { stopWatch(); job = null; }
      }
      mountPill();
    }
    if (msg.type === "intent-lock") {
      // 星系所屬的問題在前、AST 在後；使用者若另外打了補充說明（不是之前填回的 AST），接在最後。
      const editor = targetEditor?.isConnected ? targetEditor : findEditor();
      const goal = String(msg.goal ?? openGoal).trim();
      const extra = userText(editor);
      const text = [goal, msg.ast, extra && extra !== goal ? `補充：${extra}` : ""].filter(Boolean).join("\n\n");
      closePanel();
      if (!writeToEditor(editor, text, "LOCKED INTENT AST")) navigator.clipboard?.writeText(text).catch(() => {});
    }
  });

  mountPill();

  // 工具列圖示（background.js）以 scripting.executeScript 在同一個 isolated world 呼叫；頁面腳本看不到這個全域。
  window.__intentGalaxyToggle = togglePanel;

  // Cmd/Ctrl+Shift+G：capture 階段攔截，避免被頁面快捷鍵吃掉；以 e.code 判斷，IME 開啟時同樣可用。
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyG") { e.preventDefault(); e.stopPropagation(); togglePanel(); }
  }, true);
})();
