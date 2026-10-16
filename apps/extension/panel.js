// 擴充功能星系面板（iframe 內，擴充功能來源）：生成或載入星系，Enter 後把 AST 交回 content script。
// 生成來源：本機 CLI 在線就交給它（不出現在對話裡）；否則請當前網頁的 AI 在對話中產生星系 JSON。
// 重新打開時：這個對話已生成（或正在生成）的星系優先顯示，不必重問。
import "./galaxy/apps/web/galaxy-overlay.js";
import { SPAWNER_SYSTEM_PROMPT, buildSpawnerUserMessage } from "./galaxy/libs/epistemic/src/prompt.js";
import { DISHWASHER_GALAXY } from "./samples/dishwasher.js";
import { SWEET_SOUR_GALAXY } from "./samples/sweet-sour.js";

const api = globalThis.browser ?? globalThis.chrome;
const CLI = "http://127.0.0.1:4787";
const id = new URLSearchParams(location.search).get("id");
const galaxy = document.querySelector("intent-galaxy-overlay");
const card = document.getElementById("card");
const strip = document.getElementById("strip");
const toParent = (msg) => parent.postMessage({ ...msg, id }, "*");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
// 一般人用的示範題目（npm 網頁版保留工程題目）。
const DEMOS = [
  { label: "示範：怎麼挑洗碗機", goal: "如何挑選洗碗機？", galaxy: DISHWASHER_GALAXY },
  { label: "示範：酸甜又不負擔的食物", goal: "我喜歡又甜又酸的食物，但又不想吃了會讓身體太有負擔，有哪些選擇適合我？", galaxy: SWEET_SOUR_GALAXY },
];
let site = "", goal = "", waiting = false;

async function cliAlive() {
  try { return (await fetch(`${CLI}/api/galaxy`, { signal: AbortSignal.timeout(800) })).ok; } catch { return false; }
}

/** 面板中央的說明卡；actions 為 [label, handler, primary?]。 */
function showCard(title, body, actions = []) {
  card.querySelector("h2").textContent = title;
  card.querySelector(".body").innerHTML = body;
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

const demoActions = () => DEMOS.map((d) => [d.label, () => { goal = d.goal; setStrip(""); galaxy.setGalaxy(d.galaxy, { goal: d.goal }); }]);
const fmt = (sec) => sec >= 60 ? `${Math.floor(sec / 60)} 分 ${sec % 60} 秒` : `${sec} 秒`;

/** 頂部提示條：text 為說明文字；buttons 為 [label, handler]。只在內容改變時重建，按鈕才點得到、焦點不會跑掉。 */
function setStrip(text, buttons = [], note = "") {
  strip.hidden = !text;
  strip.replaceChildren();
  if (!text) return;
  const line = Object.assign(document.createElement("span"), { className: "t", textContent: text });
  strip.append(line, ...buttons.map(([label, fn]) => {
    const b = Object.assign(document.createElement("button"), { type: "button", textContent: label });
    b.addEventListener("click", fn);
    return b;
  }));
  if (note) strip.append(Object.assign(document.createElement("small"), { textContent: note }));
}
const resetJob = () => { toParent({ type: "intent-reset" }); waiting = false; setStrip(""); };

function showGalaxy(analysis, g, { adopt = false } = {}) {
  goal = g || goal;
  waiting = false;
  setStrip("");
  if (!galaxy.setGalaxy(analysis, { goal })) { galaxy.showMessage("AI 回覆的星系格式不完整，請再生成一次，或貼上修正後的 JSON"); return false; }
  galaxy.showMessage(goal ? `這是「${goal.slice(0, 40)}」的星系。按 1／2／3 選方案，再按 Enter 填回對話框。` : "");
  if (adopt) toParent({ type: "intent-adopt", analysis, goal });
  return true;
}

/** 手動貼上：AI 已回覆但讀不到時（例如網站把長程式碼區塊收合），複製 JSON 貼進來。 */
function showPaste() {
  showCard("貼上 AI 回覆的 JSON",
    "在對話裡找到 AI 回覆的 JSON 程式碼區塊，按它的「複製」按鈕，再貼到下面。<textarea id=\"paste\" placeholder=\"在這裡貼上（Cmd/Ctrl+V）\"></textarea>",
    [["載入星系", () => {
      const text = document.getElementById("paste")?.value ?? "";
      const at = text.indexOf("{");
      let obj = null;
      try { obj = at >= 0 ? JSON.parse(text.slice(at, text.lastIndexOf("}") + 1)) : null; } catch { obj = null; }
      if (!obj || !showGalaxy(obj, goal, { adopt: true })) showCard("讀不到星系", "貼上的內容不是完整的星系 JSON。請確認從 { 開頭複製到最後的 }。", [["再貼一次", showPaste, true]]);
    }, true], ["取消", () => {}]]);
  document.getElementById("paste")?.focus();
}

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
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
      if (!line.trim()) continue;
      const ev = JSON.parse(line);
      galaxy.applyStreamEvent(ev);
      // 本機 CLI 生成完成：記成這個對話的結果，重新打開時直接顯示，不必再跑一次。
      if (ev.t === "repaired" && galaxy.analysis) toParent({ type: "intent-adopt", analysis: galaxy.analysis, goal });
    }
  }
}

function startWaiting(g, elapsedSec = 0) {
  goal = g || goal;
  waiting = true;
  galaxy.beginStream(goal);
  galaxy.showMessage("等待 AI 在對話中回覆星系 JSON…");
  setStrip(`⋯ 等待 ${site} 回覆 · ${fmt(elapsedSec)}`, [["已回覆但沒出現？貼上 JSON", showPaste], ["放棄等待", () => { resetJob(); galaxy.showMessage("已放棄等待。可以在輸入框打新的問題，再按 iG。"); }]],
    "推理型模型（如 Pro、Thinking）常要 5–15 分鐘。可以按右上角「—」縮小面板，完成時 iG 按鈕會顯示 ✓。");
}
function updateWaiting(elapsedSec, unsent) {
  const t = strip.querySelector(".t");
  if (t) t.textContent = unsent ? "⚠ 提示詞還在輸入框裡：請在對話框按一下送出" : `⋯ 等待 ${site} 回覆 · ${fmt(elapsedSec)}`;
}
function showFailed(detail) {
  waiting = false;
  galaxy.showMessage(detail);
  setStrip(`⚠ ${detail}`, [["重新生成", () => { resetJob(); confirmChat(); }], ["貼上 JSON", showPaste], ["放棄", resetJob]]);
}

function spawnViaChat() {
  const prompt = `${SPAWNER_SYSTEM_PROMPT}\n\n---\n\n${buildSpawnerUserMessage(goal)}\n`
    + "Answer directly in this reply: do not run code, call tools, or browse the web. Put the JSON in one ```json code block.";
  toParent({ type: "intent-chat-spawn", prompt, goal });
  startWaiting(goal, 0);
}

function confirmChat(extra = []) {
  showCard(`用 ${site} 生成星系`,
    `目標：<b>${esc(goal)}</b><br><br>`
      + "我會在這個對話送出一段分析提示詞，AI 回覆後自動畫出星系。<br>"
      + "<small>⏱ 一般模型約 1–3 分鐘；推理型高階模型（如 ChatGPT Pro、Thinking、Gemini Pro）可能要 5–15 分鐘，想快一點可以先在網頁上切換到一般模型。<br>"
      + "不想讓提示詞出現在對話裡？在終端機執行 <code>npx @stephen.taipei/intent-galaxy</code>，改用本機的 AI 生成。</small>",
    [["開始生成", spawnViaChat, true], ...extra, ...demoActions()]);
}

async function open({ goal: text = "", site: host = "這個 AI", job = null, pageGalaxy = null }) {
  goal = text; site = host;
  galaxy.focus();
  const newGoal = goal && goal !== job?.goal;
  // 1. 這個對話已有結果或正在生成：直接接續（輸入框打了新目標時，改問要不要用新目標重來）。
  if (job && !newGoal) {
    if (job.status === "done" && job.analysis) {
      showGalaxy(job.analysis, job.goal);
      // 已有結果時仍可重問同一題（例如換了模型）。
      setStrip("這是這個對話已生成的星系", [["重新生成", () => confirmChat([["回到星系", () => showGalaxy(job.analysis, job.goal)]])]]);
      return;
    }
    if (job.status === "waiting") return startWaiting(job.goal, job.elapsedSec);
    if (job.status === "failed") { goal = job.goal; galaxy.beginStream(goal); return showFailed(job.detail); }
  }
  // 上一個問題還在等，輸入框又打了新問題：先決定要繼續等還是放棄。
  if (job?.status === "waiting" && newGoal) {
    return showCard("上一個問題還在等 AI 回覆",
      `正在等：<b>${esc(job.goal)}</b><br>AI 回完之前，網站通常不接受新訊息。要繼續等，還是放棄它、改問新的問題？`,
      [["繼續等待", () => startWaiting(job.goal, job.elapsedSec), true], ["放棄並改問新問題", () => { resetJob(); confirmChat(); }]]);
  }
  if (goal) {
    if (await cliAlive()) return spawnViaCli().catch((err) => galaxy.applyStreamEvent({ t: "error", code: "network", detail: err.message }));
    const back = job?.status === "done" && job.analysis ? [["回到上一個星系", () => showGalaxy(job.analysis, job.goal)]] : [];
    return confirmChat(back);
  }
  // 2. 頁面上已經有 AI 回覆過的星系（例如換了裝置或清掉記錄）：直接載入。
  if (pageGalaxy) return showGalaxy(pageGalaxy, pageGalaxy.core?.decision?.replace(/^你真正在決定的是[:：]\s*/, "") ?? "", { adopt: true });
  showCard("先寫下你要決定的事",
    "在這個網頁的輸入框打一句你正在猶豫的事（例如「如何挑選洗碗機？」），再點 iG 或按 <kbd>Cmd/Ctrl+Shift+G</kbd>。<br>"
      + "星系會把它拆成 4 種角度的 12 個觀點和 3 條方案，你選好後，方案會填回輸入框讓 AI 照著回答。",
    demoActions());
}

api.runtime.onMessage.addListener((msg) => {
  if (msg?.id !== id) return;
  if (msg.type === "ig-open") open(msg);
  if (msg.type === "ig-progress" && waiting) updateWaiting(msg.elapsedSec, msg.unsent);
  if (msg.type === "ig-galaxy") showGalaxy(msg.analysis, msg.goal);
  if (msg.type === "ig-chat-error") {
    if (msg.failed || !waiting) showFailed(msg.detail);
    else galaxy.showMessage(msg.detail);
  }
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
