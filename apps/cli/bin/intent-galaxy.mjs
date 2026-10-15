#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const WEB_HTML = path.join(ROOT, "apps/web/index.html");

let pendingMcpResolve = null;
const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(WEB_HTML, "utf8")); return;
  }
  if (req.method === "POST" && req.url === "/api/lock") {
    let body = ""; req.on("data", c => body += c);
    req.on("end", () => {
      const data = JSON.parse(body);
      fs.writeFileSync(path.join(process.cwd(), ".intent.lock.json"), JSON.stringify(data, null, 2) + "\n");
      if (pendingMcpResolve) { pendingMcpResolve(data.astMarkdown); pendingMcpResolve = null; }
      res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: true }));
    }); return;
  }
  res.writeHead(404); res.end();
});

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  if (process.argv.includes("--standalone") || process.stdin.isTTY) {
    const url = `http://127.0.0.1:${port}`;
    console.log(`🌌 intent-engineering-galaxy listening on ${url} (127.0.0.1 only, 0 dependencies)`);
    try { execFileSync("open", [url]); } catch (_) {}
  }
});
