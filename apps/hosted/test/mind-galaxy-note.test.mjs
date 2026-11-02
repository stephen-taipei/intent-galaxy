import test from 'node:test';
import assert from 'node:assert/strict';
import { topicToMindGalaxyNote, mindGalaxyFileName, taipeiDate } from '../public/mind-galaxy-note.js';

// Keys Mind Galaxy v0.14 knows (libs/vault/src/types.ts FRONTMATTER_KEYS); anything else
// would import with an "unknown key" warning.
const V2_KEYS = new Set(['title', 'type', 'source', 'source_date', 'source_date_precision', 'acquired_date', 'acquired_date_precision',
  'imported_at', 'why', 'domains', 'place_name', 'place_lat', 'place_lon', 'place_osm', 'place_withheld', 'media', 'inspired_by',
  'model_egress', 'backup_egress', 'selection', 'capture_limited', 'mg_id', 'mg_version']);

const actions = (prefix, n) => Array.from({ length: 8 }, (_, j) => ({ id: `${prefix}${j}`, text: j < n ? `行動 ${prefix}${j}` : '', done: j === 0, ...(j === 1 ? { skipped: true } : {}) }));
const exported = (overrides = {}) => ({
  format: 'intent-galaxy.topic-export', version: 1, exportedAt: '2026-11-02T10:00:00Z',
  topic: { id: '3f2a9c1e-0000-4000-8000-000000000001', title: '明年要不要轉職：產品經理？', createdAt: '2026-10-31T17:30:00Z', updatedAt: '2026-11-02T00:00:00Z' },
  documents: [
    { id: 'b', product: 'studio', kind: 'work', title: '轉職決策', data: { contract: { goal: '要不要轉 PM' }, selectionText: 'LOCKED\n```\nMUST: x\n```', artifact: { content: '先內轉。' } } },
    { id: 'a', product: 'mandala', kind: 'goal', title: '轉職九宮格', data: { chart: { schemaVersion: 1, title: '轉職', goal: '一年內轉 PM',
      themes: Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, title: i === 0 ? '能力' : '', actions: actions(`t${i}a`, i === 0 ? 3 : 0) })) }, reviews: [] } },
  ],
  ...overrides,
});
const frontmatter = (md) => md.split('\n---\n')[0].replace(/^---\n/, '').split('\n').map(l => l.split(':')[0]);

test('topic export becomes a V-2 note Mind Galaxy imports without warnings', () => {
  const { fileName, markdown } = topicToMindGalaxyNote(exported(), { origin: 'https://apps.stephen.taipei' });
  assert.equal(fileName, '明年要不要轉職：產品經理？-3f2a9c1e.md');
  const keys = frontmatter(markdown);
  assert.ok(keys.every(k => V2_KEYS.has(k)), keys.join(','));
  assert.match(markdown, /^---\ntitle: "明年要不要轉職：產品經理？"\ntype: note\nsource: "https:\/\/apps\.stephen\.taipei\/t\/3f2a9c1e-0000-4000-8000-000000000001"\n/);
  assert.match(markdown, /\nsource_date: "2026-11-01"\nsource_date_precision: exact\n/, 'creation day is taken in Asia/Taipei');
  assert.match(markdown, /\nwhy:\n/, 'why is left for the user');
  assert.match(markdown, /\nmodel_egress: deny\nbackup_egress: deny\n---\n/);
  assert.ok(markdown.indexOf('## 九宮格') < markdown.indexOf('## 決策'), 'charts come before decisions');
  assert.match(markdown, /- \[x\] 行動 t0a0\n- \[ \] 行動 t0a1（略過）\n- \[ \] 行動 t0a2\n/);
  assert.match(markdown, /進度：完成 1／3，略過 1/);
  assert.match(markdown, /````text\nLOCKED\n```\nMUST: x\n```\n````/, 'a longer fence keeps pasted code inside');
});

test('the note is deterministic so an unchanged topic is not imported twice', () => {
  const a = topicToMindGalaxyNote(exported(), { origin: 'https://apps.stephen.taipei' });
  const b = topicToMindGalaxyNote(exported({ exportedAt: '2027-01-01T00:00:00Z', documents: [...exported().documents].reverse() }), { origin: 'https://apps.stephen.taipei' });
  assert.deepEqual(a, b);
});

test('empty topics, English copy and bad input', () => {
  const empty = topicToMindGalaxyNote(exported({ documents: [] }), { origin: 'http://127.0.0.1:9300', lang: 'en' });
  assert.match(empty.markdown, /---\nThis topic has no chart or decision yet\.\n$/);
  assert.throws(() => topicToMindGalaxyNote({ format: 'other', version: 1, topic: { id: 'x' } }, { origin: 'https://x' }), /Unsupported/);
  const noDate = topicToMindGalaxyNote(exported({ topic: { id: 'abc', title: 'x', createdAt: 'nope' } }), { origin: 'https://x' });
  assert.match(noDate.markdown, /\nsource_date:\nsource_date_precision: unknown\n/);
  assert.equal(taipeiDate('2026-10-31T15:59:59Z'), '2026-10-31');
  assert.equal(taipeiDate('2026-10-31T16:00:00Z'), '2026-11-01');
  assert.equal(mindGalaxyFileName('a/b:c*d?"e"<f>|g#h^[i]', 'abcdef123456'), 'abcdefghi-abcdef12.md');
  assert.equal(mindGalaxyFileName('  ', ''), 'topic.md');
});

test('English notes use English punctuation', () => {
  const { markdown } = topicToMindGalaxyNote(exported(), { origin: 'https://apps.stephen.taipei', lang: 'en' });
  assert.match(markdown, /## Mandala: 轉職\n\nGoal: 一年內轉 PM\nProgress: 1 of 3 done, 1 skipped\n/);
  assert.match(markdown, /- \[ \] 行動 t0a1 \(skipped\)\n/);
  assert.match(markdown, /## Decision: 轉職決策\n\nQuestion: 要不要轉 PM\n/);
  assert.doesNotMatch(markdown.split('\n---\n')[1], /[：（）]/, 'only the user\'s own title keeps full-width marks');
});
