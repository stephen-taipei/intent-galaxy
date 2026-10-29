const enc = new TextEncoder();
const dec = new TextDecoder();

export class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

export function assert(condition, status, code, message) {
  if (!condition) throw new HttpError(status, code, message);
}

export const randomToken = (size = 32) => base64url(crypto.getRandomValues(new Uint8Array(size)));
export function base64url(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function fromBase64url(text) { return Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - text.length % 4) % 4)), c => c.charCodeAt(0)); }
export async function sha256(text) { return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)))); }
export async function hmac(secret, text, hex = false) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
  return hex ? Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('') : base64url(bytes);
}
export function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
export async function signObject(value, secret) {
  const body = base64url(enc.encode(JSON.stringify(value)));
  return `${body}.${await hmac(secret, body)}`;
}
export async function readSigned(value, secret, now = Date.now()) {
  try {
    const [body, signature, extra] = (value || '').split('.');
    if (extra || !body || !constantTimeEqual(signature, await hmac(secret, body))) return null;
    const data = JSON.parse(dec.decode(fromBase64url(body)));
    return data.expiresAt > now ? data : null;
  } catch { return null; }
}
export async function seal(value, secret) {
  const keyBytes = await crypto.subtle.digest('SHA-256', enc.encode(`intent-galaxy-session-v1:${secret}`));
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value))));
  return `${base64url(iv)}.${base64url(encrypted)}`;
}
export async function unseal(value, secret) {
  try {
    const [iv, ciphertext] = value.split('.');
    const keyBytes = await crypto.subtle.digest('SHA-256', enc.encode(`intent-galaxy-session-v1:${secret}`));
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
    return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64url(iv) }, key, fromBase64url(ciphertext))));
  } catch { throw new HttpError(401, 'session_expired', 'Please sign in again.'); }
}

export function cookies(request) {
  return Object.fromEntries((request.headers.get('Cookie') || '').split(';').map(part => {
    const at = part.indexOf('=');
    return at < 0 ? [] : [part.slice(0, at).trim(), part.slice(at + 1).trim()];
  }).filter(item => item.length === 2));
}
export function cookieName(name, mode) { return `${mode === 'demo' ? 'ig-' : '__Host-ig-'}${name}`; }
export function setCookie(name, value, mode, maxAge) {
  return `${cookieName(name, mode)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${mode === 'demo' ? '' : '; Secure'}`;
}
export function isLoopback(hostname) { return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname); }
export function modeFor(request, env) {
  if (env.APP_MODE === 'demo') {
    assert(isLoopback(new URL(request.url).hostname), 503, 'demo_loopback_only', 'Demo mode is available on loopback only.');
    return 'demo';
  }
  return env.APP_MODE === 'live' ? 'live' : 'disabled';
}
export function signingSecret(env, mode) {
  if (mode === 'demo') return 'loopback-only-synthetic-demo-secret-v1';
  assert(typeof env.SESSION_SECRET === 'string' && env.SESSION_SECRET.length >= 32, 503, 'configuration_required', 'Session configuration is incomplete.');
  return env.SESSION_SECRET;
}
export function sameOrigin(request, origin) {
  assert(request.headers.get('Origin') === origin, 403, 'origin_rejected', 'A same-origin request is required.');
  const site = request.headers.get('Sec-Fetch-Site');
  assert(!site || site === 'same-origin' || site === 'none', 403, 'origin_rejected', 'A same-origin request is required.');
}
export async function readText(request, maximum = 262144) {
  const length = Number(request.headers.get('Content-Length') || 0);
  assert(length <= maximum, 413, 'body_too_large', 'The request is too large.');
  if (!request.body) return '';
  const reader = request.body.getReader(); let size = 0; const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new HttpError(413, 'body_too_large', 'The request is too large.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const output = new Uint8Array(size); let at = 0;
  for (const chunk of chunks) { output.set(chunk, at); at += chunk.length; }
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(output); }
  catch { throw new HttpError(400, 'invalid_encoding', 'The request must use valid UTF-8.'); }
}
export async function readJson(request, maximum) {
  assert(/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || ''), 415, 'json_required', 'Send application/json.');
  try { return JSON.parse(await readText(request, maximum)); }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'invalid_json', 'The JSON request is invalid.'); }
}
export function onlyKeys(value, allowed) {
  assert(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(k => allowed.includes(k)), 400, 'invalid_request', 'The request contains unsupported fields.');
}
export function idempotencyKey(request) {
  const key = request.headers.get('Idempotency-Key') || '';
  assert(/^[A-Za-z0-9._:-]{8,128}$/.test(key), 400, 'idempotency_required', 'Supply an Idempotency-Key of 8–128 safe characters.');
  return key;
}
export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Cookie, Origin', ...extraHeaders } });
}
export function safeError(error) {
  if (error instanceof HttpError) return json({ error: { code: error.code, message: error.message } }, error.status);
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 && typeof error.code === 'string') return json({ error: { code: error.code, message: 'The request could not be accepted.' } }, error.status);
  return json({ error: { code: 'service_unavailable', message: 'The service is temporarily unavailable.' } }, 503);
}
