// 127.0.0.1 星系伺服器：託管 apps/web、即時剝除型別後提供 libs/*.ts、星系狀態中樞（SSE）、/api/spawn 與 /api/lock。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import { spawnGalaxy } from "./spawn.mjs";

const MAX_BODY = 1 << 20;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".ts": "text/javascript; charset=utf-8" };

// stripTypeScriptTypes 在 Node 22/24 仍標示 experimental；只靜音這一則警告，其他警告照常輸出。
const emitWarning = process.emitWarning;
process.emitWarning = function (warning, ...rest) {
  if (String(warning?.message ?? warning).includes("stripTypeScriptTypes")) return;
  return emitWarning.call(process, warning, ...rest);
};

export function createGalaxyServer({ root, lockDir = process.cwd(), log = () => {} }) {
  let current = null, seq = 0, port = 0;
  const sseClients = new Set();
  const lockWaiters = new Map();
  const stripped = new Map();

  const hub = {
    get url() { return `http://127.0.0.1:${port}`; },
    publish(goal, analysis, findings, source) {
      current = { id: ++seq, goal, analysis, findings, source, at: new Date().toISOString() };
      const data = `event: galaxy\ndata: ${JSON.stringify(current)}\n\n`;
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
      if (req.method === "GET" && url.pathname === "/api/galaxy") return json(res, 200, current ?? { id: 0, analysis: null });
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
        const { goal } = await readJson(req);
        if (typeof goal !== "string" || !goal.trim() || goal.length > 4000) return json(res, 400, { ok: false, error: "goal must be a non-empty string (<= 4000 chars)" });
        res.writeHead(200, { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" });
        log(`spawn: ${goal.slice(0, 60)}`);
        const abort = spawnGalaxy(goal, (ev) => {
          if (ev.t === "repaired") ev.galaxyId = hub.publish(goal, ev.analysis, ev.findings, "spawn").id;
          if (res.writableEnded) return;
          res.write(JSON.stringify(ev) + "\n");
          // spawnGalaxy 只在收尾時送出 repaired 或 error。
          if (ev.t === "repaired" || ev.t === "error") res.end();
        });
        res.on("close", () => abort());
        return;
      }
      if (url.pathname === "/api/lock") {
        const lock = await readJson(req);
        if (typeof lock.ast !== "string") return json(res, 400, { ok: false, error: "ast is required" });
        const record = {
          schema: "intent-lock/0.1",
          locked_at: new Date().toISOString(),
          goal: current?.goal ?? "",
          galaxy_id: lock.galaxyId ?? null,
          base: lock.baseKey ?? null,
          overrides: lock.overrides ?? {},
          decision: current?.analysis?.core ?? null,
          ast: lock.ast,
        };
        const file = path.join(lockDir, ".intent.lock.json");
        fs.writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
        log(`locked → ${file}`);
        const waiter = lockWaiters.get(lock.galaxyId) ?? (current && lockWaiters.get(current.id));
        if (waiter) waiter(record);
        return json(res, 200, { ok: true, file });
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
