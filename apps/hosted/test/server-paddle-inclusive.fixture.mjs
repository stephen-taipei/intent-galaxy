// Field structure follows the official Paddle transaction.completed/Get transaction
// schema: https://developer.paddle.com/webhooks/transactions/transaction-completed/
// https://developer.paddle.com/api-reference/transactions/get-transaction/
// These are labelled, constructed TWD arithmetic fixtures, not captured sandbox
// receipts or proof of a customer's actual tax treatment. 5% is illustrative.
export function catalogPrice(product) {
  return { id: `pri_${product}`, status: 'active', tax_mode: 'internal', unit_price: { amount: product === 'studio' ? '39900' : '19900', currency_code: 'TWD' }, unit_price_overrides: [], billing_cycle: { interval: 'month', frequency: 1 }, trial_period: null };
}
export function inclusiveCompletedEvent({ product = 'studio', userId, checkoutId, binding, now = Date.now(), eventId = 'evt_paid', transactionId = 'txn_paid', subscriptionId = 'sub_paid', customerId = 'ctm_paid' }) {
  const amount = product === 'studio' ? '39900' : '19900';
  const subtotal = product === 'studio' ? '38000' : '18952';
  const tax = product === 'studio' ? '1900' : '948';
  const lineTotals = { subtotal, discount: '0', tax, total: amount };
  return { event_id: eventId, event_type: 'transaction.completed', occurred_at: new Date(now - 1000).toISOString(), data: {
    id: transactionId, status: 'completed', subscription_id: subscriptionId, customer_id: customerId,
    currency_code: 'TWD', discount_id: null, items: [{ quantity: 1, proration: null, price: catalogPrice(product) }],
    details: {
      tax_rates_used: [{ tax_rate: '0.05', totals: { ...lineTotals } }],
      totals: { ...lineTotals, credit: '0', credit_to_balance: '0', balance: '0', grand_total: amount, grand_total_tax: tax, currency_code: 'TWD' },
      line_items: [{ id: 'txnitm_monthly', price_id: `pri_${product}`, quantity: 1, proration: null, tax_rate: '0.05', unit_totals: { ...lineTotals }, totals: { ...lineTotals } }],
    },
    billing_period: { starts_at: new Date(now - 3600000).toISOString(), ends_at: new Date(now + 30 * 86400000).toISOString() },
    custom_data: { checkout_id: checkoutId, user_id: userId, product, binding },
  } };
}
