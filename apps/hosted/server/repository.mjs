import { HttpError } from './security.mjs';

const ERRORS = {
  quota_exceeded: [402, 'There are not enough credits.'], budget_exceeded: [503, 'The platform budget is unavailable.'],
  guest_limit: [429, 'The browser trial or server trial cap has been reached.'], trial_limit: [429, 'Today’s free Mandala AI limit has been reached.'], not_found: [404, 'The record was not found.'],
  stale_revision: [409, 'The document changed. Reload it before saving.'], document_limit: [403, 'The saved document limit has been reached.'],
  pro_required: [403, 'This feature requires this product’s Pro plan.'], idempotency_conflict: [409, 'This key was already used for a different request.'],
  checkout_pending: [409, 'Checkout is pending reconciliation.'], session_busy: [409, 'The session is refreshing. Please retry shortly.'],
  session_expired: [401, 'Please sign in again.'], billing_conflict: [409, 'Billing information needs reconciliation.'],
  trial_login_required: [403, 'Sign in to use the free Mandala AI, or open an invite link.'], invite_limit: [429, 'You have reached today’s invite limit or have too many unused invites.'],
  invite_invalid: [404, 'This invite code is invalid, used or expired.'], invite_used: [409, 'This browser has already used an invite.'],
  topic_limit: [409, 'You have reached the topic limit.'], profile_required: [409, 'Choose a nickname and an avatar before publishing.'], goal_required: [400, 'Write the goal before publishing.'],
};

/** Production persistence: every mutation is a service-only, atomic Postgres RPC.
 * No unfiltered table access or in-memory fallback exists in this adapter. */
export class PostgrestRepository {
  constructor(env, fetchImpl = fetch) {
    if (!/^https:\/\/[^/]+$/.test(env.SUPABASE_URL || '') || !env.SUPABASE_SERVICE_ROLE_KEY) throw new HttpError(503, 'configuration_required', 'Database configuration is incomplete.');
    this.url = env.SUPABASE_URL; this.key = env.SUPABASE_SERVICE_ROLE_KEY; this.fetch = fetchImpl;
  }
  async rpc(name, params = {}) {
    let response;
    try {
      response = await this.fetch(`${this.url}/rest/v1/rpc/hosted_${name}`, {
        method: 'POST', headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(params), signal: AbortSignal.timeout(15000), redirect: 'error',
      });
    } catch { throw new HttpError(503, 'database_unavailable', 'The database is temporarily unavailable.'); }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = typeof body.message === 'string' ? Object.keys(ERRORS).find(c => body.message === c) : null;
      if (code) throw new HttpError(ERRORS[code][0], code, ERRORS[code][1]);
      throw new HttpError(503, 'database_unavailable', 'The database is temporarily unavailable.');
    }
    return body;
  }
  sessionGet(id) { return this.rpc('session_get', { p_id: id }); }
  sessionCreate(value) { return this.rpc('session_create', { p_session: value }); }
  sessionRefreshClaim(id) { return this.rpc('session_refresh_claim', { p_id: id }); }
  sessionRefresh(id, tokens, expiresAt) { return this.rpc('session_refresh', { p_id: id, p_tokens: tokens, p_access_expires_at: expiresAt }); }
  sessionDelete(id) { return this.rpc('session_delete', { p_id: id }); }
  guestCreate(value) { return this.rpc('guest_create', { p_guest: value }); }
  guestGet(id) { return this.rpc('guest_get', { p_id: id }); }
  entitlements(userId) { return this.rpc('entitlements', { p_user_id: userId }); }
  reserveJob(value) { return this.rpc('reserve_job', { p_job: value }); }
  jobGet(id, owner) { return this.rpc('job_get', { p_id: id, p_owner: owner }); }
  jobClaim(id) { return this.rpc('job_claim', { p_id: id }); }
  jobDispatched(id) { return this.rpc('job_dispatched', { p_id: id }); }
  jobFinish(id, status, result, error, actualMicros) { return this.rpc('job_finish', { p_id: id, p_status: status, p_result: result, p_error: error, p_actual_micros: actualMicros }); }
  documentList(userId, product, kind) { return this.rpc('document_list', { p_user_id: userId, p_product: product, p_kind: kind }); }
  documentGet(userId, id) { return this.rpc('document_get', { p_user_id: userId, p_id: id }); }
  documentCreate(userId, document) { return this.rpc('document_create', { p_user_id: userId, p_document: document }); }
  documentUpdate(userId, id, document) { return this.rpc('document_update', { p_user_id: userId, p_id: id, p_document: document }); }
  documentDelete(userId, id) { return this.rpc('document_delete', { p_user_id: userId, p_id: id }); }
  documentVersions(userId, id) { return this.rpc('document_versions', { p_user_id: userId, p_id: id }); }
  checkoutBegin(userId, product, key) { return this.rpc('checkout_begin', { p_user_id: userId, p_product: product, p_key: key }); }
  checkoutFinish(id, status, transactionId = null, url = null) { return this.rpc('checkout_finish', { p_id: id, p_status: status, p_transaction_id: transactionId, p_url: url }); }
  billingAccount(userId, product) { return this.rpc('billing_account', { p_user_id: userId, p_product: product }); }
  billingLookup(transactionId, subscriptionId) { return this.rpc('billing_lookup', { p_transaction_id: transactionId, p_subscription_id: subscriptionId }); }
  webhookApply(event) { return this.rpc('webhook_apply', { p_event: event }); }
  recordEvent(userId, name, product, templateId) { return this.rpc('record_event', { p_user_id: userId, p_name: name, p_product: product, p_template_id: templateId }); }
  cleanup() { return this.rpc('cleanup'); }
  userUpsert(identity) { return this.rpc('user_upsert', { p_identity: identity }); }
  touchActivity(userId) { return this.rpc('touch_activity', { p_user_id: userId }); }
  inviteCreate(value) { return this.rpc('invite_create', { p_invite: value }); }
  inviteList(userId) { return this.rpc('invite_list', { p_user_id: userId }); }
  inviteRedeem(value) { return this.rpc('invite_redeem', { p_redeem: value }); }
  inviteConvert(browserHash, userId) { return this.rpc('invite_convert', { p_browser_hash: browserHash, p_user_id: userId }); }
  accountDelete(userId) { return this.rpc('account_delete', { p_user_id: userId }); }
  metrics(days) { return this.rpc('metrics', { p_days: days }); }
  feedMetrics(days) { return this.rpc('feed_metrics', { p_days: days }); }
  profileGet(userId) { return this.rpc('profile_get', { p_user_id: userId }); }
  profileSet(userId, profile) { return this.rpc('profile_set', { p_user_id: userId, p_profile: profile }); }
  publicPublish(userId, value) { return this.rpc('public_publish', { p_user_id: userId, p_publish: value }); }
  publicUnpublish(userId, id) { return this.rpc('public_unpublish', { p_user_id: userId, p_id: id }); }
  publicFeed(viewer, query) { return this.rpc('public_feed', { p_viewer: viewer, p_query: query }); }
  publicGet(viewer, id) { return this.rpc('public_get', { p_viewer: viewer, p_id: id }); }
  publicMine(userId) { return this.rpc('public_mine', { p_user_id: userId }); }
  publicEncourage(userId, id, on) { return this.rpc('public_encourage', { p_user_id: userId, p_id: id, p_on: on }); }
  publicCopy(userId, id) { return this.rpc('public_copy', { p_user_id: userId, p_id: id }); }
  publicReport(userId, id, reason) { return this.rpc('public_report', { p_user_id: userId, p_id: id, p_reason: reason }); }
  publicView(userId, id) { return this.rpc('public_view', { p_user_id: userId, p_id: id }); }
  publicSeed(examples) { return this.rpc('public_seed', { p_examples: examples }); }
  topicList(userId) { return this.rpc('topic_list', { p_user_id: userId }); }
  topicSave(userId, topic) { return this.rpc('topic_save', { p_user_id: userId, p_topic: topic }); }
  topicDelete(userId, id) { return this.rpc('topic_delete', { p_user_id: userId, p_id: id }); }
  documentSetTopic(userId, documentId, topicId) { return this.rpc('document_set_topic', { p_user_id: userId, p_document_id: documentId, p_topic_id: topicId }); }
  topicExport(userId, id) { return this.rpc('topic_export', { p_user_id: userId, p_id: id }); }
  publicReviewList() { return this.rpc('public_review_list'); }
  publicModerate(id, hidden) { return this.rpc('public_moderate', { p_id: id, p_hidden: hidden }); }
}
