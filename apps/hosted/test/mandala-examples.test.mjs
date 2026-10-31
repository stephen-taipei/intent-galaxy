import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateChart } from '../public/model.js';

test('the public example library holds valid, complete and uniquely named charts', () => {
  const { examples } = JSON.parse(readFileSync(new URL('../public/mandala-examples.json', import.meta.url), 'utf8'));
  assert.ok(examples.length >= 3);
  assert.equal(new Set(examples.map(e => e.id)).size, examples.length);
  for (const example of examples) {
    validateChart(example.chart);
    assert.ok(example.chart.themes.every(t => t.title && t.actions.every(a => a.text)), `${example.id} has empty cells`);
  }
});
