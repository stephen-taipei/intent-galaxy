import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplication, runJob } from '../server/index.mjs';
import { DemoRepository } from '../server/demo-repository.mjs';
import { PostgrestRepository } from '../server/repository.mjs';
import { createCheckout, verifyPaddle, applyPaddleEvent } from '../server/billing.mjs';
import { sha256, randomToken, seal, hmac } from '../server/security.mjs';
import * as domain from '../domain/index.mjs';
import { catalogPrice as price, inclusiveCompletedEvent } from './server-paddle-inclusive.fixture.mjs';

const SECRET = 'test-only-session-secret-32-characters-long';
const U = '11111111-1111-4111-8111-111111111111';
const V = '22222222-2222-4222-8222-222222222222';
const operation = () => ({ product: 'studio', operation: 'analyze', provider: 'openai', mode: 'standard', consentDecisions: false, payload: { taskType: 'message', goal: 'Draft a factual update', input: 'The release is awaiting review.', requirements: [] } });
const liveEnv = () => ({ APP_MODE: 'live', APP_ORIGIN: 'https://app.example', SUPABASE_URL: 'https://auth.example', SUPABASE_ANON_KEY: 'test-anon-key', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key', SESSION_SECRET: SECRET, LIVE_AI_ENABLED: 'true', MODEL_QUALITY_APPROVED: 'true', AI_DAILY_BUDGET_USD: '5', AI_MONTHLY_BUDGET_USD: '100', OPENAI_API_KEY: 'test-provider-key', TURNSTILE_SITE_KEY: 'test-site', TURNSTILE_SECRET_KEY: 'test-turnstile-secret', ABUSE_HASH_SECRET: SECRET, JOB_WORKFLOW: { create: async () => ({}) } });
const billingEnv = () => ({ ...liveEnv(), BILLING_ENABLED: 'true', PADDLE_ENV: 'sandbox', PADDLE_API_KEY: 'test-paddle', PADDLE_WEBHOOK_SECRET: 'test-webhook-secret', PADDLE_PRICE_STUDIO: 'pri_studio', PADDLE_PRICE_MANDALA: 'pri_mandala' });

function client(app, env) {
  const jar = new Map(); let csrf; const pending = [];
  const origin = env.APP_MODE === 'demo' ? 'http://127.0.0.1:8080' : env.APP_ORIGIN;
  return {
    jar, pending,
    get csrf() { return csrf; },
    async request(path, { method = 'GET', body, key, headers = {}, sendCsrf = true } = {}) {
      const h = new Headers(headers);
      if (jar.size) h.set('Cookie', [...jar].map(([k, v]) => `${k}=${v}`).join('; '));
      if (method !== 'GET') { if (!h.has('Origin')) h.set('Origin', origin); if (csrf && sendCsrf) h.set('X-CSRF-Token', csrf); }
      if (body !== undefined) h.set('Content-Type', 'application/json');
      if (key) h.set('Idempotency-Key', key);
      const response = await app(new Request(`${origin}${path}`, { method, headers: h, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), env, { waitUntil(promise) { pending.push(promise); } });
      for (const cookie of response.headers.getSetCookie()) {
        const first = cookie.split(';')[0]; const at = first.indexOf('='); const k = first.slice(0, at); const v = first.slice(at + 1);
        if (/Max-Age=0(?:;|$)/.test(cookie)) jar.delete(k); else jar.set(k, v);
      }
      const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
      if (path === '/api/session' && data.csrfToken) csrf = data.csrfToken;
      return { response, data };
    },
  };
}
async function signedClient(app, env, repo, userId = U) {
  const c = client(app, env); const opaque = randomToken();
  await repo.sessionCreate({ id: await sha256(opaque), user: { id: userId, email: 'owner@example.test' }, csrf: randomToken(), tokens: await seal({ accessToken: 'private-access', refreshToken: 'private-refresh' }, SECRET), accessExpiresAt: new Date(Date.now() + 3600000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() });
  c.jar.set('__Host-ig-session', opaque); await c.request('/api/session'); return c;
}
async function reserve(repo, overrides = {}) {
  return repo.reserveJob({ owner: { userId: U }, key: randomToken(), requestHash: 'request-hash', request: operation(), creditCost: 1, reservedMicros: 150000, dailyLimitMicros: 5000000, monthlyLimitMicros: 100000000, trialDailyLimitMicros: 500000, ...overrides });
}

test('mode gates cannot expose demo remotely, enable AI without quality/budget approval, or silently fall back', async () => {
  const app = createApplication();
  assert.equal((await app(new Request('https://public.example/api/config'), { APP_MODE: 'demo' })).status, 503);
  const disabled = await app(new Request('https://public.example/api/config'), {});
  assert.equal((await disabled.json()).mode, 'disabled');
  const env = liveEnv(); env.MODEL_QUALITY_APPROVED = 'false';
  const repo = new DemoRepository(); const c = await signedClient(createApplication({ repo }), env, repo);
  assert.equal((await c.request('/api/jobs', { method: 'POST', body: operation(), key: 'blocked-quality' })).response.status, 503);
  assert.equal(repo.jobs.size, 0);
  const failedLive = await app(new Request('https://app.example/api/session'), { ...liveEnv(), SUPABASE_SERVICE_ROLE_KEY: '' });
  assert.equal(failedLive.status, 503);
});

test('HttpOnly CSRF cookie, exact Origin and body restrictions protect all unsafe APIs', async () => {
  const repo = new DemoRepository(); const c = client(createApplication({ repo }), { APP_MODE: 'demo' });
  const session = await c.request('/api/session');
  assert.ok(session.response.headers.get('Set-Cookie').includes('HttpOnly; SameSite=Lax'));
  assert.equal((await c.request('/api/guest', { method: 'POST', body: {}, sendCsrf: false })).data.error.code, 'csrf_rejected');
  assert.equal((await c.request('/api/guest', { method: 'POST', body: {}, headers: { Origin: 'https://evil.example' } })).data.error.code, 'origin_rejected');
  assert.equal((await c.request('/api/guest', { method: 'POST', body: { turnstileToken: '', userId: U } })).response.status, 400);
  assert.equal(repo.guests.size, 0);
  const signed = await c.request('/api/auth/login'); assert.equal(signed.response.status, 303);
  await c.request('/api/session');
  assert.equal((await c.request('/api/billing/checkout', { method: 'POST', body: { product: 'studio', price_id: 'pri_attack' }, key: 'billing-forge' })).response.status, 400);
});

test('browser trial is explicit, one analysis per browser, owner-bound, and reports remaining allowance', async () => {
  const repo = new DemoRepository(); const env = { APP_MODE: 'demo' }; const app = createApplication({ repo }); const c = client(app, env);
  await c.request('/api/session');
  assert.equal((await c.request('/api/jobs', { method: 'POST', body: operation(), key: 'before-trial' })).response.status, 401);
  assert.equal((await c.request('/api/guest', { method: 'POST', body: {} })).response.status, 201);
  const first = await c.request('/api/jobs', { method: 'POST', body: operation(), key: 'first-analysis' });
  assert.equal(first.response.status, 202); await Promise.all(c.pending);
  const polled = await c.request(`/api/jobs/${first.data.job.id}`);
  assert.equal(polled.data.job.status, 'completed'); assert.equal(polled.data.job.result.demo, true);
  assert.equal((await c.request('/api/session')).data.entitlements.studio.credits, 1);
  const repeat = await c.request('/api/jobs', { method: 'POST', body: operation(), key: 'first-analysis' });
  assert.equal(repeat.data.job.id, first.data.job.id); assert.equal(repo.jobs.size, 1);
  assert.equal((await c.request('/api/jobs', { method: 'POST', body: operation(), key: 'another-analysis' })).response.status, 429);
  const other = client(app, env); await other.request('/api/session'); await other.request('/api/guest', { method: 'POST', body: {} });
  assert.equal((await other.request(`/api/jobs/${first.data.job.id}`)).response.status, 404);
  assert.equal((await c.request('/api/documents', { method: 'POST', body: { product: 'studio', kind: 'work', title: 'claim', data: {} } })).response.status, 401);
  c.jar.delete('ig-guest');
  assert.equal((await c.request('/api/guest', { method: 'POST', body: {} })).response.status, 429);
});

test('document ownership, optimistic writes, plan-specific versions, telemetry privacy', async () => {
  const env = liveEnv(); const repo = new DemoRepository(); const app = createApplication({ repo }); const c = await signedClient(app, env, repo); const other = await signedClient(app, env, repo, V);
  const created = await c.request('/api/documents', { method: 'POST', body: { product: 'studio', kind: 'work', title: 'Draft', data: { content: 'private document' } } });
  assert.equal(created.response.status, 201); const id = created.data.document.id;
  assert.equal((await other.request(`/api/documents/${id}`)).response.status, 404);
  assert.equal((await other.request(`/api/documents/${id}`, { method: 'DELETE' })).response.status, 404);
  const writes = await Promise.all([1, 2].map(n => c.request(`/api/documents/${id}`, { method: 'PUT', body: { title: `edit ${n}`, data: { content: `edit ${n}` }, revision: 1 } })));
  assert.deepEqual(writes.map(r => r.response.status).sort(), [200, 409]);
  assert.equal((await c.request(`/api/documents/${id}/versions`)).response.status, 403);
  assert.equal((await c.request(`/api/documents/${id}`, { method: 'PUT', body: { title: 'move', data: {}, revision: 2, product: 'mandala' } })).response.status, 400);
  assert.equal((await c.request('/api/events', { method: 'POST', body: { name: 'document_saved', product: 'studio', content: 'must not reach telemetry' } })).response.status, 400);
  assert.equal((await c.request('/api/events', { method: 'POST', body: { name: 'document_saved', product: 'studio', templateId: 'personal-input' } })).response.status, 400);
  assert.equal((await c.request('/api/events', { method: 'POST', body: { name: 'document_saved', product: 'studio', templateId: 'message' } })).response.status, 200);
  assert.equal(repo.events.size, 1);
});

test('Google PKCE exchanges server-side, stores encrypted tokens and rotates BFF CSRF on login', async () => {
  const repo = new DemoRepository(); const env = liveEnv(); const calls = [];
  const app = createApplication({ repo, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (String(url).includes('grant_type=pkce')) return Response.json({ user: { id: U, email: 'owner@example.test' }, access_token: 'private-access', refresh_token: 'private-refresh', expires_in: 3600 });
    if (String(url).includes('/logout')) return new Response(null, { status: 204 });
    throw new Error('unexpected network call');
  } });
  const c = client(app, env); await c.request('/api/session'); const before = c.csrf;
  const login = await c.request('/api/auth/login'); const authorize = new URL(login.response.headers.get('Location'));
  assert.equal(authorize.origin, 'https://auth.example'); assert.equal(authorize.searchParams.get('code_challenge_method'), 's256');
  assert.ok(login.response.headers.get('Set-Cookie').includes('; Secure'));
  const redirect = new URL(authorize.searchParams.get('redirect_to'));
  assert.equal((await c.request('/api/auth/callback?flow=wrong&code=code')).response.status, 400);
  redirect.searchParams.set('code', 'one-time-code');
  const callback = await c.request(redirect.pathname + redirect.search);
  assert.equal(callback.response.status, 303); assert.equal(calls.length, 1);
  assert.equal(JSON.parse(calls[0].options.body).auth_code, 'one-time-code');
  const after = await c.request('/api/session');
  assert.equal(after.data.user.id, U); assert.notEqual(c.csrf, before);
  assert.ok(!JSON.stringify(after.data).includes('private-access'));
  assert.ok(![...c.jar.values()].join('').includes('private-refresh'));
  assert.ok(![...repo.sessions.values()][0].tokens.includes('private-access'));
  assert.equal((await c.request('/api/auth/logout', { method: 'POST', body: {} })).response.status, 200);
  assert.equal(repo.sessions.size, 0);
  assert.equal((await c.request('/api/session')).data.user, null);
});

test('Turnstile verifies hostname/action with trusted edge IP; failed verification creates no trial', async () => {
  const env = liveEnv(); const repo = new DemoRepository(); let valid = false; let seen;
  const app = createApplication({ repo, fetchImpl: async (url, options) => { seen = { url, body: options.body }; return Response.json({ success: valid, hostname: 'app.example', action: valid ? 'guest_trial' : 'other' }); } });
  const c = client(app, env); await c.request('/api/session');
  assert.equal((await c.request('/api/guest', { method: 'POST', body: { turnstileToken: 'test' } })).response.status, 503);
  assert.equal((await c.request('/api/guest', { method: 'POST', body: { turnstileToken: 'test' }, headers: { 'CF-Connecting-IP': '192.0.2.1' } })).response.status, 403);
  assert.equal(repo.guests.size, 0); valid = true;
  assert.equal((await c.request('/api/guest', { method: 'POST', body: { turnstileToken: 'test' }, headers: { 'CF-Connecting-IP': '192.0.2.1' } })).response.status, 201);
  assert.equal(seen.url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(seen.body.get('remoteip'), '192.0.2.1');
  assert.ok(!JSON.stringify([...repo.trials.values()]).includes('192.0.2.1'));
});

test('session refresh uses one lease and uncertain refresh revokes the local session', async () => {
  const env = liveEnv(); const repo = new DemoRepository(); let release; let observed;
  const observedCall = new Promise(resolve => { observed = resolve; });
  const response = new Promise(resolve => { release = resolve; });
  let refreshes = 0;
  const app = createApplication({ repo, fetchImpl: async url => { assert.match(url, /grant_type=refresh_token/); refreshes++; observed(); return response; } });
  const c = await signedClient(app, env, repo);
  for (const s of repo.sessions.values()) s.accessExpiresAt = new Date(Date.now() - 1000).toISOString();
  const first = c.request('/api/session'); await observedCall;
  assert.equal((await c.request('/api/session')).response.status, 409);
  release(Response.json({ user: { id: U }, access_token: 'rotated-access', refresh_token: 'rotated-refresh', expires_in: 3600 }));
  assert.equal((await first).response.status, 200); assert.equal(refreshes, 1);
  for (const s of repo.sessions.values()) s.accessExpiresAt = new Date(Date.now() - 1000).toISOString();
  const failedApp = createApplication({ repo, fetchImpl: async () => { throw new Error('ambiguous refresh timeout'); } });
  const request = new Request('https://app.example/api/session', { headers: { Cookie: [...c.jar].map(([k, v]) => `${k}=${v}`).join('; ') } });
  assert.equal((await failedApp(request, env)).status, 503); assert.equal(repo.sessions.size, 0);
});

test('ambiguous workflow creation reuses the durable queued job without resubmission', async () => {
  const repo = new DemoRepository(); const env = liveEnv(); let starts = 0;
  env.JOB_WORKFLOW.create = async () => { starts++; throw new Error('timeout after accepted'); };
  const c = await signedClient(createApplication({ repo }), env, repo);
  const first = await c.request('/api/jobs', { method: 'POST', body: operation(), key: 'stable-job-key' });
  const second = await c.request('/api/jobs', { method: 'POST', body: operation(), key: 'stable-job-key' });
  assert.equal(first.response.status, 202); assert.equal(second.data.job.id, first.data.job.id); assert.equal(starts, 1);
  assert.equal((await repo.entitlements(U)).studio.credits, 19);
});

test('queued jobs recheck withdrawn live gates at execution and refund without a provider call', async () => {
  for (const change of [{ MODEL_QUALITY_APPROVED: 'false' }, { LIVE_AI_ENABLED: 'false' }, { AI_DAILY_BUDGET_USD: '0' }, { AI_MONTHLY_BUDGET_USD: '0' }, { AI_DAILY_BUDGET_USD: 'NaN' }, { AI_DAILY_BUDGET_USD: 'Infinity' }, { AI_MONTHLY_BUDGET_USD: 'NaN' }, { AI_MONTHLY_BUDGET_USD: 'Infinity' }]) {
    const repo = new DemoRepository(); const env = liveEnv(); const job = await reserve(repo); let fetched = 0;
    Object.assign(env, change);
    const engine = { executeJob: async (_r, { fetchImpl }) => { await fetchImpl('https://api.openai.com/v1/responses', {}); return { actualCostUsd: 0.01 }; } };
    await runJob(job.id, env, { repo, engine, fetchImpl: async () => { fetched++; return Response.json({}); } });
    assert.equal(fetched, 0, Object.keys(change)[0]);
    assert.equal((await repo.jobGet(job.id, { userId: U })).status, 'failed');
    assert.equal((await repo.entitlements(U)).studio.credits, 20); assert.equal([...repo.budgets.values()][0], 0);
  }
  const repo = new DemoRepository(); const env = liveEnv(); delete env.AI_MONTHLY_BUDGET_USD;
  const job = await reserve(repo); let fetched = 0;
  const engine = { executeJob: async (_r, { fetchImpl }) => { await fetchImpl('https://api.openai.com/v1/responses', {}); return { actualCostUsd: 0.01 }; } };
  await runJob(job.id, env, { repo, engine, fetchImpl: async () => { fetched++; return Response.json({}); } });
  assert.equal(fetched, 1); assert.equal((await repo.jobGet(job.id, { userId: U })).status, 'completed');
});

test('gate withdrawal while persisting the dispatch marker still makes zero calls and refunds', async () => {
  const repo = new DemoRepository(); const env = liveEnv(); const job = await reserve(repo); let fetched = 0;
  const mark = repo.jobDispatched.bind(repo);
  repo.jobDispatched = async id => { const answer = await mark(id); env.MODEL_QUALITY_APPROVED = 'false'; return answer; };
  const engine = { executeJob: async (_r, { fetchImpl }) => { await fetchImpl('https://api.openai.com/v1/responses', {}); return { actualCostUsd: 0.01 }; } };
  await runJob(job.id, env, { repo, engine, fetchImpl: async () => { fetched++; return Response.json({}); } });
  assert.equal(fetched, 0); assert.equal((await repo.jobGet(job.id, { userId: U })).status, 'failed');
  assert.equal((await repo.entitlements(U)).studio.credits, 20); assert.equal([...repo.budgets.values()][0], 0);
});

test('gate withdrawal after generation prevents a second call and retains its reservation', async () => {
  const repo = new DemoRepository(); const env = liveEnv(); const job = await reserve(repo); let fetched = 0;
  const engine = { executeJob: async (_r, { fetchImpl }) => {
    await fetchImpl('https://api.openai.com/v1/responses', {}); env.AI_DAILY_BUDGET_USD = '0';
    await fetchImpl('https://api.openai.com/v1/decisions', {}); return { actualCostUsd: 0.01 };
  } };
  await runJob(job.id, env, { repo, engine, fetchImpl: async () => { fetched++; return Response.json({}); } });
  assert.equal(fetched, 1); assert.equal((await repo.jobGet(job.id, { userId: U })).status, 'unknown');
  assert.equal((await repo.entitlements(U)).studio.credits, 19); assert.equal([...repo.budgets.values()][0], 150000);
});

test('workflow replay never repeats a dispatched unknown provider call', async () => {
  const repo = new DemoRepository(); const job = await reserve(repo); let calls = 0;
  const engine = { executeJob: async (_r, { fetchImpl }) => { await fetchImpl('https://api.openai.com/v1/responses', { method: 'POST' }); const e = new Error('private provider payload'); e.definitiveFailure = false; throw e; } };
  const options = { repo, engine, mode: 'live', fetchImpl: async () => { calls++; return Response.json({}); } };
  await Promise.all([runJob(job.id, liveEnv(), options), runJob(job.id, liveEnv(), options)]);
  await runJob(job.id, liveEnv(), options);
  assert.equal(calls, 1); assert.equal((await repo.jobGet(job.id, { userId: U })).status, 'unknown');
  assert.equal((await repo.entitlements(U)).studio.credits, 19); assert.equal([...repo.budgets.values()][0], 150000);
  assert.ok(!JSON.stringify(await repo.jobGet(job.id, { userId: U })).includes('private provider payload'));
});

test('one claimed job may call generation and Decisions once each; pre-dispatch failure refunds', async () => {
  const repo = new DemoRepository(); const job = await reserve(repo); let calls = 0;
  const engine = { executeJob: async (_r, { fetchImpl }) => { await fetchImpl('https://api.anthropic.com/v1/messages', {}); await fetchImpl('https://api.openai.com/v1/decisions', {}); return { artifact: { content: 'draft' }, actualCostUsd: 0.02 }; } };
  const options = { repo, engine, mode: 'live', fetchImpl: async () => { calls++; return Response.json({}); } };
  assert.equal((await runJob(job.id, liveEnv(), options)).status, 'completed');
  await runJob(job.id, liveEnv(), options); assert.equal(calls, 2); assert.equal([...repo.budgets.values()][0], 20000);
  const rejected = await reserve(repo);
  await runJob(rejected.id, liveEnv(), { ...options, engine: { executeJob: async (_r, { fetchImpl }) => fetchImpl('https://attacker.example/tool') } });
  assert.equal((await repo.jobGet(rejected.id, { userId: U })).status, 'failed');
  assert.equal((await repo.entitlements(U)).studio.credits, 19); assert.equal(calls, 2);
});

test('a certain rejection after a successful provider response cannot refund the generation', async () => {
  const repo = new DemoRepository(); const job = await reserve(repo);
  const engine = { executeJob: async (_r, { fetchImpl }) => {
    await fetchImpl('https://api.openai.com/v1/responses', {});
    await fetchImpl('https://api.openai.com/v1/decisions', {});
    const error = new Error('second request rejected'); error.definitiveFailure = true; throw error;
  } };
  let count = 0;
  await runJob(job.id, liveEnv(), { repo, engine, mode: 'live', fetchImpl: async () => new Response('{}', { status: ++count === 1 ? 200 : 400 }) });
  assert.equal((await repo.jobGet(job.id, { userId: U })).status, 'unknown');
  assert.equal((await repo.entitlements(U)).studio.credits, 19); assert.equal([...repo.budgets.values()][0], 150000);
});

test('server-owned checkout price and idempotency; unknown create never repeats or grants credit', async () => {
  const env = billingEnv(); const repo = new DemoRepository(); let transactions = 0; let submitted;
  const fetchImpl = async (url, options) => {
    if (url.includes('/prices/')) return Response.json({ data: price('studio') });
    transactions++; submitted = JSON.parse(options.body); return Response.json({ data: { id: 'txn_created', checkout: { url: 'https://sandbox-checkout.paddle.com/pay/created' } } });
  };
  const args = { userId: U, product: 'studio', key: 'checkout-key', env, repo, fetchImpl, origin: env.APP_ORIGIN };
  assert.equal(await createCheckout(args), 'https://sandbox-checkout.paddle.com/pay/created');
  await createCheckout(args); assert.equal(transactions, 1); assert.equal(submitted.items[0].price_id, 'pri_studio');
  assert.equal(submitted.custom_data.user_id, U); assert.ok(submitted.custom_data.binding);
  assert.equal((await repo.entitlements(U)).studio.plan, 'free');
  const unknownRepo = new DemoRepository(); let unknownCalls = 0;
  const unknown = { ...args, repo: unknownRepo, fetchImpl: async url => { if (url.includes('/prices/')) return Response.json({ data: price('studio') }); unknownCalls++; throw new Error('ambiguous timeout'); } };
  await assert.rejects(createCheckout(unknown), /reconciliation/);
  await assert.rejects(createCheckout(unknown), /reconciliation/);
  await assert.rejects(createCheckout({ ...unknown, key: 'new-key-to-bypass' }), /checkout pending/);
  assert.equal(unknownCalls, 1); assert.equal((await unknownRepo.entitlements(U)).studio.plan, 'free');
});

test('Paddle verifies exact bytes/timestamp; signed completion is bound, replay-safe and product-specific', async () => {
  const env = billingEnv(); const repo = new DemoRepository(); const c = await repo.checkoutBegin(U, 'studio', 'webhook-checkout');
  const now = Date.now(); const ts = Math.floor(now / 1000);
  const body = inclusiveCompletedEvent({ userId: U, checkoutId: c.id, binding: await hmac(SECRET, `checkout:${c.id}:${U}:studio`), now });
  const raw = JSON.stringify(body); const signature = await hmac(env.PADDLE_WEBHOOK_SECRET, `${ts}:${raw}`, true);
  const signed = text => new Request('https://app.example/api/webhooks/paddle', { method: 'POST', headers: { 'Paddle-Signature': `ts=${ts};h1=${signature}` }, body: text });
  await assert.rejects(verifyPaddle(signed(`${raw} `), env.PADDLE_WEBHOOK_SECRET, now), /Invalid webhook signature/);
  await assert.rejects(verifyPaddle(signed(raw), env.PADDLE_WEBHOOK_SECRET, now + 10000), /Invalid webhook signature/);
  const event = await verifyPaddle(signed(raw), env.PADDLE_WEBHOOK_SECRET, now);
  await applyPaddleEvent(event, { env, repo, now });
  assert.equal((await repo.entitlements(U)).studio.credits, 200); assert.equal((await repo.entitlements(U)).mandala.credits, 0);
  assert.equal((await applyPaddleEvent(event, { env, repo, now })).duplicate, true);
  const forged = structuredClone(event); forged.event_id = 'evt_forged'; forged.data.items[0].price = price('mandala');
  await assert.rejects(applyPaddleEvent(forged, { env, repo, now }), error => error.code === 'invalid_billing_totals');
  await assert.rejects(applyPaddleEvent({ event_id: 'evt_early_cancel', event_type: 'subscription.canceled', occurred_at: new Date(now).toISOString(), data: { id: 'sub_unknown', customer_id: 'ctm_unknown', status: 'canceled' } }, { env, repo, now }), /reconciliation/);
  await applyPaddleEvent({ event_id: 'evt_refund', event_type: 'adjustment.updated', occurred_at: new Date(now).toISOString(), data: { transaction_id: 'txn_paid', action: 'refund', status: 'approved' } }, { env, repo, now });
  assert.equal((await repo.entitlements(U)).studio.plan, 'free');
});

test('PostgREST adapter sends real ownership-scoped RPCs and never surfaces server payloads', async () => {
  const seen = []; const env = liveEnv();
  const repo = new PostgrestRepository(env, async (url, options) => { seen.push({ url, options }); return Response.json({ id: 'saved', title: 'test' }); });
  await repo.documentGet(U, 'doc-id');
  assert.equal(seen[0].url, 'https://auth.example/rest/v1/rpc/hosted_document_get');
  assert.deepEqual(JSON.parse(seen[0].options.body), { p_user_id: U, p_id: 'doc-id' });
  assert.equal(seen[0].options.headers.Authorization, 'Bearer test-service-key');
  const bad = new PostgrestRepository(env, async () => Response.json({ message: 'database secret details' }, { status: 500 }));
  await assert.rejects(bad.documentGet(U, 'doc'), e => e.code === 'database_unavailable' && !e.message.includes('secret'));
});

test('asset responses have CSP with Turnstile support and never bypass a live origin mismatch', async () => {
  const env = { ...liveEnv(), ASSETS: { fetch: async () => new Response('<html>safe</html>', { headers: { 'Content-Type': 'text/html' } }) } };
  const app = createApplication(); const response = await app(new Request('https://app.example/studio'), env);
  assert.equal(response.status, 200); assert.match(response.headers.get('Content-Security-Policy'), /frame-src https:\/\/challenges.cloudflare.com/);
  assert.match(response.headers.get('Content-Security-Policy'), /script-src 'self' https:\/\/challenges.cloudflare.com/);
  assert.equal((await app(new Request('https://wrong.example/studio'), env)).status, 503);
});

test('the operator picks the AI provider; the client value is ignored and never selects an unconfigured key', async () => {
  const repo = new DemoRepository(); const env = liveEnv();
  const c = await signedClient(createApplication({ repo }), env, repo);
  const asked = { ...operation(), provider: 'anthropic', consentDecisions: true };
  const { response } = await c.request('/api/jobs', { method: 'POST', body: asked, key: 'operator-provider' });
  assert.equal(response.status, 202, 'only OPENAI_API_KEY is configured, so the job runs on OpenAI instead of failing');
  const stored = [...repo.jobs.values()][0].request;
  assert.equal(stored.provider, 'openai');
  assert.equal(stored.consentDecisions, true, 'OpenAI as primary covers its own Decisions review');
  const forced = { ...liveEnv(), STUDIO_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'test-anthropic-key' };
  const repo2 = new DemoRepository(); const c2 = await signedClient(createApplication({ repo: repo2 }), forced, repo2);
  await c2.request('/api/jobs', { method: 'POST', body: { ...operation(), provider: 'openai' }, key: 'operator-forced' });
  const stored2 = [...repo2.jobs.values()][0].request;
  assert.equal(stored2.provider, 'anthropic');
  assert.equal(stored2.consentDecisions, false, 'cross-provider review stays off unless DECISIONS_ENABLED');
  const config = await (await createApplication({ repo: repo2 })(new Request('https://app.example/api/config'), forced)).json();
  assert.equal(config.studioProvider, 'anthropic');
  assert.equal(config.studioDecisions, false);
});
