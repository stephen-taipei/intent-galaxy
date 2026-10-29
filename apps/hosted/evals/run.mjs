import fs from 'node:fs';
import { CASES } from './cases.mjs';
import { digest } from '../domain/validation.mjs';
import { RUBRIC_VERSION } from '../domain/evaluation.mjs';

if (CASES.length !== 120 || new Set(CASES.map(c => c.id)).size !== 120) throw new Error('Exactly 120 unique cases required.');
const datasetHash = await digest(CASES);
const at = process.argv.indexOf('--results');
if (at === -1) {
  console.log(JSON.stringify({ cases: CASES.length, datasetHash, rubricVersion: RUBRIC_VERSION,
    labels: 'PROPOSED — independent human review required', liveModelEvaluation: 'NOT_RUN', releaseGate: 'HOLD',
    instruction: 'After label review and an authorized run, pass a JSON results file with --results. No provider is called by this tool.' }, null, 2));
} else {
  const result = JSON.parse(fs.readFileSync(process.argv[at + 1], 'utf8'));
  if (result.datasetHash !== datasetHash || result.rubricVersion !== RUBRIC_VERSION || result.mode !== 'live' || !result.model || !Array.isArray(result.records)) throw new Error('Results do not match the live dataset and rubric.');
  if (result.records.length !== 120 || new Set(result.records.map(r => r.caseId)).size !== 120) throw new Error('Exactly one result per case is required.');
  let critical = 0, falsePass = 0, covered = 0, comparable = 0, correct = 0;
  for (const c of CASES) {
    const r = result.records.find(r => r.caseId === c.id);
    if (!r || !['pass', 'fail', 'unknown'].includes(r.status) || r.artifactHash !== await digest(c.artifact) || r.contractHash !== await digest(c.contract)) throw new Error(`Invalid or stale record: ${c.id}`);
    if (c.critical) { critical++; if (r.status === 'pass') falsePass++; }
    if (c.expected !== 'unknown') { comparable++; if (r.status !== 'unknown') covered++; }
    if (r.status === c.expected) correct++;
  }
  const reviewed = CASES.every(c => c.annotationStatus === 'human-reviewed');
  const passed = reviewed && falsePass / critical <= 0.05 && covered / comparable >= 0.8;
  console.log(JSON.stringify({ datasetHash, rubricVersion: RUBRIC_VERSION, model: result.model, humanReviewed: reviewed,
    criticalFalsePassRate: falsePass / critical, coverage: covered / comparable, agreement: correct / CASES.length, releaseGate: passed ? 'PASS' : 'HOLD' }, null, 2));
  if (!passed) process.exitCode = 1;
}
