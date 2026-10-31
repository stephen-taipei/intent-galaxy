#!/usr/bin/env node
// Builds public/mandala-examples.json: the hand-written seeds plus charts the
// trial models generate once for each goal in examples/goals.json. Guests
// browse these, so showing them costs no tokens.
//
//   node apps/hosted/scripts/generate-mandala-examples.mjs --seeds-only
//   ANTHROPIC_API_KEY=... node apps/hosted/scripts/generate-mandala-examples.mjs [--only id] [--force]
//
// Generated examples already in the output are kept unless --force is given,
// so a rerun only pays for new goals. Review the output before publishing.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { executeJob } from '../domain/index.mjs';

const root = new URL('..', import.meta.url);
const OUTPUT = new URL('public/mandala-examples.json', root);
const args = process.argv.slice(2);
const flag = name => args.includes(name);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

function chartFrom({ title, goal, themes = [] }) {
  return { schemaVersion: 1, title, goal, themes: Array.from({ length: 8 }, (_, t) => ({
    id: `t${t}`, title: themes[t]?.[0] ?? '',
    actions: Array.from({ length: 8 }, (_, a) => ({ id: `a${t}_${a}`, text: themes[t]?.[1]?.[a] ?? '', done: false })),
  })) };
}
const filled = chart => chart.themes.every(t => t.title && t.actions.every(a => a.text));

const seeds = JSON.parse(readFileSync(new URL('examples/seed-examples.json', root), 'utf8')).examples
  .map(seed => ({ id: seed.id, locale: seed.locale, source: 'seed', chart: chartFrom(seed) }));
const previous = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, 'utf8')).examples.filter(e => e.source === 'generated') : [];
const generated = new Map(previous.map(e => [e.id, e]));

if (!flag('--seeds-only')) {
  if (!process.env.ANTHROPIC_API_KEY) { console.error('Set ANTHROPIC_API_KEY, or pass --seeds-only.'); process.exit(1); }
  const env = { APP_MODE: 'live', LIVE_AI_ENABLED: 'true', MODEL_QUALITY_APPROVED: 'true', AI_DAILY_BUDGET_USD: '5', AI_MONTHLY_BUDGET_USD: '5', ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY };
  const request = (operation, chart) => ({ product: 'mandala', operation, provider: 'anthropic', mode: 'standard', consentDecisions: false, payload: { chart } });
  const goals = JSON.parse(readFileSync(new URL('examples/goals.json', root), 'utf8')).goals.filter(g => !only || g.id === only);
  let total = 0;
  for (const goal of goals) {
    if (generated.has(goal.id) && !flag('--force')) { console.log(`skip ${goal.id} (already generated)`); continue; }
    try {
      const themed = await executeJob(request('themes', chartFrom(goal)), { env });
      let chart = themed.chart; total += themed.actualCostUsd ?? 0;
      // Parallel expansion can leave a duplicate blank; retry the gaps once.
      for (let round = 0; round < 2 && !filled(chart); round++) {
        const expanded = await executeJob(request('expand_empty', chart), { env });
        chart = expanded.chart; total += expanded.actualCostUsd ?? 0;
      }
      if (!filled(chart)) throw new Error('some cells are still empty');
      generated.set(goal.id, { id: goal.id, locale: goal.locale, source: 'generated', chart });
      console.log(`ok   ${goal.id}  running cost ≈ US$${total.toFixed(3)}`);
    } catch (error) { console.error(`fail ${goal.id}: ${error.code || ''} ${error.message}`); }
  }
}

const examples = [...seeds, ...generated.values()];
writeFileSync(OUTPUT, `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), examples })}\n`);
console.log(`wrote ${examples.length} examples (${seeds.length} seeds) to apps/hosted/public/mandala-examples.json`);
