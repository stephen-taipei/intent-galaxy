#!/usr/bin/env node
// 來源：reviews/results-v0.1.1/review-grok-4.7.md §2.6（「這支檔案就是規格」）。
// 由 `npx @stephen.taipei/intent-galaxy init-hook` 複製到使用者 repo 的 .intent/hooks/kill-gate.mjs，零依賴。
// 與參考實作的差異：session 模式在 git repo 外直接靜默結束（SessionStart 不可中斷啟動）。
// Passive kill-gate. Silence before auditDueAt. After that, a scoped
// commit or pull request must carry an Intent-Kill trailer. Session
// mode only prints. It never blocks process startup.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const KILL_VERDICT = /^(alive|dead|unobservable)$/;
const WITHHELD_VERDICT = /^(card|withheld|other)$/;
const MIN_EVIDENCE = 12;

const mode = process.argv[2];

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return null;
  }
}

function fail(message) {
  console.error(message);
  if (process.env.GITHUB_ACTIONS) {
    const flat = String(message).replaceAll('\n', '%0A');
    console.log(`::error::${flat}`);
  }
  process.exit(1);
}

function chdirRepo() {
  const root = git(['rev-parse', '--show-toplevel']);
  process.chdir(root);
}

function gitPathExists(name) {
  const path = tryGit(['rev-parse', '--git-path', name]);
  return path ? existsSync(path) : false;
}

function inProgressGitOp() {
  return gitPathExists('MERGE_HEAD')
    || gitPathExists('CHERRY_PICK_HEAD')
    || gitPathExists('REBASE_HEAD');
}

function parseJson(text) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, data: null };
  }
}

function readRev(rev) {
  const text = tryGit(['show', rev]);
  if (text == null) return { present: false, ok: true, data: null };
  const parsed = parseJson(text);
  return { present: true, ok: parsed.ok, data: parsed.data };
}

function readWorktree() {
  if (!existsSync('.intent.lock.json')) return { present: false, ok: true, data: null };
  const parsed = parseJson(readFileSync('.intent.lock.json', 'utf8'));
  return { present: true, ok: parsed.ok, data: parsed.data };
}

function stagedNames() {
  const raw = tryGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR']) ?? '';
  return raw.split('\n').filter(Boolean);
}

function lockDeletedInIndex() {
  const raw = tryGit(['diff', '--cached', '--name-status', '--find-renames']) ?? '';
  for (const line of raw.split('\n')) {
    const parts = line.split('\t');
    if (parts[0] === 'D' && parts[1] === '.intent.lock.json') return true;
    if (parts[0]?.startsWith('R') && parts[1] === '.intent.lock.json' && parts[2] !== '.intent.lock.json') {
      return true;
    }
  }
  return false;
}

function touchesScope(paths, scopePaths) {
  if (paths.length === 0) return false;
  if (!Array.isArray(scopePaths) || scopePaths.length === 0 || scopePaths.includes('*')) return true;
  return paths.some((file) => scopePaths.some((scope) => {
    if (file === scope) return true;
    const prefix = scope.endsWith('/') ? scope : `${scope}/`;
    return file.startsWith(prefix);
  }));
}

function parseTrailers(message) {
  const out = {};
  for (const raw of message.split(/\r?\n/)) {
    const match = raw.trim().match(/^(Intent-(?:Lock|Kill|Kill-Evidence|Withheld))\s*[:：]\s*(.+)$/);
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
}

function validKill(trailers, specHash) {
  return trailers['Intent-Lock'] === specHash
    && KILL_VERDICT.test(trailers['Intent-Kill'] ?? '')
    && [...(trailers['Intent-Kill-Evidence'] ?? '')].length >= MIN_EVIDENCE;
}

function findAttestation(specHash) {
  const raw = tryGit(['log', '-F', '--grep', specHash, '--format=%B%x1e']);
  if (!raw) return null;
  let verdict = null;
  let withheld = null;
  for (const message of raw.split('\u001e')) {
    const trailers = parseTrailers(message);
    if (trailers['Intent-Lock'] !== specHash) continue;
    if (KILL_VERDICT.test(trailers['Intent-Kill'] ?? '')
      && [...(trailers['Intent-Kill-Evidence'] ?? '')].length >= MIN_EVIDENCE) {
      verdict = trailers['Intent-Kill'];
    }
    if (WITHHELD_VERDICT.test(trailers['Intent-Withheld'] ?? '')) {
      withheld = trailers['Intent-Withheld'];
    }
  }
  if (!verdict) return null;
  return { verdict, withheld };
}

function dueState(lock) {
  const at = Date.parse(lock?.auditDueAt ?? '');
  if (Number.isNaN(at)) return 'invalid';
  return Date.now() >= at ? 'due' : 'waiting';
}

function clockSlip(previous, next) {
  if (!previous || !next) return null;
  const previousDecided = Date.parse(previous.decidedAt ?? '');
  const nextDecided = Date.parse(next.decidedAt ?? '');
  if (Number.isNaN(previousDecided) || Number.isNaN(nextDecided)) return 'decidedAt 無法解析';
  const hashChanged = previous.specHash !== next.specHash;
  const attested = findAttestation(previous.specHash);
  const ageMs = Date.now() - previousDecided;
  const decidedNow = Math.abs(Date.now() - nextDecided) <= 60 * 1000;
  const graceRestart = hashChanged && !attested && ageMs >= 0 && ageMs < 10 * 60 * 1000 && decidedNow;
  if (hashChanged && !attested && !graceRestart) {
    return '舊契約還沒有 Intent-Kill。specHash 現在不能換。簽署後 10 分鐘內可以換牌，decidedAt 必須改成現在。';
  }
  if (!graceRestart && nextDecided > previousDecided && !attested) {
    return 'decidedAt 被往後搬，而舊契約還沒有 Intent-Kill';
  }
  if (!hashChanged && Date.parse(next.auditDueAt) > Date.parse(previous.auditDueAt)) {
    return 'auditDueAt 被往後搬';
  }
  return null;
}

function hitsGate(paths, scopePaths) {
  if (paths.includes('.intent.lock.json')) return true;
  return touchesScope(paths, scopePaths);
}

function requireWeldedKill(lock) {
  if (!lock?.specHash || !lock?.weldedKill?.fatalPremise || !lock?.weldedKill?.killCondition14d) {
    return '鎖裡沒有 specHash 或 weldedKill。沒有牌面致死前提的契約不能放行。';
  }
  return null;
}

function banner(lock) {
  return [
    `14 天前你簽了這句：${lock.weldedKill.fatalPremise}`,
    `當時寫下、外人拿得出來對的指標：${lock.weldedKill.killCondition14d}`,
    '這次先停住。在 commit message 加上這三行再送：',
    `Intent-Lock: ${lock.specHash}`,
    'Intent-Kill: alive|dead|unobservable',
    'Intent-Kill-Evidence: （一句話。寫你看到的數，或寫你缺的那個數）',
  ].join('\n');
}

function withheldText(lock) {
  const withheld = lock.withheldKill ?? {};
  return [
    '牌上那一刀已經有結果。下面這刀當時沒放上牌面：',
    `${withheld.label ?? '（鎖裡沒有 withheldKill.label）'}：${withheld.fatalPremise ?? '（沒有 fatalPremise）'}`,
    `外人可查：${withheld.killCondition14d ?? '（沒有 killCondition14d）'}`,
    '下一次碰到這個範圍的 commit，加上這兩行：',
    `Intent-Lock: ${lock.specHash}`,
    'Intent-Withheld: card|withheld|other',
  ].join('\n');
}

function baseSha() {
  if (process.env.INTENT_BASE_SHA) return process.env.INTENT_BASE_SHA;
  if (!process.env.GITHUB_EVENT_PATH) return null;
  const event = parseJson(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  return event.ok ? event.data?.pull_request?.base?.sha ?? null : null;
}

function session(lockFile) {
  if (!lockFile.present) return;
  if (!lockFile.ok) {
    process.stdout.write('intent lock 讀不了。這次不會假裝你沒簽過。\n');
    return;
  }
  const state = dueState(lockFile.data);
  if (state === 'waiting') return;
  if (state === 'invalid') {
    process.stdout.write('auditDueAt 無法解析。\n');
    return;
  }
  const broken = requireWeldedKill(lockFile.data);
  if (broken) {
    process.stdout.write(`${broken}\n`);
    return;
  }
  const found = findAttestation(lockFile.data.specHash);
  if (!found) {
    process.stdout.write(`${banner(lockFile.data)}\n`);
    return;
  }
  if (found.verdict === 'dead' && !found.withheld) {
    process.stdout.write(`${withheldText(lockFile.data)}\n`);
    return;
  }
  const followUpAt = Date.parse(lockFile.data.decidedAt) + (28 * 24 * 60 * 60 * 1000);
  if (found.verdict === 'alive' && Date.now() >= followUpAt && !found.withheld) {
    const marker = tryGit(['rev-parse', '--git-path', 'intent-withheld-prompted']);
    if (!marker || existsSync(marker)) return;
    writeFileSync(marker, new Date().toISOString());
    process.stdout.write(`${withheldText(lockFile.data)}\n`);
  }
}

function commitMsg(messagePath) {
  if (inProgressGitOp()) return;
  const staged = stagedNames();
  const head = readRev('HEAD:.intent.lock.json');
  if (head.present && !head.ok) fail('HEAD 上的 .intent.lock.json 讀不了。');
  if (lockDeletedInIndex()) {
    if (head.data && !findAttestation(head.data.specHash)) {
      fail('這張契約還沒有 Intent-Kill。現在不能刪。到期之後用 Intent-Kill trailer 收屍，才能拿掉檔案。');
    }
    return;
  }
  const index = staged.includes('.intent.lock.json')
    ? readRev(':.intent.lock.json')
    : { present: false, ok: true, data: null };
  if (index.present && !index.ok) fail('這次提交裡的 .intent.lock.json 讀不了。');
  const post = index.present ? index.data : head.data;
  if (!post) return;
  const slip = clockSlip(head.data, index.present ? index.data : null);
  if (slip) fail(slip);
  const state = dueState(post);
  if (state === 'invalid') fail('auditDueAt 無法解析。');
  if (state === 'waiting') return;
  const broken = requireWeldedKill(post);
  if (broken) fail(broken);
  const found = findAttestation(post.specHash);
  if (found?.verdict === 'dead' && !found.withheld && hitsGate(staged, post.scopePaths)) {
    const trailers = parseTrailers(readFileSync(messagePath, 'utf8'));
    const closed = trailers['Intent-Lock'] === post.specHash
      && WITHHELD_VERDICT.test(trailers['Intent-Withheld'] ?? '');
    if (!closed) fail(withheldText(post));
  }
  if (found) return;
  if (!hitsGate(staged, post.scopePaths)) return;
  const trailers = parseTrailers(readFileSync(messagePath, 'utf8'));
  if (validKill(trailers, post.specHash)) return;
  fail(banner(post));
}

function pullRequest() {
  const base = baseSha();
  if (!base) fail('pull-request 模式需要 INTENT_BASE_SHA 或 GITHUB_EVENT_PATH。');
  const baseLock = readRev(`${base}:.intent.lock.json`);
  const headLock = readRev('HEAD:.intent.lock.json');
  if (baseLock.present && !baseLock.ok) fail('base 上的 .intent.lock.json 讀不了。');
  if (headLock.present && !headLock.ok) fail('HEAD 上的 .intent.lock.json 讀不了。');
  if (!headLock.present) {
    if (baseLock.data && !findAttestation(baseLock.data.specHash)) {
      fail('這張 PR 刪掉了尚未驗屍的 .intent.lock.json');
    }
    return;
  }
  const slip = clockSlip(baseLock.data, headLock.data);
  if (slip) fail(slip);
  const state = dueState(headLock.data);
  if (state === 'invalid') fail('auditDueAt 無法解析。');
  if (state === 'waiting') return;
  const broken = requireWeldedKill(headLock.data);
  if (broken) fail(broken);
  if (findAttestation(headLock.data.specHash)) return;
  const diff = (tryGit(['diff', '--name-only', `${base}...HEAD`]) ?? '').split('\n').filter(Boolean);
  if (!hitsGate(diff, headLock.data.scopePaths)) return;
  fail(banner(headLock.data));
}

try {
  chdirRepo();
} catch {
  if (mode === 'session') process.exit(0);
  fail('kill-gate 必須在 git repo 內執行。');
}

if (mode === 'session') session(readWorktree());
else if (mode === 'commit-msg') commitMsg(process.argv[3]);
else if (mode === 'pull-request') pullRequest();
else {
  console.error('usage: kill-gate.mjs <session|commit-msg|pull-request>');
  process.exit(2);
}
