// 擴充功能星系面板（iframe 內，擴充功能來源）：生成或載入星系，Enter 後把 AST 交回 content script。
// 生成來源：本機 CLI 在線就交給它（不出現在對話裡）；否則請當前網頁的 AI 在對話中產生星系 JSON。
// 重新打開時：這個對話已生成（或正在生成）的星系優先顯示，不必重問。
import "./galaxy/apps/web/galaxy-overlay.js";
import { SPAWNER_SYSTEM_PROMPT, buildSpawnerUserMessage } from "./galaxy/libs/epistemic/src/prompt.js";
import { DISHWASHER_GALAXY } from "./samples/dishwasher.js";
import { SWEET_SOUR_GALAXY } from "./samples/sweet-sour.js";
import { SAMPLE_GALAXY } from "./galaxy/apps/web/sample-galaxy.js";

const api = globalThis.browser ?? globalThis.chrome;
const CLI = "http://127.0.0.1:4787";
const id = new URLSearchParams(location.search).get("id");
const galaxy = document.querySelector("intent-galaxy-overlay");
const card = document.getElementById("card");
const strip = document.getElementById("strip");
// 傳給所在分頁的 content script：經 background.js 轉送的擴充功能內部訊息（window.postMessage 會被網頁自己的腳本讀到）。
const toParent = (msg) => api.runtime.sendMessage({ type: "ig-to-content", id, msg }).catch?.(() => {});
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
// 一般人用的示範題目（npm 網頁版保留工程題目）。
const DEMOS = [
  { label: "示範：怎麼挑洗碗機", goal: "如何挑選洗碗機？", galaxy: DISHWASHER_GALAXY },
  { label: "示範：酸甜又不負擔的食物", goal: "我喜歡又甜又酸的食物，但又不想吃了會讓身體太有負擔，有哪些選擇適合我？", galaxy: SWEET_SOUR_GALAXY },
  { label: "示範：多主題前端架構", goal: "多版型、多主題的前端系統該怎麼設計？", galaxy: SAMPLE_GALAXY },
];
// 網頁版提示詞的第一行：先消除模型「自己開程式驗證字數」的動機（ChatGPT Pro 曾因此跑 200 多秒），再禁止呼叫工具。
const RUNTIME_HEADER = "[RUNTIME] Reply with plain text only. Do not call any tool (code, browsing, canvas). Do not verify or count; the client validates and repairs all limits. Approximate lengths are acceptable. Start output immediately with the fenced block.";
const SLOW_HINT_SEC = 20;
let site = "", goal = "", waiting = false;
let nonce = "";        // 目前顯示的生成工作的識別碼（放棄時只取消這一個）
let cliBusy = false;   // 本機 CLI 生成中：縮小、換對話都保留面板
let shown = "idle";    // 畫面狀態：idle | card | waiting | galaxy | failed
let pendingGoal = "";  // 本機 CLI 生成中，輸入框又打了新問題：生成完再問要不要換
let lastFailed = "";   // 目前顯示的失敗原因（同樣的通知不重畫，貼上 JSON 的卡片才不會被關掉）
const CLI_GOAL_MAX = 4000; // 本機 CLI 接受的問題長度上限（apps/cli/src/server.mjs）
const dropped = new Set(); // 改用本機生成後不再理會的網頁 run（之後又明確回到它時移除）
/** 面板改為顯示某個網頁 run：記下識別碼，它的通知也重新接收。 */
const bindNonce = (n) => { nonce = n ?? ""; dropped.delete(nonce); };

async function cliAlive() {
  try { return (await fetch(`${CLI}/api/galaxy`, { signal: AbortSignal.timeout(800) })).ok; } catch { return false; }
}
/** 本機 CLI 最近一次生成的星系（不分對話；只在問題相同或使用者明確要求時才拿來用）。 */
async function cliLatest() {
  try { const cur = await (await fetch(`${CLI}/api/galaxy`, { signal: AbortSignal.timeout(800) })).json(); return cur?.analysis ? cur : null; } catch { return null; }
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
  if (shown !== "waiting" && shown !== "galaxy") shown = "card";
  row.querySelector("button")?.focus();
}
function hideCard() { card.hidden = true; galaxy.focus(); }

const demoActions = () => DEMOS.map((d) => [d.label, () => { setStrip(""); showGalaxy(d.galaxy, d.goal); }]);
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
const resetJob = () => { toParent({ type: "intent-reset", nonce }); nonce = ""; waiting = false; shown = "idle"; setStrip(""); };

function showGalaxy(analysis, g, { adopt = false, galaxyId = 0 } = {}) {
  // 先驗證：格式不對時保留原本的等待／失敗提示條與按鈕。
  if (!galaxy.setGalaxy(analysis, { goal: g || goal, galaxyId })) { galaxy.showMessage("星系格式不完整，請再生成一次，或貼上修正後的 JSON"); return false; }
  hideCard();
  goal = g || goal;
  waiting = false;
  shown = "galaxy";
  lastFailed = "";
  setStrip("");
  galaxy.showMessage(goal ? `這是「${goal.slice(0, 40)}」的星系。按 1／2／3 選方案，再按 Enter 填回對話框。` : "");
  if (adopt) toParent({ type: "intent-adopt", analysis, goal, nonce });
  return true;
}

/** 手動貼上：AI 已回覆但讀不到時（例如網站把長程式碼區塊收合），複製 JSON 貼進來。 */
let lastPaste = "";
function showPaste() {
  showCard("貼上 AI 回覆的 JSON",
    "在對話裡找到 AI 回覆的 JSON 程式碼區塊，按它的「複製」按鈕，再貼到下面。<textarea id=\"paste\" placeholder=\"在這裡貼上（Cmd/Ctrl+V）\"></textarea>",
    [["載入星系", () => {
      const text = lastPaste = document.getElementById("paste")?.value ?? "";
      const at = text.indexOf("{");
      let obj = null;
      try { obj = at >= 0 ? JSON.parse(text.slice(at, text.lastIndexOf("}") + 1)) : null; } catch { obj = null; }
      if (obj && showGalaxy(obj, goal, { adopt: true })) { lastPaste = ""; nonce = ""; return; }
      if (obj && shown === "galaxy") return; // 格式不完整：showGalaxy 已在畫面上說明，原本的星系保留
      showCard("讀不到星系", "貼上的內容不是完整的星系 JSON。請確認從 { 開頭複製到最後的 }。", [["再貼一次", showPaste, true]]);
    }, true], ["取消", () => {}]]);
  const area = document.getElementById("paste");
  // 保留上次貼的內容方便修改；全選起來，直接貼上新內容就會取代它。
  if (area) { area.value = lastPaste; area.focus(); area.select(); }
}

function showCliFailed() {
  shown = "failed";
  setStrip("⚠ 本機 AI 沒有產出可用的星系", [["重試（本機）", () => { setStrip(""); spawnViaCli().catch(cliError); }], ["改用網頁上的 AI", () => confirmChat()]]);
}
const cliError = (err) => { galaxy.applyStreamEvent({ t: "error", code: "network", detail: err.message }); galaxy.showMessage(err.message); };

async function spawnViaCli() {
  // 太長的問題本機 CLI 不收（會一直回 400）：改用網頁上的 AI。
  if (goal.length > CLI_GOAL_MAX) return confirmChat();
  cliBusy = true;
  toParent({ type: "intent-busy", busy: true });
  // 換成本機生成：前一個網頁 run 的提示條與識別碼不再適用，它之後的通知也不再顯示（不會蓋掉本機的星系）。
  if (nonce) dropped.add(nonce);
  nonce = ""; waiting = false; lastFailed = ""; pendingGoal = "";
  setStrip("");
  try {
    galaxy.beginStream(goal);
    shown = "waiting";
    const res = await fetch(`${CLI}/api/spawn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal }) });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error ? `本機 CLI 拒絕：${err.error}` : `本機 CLI 回應 ${res.status}`);
    }
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
        // 本機生成的結果由本機 CLI 保存（不寫進網站或擴充功能的記錄）；同一個問題再按 iG 時從 /api/galaxy 帶回來。
        if (ev.t === "repaired" && galaxy.analysis) shown = "galaxy";
      }
    }
  } finally {
    cliBusy = false;
    if (shown === "waiting") showCliFailed();
    toParent({ type: "intent-busy", busy: false });
    // 生成期間輸入框換了問題：現在才問要不要換。
    const next = pendingGoal;
    pendingGoal = "";
    if (next && next !== goal) askNewQuestion(next);
  }
}

let slowShown = false;
function waitingStrip(elapsedSec, unsent) {
  const giveUp = ["放棄等待", () => { resetJob(); galaxy.showMessage("已放棄等待。可以在輸入框打新的問題，再按 iG。"); }];
  if (unsent) return setStrip("📨 提示詞已放進輸入框：請按對話框的送出鍵，送出後這裡會自動接著等", [giveUp]);
  slowShown = elapsedSec >= SLOW_HINT_SEC;
  setStrip(`⋯ 等待 ${site} 回覆 · ${fmt(elapsedSec)}`,
    [["已回覆但沒出現？貼上 JSON", showPaste], ...(slowShown ? [["先看示範", () => showDemoWhileWaiting(elapsedSec)]] : []), giveUp],
    slowShown ? "超過 20 秒還沒有回覆：可能選了深度推理模型（如 Pro、Thinking），常要 5–15 分鐘。可以按右上角「—」縮小面板，完成時 iG 按鈕會顯示 ✓；想快一點，下次先在網頁上切換到一般模型。" : "");
}
/** 等待中先看示範：提示條保留「回到等待」；真的回覆到了會直接換成它的星系。 */
function showDemoWhileWaiting(elapsedSec) {
  const g = goal, started = Date.now() - elapsedSec * 1000;
  waiting = false;
  demoActions()[0][1]();
  setStrip(`⋯ 「${g.slice(0, 20)}」仍在生成，完成時會自動換成它的星系`, [["回到等待", () => startWaiting(g, Math.round((Date.now() - started) / 1000))]]);
}
function startWaiting(g, elapsedSec = 0, unsent = false) {
  hideCard();
  goal = g || goal;
  waiting = true;
  shown = "waiting";
  galaxy.beginStream(goal);
  galaxy.showMessage(unsent ? "等你按下送出…" : "等待 AI 在對話中回覆星系 JSON…");
  waitingUnsent = unsent;
  waitingStrip(elapsedSec, unsent);
}
let waitingUnsent = false;
function updateWaiting(elapsedSec, unsent) {
  // 狀態改變（送出了、超過 20 秒）時重建一次提示條；其他時候只更新秒數，按鈕才點得到。
  if (unsent !== waitingUnsent || (!unsent && !slowShown && elapsedSec >= SLOW_HINT_SEC)) {
    waitingUnsent = unsent;
    if (!unsent) galaxy.showMessage("等待 AI 在對話中回覆星系 JSON…");
    return waitingStrip(elapsedSec, unsent);
  }
  const t = strip.querySelector(".t");
  if (t && !unsent) t.textContent = `⋯ 等待 ${site} 回覆 · ${fmt(elapsedSec)}`;
}
function showFailed(detail) {
  // 同樣的失敗再通知一次（例如另一個分頁也讀到）：不重畫，使用者開著的「貼上 JSON」卡片不會被關掉。
  if (shown === "failed" && detail === lastFailed && !card.hidden) return;
  hideCard();
  waiting = false;
  shown = "failed";
  lastFailed = detail;
  galaxy.showMessage(detail);
  // 沒有對應的工作（例如提示詞根本沒放進輸入框）時，不提供「放棄」，避免刪到這個對話其他的記錄。
  // 「重新生成」先只開確認卡片；按「開始生成」才取消舊的 run，按「返回」一切照舊（還能貼上 JSON）。
  const actions = [["重新生成", () => confirmChat([["返回", () => {}]], () => { if (nonce) resetJob(); })], ["貼上 JSON", showPaste]];
  if (nonce) actions.push(["放棄", resetJob]);
  setStrip(`⚠ ${detail}`, actions);
}

function spawnViaChat() {
  const prompt = `${RUNTIME_HEADER}\n\n${SPAWNER_SYSTEM_PROMPT}\n\n---\n\n${buildSpawnerUserMessage(goal)}\n`
    + "Put the JSON in one ```json code block.";
  toParent({ type: "intent-chat-spawn", prompt, goal });
  startWaiting(goal, 0, true);
}

function confirmChat(extra = [], beforeStart = null) {
  const g = goal; // 卡片開著時畫面可能換成別的星系：送出的永遠是卡片上寫的這個問題
  showCard(`用 ${site} 生成星系`,
    `目標：<b>${esc(goal)}</b><br><br>`
      + "我會把一段分析提示詞放進這個對話的輸入框，<b>由你按送出</b>；AI 回覆後自動畫出星系。對話裡的提示詞和 JSON 會自動折疊成一行，點一下可以展開。<br>"
      + "<small>⏱ 一般模型約 1–3 分鐘；推理型高階模型（如 ChatGPT Pro、Thinking、Gemini Pro）可能要 5–15 分鐘，想快一點可以先在網頁上切換到一般模型。<br>"
      + "不想讓提示詞出現在對話裡？在終端機執行 <code>npx @stephen.taipei/intent-galaxy</code>，改用本機的 AI 生成。</small>",
    [["開始生成", () => { beforeStart?.(); goal = g; spawnViaChat(); }, true], ...extra, ...demoActions()]);
}

/** 這個對話已生成的星系，附「重新生成」（例如換了模型想再問一次）。 */
function showDone(job) {
  if (!showGalaxy(job.analysis, job.goal)) return;
  bindNonce(job.nonce);
  // 「回到星系」只關掉卡片：星系一直在下面，已選的方案和節點立場都保留。
  setStrip("這是這個對話已生成的星系", [["重新生成", () => { const g = goal; confirmChat([["回到星系", () => { goal = g; }]]); }]]);
}

/** 新問題：本機 CLI 在線就直接生成（ask 時先確認），否則請網頁上的 AI。 */
async function generate(back = [], ask = false, reuse = true) {
  if (!(await cliAlive())) return confirmChat(back);
  // 本機 CLI 最近生成的就是這個問題（例如鎖定後想再調整）：直接顯示，不重跑。
  const cur = reuse ? await cliLatest() : null;
  if (cur && cur.goal === goal && showGalaxy(cur.analysis, cur.goal, { galaxyId: cur.id })) {
    return setStrip("這是本機已生成的星系", [["重新生成", () => { const g = goal; generate([["回到星系", () => { goal = g; }]], true, false); }]]);
  }
  if (goal.length > CLI_GOAL_MAX) return confirmChat(back);
  if (!ask) return spawnViaCli().catch(cliError);
  const g = goal;
  showCard("用本機 AI 生成星系", `目標：<b>${esc(g)}</b><br><br>本機的 Intent Galaxy 正在執行，會用它生成（不會出現在對話裡）。`,
    [["開始生成", () => { goal = g; spawnViaCli().catch(cliError); }, true], ...back, ["改用網頁上的 AI", () => { goal = g; confirmChat(back); }]]);
}

async function open({ goal: text = "", site: host = "這個 AI", job = null, pageGalaxy = null, reopen = false }) {
  site = host;
  galaxy.focus();
  // 縮小後叫回來：保留畫面（勾選的方案、等待進度）；只有出現新問題或狀態已改變時才換。
  if (reopen) {
    // 本機 CLI 生成中：先記下新問題，生成完再問。
    if (cliBusy) {
      if (text && text !== goal) { pendingGoal = text; galaxy.showMessage("本機正在生成上一個問題；完成後會問你要不要換成輸入框的新問題。"); }
      return;
    }
    if (job?.status === "done" && (shown === "waiting" || shown === "idle") && (!text || text === job.goal)) return showDone(job);
    // 這個對話還有問題在等（例如先看示範時）：輸入框換了新問題，先決定要繼續等還是放棄；沒換就保留目前畫面。
    if (job?.status === "waiting" && shown !== "waiting") {
      if (text && text !== job.goal && text !== goal) return askWhileWaiting(job, text);
      if (shown !== "idle") return;
    }
    if (shown === "galaxy" || shown === "waiting" || shown === "card") {
      if (!text || text === goal) return;
      if (shown === "card") { goal = text; return generate([], true); }
      if (shown === "waiting") return askWhileWaiting(job ?? { goal, nonce }, text);
      return askNewQuestion(text);
    }
  }
  goal = text;
  bindNonce(job?.nonce);
  const newGoal = goal && goal !== job?.goal;
  // 1. 這個對話已有結果或正在生成：直接接續（輸入框打了新目標時，改問要不要用新目標重來）。
  if (job && !newGoal) {
    if (job.status === "done" && job.analysis) return showDone(job);
    if (job.status === "waiting") return startWaiting(job.goal, job.elapsedSec, job.unsent);
    if (job.status === "failed") { goal = job.goal; galaxy.beginStream(goal); return showFailed(job.detail); }
  }
  // 上一個問題還在等，輸入框又打了新問題：先決定要繼續等還是放棄。
  if (job?.status === "waiting" && newGoal) return askWhileWaiting(job, goal);
  if (goal) return generate(job?.status === "done" && job.analysis ? [["回到上一個星系", () => showDone(job)]] : [], reopen);
  // 2. 頁面上已經有 AI 回覆過的星系（例如換了裝置或清掉記錄）：直接載入。
  if (pageGalaxy) return showGalaxy(pageGalaxy, pageGalaxy.core?.decision?.replace(/^你真正在決定的是[:：]\s*/, "") ?? "");
  // 3. 本機 CLI 有最近生成的星系：不分對話，所以不自動顯示，只提供按鈕（可能是別的網站或 Claude Code 的決策）。
  const cur = await cliLatest();
  const local = cur ? [[`載入本機最近的星系：${cur.goal.slice(0, 20)}${cur.goal.length > 20 ? "…" : ""}`, () => showGalaxy(cur.analysis, cur.goal, { galaxyId: cur.id })]] : [];
  showCard("先寫下你要決定的事",
    "在這個網頁的輸入框打一句你正在猶豫的事（例如「如何挑選洗碗機？」），再點 iG 或按 <kbd>Cmd/Ctrl+Shift+G</kbd>。<br>"
      + "星系會把它拆成 4 種角度的 12 個觀點和 3 條方案，你選好後，方案會填回輸入框讓 AI 照著回答。",
    [...demoActions(), ...local]);
}

/** 星系開著時輸入框換了問題：問要不要用新問題重來；「回到」只關卡片，原本的星系與已選方案都保留。 */
function askNewQuestion(text) {
  const currentGoal = goal;
  showCard("輸入框有新的問題", `「${esc(text)}」<br><br>要用它重新生成星系，還是留在目前這個星系？`,
    [["用新問題生成", () => { goal = text; generate([["回到剛才的星系", () => { goal = currentGoal; }]]); }, true], ["留在目前的星系", () => {}]]);
}

function askWhileWaiting(job, newText) {
  showCard("上一個問題還在等 AI 回覆",
    `正在等：<b>${esc(job.goal)}</b><br>AI 回完之前，網站通常不接受新訊息。要繼續等，還是放棄它、改問新的問題？`,
    // 卡片開著時 AI 回完會換成星系或失敗並關掉卡片；按得到「繼續等待」就表示還在等（除非在別的分頁取消了）。
    [["繼續等待", () => { if (!job.nonce || nonce === job.nonce) { bindNonce(job.nonce ?? nonce); startWaiting(job.goal, job.elapsedSec ?? 0, job.unsent); } }, true],
      ["放棄並改問新問題", () => { resetJob(); goal = newText; generate(); }]]);
}

api.runtime.onMessage.addListener((msg) => {
  if (msg?.id !== id || msg.type === "ig-to-content" || (msg.nonce && dropped.has(msg.nonce))) return;
  if (msg.type === "ig-open") open(msg);
  if (msg.type === "ig-started") bindNonce(msg.nonce);
  if (msg.type === "ig-progress" && waiting) { if (msg.nonce) nonce = msg.nonce; updateWaiting(msg.elapsedSec, !!msg.unsent); }
  if (msg.type === "ig-reopen" && msg.job) { nonce = msg.job.nonce; startWaiting(msg.job.goal, msg.job.elapsedSec, msg.job.unsent); }
  if (msg.type === "ig-galaxy") showGalaxy(msg.analysis, msg.goal);
  if (msg.type === "ig-reset" && (!msg.nonce || msg.nonce === nonce)) { waiting = false; nonce = ""; shown = "idle"; lastFailed = ""; setStrip(""); galaxy.showMessage("這個生成已在其他分頁取消。可以在輸入框打問題，再按 iG。"); }
  if (msg.type === "ig-chat-error") {
    if (msg.nonce !== undefined && msg.failed) nonce = msg.nonce;
    if (msg.failed || !waiting) showFailed(msg.detail);
    else galaxy.showMessage(msg.detail);
  }
});

galaxy.addEventListener("intent-lock", async (e) => {
  // 本機 CLI 生成的星系（有 galaxyId）由 CLI 簽署 .intent.lock.json；被拒（例如沒有採納 Q4 節點）就留在面板顯示原因。
  // 網頁 AI、貼上、示範的星系與 CLI 所在的專案無關，不寫鎖檔。一律附上 analysis：CLI 重啟後舊 id 找不到時照樣能簽。
  if (e.detail.galaxyId && await cliAlive()) {
    const body = { ...e.detail, analysis: galaxy.analysis, goal: galaxy.goal };
    const res = await fetch(`${CLI}/api/lock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);
    if (res && !res.ok) { galaxy.showMessage(`鎖檔未寫入：${res.error}`); return; }
  }
  toParent({ type: "intent-lock", ast: e.detail.ast, goal: galaxy.goal || goal });
});
galaxy.addEventListener("intent-close", () => toParent({ type: "intent-close" }));
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyG") { e.preventDefault(); toParent({ type: "intent-close" }); }
});
