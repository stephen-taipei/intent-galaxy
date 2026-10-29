#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXTENSION_ROOT = path.join(ROOT, "apps/extension");
const FIXTURE_ROOT = path.join(ROOT, "tools/fixtures");
const STATIC_EXTENSIONS = new Set([".html", ".js", ".mjs", ".css", ".svg", ".png", ".json"]);
// The generated apps/extension/galaxy tree is intentionally not built here; expose only these source-module prefixes used by the real panel import graph.
const SOURCE_ROUTES = [
  ["galaxy/apps/web/", path.join(ROOT, "apps/web")],
  ["galaxy/libs/core/", path.join(ROOT, "libs/core")],
  ["galaxy/libs/protocol/", path.join(ROOT, "libs/protocol")],
  ["galaxy/libs/epistemic/", path.join(ROOT, "libs/epistemic")],
];
const STORAGE_CSP = "default-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ts": "text/javascript; charset=utf-8",
};

function parsePort(args) {
  let value = "4789";
  let seen = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--port") {
      if (seen || !args[i + 1]) throw new Error("Usage: node tools/extension-preview.mjs [--port PORT]");
      value = args[++i];
      seen = true;
    } else if (arg.startsWith("--port=")) {
      if (seen) throw new Error("Usage: node tools/extension-preview.mjs [--port PORT]");
      value = arg.slice("--port=".length);
      seen = true;
    } else if (!arg.startsWith("-") && !seen) {
      value = arg;
      seen = true;
    } else {
      throw new Error("Usage: node tools/extension-preview.mjs [--port PORT]");
    }
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port: ${value}`);
  return port;
}

function safeRelative(relative) {
  return typeof relative === "string" && !relative.includes("\0") && !relative.includes("\\")
    && !path.isAbsolute(relative) && !relative.split("/").some((part) => part === ".." || part === "." || part.startsWith("."));
}

function safeFile(base, relative) {
  if (!safeRelative(relative)) return null;
  const absoluteBase = path.resolve(base);
  const target = path.resolve(absoluteBase, relative);
  if (!target.startsWith(`${absoluteBase}${path.sep}`)) return null;
  try {
    const realBase = fs.realpathSync(absoluteBase);
    const realTarget = fs.realpathSync(target);
    if (!realTarget.startsWith(`${realBase}${path.sep}`) || !fs.statSync(realTarget).isFile()) return null;
    return realTarget;
  } catch { return null; }
}

function extensionFile(relative) {
  const direct = safeFile(EXTENSION_ROOT, relative);
  if (direct && STATIC_EXTENSIONS.has(path.extname(direct))) return { file: direct, typeScript: false };

  for (const [prefix, sourceRoot] of SOURCE_ROUTES) {
    if (!relative.startsWith(prefix)) continue;
    const sourceRelative = relative.slice(prefix.length);
    if (!safeRelative(sourceRelative) || ![".js", ".ts"].includes(path.extname(sourceRelative))) return null;
    let file = safeFile(sourceRoot, sourceRelative);
    if (!file && sourceRelative.endsWith(".js")) file = safeFile(sourceRoot, `${sourceRelative.slice(0, -3)}.ts`);
    if (!file) return null;
    return { file, typeScript: path.extname(file) === ".ts" };
  }
  return null;
}

function readAsset(file, mime) {
  if (!file.typeScript) return mime.startsWith("text/") || mime === "application/json" ? fs.readFileSync(file.file, "utf8") : fs.readFileSync(file.file);
  return stripTypeScriptTypes(fs.readFileSync(file.file, "utf8"), { mode: "strip" });
}

function injectPanelPreview(html) {
  const injection = `<meta http-equiv="Content-Security-Policy" content="${STORAGE_CSP}">\n<script src="/fixture/extension-preview.js"></script>\n`;
  if (!/<head(?:\s[^>]*)?>/i.test(html) || !/<\/head>/i.test(html)) throw new Error("panel.html must contain a head element");
  return html.replace(/<\/head>/i, `${injection}</head>`);
}

function respond(res, status, body = "", mime = "text/plain; charset=utf-8", headOnly = false) {
  res.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": mime,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(headOnly ? undefined : body);
}

function createPreviewServer() {
  return createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") return respond(res, 405, "Method not allowed", undefined, req.method === "HEAD");
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url ?? "/", "http://127.0.0.1").pathname); }
    catch { return respond(res, 400, "Bad request", undefined, req.method === "HEAD"); }
    if (pathname.includes("\0") || pathname.includes("\\")) return respond(res, 400, "Bad request", undefined, req.method === "HEAD");

    let file = null, typeScript = false;
    if (pathname === "/" || pathname === "/fixture/extension-preview.html") {
      file = safeFile(FIXTURE_ROOT, "extension-preview.html");
    } else if (pathname.startsWith("/fixture/")) {
      const relative = pathname.slice("/fixture/".length);
      if (!["extension-preview.html", "extension-preview.js"].includes(relative)) return respond(res, 404, "Not found", undefined, req.method === "HEAD");
      file = safeFile(FIXTURE_ROOT, relative);
    } else if (pathname.startsWith("/extension/")) {
      const relative = pathname.slice("/extension/".length);
      const result = extensionFile(relative);
      if (!result) return respond(res, 404, "Not found", undefined, req.method === "HEAD");
      ({ file, typeScript } = result);
    } else {
      return respond(res, 404, "Not found", undefined, req.method === "HEAD");
    }

    if (!file) return respond(res, 404, "Not found", undefined, req.method === "HEAD");
    const mime = MIME[path.extname(file)] ?? "application/octet-stream";
    try {
      let body = readAsset({ file, typeScript }, mime);
      if (pathname === "/extension/panel.html") body = injectPanelPreview(body);
      res.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": mime,
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        ...(mime.startsWith("text/html") ? { "Content-Security-Policy": STORAGE_CSP } : {}),
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch (error) {
      console.error(`Preview asset error for ${pathname}: ${error.message}`);
      respond(res, 500, "Preview asset error", undefined, req.method === "HEAD");
    }
  });
}

let port;
try { port = parsePort(process.argv.slice(2)); }
catch (error) { console.error(error.message); process.exitCode = 2; }

if (port) {
  const server = createPreviewServer();
  server.on("error", (error) => {
    console.error(`Intent Galaxy preview server failed: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    console.log(JSON.stringify({
      event: "listening",
      pid: process.pid,
      ppid: process.ppid,
      cwd: process.cwd(),
      host: "127.0.0.1",
      port: address.port,
      url: `http://127.0.0.1:${address.port}/`,
    }));
  });
}
