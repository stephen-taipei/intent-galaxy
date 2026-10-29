(() => {
  const EXTENSION_ID = "intent-galaxy-local-preview";
  const STORE_PREFIX = "__intentGalaxyPreview.storage:";
  const HUB_SLOT = "__intentGalaxyPreviewHub";
  const isPanel = location.pathname === "/extension/panel.html";
  const owner = window.top;
  const hub = owner[HUB_SLOT] ??= { contexts: new Set() };
  hub.pendingDiagnostics ??= [];
  hub.lastDraftIds ??= new Map();
  const context = { role: isPanel ? "panel" : "page", window, runtimeListeners: new Set(), storageListeners: new Set(), disposed: false };
  hub.contexts.add(context);

  const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  function recordRuntimeMessage(message, route) {
    const payload = message?.msg ?? message;
    const type = String(payload?.type ?? "unknown").slice(0, 64);
    const nonce = String(payload?.nonce ?? payload?.job?.nonce ?? message?.nonce ?? "—").slice(0, 40);
    const id = String(message?.id ?? "—").slice(0, 48);
    const row = { type, nonce, id, route: String(route).slice(0, 96) };
    if (type === "intent-draft" && id !== "—" && String(route).includes("forwarded")) hub.lastDraftIds.set(nonce, id);
    const page = [...hub.contexts].find((target) => target.role === "page" && !target.disposed);
    if (page?.window.__intentGalaxyPreviewRecord) page.window.__intentGalaxyPreviewRecord(row);
    else hub.pendingDiagnostics.push(row);
  }

  function trackFrameShadow(host, root) {
    let previous = "";
    const report = () => {
      const frameUrl = root.querySelector("iframe")?.src ?? "";
      let id = "—";
      try { id = new URL(frameUrl).searchParams.get("id") ?? "—"; } catch { /* Frame URL may not be assigned yet. */ }
      const route = `frame: ${host.hidden ? "hidden" : "visible"}`;
      const key = `${id}|${route}`;
      if (key === previous) return;
      previous = key;
      recordRuntimeMessage({ type: "frame-state", id }, route);
    };
    new MutationObserver(report).observe(host, { attributes: true, attributeFilter: ["hidden"] });
    new MutationObserver(report).observe(root, { childList: true, subtree: true });
    report();
  }

  if (!isPanel) {
    const attachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init) {
      if (this.localName === "intent-galaxy-frame" && init?.mode === "closed") {
        const root = attachShadow.call(this, { ...init, mode: "open" });
        trackFrameShadow(this, root);
        return root;
      }
      return attachShadow.call(this, init);
    };

    const list = document.getElementById("runtime-log-list");
    const rows = [];
    window.__intentGalaxyPreviewRecord = (row) => {
      rows.unshift(row);
      if (rows.length > 80) rows.length = 80;
      list?.replaceChildren(...rows.map((entry) => {
        const line = document.createElement("li");
        for (const [key, className] of [["type", ""], ["nonce", ""], ["id", ""], ["route", "route"]]) {
          const cell = document.createElement("span");
          if (className) cell.className = className;
          cell.textContent = entry[key];
          line.append(cell);
        }
        return line;
      }));
    };
    document.getElementById("clear-runtime-log")?.addEventListener("click", () => {
      rows.length = 0;
      list?.replaceChildren();
    });
    for (const row of hub.pendingDiagnostics.splice(0)) window.__intentGalaxyPreviewRecord(row);
  }

  const panelBaseUrl = () => new URL("/extension/panel.html", location.origin).href;
  const extensionUrl = (resource) => new URL(String(resource).replace(/^\/+/, ""), new URL("/extension/", location.origin)).href;
  const addListenerApi = (listeners) => ({
    addListener(listener) { if (typeof listener === "function") listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
  });
  function dispatchRuntime(target, message, sender) {
    if (target.disposed) return;
    for (const listener of [...target.runtimeListeners]) {
      try { listener(message, sender, () => {}); }
      catch (error) { console.error("Preview runtime listener failed:", error); }
    }
  }
  function dispatchStorage(changes) {
    if (!Object.keys(changes).length) return;
    for (const target of [...hub.contexts]) {
      if (target.disposed) { hub.contexts.delete(target); continue; }
      for (const listener of [...target.storageListeners]) {
        try { listener(changes, "local"); }
        catch (error) { console.error("Preview storage listener failed:", error); }
      }
    }
  }

  const storageLocal = {
    async get(keys = null) {
      const all = {};
      for (let i = 0; i < localStorage.length; i++) {
        const name = localStorage.key(i);
        if (!name?.startsWith(STORE_PREFIX)) continue;
        const key = name.slice(STORE_PREFIX.length);
        try { all[key] = JSON.parse(localStorage.getItem(name)); } catch { /* Ignore malformed preview storage. */ }
      }
      if (keys == null) return all;
      if (typeof keys === "string") return Object.hasOwn(all, keys) ? { [keys]: all[keys] } : {};
      if (Array.isArray(keys)) return Object.fromEntries(keys.filter((key) => Object.hasOwn(all, key)).map((key) => [key, all[key]]));
      if (typeof keys === "object") {
        const result = {};
        for (const [key, fallback] of Object.entries(keys)) result[key] = Object.hasOwn(all, key) ? all[key] : fallback;
        return result;
      }
      return {};
    },
    async set(items) {
      const changes = {};
      for (const [key, value] of Object.entries(items ?? {})) {
        const name = `${STORE_PREFIX}${key}`;
        const oldText = localStorage.getItem(name);
        const nextText = JSON.stringify(value);
        if (nextText === undefined) throw new TypeError(`Preview storage cannot encode ${key}`);
        if (oldText === nextText) continue;
        changes[key] = { oldValue: oldText == null ? undefined : JSON.parse(oldText), newValue: clone(value) };
        localStorage.setItem(name, nextText);
      }
      dispatchStorage(changes);
      for (const [key, change] of Object.entries(changes)) {
        if (!key.startsWith("ig:run:") || !change.newValue?.draft || JSON.stringify(change.oldValue?.draft ?? null) === JSON.stringify(change.newValue.draft)) continue;
        const nonce = change.newValue.nonce ?? key.slice("ig:run:".length);
        recordRuntimeMessage({ type: "intent-draft", nonce, id: hub.lastDraftIds.get(nonce) ?? "—" }, "storage.local: draft saved");
      }
    },
    async remove(keys) {
      const changes = {};
      for (const key of (Array.isArray(keys) ? keys : [keys])) {
        const name = `${STORE_PREFIX}${key}`;
        const oldText = localStorage.getItem(name);
        if (oldText == null) continue;
        changes[key] = { oldValue: JSON.parse(oldText), newValue: undefined };
        localStorage.removeItem(name);
      }
      dispatchStorage(changes);
    },
    async clear() {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const name = localStorage.key(i);
        if (name?.startsWith(STORE_PREFIX)) keys.push(name.slice(STORE_PREFIX.length));
      }
      return this.remove(keys);
    },
    async getKeys() {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const name = localStorage.key(i);
        if (name?.startsWith(STORE_PREFIX)) keys.push(name.slice(STORE_PREFIX.length));
      }
      return keys;
    },
  };

  const runtime = {
    id: EXTENSION_ID,
    getURL: extensionUrl,
    onMessage: addListenerApi(context.runtimeListeners),
    async sendMessage(message) {
      const sender = { id: EXTENSION_ID, url: location.href, tab: { id: 1 }, frameId: isPanel ? 1 : 0 };
      if (isPanel) {
        // Mirrors background.js: only a panel page in this tab may route ig-to-content to the top frame.
        const accepted = message?.type === "ig-to-content" && sender.id === EXTENSION_ID && sender.url.startsWith(panelBaseUrl()) && sender.tab?.id != null;
        const targets = accepted ? [...hub.contexts].filter((target) => target.role === "page" && target.runtimeListeners.size) : [];
        const payload = message?.msg ?? message;
        const route = !accepted ? "panel -> content: rejected" : targets.length ? "panel -> content: forwarded" : "panel -> content: no listener";
        recordRuntimeMessage(message, payload?.type === "intent-draft" ? `draft ${route}` : route);
        for (const target of targets) dispatchRuntime(target, message, sender);
      } else {
        // Content-script notifications use runtime.sendMessage and target only their own panel id.
        const targetId = message?.id;
        const targets = [];
        for (const target of [...hub.contexts]) {
          if (target.role !== "panel" || target.disposed) continue;
          const targetUrl = new URL(target.window.location.href);
          if (targetUrl.searchParams.get("id") === targetId && target.runtimeListeners.size) targets.push(target);
        }
        recordRuntimeMessage(message, targets.length ? "page -> panel: delivered" : "page -> panel: no target");
        for (const target of targets) dispatchRuntime(target, message, sender);
      }
      return undefined;
    },
  };
  const previewApi = {
    runtime,
    extension: { inIncognitoContext: false },
    storage: { local: storageLocal, onChanged: addListenerApi(context.storageListeners) },
  };
  globalThis.chrome = previewApi;
  globalThis.browser = previewApi;
  window.addEventListener("pagehide", () => { context.disposed = true; hub.contexts.delete(context); }, { once: true });
  window.__intentGalaxyPreview = { role: context.role, api: previewApi };

  if (isPanel) return;

  const DEMO_GOAL = "家裡適合買洗碗機嗎？";
  const DEMO_NONCE = "a1b2c3d4";
  async function seedDemo({ reset = false } = {}) {
    const { DISHWASHER_GALAXY } = await import("/extension/samples/dishwasher.js");
    const runKey = `ig:run:${DEMO_NONCE}`;
    if (reset) {
      await storageLocal.clear();
      localStorage.removeItem("ig-layout");
    } else if ((await storageLocal.get(runKey))[runKey]) {
      return;
    }
    await storageLocal.set({
      "ig:locale": (await storageLocal.get("ig:locale"))["ig:locale"] ?? "zh-Hant",
      [runKey]: {
        nonce: DEMO_NONCE,
        goal: DEMO_GOAL,
        status: "done",
        startedAt: Date.now() - 60_000,
        sentAt: Date.now() - 60_000,
        owner: "intent-galaxy-preview",
        beat: Date.now(),
        unsent: false,
        analysis: DISHWASHER_GALAXY,
        picks: { baseKey: DISHWASHER_GALAXY.recommend?.key ?? null, overrides: {} },
      },
    });
  }

  const editor = document.getElementById("prompt-textarea");
  editor.value = ""; // Avoid browser form restoration triggering the quiet “new question” path on first open.
  const fireEditorInput = () => editor.dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("reset-demo")?.addEventListener("click", async () => {
    await seedDemo({ reset: true });
    location.reload();
  });
  document.getElementById("fill-prompt")?.addEventListener("click", () => {
    editor.value = DEMO_GOAL;
    fireEditorInput();
    editor.focus();
  });
  document.getElementById("clear-prompt")?.addEventListener("click", () => {
    editor.value = "";
    fireEditorInput();
    editor.focus();
  });
  document.getElementById("switch-conversation")?.addEventListener("click", (event) => {
    const token = document.getElementById("run-token");
    const other = token.textContent.trim() !== "[ig:a1b2c3d4]";
    token.textContent = other ? "[ig:a1b2c3d4]" : "[ig:feedface]";
    document.getElementById("thread-title").textContent = other ? DEMO_GOAL : "另一段示意對話";
    document.getElementById("history-title").textContent = other ? DEMO_GOAL : "另一段示意對話";
    event.currentTarget.textContent = other ? "模擬切換另一段對話" : "返回洗碗機示範對話";
  });
  document.getElementById("toggle-temporary")?.addEventListener("click", (event) => {
    const url = new URL(location.href);
    if (url.searchParams.has("temporary-chat")) url.searchParams.delete("temporary-chat");
    else url.searchParams.set("temporary-chat", "1");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    event.currentTarget.textContent = url.searchParams.has("temporary-chat") ? "暫時對話模式：開啟" : "切換暫時對話模式";
  });
  document.getElementById("send")?.addEventListener("click", () => {
    const text = editor.value.trim();
    if (!text) return;
    const article = document.createElement("article");
    article.className = "message user";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "●";
    article.append(bubble, avatar);
    document.getElementById("thread").append(article);
    editor.value = "";
    fireEditorInput();
    document.getElementById("thread-scroll").scrollTop = document.getElementById("thread-scroll").scrollHeight;
  });

  window.__intentGalaxyPreview = {
    role: context.role,
    api: previewApi,
    resetDemo: () => seedDemo({ reset: true }),
    clearStorage: () => storageLocal.clear(),
  };
  seedDemo()
    .then(() => import("/extension/content.js"))
    .catch((error) => {
      console.error("Could not initialize the local Intent Galaxy preview:", error);
      const note = document.querySelector(".local-note");
      if (note) note.textContent = `預覽初始化失敗：${error.message}`;
    });
})();
