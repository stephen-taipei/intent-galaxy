import { HttpError, assert, randomToken, sha256, hmac, signObject, readSigned, seal, unseal, cookies, cookieName, setCookie, signingSecret } from './security.mjs';

const SESSION_SECONDS = 7 * 24 * 3600;
export function authEnabled(env, mode) { return mode === 'demo' || (mode === 'live' && /^https:\/\/[^/]+$/.test(env.SUPABASE_URL || '') && Boolean(env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY && env.SESSION_SECRET?.length >= 32)); }
export async function browserContext(request, env, mode, now) {
  const secret = signingSecret(env, mode);
  const jar = cookies(request);
  let browser = await readSigned(jar[cookieName('browser', mode)], secret, now);
  const headers = [];
  if (!browser || !browser.id || !browser.csrf) {
    browser = { id: randomToken(), csrf: randomToken(), expiresAt: now + 30 * 24 * 3600 * 1000 };
    headers.push(setCookie('browser', await signObject(browser, secret), mode, 30 * 24 * 3600));
  }
  return { browser, headers, jar, secret };
}

async function authFetch(env, fetchImpl, path, body, accessToken) {
  let response;
  try {
    response = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST', headers: { apikey: env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000), redirect: 'error',
    });
  } catch { throw new HttpError(503, 'auth_unavailable', 'Sign-in is temporarily unavailable.'); }
  assert(response.ok, 401, 'session_expired', 'Please sign in again.');
  return response.status === 204 ? null : response.json();
}

export async function loadSession(context, env, mode, repo, fetchImpl, now) {
  const raw = context.jar[cookieName('session', mode)];
  if (!raw || !/^[A-Za-z0-9_-]{43}$/.test(raw)) return null;
  const id = await sha256(raw);
  let session = await repo.sessionGet(id);
  if (!session || Date.parse(session.expiresAt) <= now) return null;
  if (mode === 'live' && Date.parse(session.accessExpiresAt) <= now + 30000) {
    await repo.sessionRefreshClaim(id);
    try {
      const old = await unseal(session.tokens, context.secret);
      const result = await authFetch(env, fetchImpl, 'token?grant_type=refresh_token', { refresh_token: old.refreshToken });
      assert(result?.access_token && result?.refresh_token && result.user?.id === session.user.id, 401, 'session_expired', 'Please sign in again.');
      const accessExpiresAt = new Date(now + Number(result.expires_in || 3600) * 1000).toISOString();
      const tokens = await seal({ accessToken: result.access_token, refreshToken: result.refresh_token }, context.secret);
      await repo.sessionRefresh(id, tokens, accessExpiresAt);
      session = { ...session, tokens, accessExpiresAt };
    } catch (error) { await repo.sessionDelete(id); throw error; }
  }
  return { ...session, id };
}

export async function beginLogin(context, env, mode, origin, repo, now) {
  assert(authEnabled(env, mode), 503, 'auth_disabled', 'Sign-in is not configured.');
  if (mode === 'demo') {
    const id = crypto.randomUUID();
    return establishSession(context, mode, repo, { id, email: 'synthetic-demo@localhost' }, null, now);
  }
  const verifier = randomToken(48); const state = randomToken();
  const flow = await seal({ verifier, state, expiresAt: now + 600000 }, context.secret);
  const target = new URL('/auth/v1/authorize', env.SUPABASE_URL);
  const redirect = new URL('/api/auth/callback', origin); redirect.searchParams.set('flow', state);
  target.searchParams.set('provider', 'google');
  target.searchParams.set('redirect_to', redirect.href);
  target.searchParams.set('code_challenge', await sha256(verifier));
  target.searchParams.set('code_challenge_method', 's256');
  return { location: target.href, cookies: [setCookie('pkce', flow, mode, 600)] };
}

export async function completeLogin(request, context, env, mode, repo, fetchImpl, now) {
  assert(mode === 'live' && authEnabled(env, mode), 503, 'auth_disabled', 'Sign-in is not configured.');
  const flow = await unseal(context.jar[cookieName('pkce', mode)] || '', context.secret);
  const url = new URL(request.url);
  assert(flow.expiresAt > now && flow.state === url.searchParams.get('flow') && url.searchParams.get('code'), 400, 'invalid_auth_flow', 'Restart sign-in.');
  const result = await authFetch(env, fetchImpl, 'token?grant_type=pkce', { auth_code: url.searchParams.get('code'), code_verifier: flow.verifier });
  assert(result?.user?.id && result?.access_token && result?.refresh_token, 401, 'invalid_auth_flow', 'Restart sign-in.');
  const tokens = { accessToken: result.access_token, refreshToken: result.refresh_token, expiresIn: Number(result.expires_in || 3600) };
  const answer = await establishSession(context, mode, repo, { id: result.user.id, email: result.user.email || '' }, tokens, now);
  answer.cookies.push(setCookie('pkce', '', mode, 0));
  return answer;
}

async function establishSession(context, mode, repo, user, tokens, now) {
  const opaque = randomToken(); const id = await sha256(opaque);
  await repo.sessionCreate({ id, user, csrf: randomToken(), tokens: tokens ? await seal(tokens, context.secret) : null, accessExpiresAt: new Date(now + (tokens?.expiresIn || SESSION_SECONDS) * 1000).toISOString(), expiresAt: new Date(now + SESSION_SECONDS * 1000).toISOString() });
  return { location: '/', cookies: [setCookie('session', opaque, mode, SESSION_SECONDS)] };
}

export async function logout(session, context, env, mode, repo, fetchImpl) {
  if (session) {
    await repo.sessionDelete(session.id);
    if (mode === 'live') {
      try { const tokens = await unseal(session.tokens, context.secret); await authFetch(env, fetchImpl, 'logout?scope=local', undefined, tokens.accessToken); } catch { /* local BFF session is revoked even when upstream is unavailable */ }
    }
  }
  return setCookie('session', '', mode, 0);
}

export async function createGuest(request, context, env, mode, repo, fetchImpl, now, token) {
  let ipHash;
  if (mode === 'live') {
    assert(env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY && env.ABUSE_HASH_SECRET?.length >= 32, 503, 'trial_disabled', 'The browser trial is not configured.');
    assert(typeof token === 'string' && token.length > 0 && token.length <= 4096, 400, 'turnstile_required', 'Complete the verification challenge.');
    const ip = request.headers.get('CF-Connecting-IP');
    assert(ip, 503, 'trial_disabled', 'The browser trial is unavailable.');
    let verification;
    try {
      const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }), signal: AbortSignal.timeout(10000), redirect: 'error' });
      verification = await response.json();
    } catch { throw new HttpError(503, 'turnstile_unavailable', 'Verification is temporarily unavailable.'); }
    assert(verification?.success === true && verification.hostname === new URL(request.url).hostname && verification.action === 'guest_trial', 403, 'turnstile_rejected', 'Verification failed. Please try again.');
    ipHash = await hmac(env.ABUSE_HASH_SECRET, `trial-ip:${ip}`);
  } else { ipHash = await hmac(context.secret, `demo:${context.browser.id}`); }
  const existing = await readSigned(context.jar[cookieName('guest', mode)], context.secret, now);
  if (existing) {
    const guest = await repo.guestGet(existing.id);
    if (guest) return { guest, cookie: null };
  }
  const limit = (value, fallback, maximum) => Number.isFinite(Number(value)) && Number(value) >= 1 ? Math.min(maximum, Math.floor(Number(value))) : fallback;
  const guest = await repo.guestCreate({ id: crypto.randomUUID(), browserHash: await sha256(context.browser.id), ipHash, expiresAt: new Date(now + 86400000).toISOString(), ipDailyLimit: mode === 'demo' ? 100 : limit(env.TRIAL_IP_DAILY_LIMIT, 3, 3), globalDailyLimit: mode === 'demo' ? 1000 : limit(env.TRIAL_DAILY_LIMIT, 25, 100) });
  return { guest, cookie: setCookie('guest', await signObject({ id: guest.id, expiresAt: Date.parse(guest.expiresAt) }, context.secret), mode, 86400) };
}

export async function loadGuest(context, mode, repo, now) {
  const signed = await readSigned(context.jar[cookieName('guest', mode)], context.secret, now);
  return signed?.id ? repo.guestGet(signed.id) : null;
}
