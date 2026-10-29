import * as domain from '../domain/index.mjs';
import { liveModelGate } from '../domain/providers.mjs';
import { assert, modeFor, sameOrigin, constantTimeEqual, readJson, onlyKeys, idempotencyKey, sha256, stableJson, json, safeError } from './security.mjs';
import { browserContext, loadSession, beginLogin, completeLogin, logout, createGuest, loadGuest, authEnabled } from './auth.mjs';
import { billingEnabled, createCheckout, createPortal, verifyPaddle, applyPaddleEvent } from './billing.mjs';
import { PostgrestRepository } from './repository.mjs';
import { DemoRepository } from './demo-repository.mjs';

const demos = new WeakMap();
const EVENTS = new Set(['page_view', 'template_selected', 'analysis_started', 'generation_started', 'evaluation_viewed', 'signup_started', 'checkout_started', 'document_saved', 'job_started', 'job_completed', 'mandala_action_toggled']);
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
  return { dailyLimitMicros: Math.floor(daily * 1e6), monthlyLimitMicros: Math.floor(monthly * 1e6), trialDailyLimitMicros: Math.floor(trial * 1e6) };
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
        if (env.ASSETS?.fetch) return secureResponse(await env.ASSETS.fetch(request), mode);
        return secureResponse(json({ error: { code: 'not_found', message: 'Not found.' } }, 404), mode);
      }
      if (path === '/api/config' && request.method === 'GET') return secureResponse(json({ mode, authEnabled: authEnabled(env, mode), billingEnabled: billingEnabled(env, mode), turnstileSiteKey: mode === 'live' ? env.TURNSTILE_SITE_KEY || null : null, models: aiEnabled(env, mode) ? engine.MODEL_REGISTRY : {} }), mode);
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
        response = json({ user: session?.user || null, csrfToken: session?.csrf || context.browser.csrf, entitlements });
      } else if (path === '/api/auth/login' && request.method === 'GET') {
        assert(request.headers.get('Sec-Fetch-Site') !== 'cross-site', 403, 'origin_rejected', 'Start sign-in from this application.');
        response = redirect(await beginLogin(context, env, mode, origin, repo, now));
      } else if (path === '/api/auth/callback' && request.method === 'GET') {
        response = redirect(await completeLogin(request, context, env, mode, repo, fetchImpl, now));
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
        }
      } else if (['/api/billing/checkout', '/api/billing/portal'].includes(path) && request.method === 'POST') {
        const userId = requireUser(session); const body = await readJson(request, 1024); onlyKeys(body, ['product']);
        assert(['studio', 'mandala'].includes(body.product), 400, 'invalid_product', 'Choose a product.');
        assert(billingEnabled(env, mode), 503, 'billing_disabled', 'Sandbox billing is not configured.');
        const args = { userId, product: body.product, env, repo, fetchImpl, origin };
        response = json({ url: path.endsWith('/checkout') ? await createCheckout({ ...args, key: idempotencyKey(request) }) : await createPortal(args) });
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
