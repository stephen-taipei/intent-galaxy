import { HttpError, assert, hmac, constantTimeEqual, readText } from './security.mjs';

const PLANS = { studio: { amount: '39900', credits: 200 }, mandala: { amount: '19900', credits: 100 } };
const PADDLE_API = 'https://sandbox-api.paddle.com';
export function billingEnabled(env, mode) {
  return mode === 'live' && env.BILLING_ENABLED === 'true' && env.PADDLE_ENV === 'sandbox' && Boolean(env.PADDLE_API_KEY && env.PADDLE_WEBHOOK_SECRET && /^pri_[a-z0-9]+$/.test(env.PADDLE_PRICE_STUDIO || '') && /^pri_[a-z0-9]+$/.test(env.PADDLE_PRICE_MANDALA || '') && env.PADDLE_PRICE_STUDIO !== env.PADDLE_PRICE_MANDALA);
}
function priceId(env, product) { return product === 'studio' ? env.PADDLE_PRICE_STUDIO : env.PADDLE_PRICE_MANDALA; }
function productFor(env, id) { return ['studio', 'mandala'].find(p => priceId(env, p) === id); }
async function paddle(env, fetchImpl, path, body) {
  let response;
  try {
    response = await fetchImpl(`${PADDLE_API}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, 'Content-Type': 'application/json', 'Paddle-Version': '1' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000), redirect: 'error' });
  } catch { throw new HttpError(503, 'billing_outcome_unknown', 'Billing needs reconciliation. Reuse the same request key.'); }
  if (!response.ok) {
    const error = new HttpError(503, response.status >= 500 ? 'billing_outcome_unknown' : 'billing_rejected', 'Billing is temporarily unavailable.');
    error.definitiveFailure = response.status >= 400 && response.status < 500;
    throw error;
  }
  const result = await response.json().catch(() => null);
  assert(result?.data, 503, 'billing_outcome_unknown', 'Billing needs reconciliation.');
  return result.data;
}
function validatePrice(price, product, expectedId) {
  assert(price.id === expectedId && price.status === 'active' && price.unit_price?.amount === PLANS[product].amount && price.unit_price?.currency_code === 'TWD' && price.tax_mode === 'internal' && Array.isArray(price.unit_price_overrides) && price.unit_price_overrides.length === 0 && price.billing_cycle?.interval === 'month' && price.billing_cycle?.frequency === 1 && !price.trial_period, 503, 'price_configuration_invalid', 'The subscription price needs verification.');
}
function money(value) {
  assert(typeof value === 'string' && /^\d{1,18}$/.test(value), 400, 'invalid_billing_totals', 'The payment totals need reconciliation.');
  return BigInt(value);
}
function validatePaidTotals(data, product, expectedPriceId) {
  const totals = data.details?.totals;
  assert(totals && totals.currency_code === 'TWD', 400, 'invalid_billing_totals', 'The payment currency is unsupported.');
  const subtotal = money(totals.subtotal), tax = money(totals.tax), discount = money(totals.discount);
  const total = money(totals.total), credit = money(totals.credit), grand = money(totals.grand_total);
  // Paddle internal prices include tax. Subtotal is the tax-exclusive amount;
  // total is after discount/tax; grand_total is after credits, before payments.
  assert(total === BigInt(PLANS[product].amount) && grand === total && subtotal + tax === total && discount === 0n && credit === 0n && money(totals.credit_to_balance) === 0n && money(totals.balance) === 0n && money(totals.grand_total_tax) === tax, 400, 'invalid_billing_totals', 'Only the full advertised tax-inclusive monthly payment is supported.');
  const lines = data.details?.line_items;
  assert(Array.isArray(lines) && lines.length === 1 && lines[0].price_id === expectedPriceId && lines[0].quantity === 1 && !lines[0].proration && !data.items[0].proration, 400, 'invalid_billing_totals', 'Prorated or additional payment items are unsupported.');
  for (const breakdown of [lines[0].totals, lines[0].unit_totals]) {
    assert(breakdown && money(breakdown.subtotal) === subtotal && money(breakdown.tax) === tax && money(breakdown.discount) === 0n && money(breakdown.total) === total, 400, 'invalid_billing_totals', 'The line-item totals need reconciliation.');
  }
}
function validateReturnUrl(value, origin) {
  let url; try { url = new URL(value); } catch { throw new HttpError(503, 'billing_outcome_unknown', 'Billing needs reconciliation.'); }
  assert(url.protocol === 'https:' && (url.origin === origin || url.hostname === 'paddle.com' || url.hostname.endsWith('.paddle.com')), 503, 'billing_outcome_unknown', 'Billing needs reconciliation.');
  return url.href;
}
export async function createCheckout({ userId, product, key, env, repo, fetchImpl, origin }) {
  assert(billingEnabled(env, 'live'), 503, 'billing_disabled', 'Sandbox billing is not configured.');
  const checkout = await repo.checkoutBegin(userId, product, key);
  if (!checkout.created) {
    if (checkout.status === 'completed' && checkout.url) return checkout.url;
    throw new HttpError(409, 'checkout_pending', 'Checkout needs reconciliation. Reuse this request key.');
  }
  let dispatched = false;
  try {
    validatePrice(await paddle(env, fetchImpl, `/prices/${priceId(env, product)}`), product, priceId(env, product));
    const binding = await hmac(env.SESSION_SECRET, `checkout:${checkout.id}:${userId}:${product}`);
    dispatched = true;
    const transaction = await paddle(env, fetchImpl, '/transactions', { items: [{ price_id: priceId(env, product), quantity: 1 }], collection_mode: 'automatic', custom_data: { checkout_id: checkout.id, user_id: userId, product, binding } });
    assert(/^txn_[a-z0-9]+$/.test(transaction.id), 503, 'billing_outcome_unknown', 'Billing needs reconciliation.');
    const url = validateReturnUrl(transaction.checkout?.url, origin);
    await repo.checkoutFinish(checkout.id, 'completed', transaction.id, url);
    return url;
  } catch (error) {
    // A timeout after dispatch is never followed by another transaction creation.
    await repo.checkoutFinish(checkout.id, !dispatched || error.definitiveFailure ? 'failed' : 'unknown').catch(() => {});
    throw error;
  }
}
export async function createPortal({ userId, product, env, repo, fetchImpl, origin }) {
  assert(billingEnabled(env, 'live'), 503, 'billing_disabled', 'Sandbox billing is not configured.');
  const account = await repo.billingAccount(userId, product);
  assert(account?.customerId && /^ctm_[a-z0-9]+$/.test(account.customerId) && /^sub_[a-z0-9]+$/.test(account.subscriptionId), 404, 'not_found', 'No billing account exists for this product.');
  const session = await paddle(env, fetchImpl, `/customers/${account.customerId}/portal-sessions`, { subscription_ids: [account.subscriptionId] });
  return validateReturnUrl(session.urls?.general?.overview, origin);
}

export async function verifyPaddle(request, secret, now) {
  assert(secret, 503, 'billing_disabled', 'The webhook is not configured.');
  const raw = await readText(request, 262144);
  const signature = request.headers.get('Paddle-Signature') || '';
  const parts = signature.split(';').map(part => part.trim().split('='));
  const timestamps = parts.filter(([key]) => key === 'ts').map(([, value]) => value);
  const signatures = parts.filter(([key]) => key === 'h1').map(([, value]) => value);
  assert(timestamps.length === 1 && /^\d+$/.test(timestamps[0]) && signatures.length > 0 && Math.abs(now / 1000 - Number(timestamps[0])) <= 5, 401, 'invalid_webhook_signature', 'Invalid webhook signature.');
  const expected = await hmac(secret, `${timestamps[0]}:${raw}`, true);
  assert(signatures.some(s => constantTimeEqual(s, expected)), 401, 'invalid_webhook_signature', 'Invalid webhook signature.');
  let event; try { event = JSON.parse(raw); } catch { throw new HttpError(400, 'invalid_webhook', 'Invalid webhook.'); }
  assert(/^evt_[a-z0-9]+$/.test(event.event_id || '') && typeof event.event_type === 'string' && Number.isFinite(Date.parse(event.occurred_at)) && Date.parse(event.occurred_at) <= now + 300000 && event.data && typeof event.data === 'object', 400, 'invalid_webhook', 'Invalid webhook.');
  return event;
}

async function verifiedCheckout(data, env) {
  const custom = data.custom_data;
  if (!custom?.checkout_id || !custom.user_id || !PLANS[custom.product]) return null;
  const expected = await hmac(env.SESSION_SECRET, `checkout:${custom.checkout_id}:${custom.user_id}:${custom.product}`);
  assert(constantTimeEqual(custom.binding, expected), 400, 'invalid_billing_binding', 'The billing binding is invalid.');
  return { checkoutId: custom.checkout_id, userId: custom.user_id, product: custom.product };
}
export async function applyPaddleEvent(event, { env, repo, now }) {
  const data = event.data; const type = event.event_type;
  const base = { id: event.event_id, type, occurredAt: event.occurred_at };
  if (type === 'transaction.completed') {
    assert(data.status === 'completed' && /^txn_[a-z0-9]+$/.test(data.id || '') && /^sub_[a-z0-9]+$/.test(data.subscription_id || '') && /^ctm_[a-z0-9]+$/.test(data.customer_id || ''), 400, 'invalid_billing_event', 'Invalid completed payment.');
    const items = data.items;
    assert(Array.isArray(items) && items.length === 1 && items[0].quantity === 1, 400, 'invalid_billing_event', 'The payment price is unsupported.');
    const product = productFor(env, items[0].price?.id);
    assert(product && data.currency_code === 'TWD', 400, 'invalid_billing_event', 'The payment price is unsupported.');
    validatePrice({ ...items[0].price, status: 'active' }, product, priceId(env, product));
    validatePaidTotals(data, product, priceId(env, product));
    const period = data.billing_period;
    const start = Date.parse(period?.starts_at); const end = Date.parse(period?.ends_at);
    assert(Number.isFinite(start) && Number.isFinite(end) && start <= now + 300000 && end > start && end - start >= 20 * 86400000 && end - start <= 35 * 86400000, 400, 'invalid_billing_period', 'The paid period needs reconciliation.');
    const known = await repo.billingLookup(data.id, data.subscription_id) || await verifiedCheckout(data, env);
    assert(known?.userId && known.product === product, 400, 'invalid_billing_binding', 'The payment is not bound to a checkout.');
    return repo.webhookApply({ ...base, ...known, product, action: 'payment', transactionId: data.id, subscriptionId: data.subscription_id, customerId: data.customer_id, periodStart: new Date(start).toISOString(), periodEnd: new Date(end).toISOString() });
  }
  if (type.startsWith('subscription.') && ['subscription.created', 'subscription.activated', 'subscription.updated', 'subscription.canceled', 'subscription.paused', 'subscription.past_due', 'subscription.resumed'].includes(type)) {
    assert(/^sub_[a-z0-9]+$/.test(data.id || '') && /^ctm_[a-z0-9]+$/.test(data.customer_id || ''), 400, 'invalid_billing_event', 'Invalid subscription event.');
    const known = await repo.billingLookup(null, data.id) || await verifiedCheckout(data, env);
    // Do not acknowledge an unbound cancellation before the initial payment:
    // Paddle can redeliver it after the payment establishes the binding.
    if (!known) throw new HttpError(409, 'billing_conflict', 'The subscription needs reconciliation.');
    const canceled = data.status === 'canceled' || data.status === 'paused';
    // Subscription lifecycle never grants credits or extends paid time.
    return repo.webhookApply({ ...base, ...known, action: canceled ? 'revoke' : 'lifecycle', subscriptionId: data.id, customerId: data.customer_id, status: data.status, scheduledCancelAt: data.scheduled_change?.action === 'cancel' ? data.scheduled_change.effective_at : null });
  }
  if (['adjustment.created', 'adjustment.updated'].includes(type) && data.action === 'refund' && data.status === 'approved') {
    const known = await repo.billingLookup(data.transaction_id, null);
    if (!known) throw new HttpError(409, 'billing_conflict', 'The refunded payment needs reconciliation.');
    return repo.webhookApply({ ...base, ...known, action: 'refund', transactionId: data.transaction_id });
  }
  return repo.webhookApply({ ...base, action: 'ignored' });
}
