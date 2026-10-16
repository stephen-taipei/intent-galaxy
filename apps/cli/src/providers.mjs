// 多供應商 Stage 1 生成：本機訂閱制 CLI（claude／codex／gemini／agy）與 API（OpenAI 相容、Anthropic）。
// 零依賴：CLI 用 child_process，API 用 fetch + SSE。API key 只從環境變數讀取，永不送進瀏覽器。
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BIN_ENV = (id) => `INTENT_GALAXY_${id.toUpperCase()}_BIN`;

/** kind: "cli" 走本機已登入的 CLI；"openai" 走 OpenAI 相容 /chat/completions；"anthropic" 走 Messages API。 */
export const PROVIDERS = [
  { id: "claude", label: "Claude Code CLI", kind: "cli", bin: "claude", models: ["opus", "sonnet", "haiku"], defaultModel: "opus" },
  { id: "codex", label: "OpenAI Codex CLI", kind: "cli", bin: "codex" },
  { id: "gemini", label: "Google Gemini CLI", kind: "cli", bin: "gemini" },
  { id: "agy", label: "Antigravity CLI (agy)", kind: "cli", bin: "agy", listCmd: ["models"] },
  { id: "anthropic", label: "Anthropic API (Claude)", kind: "anthropic", base: "https://api.anthropic.com/v1", keyEnv: "ANTHROPIC_API_KEY" },
  { id: "openai", label: "OpenAI API (GPT)", kind: "openai", base: "https://api.openai.com/v1", keyEnv: "OPENAI_API_KEY" },
  { id: "google", label: "Google AI API (Gemini)", kind: "openai", base: "https://generativelanguage.googleapis.com/v1beta/openai", keyEnv: "GEMINI_API_KEY" },
  { id: "xai", label: "xAI API (Grok)", kind: "openai", base: "https://api.x.ai/v1", keyEnv: "XAI_API_KEY" },
  { id: "deepseek", label: "DeepSeek API", kind: "openai", base: "https://api.deepseek.com/v1", keyEnv: "DEEPSEEK_API_KEY" },
  { id: "mistral", label: "Mistral API", kind: "openai", base: "https://api.mistral.ai/v1", keyEnv: "MISTRAL_API_KEY" },
  { id: "qwen", label: "Alibaba Qwen API (DashScope)", kind: "openai", base: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", keyEnv: "DASHSCOPE_API_KEY" },
  { id: "moonshot", label: "Moonshot API (Kimi)", kind: "openai", base: "https://api.moonshot.ai/v1", keyEnv: "MOONSHOT_API_KEY" },
  { id: "groq", label: "Groq API (Llama 等)", kind: "openai", base: "https://api.groq.com/openai/v1", keyEnv: "GROQ_API_KEY" },
  { id: "openrouter", label: "OpenRouter（數百種模型）", kind: "openai", base: "https://openrouter.ai/api/v1", keyEnv: "OPENROUTER_API_KEY" },
  { id: "ollama", label: "Ollama（本機開源模型）", kind: "openai", base: "http://127.0.0.1:11434/v1", local: true },
  { id: "custom", label: "自訂 OpenAI 相容端點", kind: "openai", baseEnv: "INTENT_GALAXY_OPENAI_BASE_URL", keyEnv: "INTENT_GALAXY_OPENAI_API_KEY", keyOptional: true },
];
export const PROVIDER_IDS = PROVIDERS.map((p) => p.id);
export const getProvider = (id) => PROVIDERS.find((p) => p.id === id);

const baseOf = (p) => (p.baseEnv ? process.env[p.baseEnv] : process.env[`INTENT_GALAXY_${p.id.toUpperCase()}_BASE_URL`] || p.base)?.replace(/\/+$/, "");
const keyOf = (p) => (p.keyEnv ? process.env[p.keyEnv] : "") || "";
export const binOf = (p) => process.env[BIN_ENV(p.id)] || p.bin;

function onPath(bin) {
  if (path.isAbsolute(bin)) return fs.existsSync(bin);
  const exts = process.platform === "win32" ? (process.env.PATHEXT ?? ".EXE;.CMD").split(";") : [""];
  return (process.env.PATH ?? "").split(path.delimiter).some((dir) => dir && exts.some((ext) => fs.existsSync(path.join(dir, bin + ext))));
}

async function ollamaUp(base) {
  try { return (await fetch(base.replace(/\/v1$/, "") + "/api/tags", { signal: AbortSignal.timeout(600) })).ok; } catch { return false; }
}

/** 偵測每個供應商在這台機器上能否使用（CLI 在 PATH、API key 已設定、Ollama 在線）。 */
export async function detectProviders() {
  return Promise.all(PROVIDERS.map(async (p) => {
    let available = false, hint = "";
    if (p.kind === "cli") { available = onPath(binOf(p)); hint = available ? "" : `找不到 ${binOf(p)} 指令`; }
    else if (p.local) { available = await ollamaUp(baseOf(p)); hint = available ? "" : "Ollama 未啟動"; }
    else if (!baseOf(p)) hint = `請設定 ${p.baseEnv}`;
    else { available = p.keyOptional || !!keyOf(p); hint = available ? "" : `請設定 ${p.keyEnv}`; }
    return { id: p.id, label: p.label, kind: p.kind === "cli" ? "cli" : "api", available, hint, defaultModel: p.defaultModel ?? "" };
  }));
}

/** 預設供應商：INTENT_GALAXY_PROVIDER，否則第一個可用的（claude CLI 優先）。 */
export async function defaultProviderId(detected) {
  const want = process.env.INTENT_GALAXY_PROVIDER;
  if (want && getProvider(want)) return want;
  return (detected ?? await detectProviders()).find((p) => p.available)?.id ?? "claude";
}

const modelCache = new Map();
/** 列出可選模型：API 向 /models 查詢；agy 執行 `agy models`；其他 CLI 回傳建議清單（留空＝CLI 預設模型）。 */
export async function listModels(id) {
  const p = getProvider(id);
  if (!p) return [];
  if (modelCache.has(id)) return modelCache.get(id);
  let models = p.models ?? [];
  try {
    if (p.listCmd) {
      const out = await new Promise((resolve) => execFile(binOf(p), p.listCmd, { timeout: 20_000 }, (err, stdout) => resolve(err ? "" : stdout)));
      models = out.split("\n").map((l) => l.split("\t")[0].trim()).filter((m) => /^[\w.:/@-]+$/.test(m));
    } else if (p.kind !== "cli" && baseOf(p)) {
      const headers = p.kind === "anthropic" ? { "x-api-key": keyOf(p), "anthropic-version": "2023-06-01" } : keyOf(p) ? { Authorization: `Bearer ${keyOf(p)}` } : {};
      const res = await fetch(`${baseOf(p)}/models`, { headers, signal: AbortSignal.timeout(8000) });
      if (res.ok) models = ((await res.json()).data ?? []).map((m) => String(m.id).replace(/^models\//, "")).sort();
    }
  } catch { /* 查不到就讓使用者自己輸入模型 ID */ }
  if (models.length) modelCache.set(id, models);
  return models;
}

/** 非 Claude CLI 沒有 --system-prompt：把 system prompt 與使用者訊息合成一段。 */
const combined = (system, user) => `${system}\n\n---\n\n${user}`;

/**
 * 每個 CLI 的參數。回傳 { args, outFile? }：outFile 存在時以該檔內容為最終輸出（codex 的 stdout 夾雜進度訊息）。
 * 一律以唯讀／規劃模式執行，模型只需要回傳 JSON，不需要動任何檔案。
 */
export function cliArgs(id, { system, user, model, outFile }) {
  const prompt = combined(system, user);
  if (id === "codex") return { args: ["exec", "--skip-git-repo-check", "--ephemeral", "-s", "read-only", "--color", "never", "-o", outFile, ...(model ? ["-m", model] : []), prompt], outFile };
  if (id === "gemini") return { args: ["-p", prompt, "-o", "text", "--approval-mode", "plan", "--skip-trust", ...(model ? ["-m", model] : [])] };
  if (id === "agy") return { args: [...(model ? ["--model", model] : []), "--mode", "plan", "--print-timeout=0", `-p=${prompt}`] };
  throw new Error(`unknown cli provider ${id}`);
}

/** 讀取 SSE：逐行回傳 data 欄位的 JSON。 */
async function* sseEvents(body) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try { yield JSON.parse(data); } catch { /* 略過非 JSON 的 keep-alive */ }
    }
  }
}

/** 以 API 串流生成：onText 收到每段文字，回傳完整文字。錯誤以 Error 拋出（訊息不含 API key）。 */
export async function streamApi(id, { system, user, model, signal, onText }) {
  const p = getProvider(id);
  const base = baseOf(p), key = keyOf(p);
  if (!base) throw new Error(`請設定 ${p.baseEnv}`);
  if (!model) throw new Error(`${p.label} 需要指定模型（網頁右上角的模型欄位，或環境變數 INTENT_GALAXY_MODEL）`);
  let res, text = "";
  if (p.kind === "anthropic") {
    res = await fetch(`${base}/messages`, {
      method: "POST", signal,
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 32000, stream: true, system, messages: [{ role: "user", content: user }] }),
    });
  } else {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST", signal,
      headers: { "content-type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({ model, stream: true, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
  }
  if (!res.ok) throw new Error(`${p.label} 回應 ${res.status}：${(await res.text()).slice(0, 300)}`);
  for await (const ev of sseEvents(res.body)) {
    const chunk = p.kind === "anthropic"
      ? (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" ? ev.delta.text : ev.type === "error" ? Promise.reject(new Error(ev.error?.message ?? "stream error")) : "")
      : ev.choices?.[0]?.delta?.content ?? "";
    if (chunk instanceof Promise) await chunk;
    if (chunk) { text += chunk; onText(chunk); }
  }
  return text;
}
