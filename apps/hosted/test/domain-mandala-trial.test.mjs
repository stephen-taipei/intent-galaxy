import test from 'node:test';
import assert from 'node:assert/strict';
import { validateJobRequest, executeJob, creditCost, estimateCostUsd } from '../domain/index.mjs';
import { MANDALA_MODELS } from '../domain/providers.mjs';

const env = { APP_MODE: 'live', LIVE_AI_ENABLED: 'true', MODEL_QUALITY_APPROVED: 'true', AI_DAILY_BUDGET_USD: '1', AI_MONTHLY_BUDGET_USD: '30', ANTHROPIC_API_KEY: 'test-only' };
const chart = () => ({ schemaVersion: 1, title: '閱讀計畫', goal: '四週讀完一本書並寫下筆記', themes: Array.from({ length: 8 }, (_, t) => ({ id: `t${t}`, title: '', actions: Array.from({ length: 8 }, (_, a) => ({ id: `a${t}_${a}`, text: '', done: false })) })) });
const titled = () => { const c = chart(); c.themes.forEach((t, i) => { t.title = `主題${i + 1}`; }); return c; };
const request = (operation, payload = {}) => ({ product: 'mandala', operation, provider: 'anthropic', mode: 'standard', consentDecisions: false, payload: { chart: chart(), ...payload } });
const reply = (value, usage = { input_tokens: 200, output_tokens: 300 }) => new Response(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(value) }], usage }), { headers: { 'Content-Type': 'application/json' } });
const words = (prefix, n = 8) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

function recorder(answer) {
  const calls = [];
  const fetchImpl = async (url, options) => { const body = JSON.parse(options.body); calls.push({ url, body }); return answer(body, calls.length); };
  return { calls, fetchImpl };
}

test('trial operations require the standard Anthropic models and a theme on the chart', () => {
  assert.equal(validateJobRequest(request('themes')).operation, 'themes');
  assert.throws(() => validateJobRequest({ ...request('themes'), provider: 'openai' }), /Anthropic/);
  assert.throws(() => validateJobRequest({ ...request('themes'), mode: 'deep' }), /Anthropic/);
  assert.throws(() => validateJobRequest(request('expand_theme', { themeId: 'missing' })), /theme/);
  assert.equal(validateJobRequest(request('expand_theme', { themeId: 't3' })).payload.themeId, 't3');
  const valid = validateJobRequest(request('perspectives'));
  assert.equal(creditCost(valid), 1);
  assert.ok(estimateCostUsd(validateJobRequest(request('themes'))) > estimateCostUsd(validateJobRequest(request('expand_theme', { themeId: 't0' }))));
});

test('themes call Sonnet at low effort with a JSON schema and fill only empty slots', async () => {
  const input = chart(); input.themes[2].title = '我自己的主題';
  const { calls, fetchImpl } = recorder(body => reply({ themes: words('新主題', body.system.match(/exactly (\d+)/)[1] * 1) }));
  const result = await executeJob({ ...request('themes'), payload: { chart: input } }, { env, fetchImpl });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.model, MANDALA_MODELS.themes.id);
  assert.equal(calls[0].body.output_config.effort, 'low');
  assert.equal(calls[0].body.output_config.format.type, 'json_schema');
  assert.match(calls[0].body.system, /exactly 7/);
  assert.equal(result.chart.themes[2].title, '我自己的主題');
  assert.deepEqual(result.chart.themes.filter((_, i) => i !== 2).map(t => t.title), words('新主題', 7));
  assert.ok(Number.isFinite(result.actualCostUsd));
});

test('themes reject duplicates, wrong counts and themes that repeat what the user wrote', async () => {
  for (const themes of [words('a', 7), [...words('a', 7), 'a1'], [...words('a', 7), '  ']]) {
    const { fetchImpl } = recorder(() => reply({ themes }));
    await assert.rejects(executeJob(request('themes'), { env, fetchImpl }), e => e.code === 'provider_invalid_output');
  }
  const input = chart(); input.themes[0].title = '運動';
  const { fetchImpl } = recorder(() => reply({ themes: ['運 動', ...words('b', 6)] }));
  await assert.rejects(executeJob({ ...request('themes'), payload: { chart: input } }, { env, fetchImpl }), e => e.code === 'provider_invalid_output');
  const full = titled();
  await assert.rejects(executeJob({ ...request('themes'), payload: { chart: full } }, { env, fetchImpl: () => assert.fail('no call') }), e => e.code === 'nothing_to_fill');
});

test('expanding one theme uses Haiku, sends the other actions, and keeps the user’s text', async () => {
  const input = titled(); input.themes[1].actions[0].text = '每天讀 10 頁'; input.themes[4].actions[3].text = '週末寫摘要';
  const { calls, fetchImpl } = recorder(() => reply({ actions: words('行動', 7) }));
  const result = await executeJob({ ...request('expand_theme', { themeId: 't1' }), payload: { chart: input, themeId: 't1' } }, { env, fetchImpl });
  assert.equal(calls.length, 1); assert.equal(calls[0].body.model, MANDALA_MODELS.cells.id);
  const sent = JSON.parse(calls[0].body.messages[0].content);
  assert.equal(sent.theme, '主題2'); assert.deepEqual(sent.existingActions.sort(), ['每天讀 10 頁', '週末寫摘要'].sort());
  assert.equal(result.chart.themes[1].actions[0].text, '每天讀 10 頁');
  assert.deepEqual(result.chart.themes[1].actions.slice(1).map(a => a.text), words('行動', 7));
  assert.ok(result.chart.themes[0].actions.every(a => !a.text));
  const untitled = chart();
  await assert.rejects(executeJob({ ...request('expand_theme', { themeId: 't0' }), payload: { chart: untitled, themeId: 't0' } }, { env, fetchImpl }), e => e.code === 'theme_required');
});

test('expanding all themes runs in parallel and drops actions two themes produced', async () => {
  const input = titled(); input.themes[7].title = '';
  const { calls, fetchImpl } = recorder(body => {
    const theme = JSON.parse(body.messages[0].content).theme;
    return reply({ actions: theme === '主題2' ? ['重複的行動', ...words('B', 7)] : theme === '主題3' ? ['重複的行動', ...words('C', 7)] : words(theme) });
  });
  const result = await executeJob({ ...request('expand_empty'), payload: { chart: input } }, { env, fetchImpl });
  assert.equal(calls.length, 7);
  assert.equal(result.skipped, 1);
  const texts = result.chart.themes.flatMap(t => t.actions.map(a => a.text)).filter(Boolean);
  assert.equal(new Set(texts).size, texts.length);
  assert.ok(result.chart.themes[7].actions.every(a => !a.text));
});

test('perspectives ask four lenses in parallel and keep the lenses that succeed', async () => {
  const { calls, fetchImpl } = recorder(body => body.system.includes('Coroner') ? reply({ themes: ['x'] }) : reply({ themes: words(body.system.match(/as the ([\w-]+)/)[1]) }));
  const result = await executeJob(request('perspectives'), { env, fetchImpl });
  assert.equal(calls.length, 4);
  assert.ok(calls.every(c => c.body.model === MANDALA_MODELS.cells.id));
  assert.deepEqual(result.perspectives.map(p => p.lens), ['Q1', 'Q2', 'Q3']);
  assert.ok(result.perspectives.every(p => p.themes.length === 8));
  // The failed lens may have been billed, so the cost is not settled.
  assert.equal(result.actualCostUsd, undefined);
  const none = recorder(() => reply({ themes: [] }));
  await assert.rejects(executeJob(request('perspectives'), { env, fetchImpl: none.fetchImpl }), e => e.code === 'provider_invalid_output');
});

test('demo mode returns labelled synthetic proposals without calling a provider', async () => {
  const demo = { ...env, APP_MODE: 'demo' };
  const fail = () => assert.fail('demo must not fetch');
  assert.ok((await executeJob(request('themes'), { env: demo, fetchImpl: fail })).chart.themes.every(t => t.title.startsWith('【示例】')));
  const expanded = await executeJob({ ...request('expand_theme', { themeId: 't0' }), payload: { chart: titled(), themeId: 't0' } }, { env: demo, fetchImpl: fail });
  assert.ok(expanded.chart.themes[0].actions.every(a => a.text.startsWith('【示例】')));
  assert.ok(expanded.chart.themes[1].actions.every(a => !a.text));
  assert.equal((await executeJob(request('perspectives'), { env: demo, fetchImpl: fail })).perspectives.length, 4);
});
