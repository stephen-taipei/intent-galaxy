import * as domain from '../domain/index.mjs';
import { liveModelGate } from '../domain/providers.mjs';
import { assert, modeFor, sameOrigin, constantTimeEqual, readJson, onlyKeys, idempotencyKey, sha256, stableJson, json, safeError } from './security.mjs';
import { browserContext, loadSession, beginLogin, completeLogin, logout, createGuest, loadGuest, authEnabled, googleEnabled, redeemInvite, inviteCode } from './auth.mjs';
import { billingEnabled, createCheckout, createPortal, verifyPaddle, applyPaddleEvent } from './billing.mjs';
import { PostgrestRepository } from './repository.mjs';
import { DemoRepository } from './demo-repository.mjs';

const demos = new WeakMap();
const EVENTS = new Set(['page_view', 'template_selected', 'analysis_started', 'generation_started', 'evaluation_viewed', 'signup_started', 'checkout_started', 'document_saved', 'job_started', 'job_completed', 'mandala_action_toggled', 'mandala_example_opened', 'invite_link_copied', 'feed_viewed', 'chart_shared', 'chart_exported']);
const EMPTY = { studio: { plan: 'guest', credits: 0, limits: { works: 0, templates: 0, goals: 0 } }, mandala: { plan: 'guest', credits: 0, limits: { works: 0, templates: 0, goals: 0 } } };

function repository(env, mode, fetchImpl, clock) {
  if (mode === 'demo') {
    if (!demos.has(env)) demos.set(env, new DemoRepository({ clock }));
    return demos.get(env);
  }
  return new PostgrestRepository(env, fetchImpl);
}
function productKind(product, kind) { return (product === 'studio' && ['work', 'template'].includes(kind)) || (product === 'mandala' && kind === 'goal'); }
function requireUser(session) { assert(session?.user?.id, 401, 'sign_in_required', 'Sign in to continue.'); return session.user.id; }
function positiveNumber(value, fallback = 0) { const number = Number(value ?? fallback); return Number.isFinite(number) && number > 0 ? number : 0; }
function budget(env, mode) {
  const daily = positiveNumber(env.AI_DAILY_BUDGET_USD, mode === 'demo' ? 5 : 0);
  const monthly = positiveNumber(env.AI_MONTHLY_BUDGET_USD, daily * 31);
  const trial = Math.min(daily, positiveNumber(env.TRIAL_DAILY_BUDGET_USD, 0.5));
  return { dailyLimitMicros: Math.floor(daily * 1e6), monthlyLimitMicros: Math.floor(monthly * 1e6), trialDailyLimitMicros: Math.floor(trial * 1e6), ...mandalaTrialLimits(env) };
}
// Free Mandala AI counts: charts start with one themes call; every later
// expansion or perspectives call is counted separately. Zero disables a cap.
function mandalaTrialLimits(env) {
  const count = (value, fallback) => { const n = Number(value ?? fallback); return Number.isInteger(n) && n >= 0 ? n : 0; };
  return { mandalaOwnerDailyCharts: count(env.MANDALA_OWNER_DAILY_CHARTS, 3), mandalaOwnerDailyCalls: count(env.MANDALA_OWNER_DAILY_CALLS, 30),
    mandalaInviteCharts: count(env.MANDALA_INVITE_CHARTS, 1), mandalaInviteCalls: count(env.MANDALA_INVITE_CALLS, 10),
    mandalaPlatformDailyCharts: count(env.MANDALA_PLATFORM_DAILY_CHARTS, 200), mandalaPlatformDailyCalls: count(env.MANDALA_PLATFORM_DAILY_CALLS, 2000) };
}
// Invite codes per signed-in account: created per Asia/Taipei day, unused at once, days valid.
function inviteLimits(env) {
  const count = (value, fallback, max) => { const n = Number(value ?? fallback); return Number.isInteger(n) && n >= 0 ? Math.min(n, max) : 0; };
  return { dailyLimit: count(env.MANDALA_INVITES_DAILY, 3, 20), openLimit: count(env.MANDALA_INVITES_OPEN, 3, 20), ttlDays: count(env.MANDALA_INVITE_TTL_DAYS, 7, 30) };
}
function isAdmin(env, session) {
  const email = session?.user?.email?.toLowerCase();
  return Boolean(email) && (env.ADMIN_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean).includes(email);
}
async function touch(repo, userId) { try { await repo.touchActivity(userId); } catch { /* activity is best effort and never blocks the action */ } }
async function convertInvite(repo, context, userId) { try { if (userId) await repo.inviteConvert(await sha256(context.browser.id), userId); } catch { /* attribution is best effort */ } }
const TAGS = ['health', 'learning', 'career', 'money', 'sports', 'creative', 'family', 'life'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function publicId(value) { assert(UUID.test(value || ''), 404, 'not_found', 'Not found.'); return value; }
function profileBody(body) {
  onlyKeys(body, ['nickname', 'avatar']);
  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
  assert(nickname.length >= 1 && nickname.length <= 24 && !/[\u0000-\u001f\u007f<>]/.test(nickname), 400, 'invalid_profile', 'Use a nickname of 1 to 24 characters.');
  assert(/^a(0[1-9]|1[0-2])$/.test(body.avatar || ''), 400, 'invalid_profile', 'Choose one of the avatars.');
  return { nickname, avatar: body.avatar };
}
// The brand examples (public/mandala-examples.json) are published into the
// feed under the brand account and ranked like everyone else's charts. The
// operator reseeds after regenerating; the demo seeds itself on first use.
async function exampleRows(request, env) {
  const response = await env.ASSETS.fetch(new Request(new URL('/mandala-examples.json', request.url)));
  assert(response.ok, 503, 'examples_unavailable', 'The examples file is not deployed.');
  const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  return ((await response.json()).examples || []).filter(e => /^[a-z0-9-]{1,64}$/.test(e.id || '') && ['zh', 'en'].includes(e.locale) && text(e.chart?.title, 200) && Array.isArray(e.chart?.themes))
    .map(e => ({ id: e.id, locale: e.locale, tags: (e.tags || []).filter(t => TAGS.includes(t)).slice(0, 3), chart: { title: text(e.chart.title, 200), goal: text(e.chart.goal, 500),
      themes: e.chart.themes.slice(0, 8).map(t => ({ title: text(t.title, 200), actions: (t.actions || []).slice(0, 8).map(a => ({ text: text(a.text, 500) })) })) } }));
}
// Shared chart pages get their own title and preview text so links unfurl
// with the chart, but stay out of search indexes.
async function sharePage(request, env, mode, repo, id) {
  const response = await env.ASSETS.fetch(new Request(new URL('/', request.url), request));
  let html = await response.text(); let title = 'Mandala'; let description = '';
  try { const chart = await repo.publicGet(null, id); title = `${chart.title}｜九宮格目標規劃`; description = `${chart.author?.brand ? '九宮格範例' : `${chart.author?.nickname ?? ''}的目標`}：${chart.goal}`.slice(0, 160); } catch { /* unknown or hidden charts get the generic page */ }
  const meta = `<meta name="robots" content="noindex"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(new URL(request.url).href)}"><meta property="og:image" content="${escapeHtml(new URL('/icon.png', request.url).href)}"><meta name="twitter:card" content="summary">`;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`).replace('</head>', `${meta}</head>`);
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
function aiEnabled(env, mode) { return mode === 'demo' || (mode === 'live' && liveModelGate(env) && budget(env, mode).dailyLimitMicros > 0 && budget(env, mode).monthlyLimitMicros > 0); }
function publicJob(job) {
  return { id: job.id, status: job.status, ...(job.status === 'completed' ? { result: job.result } : {}), ...(['failed', 'unknown'].includes(job.status) ? { error: { code: job.error || 'job_failed', message: job.status === 'unknown' ? 'The provider outcome is unknown. This operation will not be sent again automatically.' : 'The operation failed. Reserved credits were released.' } } : {}) };
}
function attachCookies(response, values) { for (const value of values) response.headers.append('Set-Cookie', value); return response; }
function redirect(answer) { const response = new Response(null, { status: 303, headers: { Location: answer.location, 'Cache-Control': 'no-store' } }); return attachCookies(response, answer.cookies || []); }
function secureResponse(response, mode) {
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  headers.set('Referrer-Policy', 'no-referrer'); headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (mode === 'live') headers.set('Strict-Transport-Security', 'max-age=31536000');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** Dependencies are explicit test seams, never environment-controlled fallbacks. */
export function createApplication({ repo: injectedRepo, engine = domain, fetchImpl = fetch, clock = Date.now } = {}) {
  return async function application(request, env, ctx = {}) {
    let context;
    try {
      const url = new URL(request.url); const mode = modeFor(request, env); const now = clock();
      const origin = mode === 'demo' ? url.origin : env.APP_ORIGIN;
      if (mode === 'live') assert(origin && new URL(origin).origin === origin && url.origin === origin && url.protocol === 'https:', 503, 'origin_configuration_invalid', 'The application origin is not configured.');
      const path = url.pathname.replace(/\/$/, '') || '/';
      if (!path.startsWith('/api/')) {
        const share = path.match(/^\/mandala\/p\/([0-9a-f-]{36})$/);
        if (share && env.ASSETS?.fetch && mode !== 'disabled' && UUID.test(share[1])) return secureResponse(await sharePage(request, env, mode, injectedRepo || repository(env, mode, fetchImpl, clock), share[1]), mode);
        if (env.ASSETS?.fetch) return secureResponse(await env.ASSETS.fetch(request), mode);
        return secureResponse(json({ error: { code: 'not_found', message: 'Not found.' } }, 404), mode);
      }
      if (path === '/api/config' && request.method === 'GET') return secureResponse(json({ mode, authEnabled: authEnabled(env, mode), billingEnabled: billingEnabled(env, mode), turnstileSiteKey: mode === 'live' ? env.TURNSTILE_SITE_KEY || null : null, googleSignIn: googleEnabled(env, mode), mandalaTrial: aiEnabled(env, mode) && Object.values(mandalaTrialLimits(env)).every(n => n > 0), mandalaLimits: { dailyCharts: mandalaTrialLimits(env).mandalaOwnerDailyCharts, inviteCharts: mandalaTrialLimits(env).mandalaInviteCharts, invitesPerDay: inviteLimits(env).dailyLimit }, invites: authEnabled(env, mode) && Object.values(inviteLimits(env)).every(n => n > 0), models: aiEnabled(env, mode) ? engine.MODEL_REGISTRY : {} }), mode);
      assert(mode !== 'disabled', 503, 'service_disabled', 'The hosted service is not enabled.');
      const repo = injectedRepo || repository(env, mode, fetchImpl, clock);
      if (path === '/api/webhooks/paddle' && request.method === 'POST') {
        assert(mode === 'live' && billingEnabled(env, mode), 503, 'billing_disabled', 'Sandbox billing is not configured.');
        const event = await verifyPaddle(request, env.PADDLE_WEBHOOK_SECRET, now);
        return secureResponse(json(await applyPaddleEvent(event, { env, repo, now })), mode);
      }
      context = await browserContext(request, env, mode, now);
      let session = await loadSession(context, env, mode, repo, fetchImpl, now);
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        sameOrigin(request, origin);
        assert(constantTimeEqual(request.headers.get('X-CSRF-Token'), session?.csrf || context.browser.csrf), 403, 'csrf_rejected', 'Refresh the session and send its CSRF token.');
      }
      let response;
      if (path === '/api/session' && request.method === 'GET') {
        const guest = session ? null : await loadGuest(context, mode, repo, now);
        const entitlements = session ? await repo.entitlements(session.user.id) : structuredClone(EMPTY);
        if (guest) {
          entitlements.studio.credits = guest.remainingAnalyses + guest.remainingGenerations;
          entitlements.studio.limits = { ...entitlements.studio.limits, analyses: guest.remainingAnalyses, generations: guest.remainingGenerations, expiresAt: guest.expiresAt };
        }
        response = json({ user: session?.user || null, csrfToken: session?.csrf || context.browser.csrf, entitlements, guest: guest ? { invite: guest.invite === true, expiresAt: guest.expiresAt } : null });
      } else if (path === '/api/auth/login' && request.method === 'GET') {
        assert(request.headers.get('Sec-Fetch-Site') !== 'cross-site', 403, 'origin_rejected', 'Start sign-in from this application.');
        const answer = await beginLogin(context, env, mode, origin, repo, now);
        await convertInvite(repo, context, answer.userId); response = redirect(answer);
      } else if (path === '/api/auth/callback' && request.method === 'GET') {
        const answer = await completeLogin(request, context, env, mode, repo, fetchImpl, now);
        await convertInvite(repo, context, answer.userId); response = redirect(answer);
      } else if (path === '/api/auth/logout' && request.method === 'POST') {
        response = json({ ok: true }); response.headers.append('Set-Cookie', await logout(session, context, env, mode, repo, fetchImpl));
      } else if (path === '/api/guest' && request.method === 'POST') {
        const body = await readJson(request, 8192); onlyKeys(body, ['turnstileToken']);
        assert(!session, 409, 'already_signed_in', 'The signed-in account has its own allowance.');
        const result = await createGuest(request, context, env, mode, repo, fetchImpl, now, body.turnstileToken);
        response = json({ guest: { expiresAt: result.guest.expiresAt } }, 201);
        if (result.cookie) response.headers.append('Set-Cookie', result.cookie);
      } else if (path === '/api/jobs' && request.method === 'POST') {
        assert(aiEnabled(env, mode), 503, 'ai_disabled', 'AI is not enabled or its platform budget is unavailable.');
        const body = await readJson(request); const validated = await engine.validateJobRequest(body);
        assert(mode === 'demo' || (validated.provider === 'openai' ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY), 503, 'provider_unavailable', 'The selected provider is not configured.');
        const guest = session ? null : await loadGuest(context, mode, repo, now);
        assert(session || guest, 401, 'trial_or_sign_in_required', 'Start the browser trial or sign in.');
        const owner = session ? { userId: session.user.id } : { guestId: guest.id };
        assert(mode === 'demo' || env.JOB_WORKFLOW?.create, 503, 'workflow_unavailable', 'The background worker is not configured.');
        const credits = engine.creditCost(validated); const estimate = engine.estimateCostUsd(validated);
        assert(Number.isInteger(credits) && credits > 0 && Number.isFinite(estimate) && estimate > 0, 503, 'cost_configuration_invalid', 'The operation cost is unavailable.');
        const job = await repo.reserveJob({ owner, key: idempotencyKey(request), requestHash: await sha256(stableJson(validated)), request: validated, creditCost: credits, reservedMicros: Math.ceil(estimate * 1e6), ...budget(env, mode) });
        if (job.created) {
          if (mode === 'demo') {
            const work = runJob(job.id, env, { repo, engine, fetchImpl, mode });
            if (ctx.waitUntil) ctx.waitUntil(work); else await work;
          } else {
            // Creation can time out after acceptance. The stable workflow ID prevents a second job.
            try { await env.JOB_WORKFLOW.create({ id: job.id, params: { jobId: job.id } }); }
            catch { /* keep queued; polling and reconciliation expose the persisted state */ }
          }
        }
        if (session && validated.product === 'mandala') await touch(repo, session.user.id);
        response = json({ job: { id: job.id, status: job.status } }, 202);
      } else if (/^\/api\/jobs\/[^/]+$/.test(path) && request.method === 'GET') {
        const guest = session ? null : await loadGuest(context, mode, repo, now);
        assert(session || guest, 401, 'sign_in_required', 'Sign in or restart the trial session.');
        response = json({ job: publicJob(await repo.jobGet(path.split('/').at(-1), session ? { userId: session.user.id } : { guestId: guest.id })) });
      } else if (path === '/api/documents' && request.method === 'GET') {
        const userId = requireUser(session); const product = url.searchParams.get('product'); const kind = url.searchParams.get('kind');
        assert(productKind(product, kind), 400, 'invalid_document_kind', 'Choose a valid product and document kind.');
        response = json({ documents: await repo.documentList(userId, product, kind) });
      } else if (path === '/api/documents' && request.method === 'POST') {
        const userId = requireUser(session); const body = await readJson(request); onlyKeys(body, ['product', 'kind', 'title', 'data']);
        assert(productKind(body.product, body.kind), 400, 'invalid_document_kind', 'Choose a valid product and document kind.');
        response = json({ document: await repo.documentCreate(userId, await engine.validateDocument(body)) }, 201);
        if (body.product === 'mandala') await touch(repo, userId);
      } else if (/^\/api\/documents\/[^/]+\/versions$/.test(path) && request.method === 'GET') {
        response = json({ versions: await repo.documentVersions(requireUser(session), path.split('/').at(-2)) });
      } else if (/^\/api\/documents\/[^/]+$/.test(path)) {
        const userId = requireUser(session); const id = path.split('/').at(-1);
        if (request.method === 'GET') response = json({ document: await repo.documentGet(userId, id) });
        else if (request.method === 'DELETE') { await repo.documentDelete(userId, id); response = json({ ok: true }); }
        else if (request.method === 'PUT') {
          const body = await readJson(request); onlyKeys(body, ['title', 'data', 'revision']);
          assert(Number.isInteger(body.revision) && body.revision > 0, 400, 'invalid_revision', 'Supply the current document revision.');
          const current = await repo.documentGet(userId, id);
          const validated = await engine.validateDocument({ product: current.product, kind: current.kind, title: body.title, data: body.data });
          response = json({ document: await repo.documentUpdate(userId, id, { ...validated, revision: body.revision }) });
          if (current.product === 'mandala') await touch(repo, userId);
        }
      } else if (['/api/billing/checkout', '/api/billing/portal'].includes(path) && request.method === 'POST') {
        const userId = requireUser(session); const body = await readJson(request, 1024); onlyKeys(body, ['product']);
        assert(['studio', 'mandala'].includes(body.product), 400, 'invalid_product', 'Choose a product.');
        assert(billingEnabled(env, mode), 503, 'billing_disabled', 'Sandbox billing is not configured.');
        const args = { userId, product: body.product, env, repo, fetchImpl, origin };
        response = json({ url: path.endsWith('/checkout') ? await createCheckout({ ...args, key: idempotencyKey(request) }) : await createPortal(args) });
      } else if (path === '/api/invites' && request.method === 'GET') {
        response = json({ invites: await repo.inviteList(requireUser(session)) });
      } else if (path === '/api/invites' && request.method === 'POST') {
        const userId = requireUser(session); const limits = inviteLimits(env);
        assert(Object.values(limits).every(n => n > 0), 503, 'invites_disabled', 'Invites are not enabled.');
        const invite = await repo.inviteCreate({ userId, code: inviteCode(), browserHash: await sha256(context.browser.id), ...limits });
        const link = new URL('/mandala', origin); link.searchParams.set('invite', invite.code);
        response = json({ invite: { ...invite, url: link.href } }, 201);
      } else if (path === '/api/invites/redeem' && request.method === 'POST') {
        const body = await readJson(request, 8192); onlyKeys(body, ['code', 'turnstileToken']);
        assert(!session, 409, 'already_signed_in', 'The signed-in account has its own allowance.');
        const result = await redeemInvite(request, context, env, mode, repo, fetchImpl, now, body);
        response = json({ guest: { invite: true, expiresAt: result.guest.expiresAt } }, 201);
        response.headers.append('Set-Cookie', result.cookie);
      } else if (path === '/api/account' && request.method === 'DELETE') {
        await repo.accountDelete(requireUser(session));
        response = json({ ok: true }); response.headers.append('Set-Cookie', await logout(session, context, env, mode, repo, fetchImpl));
      } else if (path === '/api/admin/metrics' && request.method === 'GET') {
        // Unknown to everyone but the operators listed in ADMIN_EMAILS.
        assert(isAdmin(env, session), 404, 'not_found', 'Not found.');
        const days = Math.min(180, Math.max(1, Number.parseInt(url.searchParams.get('days') || '30', 10) || 30));
        response = json({ metrics: { ...await repo.metrics(days), feed: await repo.feedMetrics(days) } });
      } else if (path === '/api/admin/public' && request.method === 'GET') {
        assert(isAdmin(env, session), 404, 'not_found', 'Not found.');
        response = json({ charts: await repo.publicReviewList() });
      } else if (/^\/api\/admin\/public\/[^/]+$/.test(path) && request.method === 'POST') {
        assert(isAdmin(env, session), 404, 'not_found', 'Not found.');
        const body = await readJson(request, 256); onlyKeys(body, ['hidden']); assert(typeof body.hidden === 'boolean', 400, 'invalid_input', 'Send hidden as true or false.');
        await repo.publicModerate(publicId(path.split('/').at(-1)), body.hidden); response = json({ ok: true });
      } else if (path === '/api/admin/examples' && request.method === 'POST') {
        assert(isAdmin(env, session), 404, 'not_found', 'Not found.');
        response = json({ seeded: await repo.publicSeed(await exampleRows(request, env)) });
      } else if (path === '/api/profile' && request.method === 'GET') {
        response = json({ profile: await repo.profileGet(requireUser(session)) });
      } else if (path === '/api/profile' && request.method === 'PUT') {
        const userId = requireUser(session); response = json({ profile: await repo.profileSet(userId, profileBody(await readJson(request, 1024))) });
      } else if (path === '/api/feed' && request.method === 'GET') {
        const userId = requireUser(session);
        const q = name => url.searchParams.get(name) || undefined;
        const sort = q('sort') || 'new'; const window = q('window') || '7d'; const source = q('source') || 'all'; const lang = q('lang'); const tag = q('tag'); const offset = Number.parseInt(q('offset') || '0', 10);
        assert(['new', 'hot', 'copied', 'done'].includes(sort) && ['7d', '30d', 'all'].includes(window) && ['all', 'users', 'examples'].includes(source) && (lang === undefined || ['zh', 'en'].includes(lang))
          && (tag === undefined || TAGS.includes(tag)) && Number.isInteger(offset) && offset >= 0 && offset <= 500, 400, 'invalid_input', 'Unsupported feed query.');
        if (mode === 'demo' && !repo.examplesSeeded && env.ASSETS?.fetch) await repo.publicSeed(await exampleRows(request, env));
        response = json({ items: await repo.publicFeed(userId, { sort, window, source, lang, tag, offset, limit: 20 }) });
      } else if (path === '/api/public/mine' && request.method === 'GET') {
        response = json({ charts: await repo.publicMine(requireUser(session)) });
      } else if (path === '/api/public' && request.method === 'POST') {
        const userId = requireUser(session); const body = await readJson(request, 1024); onlyKeys(body, ['documentId', 'tags']);
        assert(UUID.test(body.documentId || '') && Array.isArray(body.tags) && body.tags.length <= 3 && body.tags.every(t => TAGS.includes(t)), 400, 'invalid_input', 'Choose a saved chart and up to three categories.');
        const chart = await repo.publicPublish(userId, { documentId: body.documentId, tags: [...new Set(body.tags)] });
        response = json({ chart: { ...chart, url: new URL(`/mandala/p/${chart.id}`, origin).href } }, 201);
        await touch(repo, userId);
      } else if (/^\/api\/public\/[^/]+$/.test(path) && request.method === 'GET') {
        const id = publicId(path.split('/').at(-1)); const chart = await repo.publicGet(session?.user.id || null, id);
        // Signed-in opens count once a day; views only break ranking ties.
        if (session?.user.id && !chart.mine) { try { chart.views += await repo.publicView(session.user.id, id) ? 1 : 0; } catch { /* best effort */ } }
        response = json({ chart });
      } else if (/^\/api\/public\/[^/]+$/.test(path) && request.method === 'DELETE') {
        await repo.publicUnpublish(requireUser(session), publicId(path.split('/').at(-1))); response = json({ ok: true });
      } else if (/^\/api\/public\/[^/]+\/(encourage|copy|report)$/.test(path) && request.method === 'POST') {
        const userId = requireUser(session); const parts = path.split('/'); const id = publicId(parts.at(-2)); const action = parts.at(-1);
        const body = await readJson(request, 256);
        if (action === 'encourage') { onlyKeys(body, ['on']); assert(typeof body.on === 'boolean', 400, 'invalid_input', 'Send on as true or false.'); response = json({ chart: await repo.publicEncourage(userId, id, body.on) }); }
        else if (action === 'copy') { onlyKeys(body, []); response = json({ chart: await repo.publicCopy(userId, id) }); await touch(repo, userId); }
        else { onlyKeys(body, ['reason']); assert(['personal_data', 'harmful', 'spam', 'other'].includes(body.reason), 400, 'invalid_input', 'Choose a report reason.'); await repo.publicReport(userId, id, body.reason); response = json({ ok: true }); }
      } else if (path === '/api/events' && request.method === 'POST') {
        const body = await readJson(request, 1024); onlyKeys(body, ['name', 'product', 'templateId']);
        const templateIds = new Set((env.TELEMETRY_TEMPLATE_IDS || 'message,weekly,compare').split(','));
        assert(EVENTS.has(body.name) && ['studio', 'mandala'].includes(body.product) && (body.templateId === undefined || templateIds.has(body.templateId)), 400, 'invalid_event', 'This event is not supported.');
        await repo.recordEvent(session?.user.id || null, body.name, body.product, body.templateId || null); response = json({ ok: true });
      }
      return secureResponse(attachCookies(response || json({ error: { code: 'not_found', message: 'Not found.' } }, 404), context.headers), mode);
    } catch (error) { return secureResponse(attachCookies(safeError(error), context?.headers || []), env.APP_MODE); }
  };
}

export const handleRequest = createApplication();

export async function runJob(id, env, { repo, engine = domain, fetchImpl = fetch, mode = env.APP_MODE } = {}) {
  assert(mode === 'live' || mode === 'demo', 503, 'service_disabled', 'Job execution is disabled.');
  repo ||= repository(env, mode, fetchImpl, Date.now);
  const job = await repo.jobClaim(id);
  if (!job?.claimed) return { id, status: job?.status || 'missing' };
  let dispatched = false; let providerCalls = 0; let successfulResponse = false;
  try {
    const checkGate = () => assert(aiEnabled(env, mode), 503, 'ai_disabled', 'AI approval or its platform budget is no longer available.');
    checkGate();
    const guardedFetch = async (input, options) => {
      const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
      assert(url.protocol === 'https:' && ((url.hostname === 'api.openai.com' && ['/v1/responses', '/v1/chat/completions', '/v1/decisions'].includes(url.pathname)) || (url.hostname === 'api.anthropic.com' && url.pathname === '/v1/messages')), 400, 'provider_url_rejected', 'The provider URL is unsupported.');
      assert(mode === 'live', 503, 'demo_provider_forbidden', 'Demo cannot call an AI provider.');
      checkGate();
      if (!dispatched) { await repo.jobDispatched(id); dispatched = true; }
      // Persisting the marker can await a DB lock. Recheck after that await,
      // immediately before invoking fetch, including every subsequent check.
      checkGate();
      providerCalls++;
      const response = await fetchImpl(input, { ...options, redirect: 'error' });
      if (response.ok) successfulResponse = true;
      return response;
    };
    const result = await engine.executeJob(job.request, { env: { ...env, APP_MODE: mode }, fetchImpl: guardedFetch });
    const actual = result?.actualCostUsd;
    const micros = Number.isFinite(actual) && actual >= 0 ? Math.ceil(actual * 1e6) : null;
    await repo.jobFinish(id, 'completed', result, null, micros);
    return { id, status: 'completed' };
  } catch (error) {
    // A known rejection of a later check must not refund a successful generation.
    const definite = providerCalls === 0 || (error?.definitiveFailure === true && providerCalls === 1 && !successfulResponse);
    const status = definite ? 'failed' : 'unknown';
    await repo.jobFinish(id, status, null, definite ? 'operation_rejected' : 'provider_outcome_unknown', definite ? 0 : null);
    return { id, status };
  }
}

export async function cleanup(env) {
  if (!['live', 'demo'].includes(env.APP_MODE)) return { skipped: true };
  return repository(env, env.APP_MODE, fetch, Date.now).cleanup();
}
