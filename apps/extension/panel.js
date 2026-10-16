// 擴充功能星系面板（iframe 內，擴充功能來源）：生成或載入星系，Enter 後把 AST 交回 content script。
// 生成來源：本機 CLI 在線就交給它（不出現在對話裡）；否則請當前網頁的 AI 在對話中產生星系 JSON。
import "./galaxy/apps/web/galaxy-overlay.js";
import { SAMPLE_GALAXY } from "./galaxy/apps/web/sample-galaxy.js";
import { SPAWNER_SYSTEM_PROMPT, buildSpawnerUserMessage } from "./galaxy/libs/epistemic/src/prompt.js";

const api = globalThis.browser ?? globalThis.chrome;
const CLI = "http://127.0.0.1:4787";
const id = new URLSearchParams(location.search).get("id");
const galaxy = document.querySelector("intent-galaxy-overlay");
const card = document.getElementById("card");
const toParent = (msg) => parent.postMessage({ ...msg, id }, "*");
let site = "", goal = "";

async function cliAlive() {
  try { return (await fetch(`${CLI}/api/galaxy`, { signal: AbortSignal.timeout(800) })).ok; } catch { return false; }
}

/** 面板中央的說明卡；actions 為 [label, handler, primary?]。 */
function showCard(title, body, actions = []) {
  card.querySelector("h2").textContent = title;
  card.querySelector("p").innerHTML = body;
  const row = card.querySelector(".actions");
  row.replaceChildren(...actions.map(([label, fn, primary]) => {
    const b = Object.assign(document.createElement("button"), { type: "button", textContent: label, className: primary ? "primary" : "" });
    b.addEventListener("click", () => { hideCard(); fn(); });
    return b;
  }));
  card.hidden = false;
  row.querySelector("button")?.focus();
}
function hideCard() { card.hidden = true; galaxy.focus(); }
const showSample = () => galaxy.setGalaxy(SAMPLE_GALAXY, { goal: "示範：多版型、多主題系統" });

async function spawnViaCli() {
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

function spawnViaChat() {
  galaxy.beginStream(goal);
  galaxy.showMessage("已送出提示詞，等待 AI 回覆…");
  const prompt = `${SPAWNER_SYSTEM_PROMPT}\n\n---\n\n${buildSpawnerUserMessage(goal)}\nPut the JSON in one \`\`\`json code block.`;
  toParent({ type: "intent-chat-spawn", prompt });
}

async function open(text, host) {
  goal = text; site = host;
  galaxy.focus();
  if (!goal) {
    showCard("先寫下你要決定的事",
      "在這個網頁的輸入框打一句目標（例如「前端團隊要不要導入 monorepo」），再點 iG 或按 <kbd>Cmd/Ctrl+Shift+G</kbd>。<br>星系會把它拆成 4 位專家的 12 個觀點與 3 條方案，你選好後，方案會填回輸入框。",
      [["看示範星系", showSample]]);
    return;
  }
  if (await cliAlive()) return spawnViaCli().catch((err) => galaxy.applyStreamEvent({ t: "error", code: "network", detail: err.message }));
  showCard(`用 ${site} 生成星系`,
    `目標：<b>${goal.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</b><br><br>`
      + "我會在這個對話送出一段分析提示詞，AI 回覆後自動畫出星系（通常 1–3 分鐘）。<br>"
      + "<small>不想讓提示詞出現在對話裡？在終端機執行 <code>npx @stephen.taipei/intent-galaxy</code>，改用本機的 AI 生成。</small>",
    [["開始生成", spawnViaChat, true], ["看示範星系", showSample]]);
}

api.runtime.onMessage.addListener((msg) => {
  if (msg?.id !== id) return;
  if (msg.type === "ig-open") open(msg.goal ?? "", msg.site ?? "這個 AI");
  if (msg.type === "ig-progress") galaxy.showMessage(`等待 AI 在對話中回覆星系 JSON · 已 ${msg.elapsedSec} 秒`);
  if (msg.type === "ig-galaxy" && !galaxy.setGalaxy(msg.analysis, { goal })) galaxy.showMessage("AI 回覆的星系格式不完整，請再生成一次");
  if (msg.type === "ig-chat-error") galaxy.showMessage(msg.detail);
});

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
