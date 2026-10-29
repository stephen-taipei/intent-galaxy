import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../evals/cases.mjs';
test('evaluation catalog has 120 unique cases across tasks, failure types and held-out scenarios', () => {
  assert.equal(CASES.length, 120); assert.equal(new Set(CASES.map(c => c.id)).size, 120);
  for (const kind of ['message', 'weekly', 'compare']) assert.equal(CASES.filter(c => c.contract.taskType === kind).length, 40);
  assert.equal(CASES.filter(c => c.critical).length, 30);
  assert.equal(CASES.filter(c => c.expected === 'unknown').length, 30);
  assert.equal(CASES.filter(c => c.split === 'holdout').length, 36);
  assert.ok(CASES.every(c => c.annotationStatus === 'proposed-needs-human-review'));
});
