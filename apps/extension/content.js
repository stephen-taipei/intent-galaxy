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
    btn.textContent = kind === "floating" ? "🌌 Intent Galaxy" : "🌌 iG";
    btn.title = "Intent Galaxy：把輸入框裡的目標展開成星系，選好方案後填回對話框（Cmd/Ctrl+Shift+G）";
    btn.dataset.kind = kind;
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
    if (existing && existing.dataset.kind === mount.kind && existing.isConnected && existing.parentElement === mount.parent) return;
    existing?.remove();
    mount.parent.insertBefore(makePill(mount.kind), mount.before);
  }

  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; mountPill(); if (panel) placePanel(); });
  }).observe(document.body, { childList: true, subtree: true });
  mountPill();

  // ── 星系面板：擴充功能來源的 iframe，與頁面 CSS / CSP / customElements 隔離 ──
  let panel = null, panelId = "", targetEditor = null, openGoal = "";

  function placePanel() {
    const rect = (targetEditor?.isConnected ? targetEditor : findEditor())?.getBoundingClientRect();
    const width = Math.min(Math.max(rect?.width ?? 0, 760), window.innerWidth - 24);
    const left = Math.min(Math.max(12, (rect ? rect.left + rect.width / 2 : window.innerWidth / 2) - width / 2), window.innerWidth - width - 12);
    const bottom = rect ? Math.max(12, window.innerHeight - rect.top + 10) : 80;
    const height = Math.min(560, window.innerHeight - bottom - 12);
    Object.assign(panel.style, { left: `${left}px`, bottom: `${bottom}px`, width: `${width}px`, height: `${Math.max(320, height)}px` });
  }

  function editorText(el) { return el ? ("value" in el && el.tagName !== "DIV" ? el.value : el.innerText).trim() : ""; }

  function openPanel() {
    targetEditor = findEditor();
    openGoal = editorText(targetEditor);
    panelId = crypto.randomUUID();
    panel = document.createElement("iframe");
    panel.id = PANEL_ID;
    panel.src = api.runtime.getURL(`panel.html?id=${panelId}`);
    panel.allow = "clipboard-write";
    panel.style.cssText = "position:fixed; z-index:2147483647; border:1px solid #38bdf8; border-radius:14px; background:#080b11; box-shadow:0 18px 60px rgba(0,0,0,.55); color-scheme:dark;";
    placePanel();
    document.body.appendChild(panel);
    // 目標文字只走 runtime 訊息：頁面腳本讀得到 iframe src，但無法偽造 runtime 訊息。
    panel.addEventListener("load", () => { api.runtime.sendMessage({ type: "ig-open", id: panelId, goal: openGoal }); panel.focus(); }, { once: true });
  }

  function closePanel() {
    panel?.remove();
    panel = null;
    targetEditor?.focus();
  }

  function togglePanel() { panel ? closePanel() : openPanel(); }

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

  window.addEventListener("message", (e) => {
    if (e.origin !== EXT_ORIGIN || !panel || e.source !== panel.contentWindow || e.data?.id !== panelId) return;
    if (e.data.type === "intent-close") closePanel();
    if (e.data.type === "intent-lock") {
      const text = openGoal ? `${openGoal}\n\n${e.data.ast}` : e.data.ast;
      const editor = targetEditor?.isConnected ? targetEditor : findEditor();
      closePanel();
      if (!writeToEditor(editor, text, "LOCKED INTENT AST")) navigator.clipboard?.writeText(text).catch(() => {});
    }
  });

  // 工具列圖示（background.js）以 scripting.executeScript 在同一個 isolated world 呼叫；頁面腳本看不到這個全域。
  window.__intentGalaxyToggle = togglePanel;

  // Cmd/Ctrl+Shift+G：capture 階段攔截，避免被頁面快捷鍵吃掉；以 e.code 判斷，IME 開啟時同樣可用。
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyG") { e.preventDefault(); e.stopPropagation(); togglePanel(); }
  }, true);
})();
