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
    const badge = job?.status === "done" && !frame ? " ✓ 星系完成" : job?.status === "waiting" ? " ⋯ 生成中" : "";
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
  let frame = null, panel = null, panelId = "", targetEditor = null, openGoal = "";
  let job = null; // 這個對話的生成工作：{ goal, status: "waiting" | "done" | "failed", startedAt, known: [], analysis, path }
  const pillState = () => `${job?.status ?? "idle"}-${frame ? "open" : "closed"}`;
  const UI_KEY = "ig:ui";
  const jobKey = (path = location.pathname) => `ig:job:${location.host}${path}`;
  const store = api.storage?.local;
  const load = async (key) => { try { return (await store.get(key))[key] ?? null; } catch { return null; } };
  const save = (key, value) => { try { store.set({ [key]: value }); } catch { /* 無 storage 權限時只保留在記憶體 */ } };
  const saveJob = () => { if (job) save(jobKey(job.path), job); };

  function editorText(el) { return el ? ("value" in el && el.tagName !== "DIV" ? el.value : el.innerText).trim() : ""; }

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

  async function openPanel() {
    targetEditor = findEditor();
    openGoal = editorText(targetEditor);
    panelId = crypto.randomUUID();
    frame = document.createElement("intent-galaxy-frame");
    const root = frame.attachShadow({ mode: "closed" });
    root.innerHTML = `<style>${FRAME_CSS}</style><header><span class="title">🌌 Intent Galaxy</span>
      <label title="面板透明度">透明度 <input type="range" min="30" max="100" step="5"></label>
      <button type="button" class="max" title="放大／還原">⤢</button>
      <button type="button" class="min" title="縮小到按鈕（生成會繼續）">—</button>
      <button type="button" class="close" title="關閉">✕</button></header>`;
    panel = document.createElement("iframe");
    panel.src = api.runtime.getURL(`panel.html?id=${panelId}`);
    panel.allow = "clipboard-write";
    root.appendChild(panel);

    const ui = (await load(UI_KEY)) ?? {};
    const opacity = root.querySelector("input");
    opacity.value = String(ui.opacity ?? 100);
    frame.style.opacity = String(opacity.value / 100);
    opacity.addEventListener("input", () => { frame.style.opacity = String(opacity.value / 100); persistUi(); });
    placeFrame(ui.rect);
    document.documentElement.appendChild(frame);
    wireDrag(root.querySelector("header"));
    root.querySelector(".max").addEventListener("click", toggleMaximize);
    root.querySelector(".min").addEventListener("click", () => closePanel());
    root.querySelector(".close").addEventListener("click", () => closePanel());
    new ResizeObserver(() => { if (frame && !frame.dataset.max) persistUi(); }).observe(frame);
    mountPill();

    const pageGalaxy = latestPageGalaxy();
    // 目標文字與星系只走 runtime 訊息：頁面腳本讀不到 closed shadow root，也無法偽造 runtime 訊息。
    panel.addEventListener("load", () => {
      api.runtime.sendMessage({ type: "ig-open", id: panelId, goal: openGoal, site: location.hostname.replace(/^www\./, ""),
        job: job && { goal: job.goal, status: job.status, elapsedSec: Math.round((Date.now() - job.startedAt) / 1000), analysis: job.analysis ?? null, detail: job.detail ?? "" },
        pageGalaxy });
      panel.focus();
    }, { once: true });
  }

  // 位置與大小：有記錄就沿用（夾在視窗內），否則貼在輸入框上方。
  function placeFrame(saved) {
    const vw = window.innerWidth, vh = window.innerHeight;
    let { left, top, width, height } = saved ?? {};
    if (!width) {
      const rect = (targetEditor?.isConnected ? targetEditor : findEditor())?.getBoundingClientRect();
      width = Math.min(Math.max(rect?.width ?? 0, 780), vw - 24);
      const bottom = rect ? Math.max(12, vh - rect.top + 10) : 80;
      height = Math.max(360, Math.min(600, vh - bottom - 12));
      left = (rect ? rect.left + rect.width / 2 : vw / 2) - width / 2;
      top = vh - bottom - height;
    }
    width = Math.min(width, vw - 16); height = Math.min(height, vh - 16);
    left = Math.min(Math.max(8, left), vw - width - 8); top = Math.min(Math.max(8, top), vh - height - 8);
    Object.assign(frame.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
  }

  let persistTimer = 0;
  function persistUi() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      if (!frame) return;
      const r = frame.getBoundingClientRect();
      const opacity = Number(frame.style.opacity || 1) * 100;
      save(UI_KEY, { opacity, rect: frame.dataset.max ? JSON.parse(frame.dataset.max) : { left: r.left, top: r.top, width: r.width, height: r.height } });
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
    const end = () => { if (!start) return; start = null; frame.classList.remove("dragging"); persistUi(); };
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
      Object.assign(frame.style, { left: "16px", top: "16px", width: `${window.innerWidth - 32}px`, height: `${window.innerHeight - 32}px` });
    }
    persistUi();
  }

  function closePanel() {
    frame?.remove();
    frame = null; panel = null;
    mountPill();
    targetEditor?.focus();
  }

  function togglePanel() { frame ? closePanel() : openPanel(); }
  window.addEventListener("resize", () => { if (frame && !frame.dataset.max) placeFrame(frame.getBoundingClientRect()); });

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

  // 回覆裡的 JSON 會出現 "schema_version"（帶引號）；提示詞裡的 TypeScript schema 沒有引號，不會誤判。
  const KEY = '"schema_version"';
  const isGalaxy = (o) => o?.schema_version === "1.0" && o.nodes && typeof o.nodes === "object" && o.archetypes && typeof o.archetypes === "object";
  const fingerprint = (o) => `${o.core?.decision ?? ""}|${Object.values(o.nodes).map((n) => n?.label ?? "").join("/")}`;

  /** 頁面上所有完整的星系 JSON（依文件順序）。程式碼區塊逐一讀 textContent，再以整頁文字補漏。 */
  function pageGalaxies() {
    const texts = [...document.querySelectorAll("pre, code:not(pre code)")].map((el) => el.textContent);
    texts.push(document.body.innerText);
    const found = new Map();
    for (const text of texts) {
      for (let k = text.indexOf(KEY); k >= 0; k = text.indexOf(KEY, k + KEY.length)) {
        const obj = parseObjectAt(text, text.lastIndexOf("{", k));
        if (isGalaxy(obj) && !found.has(fingerprint(obj))) found.set(fingerprint(obj), obj);
      }
    }
    return [...found.values()];
  }
  const latestPageGalaxy = () => pageGalaxies().at(-1) ?? null;

  function sendPrompt(editor, prompt) {
    if (!writeToEditor(editor, prompt, "INTENT-SPAWNER")) return false;
    // 送出按鈕通常在輸入後才出現或啟用：稍等再按；找不到就模擬 Enter。
    setTimeout(() => {
      const form = editor.closest("form, fieldset") ?? editor.parentElement?.parentElement?.parentElement;
      const send = [...(form ?? document).querySelectorAll(SEND_BUTTON)].find((b) => visible(b) && !b.disabled);
      if (send) send.click();
      else editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true, cancelable: true }));
    }, 400);
    return true;
  }

  const toPanel = (msg) => { if (panel) api.runtime.sendMessage({ ...msg, id: panelId }).catch?.(() => {}); };
  const MAX_WAIT_SEC = 30 * 60; // 推理型模型（Pro / Thinking）常要 5–15 分鐘以上

  let watchTimer = 0;
  function finishJob(analysis) {
    clearInterval(watchTimer); watchTimer = 0;
    Object.assign(job, { status: "done", analysis });
    saveJob(); mountPill();
    toPanel({ type: "ig-galaxy", analysis, goal: job.goal });
  }

  // 生成工作獨立於面板：關閉或縮小面板後仍持續等待，完成時按鈕顯示「✓ 星系完成」。
  function watchReply() {
    clearInterval(watchTimer);
    let last = "";
    watchTimer = setInterval(() => {
      // ChatGPT 等網站送出第一則訊息後網址會從 / 變成 /c/<id>：把工作搬到新網址，重新打開時才找得到。
      if (job.path !== location.pathname) { save(jobKey(job.path), null); job.path = location.pathname; saveJob(); }
      const elapsedSec = Math.round((Date.now() - job.startedAt) / 1000);
      const fresh = pageGalaxies().filter((g) => !job.known.includes(fingerprint(g))).at(-1);
      if (fresh) {
        // 連續兩次讀到相同的 JSON 才視為回覆完成，避免拿到串流中途的片段。
        const key = JSON.stringify(fresh);
        if (key === last) return finishJob(fresh);
        last = key;
      }
      if (elapsedSec > MAX_WAIT_SEC) {
        clearInterval(watchTimer); watchTimer = 0;
        Object.assign(job, { status: "failed", detail: "等了 30 分鐘仍沒有讀到星系 JSON。若 AI 已經回覆，請複製它的 JSON 後按「貼上 JSON」。" });
        saveJob(); mountPill();
        toPanel({ type: "ig-chat-error", detail: job.detail });
        return;
      }
      toPanel({ type: "ig-progress", elapsedSec });
    }, 1500);
  }

  function startJob(goal, prompt) {
    const editor = targetEditor?.isConnected ? targetEditor : findEditor();
    const known = pageGalaxies().map(fingerprint);
    if (!sendPrompt(editor, prompt)) { toPanel({ type: "ig-chat-error", detail: "找不到這個網頁的輸入框，無法送出提示詞。" }); return; }
    job = { goal, status: "waiting", startedAt: Date.now(), known, path: location.pathname };
    saveJob(); mountPill();
    watchReply();
  }

  // 重新載入頁面後接續：等待中的工作繼續等；已完成的星系留給下次打開面板時直接顯示。
  load(jobKey()).then((saved) => {
    if (!saved || job) return;
    job = saved;
    if (job.status === "waiting") watchReply();
    mountPill();
  });

  window.addEventListener("message", (e) => {
    if (e.origin !== EXT_ORIGIN || !panel || e.source !== panel.contentWindow || e.data?.id !== panelId) return;
    const msg = e.data;
    if (msg.type === "intent-close") closePanel();
    if (msg.type === "intent-chat-spawn" && typeof msg.prompt === "string") startJob(String(msg.goal ?? ""), msg.prompt);
    // 面板手動貼上或載入頁面上的星系：記成這個對話的結果，下次打開直接顯示。
    if (msg.type === "intent-adopt" && isGalaxy(msg.analysis)) {
      clearInterval(watchTimer); watchTimer = 0;
      job = { goal: String(msg.goal ?? ""), status: "done", startedAt: Date.now(), known: [], path: location.pathname, analysis: msg.analysis };
      saveJob(); mountPill();
    }
    if (msg.type === "intent-reset") { clearInterval(watchTimer); watchTimer = 0; save(jobKey(), null); job = null; mountPill(); }
    if (msg.type === "intent-lock") {
      const text = openGoal ? `${openGoal}\n\n${msg.ast}` : msg.ast;
      const editor = targetEditor?.isConnected ? targetEditor : findEditor();
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
