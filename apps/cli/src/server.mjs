// 127.0.0.1 星系伺服器：託管 apps/web、即時剝除型別後提供 libs/*.ts、星系狀態中樞（SSE）、/api/spawn 與 /api/lock。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import { spawnGalaxy } from "./spawn.mjs";
import { PROVIDER_IDS, defaultProviderId, detectProviders, listModels } from "./providers.mjs";
import { detectHookInstalled, readVerdicts } from "./init-hook.mjs";
import { LockError, buildIntentLock, repairAnalysis, solveGalaxy } from "../../../libs/core/src/index.ts";
import { ARCHETYPE_KEYS, NODE_IDS } from "../../../libs/protocol/src/index.ts";

const MAX_BODY = 1 << 20;
const STANCES = new Set(["include", "exclude", "neutral"]);
const MODEL_RE = /^[\w.:/@-]{1,120}$/;
// withheld_kill（扣留的第四把刀）只留在伺服器與鎖檔，永不送進瀏覽器（spec §3.2 S6、RFC V3 §1.3）。
const omitWithheld = (analysis) => { if (!analysis) return analysis; const { withheld_kill, ...rest } = analysis; return rest; };
const browserSafe = (g) => g && { ...g, analysis: omitWithheld(g.analysis) };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".ts": "text/javascript; charset=utf-8" };

// stripTypeScriptTypes 在 Node 22/24 仍標示 experimental；只靜音這一則警告，其他警告照常輸出。
const emitWarning = process.emitWarning;
process.emitWarning = function (warning, ...rest) {
  if (String(warning?.message ?? warning).includes("stripTypeScriptTypes")) return;
  return emitWarning.call(process, warning, ...rest);
};

export function createGalaxyServer({ root, lockDir = process.cwd(), scopePaths = ["*"], log = () => {} }) {
  // 星系 id 從啟動時間起算：重新啟動後，瀏覽器手上的舊 id 不會剛好對到新程序的另一個星系（例如 MCP 正在等的那個）。
  let current = null, seq = Date.now(), port = 0;
  const galaxies = new Map();
  const sseClients = new Set();
  const lockWaiters = new Map();
  const stripped = new Map();

  const hub = {
    get url() { return `http://127.0.0.1:${port}`; },
    publish(goal, analysis, findings, source) {
      current = { id: ++seq, goal, analysis, findings, source, at: new Date().toISOString() };
      galaxies.set(current.id, current);
      if (galaxies.size > 20) galaxies.delete(galaxies.keys().next().value);
      const data = `event: galaxy\ndata: ${JSON.stringify(browserSafe(current))}\n\n`;
      for (const res of sseClients) res.write(data);
      return { id: current.id, url: `${hub.url}/?galaxy=${current.id}` };
    },
    waitForLock(id, timeoutMs) {
      return new Promise((resolve) => {
        const timer = setTimeout(() => { lockWaiters.delete(id); resolve(null); }, timeoutMs);
        lockWaiters.set(id, (lock) => { clearTimeout(timer); lockWaiters.delete(id); resolve(lock); });
      });
    },
  };

  // DNS rebinding 與跨站請求防護：Host 必須是本機；POST 只接受同源或瀏覽器擴充功能來源。
  const hostOk = (req) => new RegExp(`^(127\\.0\\.0\\.1|localhost):${port}$`).test(req.headers.host ?? "");
  const originOk = (req) => {
    const o = req.headers.origin;
    return !o || o === hub.url || o === `http://localhost:${port}` || /^(chrome|moz)-extension:\/\//.test(o);
  };
  const json = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(body)); };
  const readJson = (req) => new Promise((resolve, reject) => {
    if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return reject(new Error("Content-Type must be application/json"));
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (c) => { body += c; if (body.length > MAX_BODY) { reject(new Error("body too large")); req.destroy(); } });
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
  });

  function serveStatic(res, urlPath) {
    // "/" 對應 apps/web；/libs/* 對應 libs（apps/web 的 ../../libs 相對路徑會解析到這裡）。
    const p = decodeURIComponent(urlPath.slice(1)) || "index.html";
    const rel = p.startsWith("libs/") ? p : `apps/web/${p}`;
    const file = path.resolve(root, rel);
    const allowed = [path.join(root, "apps/web") + path.sep, path.join(root, "libs") + path.sep];
    const ext = path.extname(file);
    if (!allowed.some(dir => file.startsWith(dir)) || !TYPES[ext] || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    let body = fs.readFileSync(file, "utf8");
    if (ext === ".ts") {
      // 瀏覽器只看 MIME，不看副檔名：.ts 直接以 JS 提供，import 路徑不必改寫。
      if (!stripped.has(file)) stripped.set(file, stripTypeScriptTypes(body));
      body = stripped.get(file);
    }
    res.writeHead(200, { "Content-Type": TYPES[ext], "Cache-Control": "no-store" });
    res.end(body);
  }

  const server = http.createServer(async (req, res) => {
    if (!hostOk(req)) { res.writeHead(421); res.end(); return; }
    const url = new URL(req.url, hub.url);
    try {
      if (req.method === "GET" && url.pathname === "/api/galaxy") return json(res, 200, browserSafe(current) ?? { id: 0, analysis: null });
      if (req.method === "GET" && url.pathname === "/api/providers") {
        const providers = await detectProviders();
        return json(res, 200, { providers, defaultProvider: await defaultProviderId(providers) });
      }
      if (req.method === "GET" && url.pathname === "/api/models") {
        const id = url.searchParams.get("provider");
        if (!PROVIDER_IDS.includes(id)) return json(res, 400, { ok: false, error: "unknown provider" });
        return json(res, 200, { models: await listModels(id) });
      }
      if (req.method === "GET" && url.pathname === "/api/events") {
        res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
        res.write(": connected\n\n");
        sseClients.add(res);
        req.on("close", () => sseClients.delete(res));
        return;
      }
      if (req.method === "GET") return serveStatic(res, url.pathname);
      if (req.method !== "POST") { res.writeHead(405); res.end(); return; }
      if (!originOk(req)) return json(res, 403, { ok: false, error: "origin not allowed" });

      if (url.pathname === "/api/spawn") {
        const { goal, provider, model } = await readJson(req);
        if (typeof goal !== "string" || !goal.trim() || goal.length > 4000) return json(res, 400, { ok: false, error: "goal must be a non-empty string (<= 4000 chars)" });
        if (provider !== undefined && !PROVIDER_IDS.includes(provider)) return json(res, 400, { ok: false, error: "unknown provider" });
        if (model !== undefined && model !== "" && !(typeof model === "string" && MODEL_RE.test(model))) return json(res, 400, { ok: false, error: "invalid model id" });
        const chosen = provider ?? await defaultProviderId();
        res.writeHead(200, { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" });
        log(`spawn [${chosen}${model ? " " + model : ""}]: ${goal.slice(0, 60)}`);
        const abort = spawnGalaxy(goal, (ev) => {
          if (ev.t === "repaired") ev = { ...ev, galaxyId: hub.publish(goal, ev.analysis, ev.findings, "spawn").id, analysis: omitWithheld(ev.analysis) };
          if (res.writableEnded) return;
          res.write(JSON.stringify(ev) + "\n");
          // spawnGalaxy 只在收尾時送出 repaired 或 error。
          if (ev.t === "repaired" || ev.t === "error") res.end();
        }, { provider: chosen, model: model || undefined });
        res.on("close", () => abort());
        return;
      }
      if (url.pathname === "/api/lock") {
        // 伺服器自行重算：用登記的完整星系（含 withheld_kill）求解並渲染 AST，不信任瀏覽器送來的 AST。
        const body = await readJson(req);
        const entry = galaxies.get(body.galaxyId);
        let analysis = entry?.analysis, goal = entry?.goal ?? "";
        if (!analysis) {
          const repaired = repairAnalysis(body.analysis);
          if (!repaired.ok) return json(res, 400, { ok: false, error: "找不到這個星系，且請求沒有附上可用的 analysis" });
          analysis = repaired.analysis; goal = typeof body.goal === "string" ? body.goal : "";
        }
        const overrides = new Map(Object.entries(body.overrides ?? {}).filter(([id, st]) => NODE_IDS.includes(id) && STANCES.has(st)));
        const baseKey = ARCHETYPE_KEYS.includes(body.baseKey) ? body.baseKey : null;
        let lock;
        try {
          lock = await buildIntentLock({ analysis, solution: solveGalaxy(analysis, baseKey, overrides), baseKey, goal, scopePaths, hookInstalled: detectHookInstalled(lockDir), recentVerdicts: readVerdicts(lockDir) });
        } catch (e) {
          if (e instanceof LockError) return json(res, 422, { ok: false, error: e.message });
          throw e;
        }
        const file = path.join(lockDir, ".intent.lock.json");
        fs.writeFileSync(file, JSON.stringify(lock, null, 2) + "\n");
        log(`locked ${lock.specHash.slice(0, 12)} → ${file}`);
        // 只解開「同一個星系」的等待：其他來源（例如瀏覽器擴充功能鎖定網頁 AI 生成的星系）不可回覆給正在等的 MCP 呼叫。
        const waiter = lockWaiters.get(body.galaxyId);
        if (waiter) waiter(lock);
        return json(res, 200, { ok: true, file, specHash: lock.specHash, auditDueAt: lock.auditDueAt, ast: lock.payload.ast, hookInstalled: lock.hookInstalled });
      }
      res.writeHead(404); res.end();
    } catch (e) {
      if (!res.headersSent) json(res, 400, { ok: false, error: e.message }); else res.end();
    }
  });

  return {
    hub,
    server,
    listen(preferredPort) {
      return new Promise((resolve, reject) => {
        const tryListen = (p) => {
          const onError = (err) => {
            if (err.code === "EADDRINUSE" && p !== 0) { log(`port ${p} in use, falling back to a random port`); tryListen(0); }
            else reject(err);
          };
          server.once("error", onError);
          server.listen(p, "127.0.0.1", () => { server.off("error", onError); port = server.address().port; resolve(port); });
        };
        tryListen(preferredPort);
      });
    },
  };
}
