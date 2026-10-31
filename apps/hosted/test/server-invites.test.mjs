import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplication } from '../server/index.mjs';
import { DemoRepository } from '../server/demo-repository.mjs';
import { sha256, randomToken } from '../server/security.mjs';

const SECRET = 'test-only-session-secret-32-characters-long';
const env = () => ({ APP_MODE: 'live', APP_ORIGIN: 'https://app.example', SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key', SESSION_SECRET: SECRET,
  GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'test-google-secret', LIVE_AI_ENABLED: 'true', MODEL_QUALITY_APPROVED: 'true', AI_DAILY_BUDGET_USD: '5',
  AI_MONTHLY_BUDGET_USD: '100', TRIAL_DAILY_BUDGET_USD: '2', ANTHROPIC_API_KEY: 'test-provider-key', TURNSTILE_SITE_KEY: 'test-site', TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
  ABUSE_HASH_SECRET: SECRET, ADMIN_EMAILS: 'Owner@Example.test', JOB_WORKFLOW: { create: async () => ({}) } });
const chart = () => ({ schemaVersion: 1, title: '閱讀計畫', goal: '四週讀完一本書', themes: Array.from({ length: 8 }, (_, t) => ({ id: `t${t}`, title: '', actions: Array.from({ length: 8 }, (_, a) => ({ id: `a${t}_${a}`, text: '', done: false })) })) });
const themes = () => ({ product: 'mandala', operation: 'themes', provider: 'anthropic', mode: 'standard', consentDecisions: false, payload: { chart: chart() } });
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const idToken = claims => `${encode({ alg: 'RS256' })}.${encode(claims)}.signature`;

function client(app, e) {
  const jar = new Map(); let csrf;
  return {
    jar,
    async request(path, { method = 'GET', body, key, headers = {} } = {}) {
      const h = new Headers(headers);
      if (jar.size) h.set('Cookie', [...jar].map(([k, v]) => `${k}=${v}`).join('; '));
      if (method !== 'GET') { h.set('Origin', e.APP_ORIGIN); if (csrf) h.set('X-CSRF-Token', csrf); }
      if (body !== undefined) h.set('Content-Type', 'application/json');
      if (key) h.set('Idempotency-Key', key);
      const response = await app(new Request(`${e.APP_ORIGIN}${path}`, { method, headers: h, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), e, {});
      for (const cookie of response.headers.getSetCookie()) {
        const first = cookie.split(';')[0]; const at = first.indexOf('=');
        if (/Max-Age=0(?:;|$)/.test(cookie)) jar.delete(first.slice(0, at)); else jar.set(first.slice(0, at), first.slice(at + 1));
      }
      const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
      if (path === '/api/session' && data.csrfToken) csrf = data.csrfToken;
      return { response, data };
    },
  };
}
// A fake Google and Turnstile: the token endpoint answers with claims the test sets.
function network() {
  const state = { claims: null, calls: [] };
  state.fetchImpl = async (url, options) => {
    state.calls.push({ url: String(url), body: options.body });
    if (String(url) === 'https://oauth2.googleapis.com/token') return state.claims ? Response.json({ id_token: idToken(state.claims), access_token: 'unused' }) : new Response('{}', { status: 400 });
    if (String(url).includes('turnstile')) return Response.json({ success: true, hostname: 'app.example', action: 'guest_trial' });
    throw new Error(`unexpected network call ${url}`);
  };
  return state;
}
async function googleLogin(c, net, claims = {}) {
  const login = await c.request('/api/auth/login'); const authorize = new URL(login.response.headers.get('Location'));
  net.claims = { iss: 'https://accounts.google.com', aud: 'client.apps.googleusercontent.com', exp: Math.floor(Date.now() / 1000) + 600, sub: 'google-sub-1', email: 'owner@example.test', email_verified: true, nonce: authorize.searchParams.get('nonce'), ...claims };
  const callback = await c.request(`/api/auth/callback?state=${authorize.searchParams.get('state')}&code=one-time`);
  await c.request('/api/session');
  return { authorize, callback };
}

test('Google OIDC: PKCE S256, state and nonce binding, verified email, and no Supabase dependency', async () => {
  const net = network(); const repo = new DemoRepository(); const app = createApplication({ repo, fetchImpl: net.fetchImpl });
  const c = client(app, env()); await c.request('/api/session');
  const config = (await c.request('/api/config')).data;
  assert.equal(config.authEnabled, true); assert.equal(config.googleSignIn, true); assert.equal(config.invites, true);
  const login = await c.request('/api/auth/login'); const authorize = new URL(login.response.headers.get('Location'));
  assert.equal(authorize.origin + authorize.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256'); assert.equal(authorize.searchParams.get('scope'), 'openid email');
  assert.equal(authorize.searchParams.get('redirect_uri'), 'https://app.example/api/auth/callback');
  assert.equal((await c.request('/api/auth/callback?state=wrong&code=x')).response.status, 400);
  for (const bad of [{ aud: 'someone-else' }, { email_verified: false }, { nonce: 'replayed' }, { iss: 'https://evil.example' }, { exp: 1 }]) {
    const fresh = client(app, env()); await fresh.request('/api/session');
    assert.equal((await googleLogin(fresh, net, bad)).callback.response.status, 401, JSON.stringify(bad));
  }
  const { callback } = await googleLogin(c, net);
  assert.equal(callback.response.status, 303);
  const token = net.calls.find(call => call.url.includes('oauth2.googleapis.com'));
  assert.equal(token.body.get('code_verifier').length > 40, true); assert.equal(token.body.get('grant_type'), 'authorization_code');
  const session = (await c.request('/api/session')).data;
  assert.equal(session.user.email, 'owner@example.test');
  // The same Google subject signs in to the same account.
  const second = client(app, env()); await second.request('/api/session'); await googleLogin(second, net);
  assert.equal((await second.request('/api/session')).data.user.id, session.user.id);
  assert.equal(repo.identities.size, 1);
});

test('invites: signed-in users share capped codes; a fresh browser redeems once and can run one chart', async () => {
  const net = network(); const repo = new DemoRepository(); const app = createApplication({ repo, fetchImpl: net.fetchImpl });
  const inviter = client(app, env()); await inviter.request('/api/session'); await googleLogin(inviter, net);
  const created = await inviter.request('/api/invites', { method: 'POST', body: {} });
  assert.equal(created.response.status, 201); assert.match(created.data.invite.code, /^[A-HJ-NP-Z2-9]{10}$/);
  assert.equal(created.data.invite.url, `https://app.example/mandala?invite=${created.data.invite.code}`);
  await inviter.request('/api/invites', { method: 'POST', body: {} }); await inviter.request('/api/invites', { method: 'POST', body: {} });
  assert.equal((await inviter.request('/api/invites', { method: 'POST', body: {} })).response.status, 429);
  // The inviter's own browser cannot redeem its code after signing out.
  await inviter.request('/api/auth/logout', { method: 'POST', body: {} }); await inviter.request('/api/session');
  assert.equal((await inviter.request('/api/invites/redeem', { method: 'POST', body: { code: created.data.invite.code, turnstileToken: 't' }, headers: { 'CF-Connecting-IP': '192.0.2.1' } })).response.status, 404);

  const plain = client(app, env()); await plain.request('/api/session');
  await plain.request('/api/guest', { method: 'POST', body: { turnstileToken: 't' }, headers: { 'CF-Connecting-IP': '192.0.2.9' } }); await plain.request('/api/session');
  assert.equal((await plain.request('/api/jobs', { method: 'POST', body: themes(), key: 'plain-themes' })).data.error.code, 'trial_login_required');

  const friend = client(app, env()); await friend.request('/api/session');
  const redeemed = await friend.request('/api/invites/redeem', { method: 'POST', body: { code: created.data.invite.code.toLowerCase(), turnstileToken: 't' }, headers: { 'CF-Connecting-IP': '192.0.2.2' } });
  assert.equal(redeemed.response.status, 201);
  assert.deepEqual((await friend.request('/api/session')).data.guest.invite, true);
  assert.equal((await friend.request('/api/jobs', { method: 'POST', body: themes(), key: 'friend-1' })).response.status, 202);
  assert.equal((await friend.request('/api/jobs', { method: 'POST', body: themes(), key: 'friend-2' })).data.error.code, 'trial_limit');
  const again = await friend.request('/api/invites/redeem', { method: 'POST', body: { code: created.data.invite.code, turnstileToken: 't' }, headers: { 'CF-Connecting-IP': '192.0.2.2' } });
  assert.equal(again.response.status, 404);
  // The friend later signs in with Google in the same browser: the invite counts as joined.
  await googleLogin(friend, net, { sub: 'google-sub-2', email: 'friend@example.test' });
  await googleLogin(inviter, net);
  const statuses = (await inviter.request('/api/invites')).data.invites.map(i => i.status).sort();
  assert.deepEqual(statuses, ['joined', 'open', 'open']);
  assert.equal((await inviter.request('/api/admin/metrics')).data.metrics.invites.joined, 1);
  assert.equal((await friend.request('/api/admin/metrics')).response.status, 404);
});

test('signed-in Mandala trial records activity; deleting the account removes its data and signs out', async () => {
  const net = network(); const repo = new DemoRepository(); const app = createApplication({ repo, fetchImpl: net.fetchImpl });
  const c = client(app, env()); await c.request('/api/session'); await googleLogin(c, net);
  const userId = (await c.request('/api/session')).data.user.id;
  const job = await c.request('/api/jobs', { method: 'POST', body: themes(), key: 'user-job-1' }); assert.equal(job.response.status, 202, JSON.stringify(job.data));
  const saved = await c.request('/api/documents', { method: 'POST', body: { product: 'mandala', kind: 'goal', title: '閱讀計畫', data: chart() } });
  assert.equal(saved.response.status, 201);
  assert.equal((await c.request(`/api/documents/${saved.data.document.id}/versions`)).response.status, 200);
  assert.equal(repo.activity.size, 1);
  assert.equal((await c.request('/api/account', { method: 'DELETE' })).response.status, 200);
  assert.equal((await c.request('/api/session')).data.user, null);
  assert.equal(repo.documents.size, 0); assert.equal(repo.identities.size, 0); assert.equal(repo.activity.size, 0);
  assert.ok(![...repo.sessions.values()].some(s => s.user.id === userId));
  assert.equal((await c.request('/api/account', { method: 'DELETE' })).response.status, 401);
});

test('a guest session cookie from another browser cannot be reused to redeem or convert', async () => {
  const repo = new DemoRepository(); const net = network(); const app = createApplication({ repo, fetchImpl: net.fetchImpl });
  const c = client(app, env()); await c.request('/api/session');
  assert.equal((await c.request('/api/invites/redeem', { method: 'POST', body: { code: 'short', turnstileToken: 't' }, headers: { 'CF-Connecting-IP': '192.0.2.3' } })).response.status, 400);
  assert.equal((await c.request('/api/invites/redeem', { method: 'POST', body: { code: 'ABCDEFGH23', turnstileToken: 't' }, headers: { 'CF-Connecting-IP': '192.0.2.3' } })).response.status, 404);
  assert.equal((await c.request('/api/invites', { method: 'POST', body: {} })).response.status, 401);
  assert.equal(await repo.inviteConvert(await sha256(randomToken()), 'nobody'), false);
});
