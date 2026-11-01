import { HttpError } from './security.mjs';
import { MANDALA_TRIAL_OPERATIONS } from '../domain/validation.mjs';

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
    this.identities = new Map(); this.activity = new Set(); this.invites = new Map(); this.redemptions = new Map();
    this.profiles = new Map(); this.publicCharts = new Map(); this.topics = new Map();
  }
  async sessionGet(id) { const s = this.sessions.get(id); return s && Date.parse(s.expiresAt) > this.clock() ? clone(s) : null; }
  async sessionCreate(value) { this.sessions.set(value.id, clone(value)); return true; }
  async sessionDelete(id) { this.sessions.delete(id); return true; }
  async sessionRefreshClaim(id) {
    const s = this.sessions.get(id); if (!s) fail('session_expired', 401);
    if (s.refreshUntil > this.clock()) fail('session_busy'); s.refreshUntil = this.clock() + 30000; return true;
  }
  async sessionRefresh(id, tokens, expiresAt) { const s = this.sessions.get(id); if (!s) fail('session_expired', 401); Object.assign(s, { tokens, accessExpiresAt: expiresAt, refreshUntil: null }); return true; }
  async guestGet(id) { const guest = this.guests.get(id); return guest && Date.parse(guest.expiresAt) > this.clock() ? { ...clone(guest), invite: Boolean(guest.inviteCode), remainingAnalyses: Math.max(0, 1 - (this.credits.get(`g:${id}:analyze`) || 0)), remainingGenerations: Math.max(0, 1 - (this.credits.get(`g:${id}:generate`) || 0)) } : null; }
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
      answer[product] = { plan: plan.plan, credits: Math.max(0, plan.allowance - used), limits: product === 'studio' ? { works: plan.plan === 'pro' ? 100 : 5, templates: plan.plan === 'pro' ? 50 : 3, goals: 0 } : { works: 0, templates: 0, goals: plan.plan === 'pro' ? 20 : 10 } };
    }
    return answer;
  }
  async reserveJob(value) {
    const key = `${ownerKey(value.owner)}:${value.key}`;
    const existing = this.jobs.get(this.jobKeys.get(key));
    if (existing) { if (existing.requestHash !== value.requestHash) fail('idempotency_conflict'); return { ...clone(existing), created: false }; }
    let creditKey; let allowance; let platformKey;
    if (value.request.product === 'mandala' && MANDALA_TRIAL_OPERATIONS.includes(value.request.operation)) {
      if (value.request.mode !== 'standard' || value.creditCost !== 1) fail('trial_limit', 429);
      // Mirrors 0003: guests need an invite and get a lifetime allowance.
      const guest = value.owner.guestId && this.guests.get(value.owner.guestId);
      if (value.owner.guestId && (!guest || Date.parse(guest.expiresAt) <= this.clock())) fail('guest_limit', 429);
      if (guest && !guest.inviteCode) fail('trial_login_required', 403);
      const kind = value.request.operation === 'themes' ? 'charts' : 'calls';
      const day = new Date(this.clock() + 8 * 3600e3).toISOString().slice(0, 10);
      const period = `mandala:trial-${kind}:${day}`;
      const owned = guest ? (kind === 'charts' ? value.mandalaInviteCharts : value.mandalaInviteCalls) : kind === 'charts' ? value.mandalaOwnerDailyCharts : value.mandalaOwnerDailyCalls;
      const platform = kind === 'charts' ? value.mandalaPlatformDailyCharts : value.mandalaPlatformDailyCalls;
      platformKey = `platform:${period}`; creditKey = `${ownerKey(value.owner)}:${guest ? `mandala:trial-${kind}:invite` : period}`;
      if (!(owned > 0) || !(platform > 0) || (this.credits.get(platformKey) || 0) + 1 > platform || (this.credits.get(creditKey) || 0) + 1 > owned) fail('trial_limit', 429);
    } else if (value.owner.userId) {
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
    if (platformKey) this.credits.set(platformKey, (this.credits.get(platformKey) || 0) + 1);
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
  async documentList(userId, product, kind) { return clone([...this.documents.values()].filter(v => v.userId === userId && v.product === product && v.kind === kind).map(({ userId: _u, topicId: _t, ...doc }) => doc)); }
  async documentGet(userId, id) { const { userId: _u, topicId: _t, ...doc } = this.ownedDocument(userId, id); return clone(doc); }
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
  async documentDelete(userId, id) { this.ownedDocument(userId, id); this.documents.delete(id); this.versions.delete(id); for (const [cid, c] of this.publicCharts) if (c.documentId === id) this.publicCharts.delete(cid); return true; }
  async documentVersions(userId, id) { const doc = this.ownedDocument(userId, id); if (doc.product !== 'mandala' && this.plan(userId, doc.product).plan !== 'pro') fail('pro_required', 403); return clone(this.versions.get(id)); }
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
  async userUpsert({ provider, subject, email }) {
    const key = `${provider}:${subject}`; const known = this.identities.get(key);
    if (known) { known.email = email; return { id: known.userId, email, created: false }; }
    const userId = crypto.randomUUID(); this.identities.set(key, { userId, email, createdAt: this.clock() }); return { id: userId, email, created: true };
  }
  async touchActivity(userId) { this.activity.add(`${userId}:${new Date(this.clock() + 8 * 3600e3).toISOString().slice(0, 10)}`); return true; }
  inviteJson(i) { return { code: i.code, createdAt: i.createdAt, expiresAt: i.expiresAt, status: i.convertedUserId ? 'joined' : i.redeemedAt ? 'redeemed' : Date.parse(i.expiresAt) <= this.clock() ? 'expired' : 'open' }; }
  async inviteCreate({ userId, code, browserHash, dailyLimit, openLimit, ttlDays }) {
    const day = new Date(this.clock() + 8 * 3600e3).toISOString().slice(0, 10); const mine = [...this.invites.values()].filter(i => i.inviterId === userId);
    if (mine.filter(i => i.createdDay === day).length >= dailyLimit || mine.filter(i => !i.redeemedAt && Date.parse(i.expiresAt) > this.clock()).length >= openLimit) fail('invite_limit', 429);
    const invite = { code, inviterId: userId, createdBrowserHash: browserHash, createdDay: day, createdAt: new Date(this.clock()).toISOString(), expiresAt: new Date(this.clock() + ttlDays * 86400000).toISOString() };
    this.invites.set(code, invite); return this.inviteJson(invite);
  }
  async inviteList(userId) { return [...this.invites.values()].filter(i => i.inviterId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30).map(i => this.inviteJson(i)); }
  async inviteRedeem({ code, browserHash, ipHash, ipDailyLimit, guestId, expiresAt }) {
    const invite = this.invites.get(code); const day = new Date(this.clock()).toISOString().slice(0, 10);
    if (!invite || invite.redeemedAt || Date.parse(invite.expiresAt) <= this.clock() || invite.createdBrowserHash === browserHash) fail('invite_invalid', 404);
    if (this.redemptions.has(browserHash)) fail('invite_used');
    if ([...this.redemptions.values()].filter(r => r.ipHash === ipHash && r.day === day).length >= ipDailyLimit) fail('guest_limit', 429);
    this.redemptions.set(browserHash, { ipHash, day, code });
    this.guests.set(guestId, { id: guestId, expiresAt, inviteCode: code });
    Object.assign(invite, { redeemedAt: new Date(this.clock()).toISOString(), redeemedBrowserHash: browserHash });
    return this.guestGet(guestId);
  }
  async inviteConvert(browserHash, userId) {
    let changed = false;
    for (const invite of this.invites.values()) if (invite.redeemedBrowserHash === browserHash && !invite.convertedUserId && invite.inviterId !== userId) { invite.convertedUserId = userId; changed = true; }
    return changed;
  }
  async accountDelete(userId) {
    if ([...this.payments.values()].some(p => p.userId === userId)) fail('billing_conflict');
    for (const [id, s] of this.sessions) if (s.user.id === userId) this.sessions.delete(id);
    for (const [id, d] of this.documents) if (d.userId === userId) { this.documents.delete(id); this.versions.delete(id); }
    for (const [key, i] of this.identities) if (i.userId === userId) this.identities.delete(key);
    for (const [code, i] of this.invites) if (i.inviterId === userId) this.invites.delete(code);
    for (const key of this.credits.keys()) if (key.startsWith(`${userId}:`) || key.startsWith(`u:${userId}:`)) this.credits.delete(key);
    for (const key of this.activity) if (key.startsWith(`${userId}:`)) this.activity.delete(key);
    this.profiles.delete(userId);
    for (const [id, t] of this.topics) if (t.userId === userId) this.topics.delete(id);
    for (const [cid, c] of this.publicCharts) { if (c.userId === userId) this.publicCharts.delete(cid); c.encouragedBy.delete(userId); c.copiedBy.delete(userId); c.reports.delete(userId); for (const key of c.views.keys()) if (key.startsWith(`${userId}:`)) c.views.delete(key); }
    return true;
  }
  async metrics(days) {
    const invites = [...this.invites.values()];
    return { synthetic: true, days, signups: this.identities.size, activeUserDays: this.activity.size, invites: { created: invites.length, redeemed: invites.filter(i => i.redeemedAt).length, joined: invites.filter(i => i.convertedUserId).length } };
  }
  // Mirrors 0005_topics.sql.
  topicJson(t) {
    const documents = [...this.documents.values()].filter(d => d.topicId === t.id && d.userId === t.userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(d => ({ id: d.id, product: d.product, kind: d.kind, title: d.title, updatedAt: d.updatedAt }));
    return { id: t.id, title: t.title, updatedAt: t.updatedAt, documents };
  }
  ownedTopic(userId, id) { const t = this.topics.get(id); if (!t || t.userId !== userId) fail('not_found', 404); return t; }
  async topicList(userId) { return [...this.topics.values()].filter(t => t.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(t => this.topicJson(t)); }
  async topicSave(userId, topic) {
    const now = new Date(this.clock()).toISOString(); const title = topic.title.trim();
    if (topic.id) { const t = this.ownedTopic(userId, topic.id); Object.assign(t, { title, updatedAt: now }); return this.topicJson(t); }
    if ([...this.topics.values()].filter(t => t.userId === userId).length >= 200) fail('topic_limit');
    const t = { id: crypto.randomUUID(), userId, title, createdAt: now, updatedAt: now }; this.topics.set(t.id, t); return this.topicJson(t);
  }
  async topicDelete(userId, id) { this.ownedTopic(userId, id); this.topics.delete(id); for (const d of this.documents.values()) if (d.topicId === id) d.topicId = null; return true; }
  async documentSetTopic(userId, documentId, topicId) {
    const t = topicId ? this.ownedTopic(userId, topicId) : null; const doc = this.ownedDocument(userId, documentId);
    doc.topicId = topicId; if (t) t.updatedAt = new Date(this.clock()).toISOString(); return t ? this.topicJson(t) : null;
  }
  async topicExport(userId, id) {
    const t = this.ownedTopic(userId, id);
    return { format: 'intent-galaxy.topic-export', version: 1, exportedAt: new Date(this.clock()).toISOString(), topic: { id: t.id, title: t.title, createdAt: t.createdAt, updatedAt: t.updatedAt },
      documents: [...this.documents.values()].filter(d => d.topicId === t.id && d.userId === userId).map(d => ({ id: d.id, product: d.product, kind: d.kind, title: d.title, revision: d.revision, updatedAt: d.updatedAt, data: clone(d.data) })) };
  }
  // Mirrors 0004_public_feed.sql.
  async profileGet(userId) { return clone(this.profiles.get(userId) ?? null); }
  async profileSet(userId, profile) { this.profiles.set(userId, { nickname: profile.nickname.trim(), avatar: profile.avatar }); return this.profileGet(userId); }
  publicJson(c, viewer) {
    return { id: c.id, title: c.title, goal: c.goal, themes: clone(c.themes), tags: [...c.tags], progress: c.progress, publishedAt: c.publishedAt, updatedAt: c.updatedAt,
      encourages: c.encouragedBy.size, copies: c.copiedBy.size, views: c.views.size, example: Boolean(c.exampleId),
      author: c.exampleId ? { brand: true, avatar: 'brand' } : clone(this.profiles.get(c.userId) ?? null), mine: Boolean(viewer) && c.userId === viewer,
      documentId: c.userId === viewer ? c.documentId : null, encouraged: c.encouragedBy.has(viewer) };
  }
  visible(id, viewer) { const c = this.publicCharts.get(id); if (!c || (c.hidden && (!viewer || c.userId !== viewer))) fail('not_found', 404); return c; }
  async publicPublish(userId, { documentId, tags }) {
    if (!this.profiles.has(userId)) fail('profile_required');
    const doc = this.ownedDocument(userId, documentId); if (doc.product !== 'mandala') fail('not_found', 404);
    if (!doc.data.goal?.trim()) fail('goal_required', 400);
    const themes = doc.data.themes.map(t => ({ title: t.title, actions: t.actions.map(a => ({ text: a.text, done: a.done === true })) }));
    const progress = themes.reduce((n, t) => n + t.actions.filter(a => a.done).length, 0); const now = new Date(this.clock()).toISOString();
    let c = [...this.publicCharts.values()].find(item => item.documentId === documentId);
    if (!c) { c = { id: crypto.randomUUID(), userId, documentId, publishedAt: now, hidden: false, encouragedBy: new Map(), copiedBy: new Map(), reports: new Map(), views: new Map() }; this.publicCharts.set(c.id, c); }
    Object.assign(c, { title: doc.data.title?.trim() || doc.title, goal: doc.data.goal, themes, tags: [...new Set(tags)], progress, updatedAt: now });
    return this.publicJson(c, userId);
  }
  async publicUnpublish(userId, id) { const c = this.publicCharts.get(id); if (!c || c.userId !== userId) fail('not_found', 404); this.publicCharts.delete(id); return true; }
  async publicFeed(viewer, { sort = 'new', tag, offset = 0, limit = 20, window = '7d', source = 'all', lang }) {
    const since = window === 'all' ? -Infinity : this.clock() - (window === '30d' ? 30 : 7) * 86400000; const recent = map => [...map.values()].filter(t => t >= since).length;
    const rank = c => sort === 'hot' ? recent(c.encouragedBy) + 2 * recent(c.copiedBy) : sort === 'copied' ? recent(c.copiedBy) : sort === 'done' ? c.progress : 0;
    const views = c => ['hot', 'copied'].includes(sort) ? recent(c.views) : 0;
    return [...this.publicCharts.values()].filter(c => !c.hidden && (!tag || c.tags.includes(tag)) && (source === 'all' || (source === 'users') === !c.exampleId) && (!c.exampleId || !lang || c.locale === lang))
      .sort((a, b) => rank(b) - rank(a) || views(b) - views(a) || b.publishedAt.localeCompare(a.publishedAt)).slice(offset, offset + limit).map(c => this.publicJson(c, viewer));
  }
  async publicView(userId, id) {
    const c = this.publicCharts.get(id); const key = `${userId}:${new Date(this.clock() + 8 * 3600e3).toISOString().slice(0, 10)}`;
    if (!c || c.hidden || c.userId === userId || c.views.has(key)) return false; c.views.set(key, this.clock()); return true;
  }
  async publicSeed(examples) {
    const now = new Date(this.clock()).toISOString();
    for (const e of examples) {
      let c = [...this.publicCharts.values()].find(item => item.exampleId === e.id);
      if (!c) { c = { id: crypto.randomUUID(), userId: null, exampleId: e.id, documentId: null, publishedAt: now, hidden: false, encouragedBy: new Map(), copiedBy: new Map(), reports: new Map(), views: new Map() }; this.publicCharts.set(c.id, c); }
      Object.assign(c, { locale: e.locale, title: e.chart.title, goal: e.chart.goal, themes: e.chart.themes.map(t => ({ title: t.title, actions: t.actions.map(a => ({ text: a.text, done: false })) })), tags: [...new Set(e.tags || [])], progress: 0, updatedAt: now });
    }
    this.examplesSeeded = true; return examples.length;
  }
  async publicGet(viewer, id) { return this.publicJson(this.visible(id, viewer), viewer); }
  async publicMine(userId) { return [...this.publicCharts.values()].filter(c => c.userId === userId).map(c => ({ ...this.publicJson(c, userId), hidden: c.hidden })); }
  async publicEncourage(userId, id, on) { const c = this.visible(id, null); if (on) { if (!c.encouragedBy.has(userId)) c.encouragedBy.set(userId, this.clock()); } else c.encouragedBy.delete(userId); return this.publicJson(c, userId); }
  async publicCopy(userId, id) { const c = this.visible(id, null); if (c.userId !== userId && !c.copiedBy.has(userId)) c.copiedBy.set(userId, this.clock()); return this.publicJson(c, userId); }
  async publicReport(userId, id, reason) { const c = this.publicCharts.get(id); if (!c || c.userId === userId) fail('not_found', 404); c.reports.set(userId, reason); if (c.reports.size >= 3) c.hidden = true; return true; }
  async publicReviewList() { return [...this.publicCharts.values()].filter(c => c.reports.size || c.hidden).map(c => ({ ...this.publicJson(c, null), hidden: c.hidden, reports: c.reports.size })); }
  async publicModerate(id, hidden) { const c = this.publicCharts.get(id); if (!c) fail('not_found', 404); c.hidden = hidden; if (!hidden) c.reports.clear(); return true; }
  async feedMetrics() { const charts = [...this.publicCharts.values()].filter(c => !c.exampleId); return { published: charts.length, views: [...this.publicCharts.values()].reduce((n, c) => n + c.views.size, 0), copies: charts.reduce((n, c) => n + c.copiedBy.size, 0), hidden: charts.filter(c => c.hidden).length }; }
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
