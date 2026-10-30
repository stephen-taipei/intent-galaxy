import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const exec = promisify(execFile);
const U = '11111111-1111-4111-8111-111111111111';
const V = '22222222-2222-4222-8222-222222222222';
const literal = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
function job(overrides = {}) {
  return { owner: { userId: U }, key: 'unique-key-1', requestHash: 'hash-one', request: { product: 'studio', operation: 'analyze', mode: 'standard' }, creditCost: 1, reservedMicros: 150000, dailyLimitMicros: 5000000, monthlyLimitMicros: 150000000, trialDailyLimitMicros: 500000, ...overrides };
}

test('PostgreSQL migration, RLS and atomic service RPC integration', { timeout: 120000 }, async t => {
  try { execFileSync('initdb', ['--version'], { stdio: 'ignore' }); execFileSync('pg_ctl', ['--version'], { stdio: 'ignore' }); execFileSync('psql', ['--version'], { stdio: 'ignore' }); }
  catch {
    if (process.env.REQUIRE_HOSTED_SQL_TESTS === '1') assert.fail('CI requires PostgreSQL initdb/pg_ctl/psql on PATH; SQL acceptance cannot be skipped.');
    t.skip('Local initdb/pg_ctl are unavailable; a real Supabase staging validation remains required.'); return;
  }
  const root = mkdtempSync(join(tmpdir(), 'intent-galaxy-pg-')); const data = join(root, 'data');
  let started = false; let postgresPid; let descendantPids = [];
  const args = ['-h', root, '-p', '5432', '-U', 'hosted_test', '-d', 'postgres', '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1'];
  const sql = text => execFileSync('psql', [...args, '-c', text], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const rpc = (name, value) => JSON.parse(sql(`select hosted_${name}(${literal(value)});`));
  const reset = () => sql(`truncate hosted_sessions,hosted_jobs,hosted_guests,hosted_trials,hosted_credit_usage,hosted_budgets,hosted_documents,hosted_checkouts,hosted_billing_links,hosted_subscriptions,hosted_payments,hosted_webhook_events,hosted_events restart identity cascade;`);
  try {
    execFileSync('initdb', ['-D', data, '--no-locale', '--encoding=UTF8', '--auth=trust', '--username=hosted_test'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    execFileSync('pg_ctl', ['-D', data, '-l', join(root, 'postgres.log'), '-o', `-c listen_addresses= -c unix_socket_directories=${root} -c port=5432`, '-w', 'start'], { stdio: 'ignore' });
    started = true; postgresPid = Number(readFileSync(join(data, 'postmaster.pid'), 'utf8').split('\n')[0]);
    const ppid = Number(execFileSync('ps', ['-p', String(postgresPid), '-o', 'ppid='], { encoding: 'utf8' }).trim());
    try { descendantPids = execFileSync('pgrep', ['-P', String(postgresPid)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split(/\s+/).map(Number).filter(Boolean); } catch { /* no children yet */ }
    writeFileSync(join(root, 'owned-resource.json'), JSON.stringify({ owner: 'hosted-backend-sql-test', startedAt: new Date().toISOString(), pid: postgresPid, ppid, descendants: descendantPids, command: 'postgres (private unix socket only)', cwd: data, socketDirectory: root, tcpListeners: false }));
    // The self-hosted bootstrap stands in for the Supabase roles and auth schema.
    execFileSync('psql', [...args], { input: readFileSync(new URL('../selfhosted/bootstrap.sql', import.meta.url), 'utf8'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    sql(`insert into auth.users values('${U}'),('${V}');`);
    const migration = readFileSync(new URL('../migrations/0001_hosted.sql', import.meta.url), 'utf8');
    execFileSync('psql', [...args], { input: migration, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const trialMigration = readFileSync(new URL('../migrations/0002_mandala_trial.sql', import.meta.url), 'utf8');
    execFileSync('psql', [...args], { input: trialMigration, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

    await t.test('RLS hides other tenants and authenticated callers cannot run service RPCs', () => {
      reset();
      const doc = JSON.parse(sql(`select hosted_document_create('${U}',${literal({ product: 'studio', kind: 'work', title: 'private', data: { body: 'private body' } })});`));
      assert.equal(sql(`set role authenticated; set request.jwt.claim.sub='${V}'; select count(*) from hosted_documents;`), '0');
      assert.equal(sql(`set role authenticated; set request.jwt.claim.sub='${U}'; select count(*) from hosted_documents;`), '1');
      // PostgREST 12 passes claims as one JSON setting.
      assert.equal(sql(`set role authenticated; set request.jwt.claims='{"sub":"${U}"}'; select count(*) from hosted_documents;`), '1');
      assert.throws(() => sql(`set role authenticated; select hosted_document_get('${U}','${doc.id}');`), /permission denied/);
      assert.throws(() => sql(`set role authenticated; insert into hosted_documents(user_id,product,kind,title,data) values('${V}','studio','work','bad','{}');`), /permission denied/);
      assert.throws(() => sql(`select hosted_document_get('${V}','${doc.id}');`), /not_found/);
    });

    await t.test('concurrent same-key reservations consume one credit and one budget reservation', async () => {
      reset();
      const query = `select hosted_reserve_job(${literal(job())});`;
      const responses = await Promise.all([exec('psql', [...args, '-c', query]), exec('psql', [...args, '-c', query])]);
      const records = responses.map(r => JSON.parse(r.stdout.trim()));
      assert.equal(records[0].id, records[1].id); assert.equal(records.filter(r => r.created).length, 1);
      assert.equal(sql('select sum(used) from hosted_credit_usage;'), '1');
      assert.equal(sql("select sum(spent_micros) from hosted_budgets where period like 'day:%';"), '150000');
      assert.equal(sql("select count(*) from hosted_ledger where entry_type='reserve';"), '1');
      assert.throws(() => rpc('reserve_job', job({ requestHash: 'different' })), /idempotency_conflict/);
    });

    await t.test('concurrent credit and budget limits never overspend', async () => {
      reset();
      sql(`insert into hosted_credit_usage values('u:${U}','studio',to_char(now() at time zone 'Asia/Taipei','YYYY-MM'),19);`);
      const responses = await Promise.allSettled([1, 2].map(n => exec('psql', [...args, '-c', `select hosted_reserve_job(${literal(job({ key: `quota-${n}` }))});`])));
      assert.equal(responses.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(sql('select sum(used) from hosted_credit_usage;'), '20');
      reset();
      const results = await Promise.allSettled([1, 2].map(n => exec('psql', [...args, '-c', `select hosted_reserve_job(${literal(job({ key: `budget-${n}`, dailyLimitMicros: 150000 }))});`])));
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(sql('select sum(used) from hosted_credit_usage;'), '1');
      assert.equal(sql('select count(*) from hosted_jobs;'), '1');
    });

    await t.test('terminal settlement is idempotent and unknown work retains credits/budget', () => {
      reset();
      const first = rpc('reserve_job', job());
      assert.equal(JSON.parse(sql(`select hosted_job_claim('${first.id}');`)).claimed, true);
      assert.equal(JSON.parse(sql(`select hosted_job_claim('${first.id}');`)).claimed, false);
      sql(`select hosted_job_dispatched('${first.id}'); select hosted_job_finish('${first.id}','unknown',null,'provider_outcome_unknown',null);`);
      assert.equal(sql(`select hosted_job_finish('${first.id}','failed',null,'late failure',0);`), 'f');
      assert.equal(sql('select sum(used) from hosted_credit_usage;'), '1');
      assert.equal(sql("select spent_micros from hosted_budgets where period like 'day:%';"), '150000');
      const second = rpc('reserve_job', job({ key: 'refund-once' }));
      sql(`select hosted_job_finish('${second.id}','failed',null,'definite',0); select hosted_job_finish('${second.id}','failed',null,'definite',0);`);
      assert.equal(sql('select sum(used) from hosted_credit_usage;'), '1');
      assert.equal(sql("select count(*) from hosted_ledger where entry_type='settle';"), '2');
    });

    await t.test('cleanup cannot refund a queued snapshot after a concurrent claim/dispatch', async () => {
      const waitForActivity = async (label, waitEvent) => {
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
          const record = sql(`select jsonb_build_object('pid',pid,'event',wait_event) from pg_stat_activity where application_name='${label}' and wait_event='${waitEvent}';`);
          if (record) return JSON.parse(record);
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        assert.fail(`Database session ${label} did not reach ${waitEvent}.`);
      };
      const named = (label, query) => exec('psql', [...args, '-c', `set application_name='${label}'; set statement_timeout='10s'; ${query}`]).then(value => ({ value }), error => ({ error }));
      for (const staleRunning of [false, true]) {
        reset(); const reserved = rpc('reserve_job', job());
        sql(`update hosted_jobs set updated_at=clock_timestamp()-interval '2 hours' where id='${reserved.id}';`);
        const blocker = named('hosted-race-blocker', "begin; select pg_advisory_xact_lock(hashtextextended('hosted-platform-budget',0)); select pg_sleep(30); commit;");
        const processes = [blocker]; let blockerPid;
        try {
          blockerPid = (await waitForActivity('hosted-race-blocker', 'PgSleep')).pid;
          // Queue a budget-owning worker before cleanup. Old cleanup reads the
          // queued row before waiting, then refunds using its obsolete flag.
          const worker = named('hosted-race-worker', `begin; select pg_advisory_xact_lock(hashtextextended('hosted-platform-budget',0)); select hosted_job_claim('${reserved.id}'); select hosted_job_dispatched('${reserved.id}'); ${staleRunning ? `update hosted_jobs set updated_at=clock_timestamp()-interval '25 minutes' where id='${reserved.id}';` : ''} commit;`);
          processes.push(worker); await waitForActivity('hosted-race-worker', 'advisory');
          const cleaner = named('hosted-race-cleaner', 'select hosted_cleanup();'); processes.push(cleaner);
          await waitForActivity('hosted-race-cleaner', 'advisory');
          assert.equal(sql(`select pg_cancel_backend(${blockerPid});`), 't');
          const [blocked, worked, cleaned] = await Promise.all([blocker, worker, cleaner]);
          assert.match(blocked.error?.stderr || '', /canceling statement due to user request/);
          if (worked.error) throw worked.error; if (cleaned.error) throw cleaned.error;
          assert.equal(sql(`select status from hosted_jobs where id='${reserved.id}';`), staleRunning ? 'unknown' : 'running');
          assert.equal(sql(`select dispatched from hosted_jobs where id='${reserved.id}';`), 't');
          assert.equal(sql('select sum(used) from hosted_credit_usage;'), '1');
          assert.equal(sql("select spent_micros from hosted_budgets where period like 'day:%';"), '150000');
          if (!staleRunning) {
            assert.equal(sql(`select hosted_job_finish('${reserved.id}','completed','{"draft":"preserved"}',null,150000);`), 't');
            assert.equal(sql(`select result->>'draft' from hosted_jobs where id='${reserved.id}';`), 'preserved');
          }
        } finally {
          // Only these named backends in this task-owned private cluster exist.
          sql("select pg_terminate_backend(pid) from pg_stat_activity where application_name in ('hosted-race-blocker','hosted-race-worker','hosted-race-cleaner') and pid<>pg_backend_pid();");
          await Promise.all(processes);
        }
      }
    });

    await t.test('document create limits and optimistic concurrency are enforced in SQL', async () => {
      reset(); const value = { product: 'mandala', kind: 'goal', title: 'one goal', data: { schemaVersion: 1 } };
      const doc = JSON.parse(sql(`select hosted_document_create('${U}',${literal(value)});`));
      assert.throws(() => sql(`select hosted_document_create('${U}',${literal(value)});`), /document_limit/);
      const writes = await Promise.allSettled([1, 2].map(n => exec('psql', [...args, '-c', `select hosted_document_update('${U}','${doc.id}',${literal({ title: `edit ${n}`, data: { n }, revision: 1 })});`])));
      assert.equal(writes.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(sql(`select revision from hosted_documents where id='${doc.id}';`), '2');
      assert.throws(() => sql(`select hosted_document_versions('${U}','${doc.id}');`), /pro_required/);
      assert.equal(sql(`select count(*) from hosted_document_versions where document_id='${doc.id}';`), '2');
    });

    await t.test('verified payment, lifecycle ordering, replay, product isolation and refund', () => {
      reset();
      const checkout = JSON.parse(sql(`select hosted_checkout_begin('${U}','studio','checkout-one');`));
      const occurred = Date.now() - 5000; const start = new Date(occurred - 3600000).toISOString(); const end = new Date(occurred + 30 * 86400000).toISOString();
      const base = { userId: U, product: 'studio', subscriptionId: 'sub_studio', customerId: 'ctm_owner', checkoutId: checkout.id };
      // A newer non-revoking subscription notification can arrive before payment.
      rpc('webhook_apply', { ...base, id: 'evt_activated', type: 'subscription.activated', action: 'lifecycle', status: 'active', occurredAt: new Date(occurred + 1000).toISOString() });
      assert.equal(JSON.parse(sql(`select hosted_entitlements('${U}');`)).studio.plan, 'free');
      const paid = { ...base, id: 'evt_payment', type: 'transaction.completed', action: 'payment', transactionId: 'txn_studio', periodStart: start, periodEnd: end, occurredAt: new Date(occurred).toISOString() };
      rpc('webhook_apply', paid);
      const ent = JSON.parse(sql(`select hosted_entitlements('${U}');`));
      assert.equal(ent.studio.plan, 'pro'); assert.equal(ent.studio.credits, 200); assert.equal(ent.mandala.plan, 'free'); assert.equal(ent.mandala.credits, 0);
      assert.equal(rpc('webhook_apply', paid).duplicate, true);
      assert.equal(sql('select count(*) from hosted_payments;'), '1');
      assert.throws(() => rpc('reserve_job', job({ key: 'wrong-product', request: { product: 'mandala', mode: 'standard', operation: 'expand' } })), /quota_exceeded/);
      rpc('webhook_apply', { ...base, checkoutId: undefined, id: 'evt_cancel', type: 'subscription.canceled', action: 'revoke', status: 'canceled', occurredAt: new Date(occurred + 2000).toISOString() });
      rpc('webhook_apply', { ...paid, id: 'evt_older_payment' });
      assert.equal(JSON.parse(sql(`select hosted_entitlements('${U}');`)).studio.plan, 'free');
      // A second product's purchase is independent.
      const mandalaCheckout = JSON.parse(sql(`select hosted_checkout_begin('${U}','mandala','checkout-mandala');`));
      rpc('webhook_apply', { ...paid, id: 'evt_mandala', product: 'mandala', checkoutId: mandalaCheckout.id, transactionId: 'txn_mandala', subscriptionId: 'sub_mandala', occurredAt: new Date(occurred + 3000).toISOString() });
      assert.equal(JSON.parse(sql(`select hosted_entitlements('${U}');`)).mandala.credits, 100);
      rpc('webhook_apply', { id: 'evt_refund', type: 'adjustment.updated', action: 'refund', occurredAt: new Date().toISOString(), userId: U, product: 'mandala', transactionId: 'txn_mandala' });
      assert.equal(JSON.parse(sql(`select hosted_entitlements('${U}');`)).mandala.plan, 'free');
      // Cancellation delivered before an older payment must not grant Pro.
      const other = JSON.parse(sql(`select hosted_checkout_begin('${V}','studio','other-checkout');`));
      const otherBase = { ...base, userId: V, checkoutId: other.id, subscriptionId: 'sub_other', customerId: 'ctm_other' };
      rpc('webhook_apply', { ...otherBase, id: 'evt_other_cancel', type: 'subscription.canceled', action: 'revoke', status: 'canceled', occurredAt: new Date(occurred + 4000).toISOString() });
      rpc('webhook_apply', { ...paid, ...otherBase, id: 'evt_other_payment', transactionId: 'txn_other' });
      assert.equal(JSON.parse(sql(`select hosted_entitlements('${V}');`)).studio.plan, 'free');
    });

    await t.test('free Mandala trial: per-owner and platform daily caps, guests allowed, owner refund only on failure', () => {
      reset(); const gid = '44444444-4444-4444-8444-444444444444';
      rpc('guest_create', { id: gid, browserHash: 'mandala-browser', ipHash: 'ip', expiresAt: new Date(Date.now() + 3600000).toISOString(), ipDailyLimit: 3, globalDailyLimit: 25 });
      const limits = { mandalaOwnerDailyCharts: 1, mandalaOwnerDailyCalls: 2, mandalaPlatformDailyCharts: 2, mandalaPlatformDailyCalls: 10 };
      const trial = (owner, operation, key) => job({ owner, key, requestHash: key, request: { product: 'mandala', operation, mode: 'standard' }, reservedMicros: 70000, ...limits });
      const first = rpc('reserve_job', trial({ guestId: gid }, 'themes', 'g-themes-1'));
      assert.equal(first.created, true);
      // Free users have no Mandala credits, but the trial does not use the plan.
      assert.equal(rpc('reserve_job', trial({ userId: U }, 'themes', 'u-themes-1')).created, true);
      assert.throws(() => rpc('reserve_job', trial({ userId: V }, 'themes', 'v-themes-1')), /trial_limit/);
      assert.throws(() => rpc('reserve_job', trial({ guestId: gid }, 'themes', 'g-themes-2')), /trial_limit/);
      rpc('reserve_job', trial({ guestId: gid }, 'expand_theme', 'g-cell-1')); rpc('reserve_job', trial({ guestId: gid }, 'perspectives', 'g-cell-2'));
      assert.throws(() => rpc('reserve_job', trial({ guestId: gid }, 'expand_empty', 'g-cell-3')), /trial_limit/);
      // A failed job returns the owner's count; the platform total stays spent.
      sql(`select hosted_job_claim('${first.id}'); select hosted_job_finish('${first.id}','failed',null,'operation_rejected',0);`);
      assert.equal(sql(`select used from hosted_credit_usage where owner_key='g:${gid}' and period like 'trial-charts:%';`), '0');
      assert.equal(sql(`select used from hosted_credit_usage where owner_key='platform' and period like 'trial-charts:%';`), '2');
      assert.throws(() => rpc('reserve_job', trial({ guestId: gid }, 'themes', 'g-themes-3')), /trial_limit/);
      // The paid operations and the deep mode still follow the plan.
      assert.throws(() => rpc('reserve_job', job({ owner: { userId: V }, key: 'v-expand', request: { product: 'mandala', operation: 'expand', mode: 'standard' } })), /quota_exceeded/);
      assert.throws(() => rpc('reserve_job', { ...trial({ userId: V }, 'expand_theme', 'v-deep'), creditCost: 10, request: { product: 'mandala', operation: 'expand_theme', mode: 'deep' } }), /trial_limit/);
      assert.throws(() => rpc('reserve_job', { ...trial({ userId: V }, 'expand_theme', 'v-off'), mandalaOwnerDailyCalls: 0 }), /trial_limit/);
    });

    await t.test('guest caps and 24-hour payload cleanup retain aggregate cost and trial tombstone', () => {
      reset(); const gid = '33333333-3333-4333-8333-333333333333';
      const guest = { id: gid, browserHash: 'browser', ipHash: 'ip', expiresAt: new Date(Date.now() + 3600000).toISOString(), ipDailyLimit: 1, globalDailyLimit: 2 };
      rpc('guest_create', guest);
      assert.throws(() => rpc('guest_create', { ...guest, id: V, browserHash: 'other' }), /guest_limit/);
      const reserved = rpc('reserve_job', job({ owner: { guestId: gid }, key: 'guest-analysis' }));
      assert.throws(() => rpc('reserve_job', job({ owner: { guestId: gid }, key: 'repeat' })), /guest_limit/);
      assert.throws(() => rpc('reserve_job', job({ owner: { guestId: gid }, key: 'deep', request: { product: 'studio', mode: 'deep', operation: 'generate' }, creditCost: 10 })), /guest_limit/);
      sql(`select hosted_job_claim('${reserved.id}'); select hosted_job_dispatched('${reserved.id}'); update hosted_jobs set updated_at=now()-interval '25 minutes'; update hosted_guests set expires_at=now()-interval '1 second'; select hosted_cleanup();`);
      assert.equal(sql('select count(*) from hosted_guests;'), '0'); assert.equal(sql('select count(*) from hosted_jobs;'), '0');
      assert.equal(sql('select count(*) from hosted_trials;'), '1');
      assert.equal(sql("select spent_micros from hosted_budgets where period like 'day:%';"), '150000');
      assert.equal(sql('select count(*) from hosted_ledger where job_id is null;'), '2');
    });
  } finally {
    if (!postgresPid && existsSync(join(data, 'postmaster.pid'))) postgresPid = Number(readFileSync(join(data, 'postmaster.pid'), 'utf8').split('\n')[0]);
    if (started || postgresPid) execFileSync('pg_ctl', ['-D', data, '-m', 'immediate', '-w', 'stop'], { stdio: 'ignore' });
    if (postgresPid) assert.throws(() => process.kill(postgresPid, 0), error => error.code === 'ESRCH');
    for (const pid of descendantPids) assert.throws(() => process.kill(pid, 0), error => error.code === 'ESRCH');
    assert.equal(existsSync(join(root, '.s.PGSQL.5432')), false);
    rmSync(root, { recursive: true, force: true });
  }
});
