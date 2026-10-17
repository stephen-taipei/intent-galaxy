// 擴充功能星系面板（iframe 內，擴充功能來源）：生成或載入星系，Enter 後把 AST 交回 content script。
// 生成來源：本機 CLI 在線就交給它（不出現在對話裡）；否則請當前網頁的 AI 在對話中產生星系 JSON。
// 重新打開時：這個對話已生成（或正在生成）的星系優先顯示，不必重問。
import "./galaxy/apps/web/galaxy-overlay.js";
import { SPAWNER_SYSTEM_PROMPT, buildSpawnerUserMessage } from "./galaxy/libs/epistemic/src/prompt.js";
import { t, ready, isRtl, onLocaleChange, loadSample } from "./galaxy/apps/web/i18n.js";
const setDocLang = (code) => { document.documentElement.lang = code; document.documentElement.dir = isRtl() ? "rtl" : "ltr"; };
ready.then(setDocLang);
onLocaleChange(setDocLang);

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
  // label／goal 是翻譯鍵：語系載入後才用 t() 取字串；星系內容載入目前語系的版本（loadSample）。
  { label: "pn.demoDishwasherLabel", goal: "pn.demoDishwasherGoal", base: new URL("./samples/dishwasher", import.meta.url).href },
  { label: "pn.demoSweetSourLabel", goal: "pn.demoSweetSourGoal", base: new URL("./samples/sweet-sour", import.meta.url).href },
  { label: "pn.demoFrontendLabel", goal: "pn.demoFrontendGoal", base: new URL("./galaxy/apps/web/sample-galaxy", import.meta.url).href },
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

let demoShown = null; // 目前顯示的示範題目：切換語系時換成該語系的版本
const showDemo = async (d) => { const g = await loadSample(d.base); setStrip(""); if (showGalaxy(g, t(d.goal))) demoShown = d; };
const demoActions = () => DEMOS.map((d) => [t(d.label), () => showDemo(d)]);
onLocaleChange(() => { if (demoShown && shown === "galaxy" && card.hidden) showDemo(demoShown); });
const fmt = (sec) => sec >= 60 ? t("pn.minSec", { m: Math.floor(sec / 60), s: sec % 60 }) : t("pn.sec", { s: sec });

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
  if (!galaxy.setGalaxy(analysis, { goal: g || goal, galaxyId })) { galaxy.showMessage(t("pn.galaxyIncomplete")); return false; }
  demoShown = null;
  hideCard();
  goal = g || goal;
  waiting = false;
  shown = "galaxy";
  lastFailed = "";
  setStrip("");
  galaxy.showMessage(goal ? t("pn.galaxyShown", { goal: goal.slice(0, 40) }) : "");
  if (adopt) toParent({ type: "intent-adopt", analysis, goal, nonce });
  return true;
}

/** 手動貼上：AI 已回覆但讀不到時（例如網站把長程式碼區塊收合），複製 JSON 貼進來。 */
let lastPaste = "";
function showPaste() {
  showCard(t("pn.pasteTitle"),
    `${t("pn.pasteBody")}<textarea id="paste" placeholder="${esc(t("pn.pastePlaceholder"))}"></textarea>`,
    [[t("pn.loadGalaxy"), () => {
      const text = lastPaste = document.getElementById("paste")?.value ?? "";
      const at = text.indexOf("{");
      let obj = null;
      try { obj = at >= 0 ? JSON.parse(text.slice(at, text.lastIndexOf("}") + 1)) : null; } catch { obj = null; }
      if (obj && showGalaxy(obj, goal, { adopt: true })) { lastPaste = ""; nonce = ""; return; }
      if (obj && shown === "galaxy") return; // 格式不完整：showGalaxy 已在畫面上說明，原本的星系保留
      showCard(t("pn.pasteFailedTitle"), t("pn.pasteFailedBody"), [[t("pn.pasteAgain"), showPaste, true]]);
    }, true], [t("pn.cancel"), () => {}]]);
  const area = document.getElementById("paste");
  // 保留上次貼的內容方便修改；全選起來，直接貼上新內容就會取代它。
  if (area) { area.value = lastPaste; area.focus(); area.select(); }
}

function showCliFailed() {
  shown = "failed";
  setStrip(t("pn.cliFailedStrip"), [[t("pn.retryLocal"), () => { setStrip(""); spawnViaCli().catch(cliError); }], [t("pn.useWebAi"), () => confirmChat()]]);
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
      throw new Error(err?.error ? t("pn.cliRejected", { detail: err.error }) : t("pn.cliStatus", { status: res.status }));
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
  const giveUp = [t("pn.giveUpWaiting"), () => { resetJob(); galaxy.showMessage(t("pn.gaveUpMsg")); }];
  if (unsent) return setStrip(t("pn.promptPlacedStrip"), [giveUp]);
  slowShown = elapsedSec >= SLOW_HINT_SEC;
  setStrip(t("pn.waitingStrip", { site, time: fmt(elapsedSec) }),
    [[t("pn.repliedPasteJson"), showPaste], ...(slowShown ? [[t("pn.viewDemoFirst"), () => showDemoWhileWaiting(elapsedSec)]] : []), giveUp],
    slowShown ? t("pn.slowNote") : "");
}
/** 等待中先看示範：提示條保留「回到等待」；真的回覆到了會直接換成它的星系。 */
async function showDemoWhileWaiting(elapsedSec) {
  const g = goal, started = Date.now() - elapsedSec * 1000;
  waiting = false;
  await showDemo(DEMOS[0]);
  demoShown = null; // 提示條要保留「回到等待」，切換語系時不重載示範
  setStrip(t("pn.stillGenerating", { goal: g.slice(0, 20) }), [[t("pn.backToWaiting"), () => startWaiting(g, Math.round((Date.now() - started) / 1000))]]);
}
function startWaiting(g, elapsedSec = 0, unsent = false) {
  hideCard();
  goal = g || goal;
  waiting = true;
  shown = "waiting";
  galaxy.beginStream(goal);
  galaxy.showMessage(unsent ? t("pn.waitingForSend") : t("pn.waitingForAi"));
  waitingUnsent = unsent;
  waitingStrip(elapsedSec, unsent);
}
let waitingUnsent = false;
function updateWaiting(elapsedSec, unsent) {
  // 狀態改變（送出了、超過 20 秒）時重建一次提示條；其他時候只更新秒數，按鈕才點得到。
  if (unsent !== waitingUnsent || (!unsent && !slowShown && elapsedSec >= SLOW_HINT_SEC)) {
    waitingUnsent = unsent;
    if (!unsent) galaxy.showMessage(t("pn.waitingForAi"));
    return waitingStrip(elapsedSec, unsent);
  }
  const line = strip.querySelector(".t");
  if (line && !unsent) line.textContent = t("pn.waitingStrip", { site, time: fmt(elapsedSec) });
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
  const actions = [[t("pn.regenerate"), () => confirmChat([[t("pn.back"), () => {}]], () => { if (nonce) resetJob(); })], [t("pn.pasteJson"), showPaste]];
  if (nonce) actions.push([t("pn.giveUp"), resetJob]);
  setStrip(t("pn.failedStrip", { detail }), actions);
}

function spawnViaChat() {
  const prompt = `${RUNTIME_HEADER}\n\n${SPAWNER_SYSTEM_PROMPT}\n\n---\n\n${buildSpawnerUserMessage(goal)}\n`
    + "Put the JSON in one ```json code block.\n"
    // 結尾再提醒一次：長提示詞的開頭容易被模型忽略。
    + "[RUNTIME] Again: answer in plain text only. Do not run code or any tool; the client validates and repairs all limits.";
  toParent({ type: "intent-chat-spawn", prompt, goal });
  startWaiting(goal, 0, true);
}

function confirmChat(extra = [], beforeStart = null) {
  const g = goal; // 卡片開著時畫面可能換成別的星系：送出的永遠是卡片上寫的這個問題
  showCard(t("pn.confirmChatTitle", { site }),
    t("pn.confirmChatGoal", { goal: esc(goal) })
      + t("pn.confirmChatHow")
      + t("pn.confirmChatNote", { cmd: "npx @stephen.taipei/intent-galaxy" }),
    [[t("pn.startGenerating"), () => { beforeStart?.(); goal = g; spawnViaChat(); }, true], ...extra, ...demoActions()]);
}

/** 這個對話已生成的星系，附「重新生成」（例如換了模型想再問一次）。 */
function showDone(job) {
  if (!showGalaxy(job.analysis, job.goal)) return;
  bindNonce(job.nonce);
  // 「回到星系」只關掉卡片：星系一直在下面，已選的方案和節點立場都保留。
  setStrip(t("pn.doneStrip"), [[t("pn.regenerate"), () => { const g = goal; confirmChat([[t("pn.backToGalaxy"), () => { goal = g; }]]); }]]);
}

/** 新問題：本機 CLI 在線就直接生成（ask 時先確認），否則請網頁上的 AI。 */
/** 新問題：預設請這個網頁上的 AI（它看得到這段對話的前文）；本機 CLI 在線時多一個「改用本機 AI」按鈕。 */
async function generate(back = [], _ask = false, reuse = true) {
  const local = await cliAlive();
  // 本機 CLI 最近生成的就是這個問題（例如鎖定後想再調整）：直接顯示，不重跑。
  const cur = local && reuse ? await cliLatest() : null;
  if (cur && cur.goal === goal && showGalaxy(cur.analysis, cur.goal, { galaxyId: cur.id })) {
    return setStrip(t("pn.localDoneStrip"), [[t("pn.regenerate"), () => { const g = goal; generate([[t("pn.backToGalaxy"), () => { goal = g; }]], true, false); }]]);
  }
  const g = goal;
  const viaCli = local && goal.length <= CLI_GOAL_MAX
    ? [[t("pn.useLocalAi"), () => { goal = g; spawnViaCli().catch(cliError); }]] : [];
  return confirmChat([...back, ...viaCli]);
}

async function open({ goal: text = "", site: host = t("pn.thisAi"), job = null, pageGalaxy = null, reopen = false }) {
  site = host;
  galaxy.focus();
  // 縮小後叫回來：保留畫面（勾選的方案、等待進度）；只有出現新問題或狀態已改變時才換。
  if (reopen) {
    // 本機 CLI 生成中：先記下新問題，生成完再問。
    if (cliBusy) {
      if (text && text !== goal) { pendingGoal = text; galaxy.showMessage(t("pn.cliBusyMsg")); }
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
  if (goal) return generate(job?.status === "done" && job.analysis ? [[t("pn.backToPrevGalaxy"), () => showDone(job)]] : [], reopen);
  // 2. 頁面上已經有 AI 回覆過的星系（例如換了裝置或清掉記錄）：直接載入。
  if (pageGalaxy) return showGalaxy(pageGalaxy, pageGalaxy.core?.decision?.replace(/^你真正在[決决]定的是[:：]\s*/, "") ?? "");
  // 3. 本機 CLI 有最近生成的星系：不分對話，所以不自動顯示，只提供按鈕（可能是別的網站或 Claude Code 的決策）。
  const cur = await cliLatest();
  const local = cur ? [[t("pn.loadLocalLatest", { goal: `${cur.goal.slice(0, 20)}${cur.goal.length > 20 ? "…" : ""}` }), () => showGalaxy(cur.analysis, cur.goal, { galaxyId: cur.id })]] : [];
  showCard(t("pn.introTitle"),
    t("pn.introBody"),
    [...demoActions(), ...local]);
}

/** 星系開著時輸入框換了問題：問要不要用新問題重來；「回到」只關卡片，原本的星系與已選方案都保留。 */
function askNewQuestion(text) {
  const currentGoal = goal;
  showCard(t("pn.newQuestionTitle"), t("pn.newQuestionBody", { text: esc(text) }),
    [[t("pn.generateWithNew"), () => { goal = text; generate([[t("pn.backToPrevious"), () => { goal = currentGoal; }]]); }, true], [t("pn.stayOnCurrent"), () => {}]]);
}

function askWhileWaiting(job, newText) {
  showCard(t("pn.stillWaitingTitle"),
    t("pn.stillWaitingBody", { goal: esc(job.goal) }),
    // 卡片開著時 AI 回完會換成星系或失敗並關掉卡片；按得到「繼續等待」就表示還在等（除非在別的分頁取消了）。
    [[t("pn.keepWaiting"), () => { if (!job.nonce || nonce === job.nonce) { bindNonce(job.nonce ?? nonce); startWaiting(job.goal, job.elapsedSec ?? 0, job.unsent); } }, true],
      [t("pn.giveUpAskNew"), () => { resetJob(); goal = newText; generate(); }]]);
}

// 監聽器立即註冊（不漏掉早到的訊息），但等語系載入後才處理；promise 依序執行，訊息順序不變。
api.runtime.onMessage.addListener((msg) => { ready.then(() => onRuntimeMessage(msg)); });
function onRuntimeMessage(msg) {
  if (msg?.id === id && msg.type === "ig-layout") { galaxy.setLayout({ [msg.toggle]: "toggle" }, { user: msg.toggle === "summary" }); return; }
  if (msg?.id !== id || msg.type === "ig-to-content" || (msg.nonce && dropped.has(msg.nonce))) return;
  if (msg.type === "ig-open") open(msg);
  if (msg.type === "ig-started") bindNonce(msg.nonce);
  if (msg.type === "ig-progress" && waiting) { if (msg.nonce) nonce = msg.nonce; updateWaiting(msg.elapsedSec, !!msg.unsent); }
  if (msg.type === "ig-reopen" && msg.job) { nonce = msg.job.nonce; startWaiting(msg.job.goal, msg.job.elapsedSec, msg.job.unsent); }
  if (msg.type === "ig-galaxy") showGalaxy(msg.analysis, msg.goal);
  if (msg.type === "ig-reset" && (!msg.nonce || msg.nonce === nonce)) { waiting = false; nonce = ""; shown = "idle"; lastFailed = ""; setStrip(""); galaxy.showMessage(t("pn.cancelledElsewhere")); }
  if (msg.type === "ig-chat-error") {
    if (msg.nonce !== undefined && msg.failed) nonce = msg.nonce;
    if (msg.failed || !waiting) showFailed(msg.detail);
    else galaxy.showMessage(msg.detail);
  }
}

galaxy.addEventListener("intent-lock", async (e) => {
  // 本機 CLI 生成的星系（有 galaxyId）由 CLI 簽署 .intent.lock.json；被拒（例如沒有採納 Q4 節點）就留在面板顯示原因。
  // 網頁 AI、貼上、示範的星系與 CLI 所在的專案無關，不寫鎖檔。一律附上 analysis：CLI 重啟後舊 id 找不到時照樣能簽。
  if (e.detail.galaxyId && await cliAlive()) {
    const body = { ...e.detail, analysis: galaxy.analysis, goal: galaxy.goal };
    const res = await fetch(`${CLI}/api/lock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);
    if (res && !res.ok) { galaxy.showMessage(t("pn.lockNotWritten", { detail: res.error })); return; }
  }
  toParent({ type: "intent-lock", ast: e.detail.ast, goal: galaxy.goal || goal });
});
galaxy.addEventListener("intent-close", () => toParent({ type: "intent-close" }));
// 版面（方案側欄、方案卡列）：記在擴充功能自己的 localStorage，下次打開照舊；狀態回報給標題列按鈕。
const LAYOUT_KEY = "ig-layout";
const savedLayout = (() => { try { return JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? "null"); } catch { return null; } })();
if (savedLayout) galaxy.restoreLayout({ summary: savedLayout.summary ?? null, cards: savedLayout.cards !== false });
toParent({ type: "intent-layout", ...galaxy.layout }); // 標題列按鈕的初始狀態
galaxy.addEventListener("intent-layout", (e) => {
  const { summary, cards, summaryPref } = e.detail;
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ summary: summaryPref, cards })); } catch { /* 不能存就不存 */ }
  toParent({ type: "intent-layout", summary, cards });
});
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyG") { e.preventDefault(); toParent({ type: "intent-close" }); }
});
