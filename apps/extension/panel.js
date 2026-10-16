// 擴充功能星系面板（iframe 內，擴充功能來源）：向本機 CLI 取得或生成星系，Enter 後把 AST 交回 content script。
import "./galaxy/apps/web/galaxy-overlay.js";
import { SAMPLE_GALAXY } from "./galaxy/apps/web/sample-galaxy.js";

const api = globalThis.browser ?? globalThis.chrome;
const CLI = "http://127.0.0.1:4787";
const id = new URLSearchParams(location.search).get("id");
const galaxy = document.querySelector("intent-galaxy-overlay");
const toParent = (msg) => parent.postMessage({ ...msg, id }, "*");

async function cliAlive() {
  try { return (await fetch(`${CLI}/api/galaxy`, { signal: AbortSignal.timeout(800) })).ok; } catch { return false; }
}

async function spawn(goal) {
  galaxy.beginStream(goal);
  const res = await fetch(`${CLI}/api/spawn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal }) });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, nl); buf = buf.slice(nl + 1); if (line.trim()) galaxy.applyStreamEvent(JSON.parse(line)); }
  }
}

async function open(goal) {
  galaxy.focus();
  if (!(await cliAlive())) {
    galaxy.setGalaxy(SAMPLE_GALAXY, { goal });
    return;
  }
  if (goal) return spawn(goal).catch((err) => galaxy.applyStreamEvent({ t: "error", code: "network", detail: err.message }));
  // 輸入框為空：沿用 CLI 目前的星系（例如 MCP 剛灌入的），沒有就用示範星系。
  const current = await (await fetch(`${CLI}/api/galaxy`)).json();
  galaxy.setGalaxy(current.analysis ?? SAMPLE_GALAXY, { galaxyId: current.id, goal: current.goal });
}

api.runtime.onMessage.addListener((msg) => { if (msg?.type === "ig-open" && msg.id === id) open(msg.goal ?? ""); });

galaxy.addEventListener("intent-lock", async (e) => {
  // CLI 在線時由它簽署 .intent.lock.json；被拒（例如沒有採納 Q4 節點）就留在面板顯示原因。
  if (await cliAlive()) {
    const body = { ...e.detail, analysis: e.detail.galaxyId ? undefined : galaxy.analysis, goal: galaxy.goal };
    const res = await fetch(`${CLI}/api/lock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);
    if (res && !res.ok) { galaxy.showMessage(`鎖檔未寫入：${res.error}`); return; }
  }
  toParent({ type: "intent-lock", ast: e.detail.ast });
});
galaxy.addEventListener("intent-close", () => toParent({ type: "intent-close" }));
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyG") { e.preventDefault(); toParent({ type: "intent-close" }); }
});
