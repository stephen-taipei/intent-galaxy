import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout, applyPaddleEvent } from '../server/billing.mjs';
import { DemoRepository } from '../server/demo-repository.mjs';
import { hmac } from '../server/security.mjs';
import { catalogPrice, inclusiveCompletedEvent } from './server-paddle-inclusive.fixture.mjs';

const USER = '11111111-1111-4111-8111-111111111111';
const SECRET = 'test-only-session-secret-32-characters-long';
const env = { APP_ORIGIN: 'https://app.example', SESSION_SECRET: SECRET, BILLING_ENABLED: 'true', PADDLE_ENV: 'sandbox', PADDLE_API_KEY: 'test', PADDLE_WEBHOOK_SECRET: 'test', PADDLE_PRICE_STUDIO: 'pri_studio', PADDLE_PRICE_MANDALA: 'pri_mandala' };
async function fixture(product = 'studio') {
  const repo = new DemoRepository(); const checkout = await repo.checkoutBegin(USER, product, 'inclusive-checkout'); const now = Date.now();
  const binding = await hmac(SECRET, `checkout:${checkout.id}:${USER}:${product}`);
  return { repo, now, event: inclusiveCompletedEvent({ product, userId: USER, checkoutId: checkout.id, binding, now }) };
}
for (const product of ['studio', 'mandala']) {
  test(`${product}: documented internal-price totals accept tax-exclusive subtotal below advertised total`, async () => {
    const { repo, event, now } = await fixture(product);
    assert.notEqual(event.data.details.totals.subtotal, event.data.details.totals.total);
    await applyPaddleEvent(event, { env, repo, now });
    assert.equal((await repo.entitlements(USER))[product].plan, 'pro');
    assert.equal((await repo.entitlements(USER))[product].credits, product === 'studio' ? 200 : 100);
  });
}

test('price validation refuses external/account/location tax settings and country overrides before checkout', async () => {
  for (const change of [{ tax_mode: 'external' }, { tax_mode: 'account_setting' }, { tax_mode: 'location' }, { unit_price_overrides: [{ country_codes: ['TW'], unit_price: { amount: '100', currency_code: 'TWD' } }] }]) {
    const repo = new DemoRepository(); let created = 0;
    await assert.rejects(createCheckout({ userId: USER, product: 'studio', key: 'tax-mode', env, repo, origin: env.APP_ORIGIN, fetchImpl: async url => {
      if (url.includes('/prices/')) return Response.json({ data: { ...catalogPrice('studio'), ...change } });
      created++; return Response.json({ data: {} });
    } }), error => error.code === 'price_configuration_invalid');
    assert.equal(created, 0);
  }
});

test('unexpected discount, credit, extra tax, proration, currency or inconsistent totals never grant Pro', async () => {
  const changes = [
    e => { e.data.details.totals.discount = '100'; },
    e => { e.data.details.totals.credit = '100'; },
    e => { e.data.details.totals.credit_to_balance = '1'; },
    e => { e.data.details.totals.total = '41895'; e.data.details.totals.grand_total = '41895'; },
    e => { e.data.details.totals.grand_total = '39800'; },
    e => { e.data.details.totals.tax = '1901'; },
    e => { e.data.details.totals.currency_code = 'USD'; },
    e => { e.data.details.line_items[0].proration = { rate: '0.5' }; },
    e => { e.data.details.line_items[0].totals.total = '19900'; },
    e => { e.data.items[0].price.tax_mode = 'external'; },
  ];
  for (const change of changes) {
    const { repo, event, now } = await fixture(); change(event);
    await assert.rejects(applyPaddleEvent(event, { env, repo, now }));
    assert.equal((await repo.entitlements(USER)).studio.plan, 'free'); assert.equal(repo.payments.size, 0);
  }
});
