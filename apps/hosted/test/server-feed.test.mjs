import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplication } from '../server/index.mjs';
import { DemoRepository } from '../server/demo-repository.mjs';
import { sha256, randomToken } from '../server/security.mjs';
import { readFileSync } from 'node:fs';

const SECRET = 'test-only-session-secret-32-characters-long';
const EXAMPLES = JSON.parse(readFileSync(new URL('../public/mandala-examples.json', import.meta.url), 'utf8'));
const INDEX = '<!doctype html><html><head><title>Intent Galaxy</title></head><body></body></html>';
const env = () => ({ APP_MODE: 'live', APP_ORIGIN: 'https://app.example', SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: SECRET,
  GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 's', ADMIN_EMAILS: 'admin@example.test', ASSETS: { fetch: async request => new URL(request.url).pathname === '/mandala-examples.json' ? Response.json(EXAMPLES) : new Response(INDEX, { headers: { 'Content-Type': 'text/html' } }) } });
const chart = (done = 2) => ({ schemaVersion: 1, title: '讀書計畫', goal: '半年讀 12 本書', themes: Array.from({ length: 8 }, (_, t) => ({ id: `t${t}`, title: `主題${t}`, actions: Array.from({ length: 8 }, (_, a) => ({ id: `a${t}_${a}`, text: `行動${t}-${a}`, done: t === 0 && a < done, notes: 'private note' })) })) });

async function signed(app, repo, email) {
  const jar = new Map(); let csrf; const e = env(); const opaque = randomToken(); const id = crypto.randomUUID();
  await repo.sessionCreate({ id: await sha256(opaque), user: { id, email }, csrf: randomToken(), tokens: null, accessExpiresAt: new Date(Date.now() + 86400000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() });
  jar.set('__Host-ig-session', opaque);
  const request = async (path, { method = 'GET', body } = {}) => {
    const h = new Headers({ Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') });
    if (method !== 'GET') { h.set('Origin', e.APP_ORIGIN); h.set('X-CSRF-Token', csrf); }
    if (body !== undefined) h.set('Content-Type', 'application/json');
    const response = await app(new Request(`${e.APP_ORIGIN}${path}`, { method, headers: h, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), e, {});
    for (const cookie of response.headers.getSetCookie()) { const first = cookie.split(';')[0]; const at = first.indexOf('='); jar.set(first.slice(0, at), first.slice(at + 1)); }
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    if (path === '/api/session') csrf = data.csrfToken;
    return { response, data };
  };
  await request('/api/session');
  return { id, request };
}

test('publishing needs a profile, hides notes, and the feed is for signed-in users only', async () => {
  const repo = new DemoRepository(); const app = createApplication({ repo });
  const owner = await signed(app, repo, 'owner@example.test'); const reader = await signed(app, repo, 'reader@example.test');
  const doc = (await owner.request('/api/documents', { method: 'POST', body: { product: 'mandala', kind: 'goal', title: '讀書計畫', data: chart() } })).data.document;
  assert.equal((await owner.request('/api/public', { method: 'POST', body: { documentId: doc.id, tags: ['learning'] } })).data.error.code, 'profile_required');
  assert.equal((await owner.request('/api/profile', { method: 'PUT', body: { nickname: '<b>', avatar: 'a01' } })).response.status, 400);
  assert.equal((await owner.request('/api/profile', { method: 'PUT', body: { nickname: '小明', avatar: 'a13' } })).response.status, 400);
  assert.equal((await owner.request('/api/profile', { method: 'PUT', body: { nickname: ' 小明 ', avatar: 'a03' } })).data.profile.nickname, '小明');
  assert.equal((await owner.request('/api/public', { method: 'POST', body: { documentId: doc.id, tags: ['politics'] } })).response.status, 400);
  const published = await owner.request('/api/public', { method: 'POST', body: { documentId: doc.id, tags: ['learning'] } });
  assert.equal(published.response.status, 201); assert.match(published.data.chart.url, /^https:\/\/app\.example\/mandala\/p\/[0-9a-f-]{36}$/);
  assert.ok(!JSON.stringify(published.data).includes('private note'));
  const id = published.data.chart.id;
  // The feed needs an account; a single shared chart does not.
  const anonymous = await app(new Request(`https://app.example/api/feed`), env(), {});
  assert.equal(anonymous.status, 401);
  assert.equal((await app(new Request(`https://app.example/api/public/${id}`), env(), {})).status, 200);
  const feed = (await reader.request('/api/feed?sort=new')).data.items;
  assert.equal(feed[0].author.nickname, '小明'); assert.equal(feed[0].mine, false); assert.equal(feed[0].documentId, null);
  assert.equal((await reader.request('/api/feed?sort=random')).response.status, 400);
  assert.equal((await reader.request('/api/feed?tag=learning')).data.items.length, 1);
  assert.equal((await reader.request(`/api/public/${id}/encourage`, { method: 'POST', body: { on: true } })).data.chart.encourages, 1);
  assert.equal((await reader.request(`/api/public/${id}/copy`, { method: 'POST', body: {} })).data.chart.copies, 1);
  assert.equal((await reader.request('/api/feed?sort=hot')).data.items[0].id, id);
  assert.equal((await reader.request(`/api/public/${id}`, { method: 'DELETE' })).response.status, 404);
  assert.equal((await owner.request('/api/public/mine')).data.charts.length, 1);
});

test('three reports hide a chart until an operator restores it; share pages unfurl without indexing', async () => {
  const repo = new DemoRepository(); const app = createApplication({ repo });
  const owner = await signed(app, repo, 'owner@example.test');
  await owner.request('/api/profile', { method: 'PUT', body: { nickname: '小明', avatar: 'a03' } });
  const doc = (await owner.request('/api/documents', { method: 'POST', body: { product: 'mandala', kind: 'goal', title: '讀書計畫', data: chart() } })).data.document;
  const id = (await owner.request('/api/public', { method: 'POST', body: { documentId: doc.id, tags: [] } })).data.chart.id;
  const page = await app(new Request(`https://app.example/mandala/p/${id}`), env(), {});
  const html = await page.text();
  assert.match(html, /<title>讀書計畫｜九宮格目標規劃<\/title>/); assert.match(html, /noindex/); assert.match(html, /og:description" content="小明的目標：半年讀 12 本書"/);
  assert.equal((await owner.request(`/api/public/${id}/report`, { method: 'POST', body: { reason: 'spam' } })).response.status, 404);
  for (let n = 0; n < 3; n++) { const r = await signed(app, repo, `r${n}@example.test`); assert.equal((await r.request(`/api/public/${id}/report`, { method: 'POST', body: { reason: 'personal_data' } })).response.status, 200); }
  const reader = await signed(app, repo, 'reader@example.test');
  assert.equal((await reader.request('/api/feed')).data.items.length, 0);
  assert.equal((await reader.request(`/api/public/${id}`)).response.status, 404);
  assert.doesNotMatch(await (await app(new Request(`https://app.example/mandala/p/${id}`), env(), {})).text(), /小明/);
  assert.equal((await reader.request('/api/admin/public')).response.status, 404);
  const admin = await signed(app, repo, 'admin@example.test');
  assert.equal((await admin.request('/api/admin/public')).data.charts[0].reports, 3);
  await admin.request(`/api/admin/public/${id}`, { method: 'POST', body: { hidden: false } });
  assert.equal((await reader.request('/api/feed')).data.items.length, 1);
  assert.equal((await admin.request('/api/admin/metrics')).data.metrics.feed.published, 1);
  // Deleting the account removes its public charts.
  await owner.request('/api/account', { method: 'DELETE' });
  assert.equal((await reader.request('/api/feed')).data.items.length, 0);
});

test('brand examples join the feed with zero counts, rank by the same rules, and count one view a day', async () => {
  const repo = new DemoRepository(); const app = createApplication({ repo });
  const admin = await signed(app, repo, 'admin@example.test'); const reader = await signed(app, repo, 'reader@example.test');
  // Only the operator can seed.
  assert.equal((await reader.request('/api/admin/examples', { method: 'POST', body: {} })).response.status, 404);
  assert.equal((await admin.request('/api/admin/examples', { method: 'POST', body: {} })).data.seeded, EXAMPLES.examples.length);
  const feed = (await reader.request('/api/feed?sort=hot&lang=zh')).data.items;
  assert.equal(feed.length, EXAMPLES.examples.length);
  assert.ok(feed.every(c => c.example && c.author.brand && c.encourages === 0 && c.copies === 0 && c.progress === 0 && c.tags.length));
  assert.equal((await reader.request('/api/feed?lang=en')).data.items.length, 0);
  assert.equal((await reader.request('/api/feed?source=users')).data.items.length, 0);
  assert.equal((await reader.request('/api/feed?window=1y')).response.status, 400);
  // A copy (x2) outranks an encouragement.
  const [first, second] = feed;
  await reader.request(`/api/public/${second.id}/copy`, { method: 'POST', body: {} });
  await admin.request(`/api/public/${first.id}/encourage`, { method: 'POST', body: { on: true } });
  assert.equal((await reader.request('/api/feed?sort=hot&lang=zh')).data.items[0].id, second.id);
  // Views: once per signed-in viewer per day; anonymous opens are not counted.
  assert.equal((await reader.request(`/api/public/${first.id}`)).data.chart.views, 1);
  assert.equal((await reader.request(`/api/public/${first.id}`)).data.chart.views, 1);
  await app(new Request(`https://app.example/api/public/${first.id}`), env(), {});
  assert.equal(repo.publicCharts.get(first.id).views.size, 1);
  // Reseeding keeps counts; users cannot unpublish examples; examples are not counted as user posts.
  await admin.request('/api/admin/examples', { method: 'POST', body: {} });
  assert.equal((await reader.request(`/api/public/${second.id}`)).data.chart.copies, 1);
  assert.equal((await reader.request(`/api/public/${second.id}`, { method: 'DELETE' })).response.status, 404);
  assert.equal((await admin.request('/api/admin/metrics')).data.metrics.feed.published, 0);
});
