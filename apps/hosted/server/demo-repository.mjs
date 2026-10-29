import { HttpError } from './security.mjs';

const fail = (code, status = 409) => { throw new HttpError(status, code, code.replaceAll('_', ' ')); };
const clone = value => value == null ? value : structuredClone(value);
const sameOwner = (a, b) => a?.userId ? a.userId === b?.userId : a?.guestId && a.guestId === b?.guestId;
const ownerKey = owner => owner.userId ? `u:${owner.userId}` : `g:${owner.guestId}`;
const monthTaipei = now => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit' }).format(new Date(now));

/** Explicit synthetic loopback storage, also injectable for isolated boundary tests.
 * It is never selected as fallback by live mode. Data disappears on process exit. */
export class DemoRepository {
  constructor({ clock = Date.now } = {}) {
    this.clock = clock; this.sessions = new Map(); this.guests = new Map(); this.trials = new Map();
    this.jobs = new Map(); this.jobKeys = new Map(); this.credits = new Map(); this.budgets = new Map();
    this.documents = new Map(); this.versions = new Map(); this.checkouts = new Map(); this.checkoutKeys = new Map();
    this.subscriptions = new Map(); this.billingLinks = new Map(); this.payments = new Map(); this.webhooks = new Map(); this.events = new Map();
  }
  async sessionGet(id) { const s = this.sessions.get(id); return s && Date.parse(s.expiresAt) > this.clock() ? clone(s) : null; }
  async sessionCreate(value) { this.sessions.set(value.id, clone(value)); return true; }
  async sessionDelete(id) { this.sessions.delete(id); return true; }
  async sessionRefreshClaim(id) {
    const s = this.sessions.get(id); if (!s) fail('session_expired', 401);
    if (s.refreshUntil > this.clock()) fail('session_busy'); s.refreshUntil = this.clock() + 30000; return true;
  }
  async sessionRefresh(id, tokens, expiresAt) { const s = this.sessions.get(id); if (!s) fail('session_expired', 401); Object.assign(s, { tokens, accessExpiresAt: expiresAt, refreshUntil: null }); return true; }
  async guestGet(id) { const guest = this.guests.get(id); return guest && Date.parse(guest.expiresAt) > this.clock() ? { ...clone(guest), remainingAnalyses: Math.max(0, 1 - (this.credits.get(`g:${id}:analyze`) || 0)), remainingGenerations: Math.max(0, 1 - (this.credits.get(`g:${id}:generate`) || 0)) } : null; }
  async guestCreate(value) {
    const now = this.clock(); const day = new Date(now).toISOString().slice(0, 10);
    if (this.trials.has(value.browserHash)) fail('guest_limit', 429);
    const today = [...this.trials.values()].filter(v => v.day === day);
    if (today.length >= value.globalDailyLimit || today.filter(v => v.ipHash === value.ipHash).length >= value.ipDailyLimit) fail('guest_limit', 429);
    this.trials.set(value.browserHash, { ...clone(value), day, createdAt: now });
    const guest = { id: value.id, expiresAt: value.expiresAt };
    this.guests.set(value.id, guest); return this.guestGet(value.id);
  }
  plan(userId, product) {
    const s = this.subscriptions.get(`${userId}:${product}`);
    if (s?.periodEnd && Date.parse(s.periodEnd) > this.clock() && Date.parse(s.periodStart) <= this.clock() && !s.revoked && s.paymentId && !this.payments.get(s.paymentId)?.refunded) return { plan: 'pro', period: s.periodStart, allowance: product === 'studio' ? 200 : 100 };
    return { plan: 'free', period: monthTaipei(this.clock()), allowance: product === 'studio' ? 20 : 0 };
  }
  async entitlements(userId) {
    const answer = {};
    for (const product of ['studio', 'mandala']) {
      const plan = this.plan(userId, product); const used = this.credits.get(`${userId}:${product}:${plan.period}`) || 0;
      answer[product] = { plan: plan.plan, credits: Math.max(0, plan.allowance - used), limits: product === 'studio' ? { works: plan.plan === 'pro' ? 100 : 5, templates: plan.plan === 'pro' ? 50 : 3, goals: 0 } : { works: 0, templates: 0, goals: plan.plan === 'pro' ? 20 : 1 } };
    }
    return answer;
  }
  async reserveJob(value) {
    const key = `${ownerKey(value.owner)}:${value.key}`;
    const existing = this.jobs.get(this.jobKeys.get(key));
    if (existing) { if (existing.requestHash !== value.requestHash) fail('idempotency_conflict'); return { ...clone(existing), created: false }; }
    let creditKey; let allowance;
    if (value.owner.userId) {
      const plan = this.plan(value.owner.userId, value.request.product);
      creditKey = `${value.owner.userId}:${value.request.product}:${plan.period}`; allowance = plan.allowance;
      if ((this.credits.get(creditKey) || 0) + value.creditCost > allowance) fail('quota_exceeded', 402);
    } else {
      const guest = this.guests.get(value.owner.guestId);
      if (!guest || Date.parse(guest.expiresAt) <= this.clock() || value.request.product !== 'studio' || value.request.mode !== 'standard' || !['analyze', 'generate'].includes(value.request.operation)) fail('guest_limit', 429);
      creditKey = `${ownerKey(value.owner)}:${value.request.operation}`;
      if ((this.credits.get(creditKey) || 0) >= 1) fail('guest_limit', 429);
    }
    const now = new Date(this.clock()).toISOString();
    const budgets = [[`day:${now.slice(0, 10)}`, value.dailyLimitMicros], [`month:${now.slice(0, 7)}`, value.monthlyLimitMicros]];
    if (value.owner.guestId) budgets.push([`trial:${now.slice(0, 10)}`, value.trialDailyLimitMicros]);
    for (const [period, limit] of budgets) if (!(limit > 0) || (this.budgets.get(period) || 0) + value.reservedMicros > limit) fail('budget_exceeded', 503);
    this.credits.set(creditKey, (this.credits.get(creditKey) || 0) + value.creditCost);
    for (const [period] of budgets) this.budgets.set(period, (this.budgets.get(period) || 0) + value.reservedMicros);
    const job = { ...clone(value), id: crypto.randomUUID(), status: 'queued', createdAt: now, updatedAt: now, creditKey, budgets: budgets.map(([period]) => period), dispatched: false };
    this.jobs.set(job.id, job); this.jobKeys.set(key, job.id); return { ...clone(job), created: true };
  }
  async jobGet(id, owner) { const job = this.jobs.get(id); if (!job || !sameOwner(job.owner, owner)) fail('not_found', 404); return clone(job); }
  async jobClaim(id) {
    const job = this.jobs.get(id); if (!job) return null;
    if (job.status !== 'queued' || (job.owner.guestId && Date.parse(this.guests.get(job.owner.guestId)?.expiresAt) <= this.clock())) return { ...clone(job), claimed: false };
    job.status = 'running'; job.updatedAt = new Date(this.clock()).toISOString(); return { ...clone(job), claimed: true };
  }
  async jobDispatched(id) { const job = this.jobs.get(id); if (!job || job.status !== 'running' || (job.owner.guestId && Date.parse(this.guests.get(job.owner.guestId)?.expiresAt) <= this.clock())) fail('not_found', 404); job.dispatched = true; job.updatedAt = new Date(this.clock()).toISOString(); return true; }
  async jobFinish(id, status, result, error, actualMicros) {
    const job = this.jobs.get(id); if (!job || ['completed', 'failed', 'unknown'].includes(job.status)) return false;
    if (!['completed', 'failed', 'unknown'].includes(status)) fail('invalid_status');
    const cost = status === 'failed' ? 0 : status === 'unknown' || actualMicros == null ? job.reservedMicros : Math.max(0, actualMicros);
    const delta = cost - job.reservedMicros;
    for (const period of job.budgets) this.budgets.set(period, (this.budgets.get(period) || 0) + delta);
    if (status === 'failed') this.credits.set(job.creditKey, Math.max(0, this.credits.get(job.creditKey) - job.creditCost));
    Object.assign(job, { status, result: clone(result), error, actualMicros: cost, updatedAt: new Date(this.clock()).toISOString() }); return true;
  }
  ownedDocument(userId, id) { const doc = this.documents.get(id); if (!doc || doc.userId !== userId) fail('not_found', 404); return doc; }
  async documentList(userId, product, kind) { return clone([...this.documents.values()].filter(v => v.userId === userId && v.product === product && v.kind === kind).map(({ userId: _u, ...doc }) => doc)); }
  async documentGet(userId, id) { const { userId: _u, ...doc } = this.ownedDocument(userId, id); return clone(doc); }
  async documentCreate(userId, value) {
    const limits = (await this.entitlements(userId))[value.product].limits;
    const limit = limits[{ work: 'works', template: 'templates', goal: 'goals' }[value.kind]];
    if ([...this.documents.values()].filter(v => v.userId === userId && v.product === value.product && v.kind === value.kind).length >= limit) fail('document_limit', 403);
    const doc = { ...clone(value), id: crypto.randomUUID(), userId, revision: 1, updatedAt: new Date(this.clock()).toISOString() };
    this.documents.set(doc.id, doc); this.versions.set(doc.id, [{ revision: 1, data: clone(doc.data), createdAt: doc.updatedAt }]);
    return this.documentGet(userId, doc.id);
  }
  async documentUpdate(userId, id, value) {
    const doc = this.ownedDocument(userId, id); if (doc.revision !== value.revision) fail('stale_revision');
    Object.assign(doc, { title: value.title, data: clone(value.data), revision: doc.revision + 1, updatedAt: new Date(this.clock()).toISOString() });
    this.versions.get(id).push({ revision: doc.revision, data: clone(doc.data), createdAt: doc.updatedAt });
    if (this.versions.get(id).length > 100) this.versions.get(id).splice(0, this.versions.get(id).length - 100);
    return this.documentGet(userId, id);
  }
  async documentDelete(userId, id) { this.ownedDocument(userId, id); this.documents.delete(id); this.versions.delete(id); return true; }
  async documentVersions(userId, id) { const doc = this.ownedDocument(userId, id); if (this.plan(userId, doc.product).plan !== 'pro') fail('pro_required', 403); return clone(this.versions.get(id)); }
  async checkoutBegin(userId, product, key) {
    const k = `${userId}:${key}`; const existing = this.checkouts.get(this.checkoutKeys.get(k));
    if (existing) { if (existing.product !== product) fail('idempotency_conflict'); return { ...clone(existing), created: false }; }
    if (this.plan(userId, product).plan === 'pro') fail('billing_conflict');
    if ([...this.checkouts.values()].some(c => c.userId === userId && c.product === product && ['pending', 'unknown', 'completed'].includes(c.status) && c.createdAt > this.clock() - 86400000)) fail('checkout_pending');
    const checkout = { id: crypto.randomUUID(), userId, product, status: 'pending', createdAt: this.clock() };
    this.checkouts.set(checkout.id, checkout); this.checkoutKeys.set(k, checkout.id); return { ...clone(checkout), created: true };
  }
  async checkoutFinish(id, status, transactionId, url) { const c = this.checkouts.get(id); if (!c) fail('not_found', 404); if (c.status === 'completed') return true; Object.assign(c, { status, transactionId, url }); return true; }
  async billingAccount(userId, product) { return clone(this.subscriptions.get(`${userId}:${product}`) || null); }
  async billingLookup(transactionId, subscriptionId) {
    const payment = this.payments.get(transactionId); if (payment) return { userId: payment.userId, product: payment.product };
    const subscription = this.billingLinks.get(subscriptionId);
    return subscription ? { userId: subscription.userId, product: subscription.product } : null;
  }
  async webhookApply(event) {
    if (this.webhooks.has(event.id)) return { received: true, duplicate: true };
    let checkout;
    if (event.checkoutId) {
      const c = this.checkouts.get(event.checkoutId);
      if (!c || c.userId !== event.userId || c.product !== event.product || (c.transactionId && event.transactionId && c.transactionId !== event.transactionId)) fail('billing_conflict');
      checkout = c;
    }
    if (event.action === 'ignored') { this.webhooks.set(event.id, clone(event)); return { received: true }; }
    const key = `${event.userId}:${event.product}`; const previous = this.subscriptions.get(key);
    let link = this.billingLinks.get(event.subscriptionId);
    if (event.subscriptionId) {
      if (link && (link.userId !== event.userId || link.product !== event.product || link.customerId !== event.customerId)) fail('billing_conflict');
      if (!link) {
        if (!checkout) fail('billing_conflict');
        link = { userId: event.userId, product: event.product, customerId: event.customerId, checkoutId: checkout.id };
        this.billingLinks.set(event.subscriptionId, link);
      }
      checkout ||= this.checkouts.get(link.checkoutId);
    }
    if (event.action === 'refund') {
      const p = this.payments.get(event.transactionId); if (!p) fail('billing_conflict'); p.refunded = true;
      if (previous?.paymentId === event.transactionId) previous.revoked = true;
    } else if (event.action === 'payment') {
      const known = this.payments.get(event.transactionId);
      if (!known) this.payments.set(event.transactionId, { ...clone(event), refunded: false });
      if (checkout && !checkout.transactionId) checkout.transactionId = event.transactionId;
      const canReplace = !previous || previous.subscriptionId === event.subscriptionId || checkout?.createdAt > previous.checkoutCreatedAt;
      if (canReplace && !known?.refunded && (!previous || !previous.revoked || Date.parse(event.occurredAt) > Date.parse(previous.lastEventAt)) && (!previous?.periodStart || Date.parse(event.periodStart) >= Date.parse(previous.periodStart))) {
        this.subscriptions.set(key, { ...clone(event), paymentId: event.transactionId, checkoutCreatedAt: checkout?.createdAt, lastEventAt: previous && Date.parse(previous.lastEventAt) > Date.parse(event.occurredAt) ? previous.lastEventAt : event.occurredAt, revoked: false });
      }
    } else if (!previous || previous.subscriptionId === event.subscriptionId) {
      if (!previous || Date.parse(event.occurredAt) > Date.parse(previous.lastEventAt)) this.subscriptions.set(key, { ...previous, ...clone(event), checkoutCreatedAt: checkout?.createdAt, lastEventAt: event.occurredAt, revoked: event.action === 'revoke' || previous?.revoked || false });
    }
    this.webhooks.set(event.id, clone(event)); return { received: true };
  }
  async recordEvent(_userId, name, product, templateId) { const k = `${new Date(this.clock()).toISOString().slice(0, 10)}:${name}:${product}:${templateId || ''}`; this.events.set(k, Math.min(1000000, (this.events.get(k) || 0) + 1)); return true; }
  async cleanup() {
    const now = this.clock(); let expiredGuests = 0;
    for (const [id, guest] of this.guests) if (Date.parse(guest.expiresAt) <= now) { this.guests.delete(id); expiredGuests++; for (const [jobId, job] of this.jobs) if (job.owner.guestId === id) { this.jobKeys.delete(`${ownerKey(job.owner)}:${job.key}`); this.jobs.delete(jobId); } }
    for (const [id, s] of this.sessions) if (Date.parse(s.expiresAt) <= now) this.sessions.delete(id);
    for (const [id, trial] of this.trials) if (trial.createdAt < now - 30 * 86400000) this.trials.delete(id);
    for (const job of this.jobs.values()) {
      if (job.status === 'running' && Date.parse(job.updatedAt) < now - 20 * 60000) await this.jobFinish(job.id, job.dispatched ? 'unknown' : 'failed', null, job.dispatched ? 'provider_outcome_unknown' : 'dispatch_abandoned', null);
      if (job.status === 'queued' && Date.parse(job.updatedAt) < now - 60 * 60000) await this.jobFinish(job.id, 'failed', null, 'queue_abandoned', null);
    }
    return { expiredGuests };
  }
}
