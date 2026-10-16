// 工具列圖示：點擊即在目前分頁展開／收合星系面板。
// 分頁若在安裝擴充功能前就已開啟（content script 尚未注入），先注入再開啟（host_permissions 只含支援的 AI 網站）。
const api = globalThis.browser ?? globalThis.chrome;
const SITES = ["claude.ai", "chatgpt.com", "grok.com", "gemini.google.com", "chat.deepseek.com", "chat.qwen.ai", "www.perplexity.ai", "copilot.microsoft.com", "chat.mistral.ai", "www.kimi.com"];
const supported = (url) => { try { const u = new URL(url); return u.protocol === "https:" && SITES.includes(u.hostname); } catch { return false; } };

api.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  if (!supported(tab.url ?? "")) {
    await api.action.setBadgeText({ tabId: tab.id, text: "?" });
    await api.action.setTitle({ tabId: tab.id, title: `Intent Galaxy 只在這些 AI 網站運作：${SITES.join("、")}` });
    return;
  }
  const target = { tabId: tab.id };
  const [{ result: mounted } = {}] = await api.scripting.executeScript({ target, func: () => typeof window.__intentGalaxyToggle === "function" });
  if (!mounted) await api.scripting.executeScript({ target, files: ["content.js"] });
  await api.scripting.executeScript({ target, func: () => window.__intentGalaxyToggle?.() });
});

// 面板（擴充功能 iframe）→ 它所在分頁的 content script。走擴充功能內部訊息：window.postMessage 會被網頁自己的腳本讀到。
const PANEL_URL = api.runtime.getURL("panel.html");
api.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "ig-to-content" || sender.id !== api.runtime.id || !sender.url?.startsWith(PANEL_URL) || sender.tab?.id == null) return;
  api.tabs.sendMessage(sender.tab.id, msg, { frameId: 0 }).catch(() => {});
});
