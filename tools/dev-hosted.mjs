import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHosted } from './build-hosted.mjs';
import { handleRequest } from '../apps/hosted/server/index.mjs';

const directory = buildHosted();
const port = Number(process.env.HOSTED_PORT || 4318);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local port.');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain' };
const origin = `http://127.0.0.1:${port}`;
const env = { APP_MODE: 'demo', ASSETS: { async fetch(request) {
  const url = new URL(request.url), relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  let file = path.resolve(directory, relative || 'index.html');
  if (!file.startsWith(directory + path.sep)) return new Response('Not found', { status: 404 });
  try { if (!(await fs.stat(file)).isFile()) file = path.join(directory, 'index.html'); }
  catch { if (path.extname(file)) return new Response('Not found', { status: 404 }); file = path.join(directory, 'index.html'); }
  return new Response(await fs.readFile(file), { headers: { 'Content-Type': `${types[path.extname(file)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' } });
} } };
const pending = new Set();
const server = http.createServer(async (incoming, outgoing) => {
  try {
    // Refuse rebinding or non-loopback Host; this runner cannot serve a hosted demo.
    if (incoming.headers.host !== `127.0.0.1:${port}`) { outgoing.writeHead(403); outgoing.end('Loopback host only'); return; }
    const method = incoming.method;
    const request = new Request(new URL(incoming.url, origin), { method, headers: incoming.headers,
      ...(!['GET', 'HEAD'].includes(method) ? { body: incoming, duplex: 'half' } : {}) });
    const response = await handleRequest(request, env, { waitUntil(p) { pending.add(p); p.finally(() => pending.delete(p)); } });
    const headers = Object.fromEntries(response.headers); const cookies = response.headers.getSetCookie(); if (cookies.length) headers['set-cookie'] = cookies;
    outgoing.writeHead(response.status, headers); outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch { outgoing.writeHead(500); outgoing.end('Local preview failed'); }
});
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ owner: 'intent-galaxy-hosted-preview', startedAt: new Date().toISOString(), pid: process.pid, ppid: process.ppid,
  command: `node ${fileURLToPath(import.meta.url)}`, cwd: process.cwd(), url: origin, mode: 'synthetic-demo', externalCalls: false })));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(async () => { await Promise.allSettled([...pending]); process.exit(0); });
  server.closeAllConnections();
});
