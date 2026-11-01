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
  const reset = () => sql(`truncate hosted_sessions,hosted_jobs,hosted_guests,hosted_trials,hosted_credit_usage,hosted_budgets,hosted_documents,hosted_checkouts,hosted_billing_links,hosted_subscriptions,hosted_payments,hosted_webhook_events,hosted_events,hosted_invites,hosted_invite_redemptions,hosted_user_activity,hosted_profiles,hosted_public_charts,hosted_public_views,hosted_topics restart identity cascade; delete from hosted_identities; delete from auth.users where id not in ('${U}','${V}');`);
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
    execFileSync('psql', [...args], { input: readFileSync(new URL('../migrations/0003_google_invites_metrics.sql', import.meta.url), 'utf8'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    execFileSync('psql', [...args], { input: readFileSync(new URL('../migrations/0004_public_feed.sql', import.meta.url), 'utf8'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    execFileSync('psql', [...args], { input: readFileSync(new URL('../migrations/0005_topics.sql', import.meta.url), 'utf8'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

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
      // Free accounts keep ten Mandala charts during the free test period (0003).
      for (let n = 1; n < 10; n++) sql(`select hosted_document_create('${U}',${literal(value)});`);
      assert.throws(() => sql(`select hosted_document_create('${U}',${literal(value)});`), /document_limit/);
      const writes = await Promise.allSettled([1, 2].map(n => exec('psql', [...args, '-c', `select hosted_document_update('${U}','${doc.id}',${literal({ title: `edit ${n}`, data: { n }, revision: 1 })});`])));
      assert.equal(writes.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(sql(`select revision from hosted_documents where id='${doc.id}';`), '2');
      // Mandala history is free during the test period; Studio history still needs Pro.
      assert.equal(JSON.parse(sql(`select hosted_document_versions('${U}','${doc.id}');`)).length, 2);
      const work = JSON.parse(sql(`select hosted_document_create('${U}',${literal({ product: 'studio', kind: 'work', title: 'w', data: {} })});`));
      assert.throws(() => sql(`select hosted_document_versions('${U}','${work.id}');`), /pro_required/);
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

    await t.test('free Mandala trial: daily caps for accounts, invite-only for guests, owner refund only on failure', () => {
      reset(); const gid = '44444444-4444-4444-8444-444444444444'; const plain = '55555555-5555-4555-8555-555555555555';
      const limits = { mandalaOwnerDailyCharts: 1, mandalaOwnerDailyCalls: 2, mandalaInviteCharts: 1, mandalaInviteCalls: 2, mandalaPlatformDailyCharts: 2, mandalaPlatformDailyCalls: 10 };
      const trial = (owner, operation, key) => job({ owner, key, requestHash: key, request: { product: 'mandala', operation, mode: 'standard' }, reservedMicros: 70000, ...limits });
      // A plain browser trial is for the Studio only; the Mandala needs an account or an invite.
      rpc('guest_create', { id: plain, browserHash: 'plain-browser', ipHash: 'ip', expiresAt: new Date(Date.now() + 3600000).toISOString(), ipDailyLimit: 3, globalDailyLimit: 25 });
      assert.throws(() => rpc('reserve_job', trial({ guestId: plain }, 'themes', 'plain-themes')), /trial_login_required/);
      const code = 'ABCDEFGH23';
      rpc('invite_create', { userId: U, code, browserHash: 'inviter-browser', dailyLimit: 3, openLimit: 3, ttlDays: 7 });
      assert.equal(rpc('invite_redeem', { code: code.toLowerCase(), browserHash: 'friend-browser', ipHash: 'ip', ipDailyLimit: 3, guestId: gid, expiresAt: new Date(Date.now() + 3600000).toISOString() }).invite, true);
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
      assert.equal(sql(`select used from hosted_credit_usage where owner_key='g:${gid}' and period='trial-charts:invite';`), '0');
      assert.equal(sql(`select used from hosted_credit_usage where owner_key='platform' and period like 'trial-charts:%';`), '2');
      assert.throws(() => rpc('reserve_job', trial({ guestId: gid }, 'themes', 'g-themes-3')), /trial_limit/);
      // The paid operations and the deep mode still follow the plan.
      assert.throws(() => rpc('reserve_job', job({ owner: { userId: V }, key: 'v-expand', request: { product: 'mandala', operation: 'expand', mode: 'standard' } })), /quota_exceeded/);
      assert.throws(() => rpc('reserve_job', { ...trial({ userId: V }, 'expand_theme', 'v-deep'), creditCost: 10, request: { product: 'mandala', operation: 'expand_theme', mode: 'deep' } }), /trial_limit/);
      assert.throws(() => rpc('reserve_job', { ...trial({ userId: V }, 'expand_theme', 'v-off'), mandalaOwnerDailyCalls: 0 }), /trial_limit/);
    });

    await t.test('invites: daily and open limits, single use, one per browser, not the inviter, conversion', () => {
      reset(); const create = (code, browserHash = 'inviter') => rpc('invite_create', { userId: U, code, browserHash, dailyLimit: 3, openLimit: 2, ttlDays: 7 });
      const redeem = (code, browserHash, guestId) => rpc('invite_redeem', { code, browserHash, ipHash: 'ip', ipDailyLimit: 2, guestId, expiresAt: new Date(Date.now() + 3600000).toISOString() });
      create('AAAAAAAAA2'); create('AAAAAAAAA3');
      assert.throws(() => create('AAAAAAAAA4'), /invite_limit/);
      assert.throws(() => redeem('AAAAAAAAA2', 'inviter', '61111111-1111-4111-8111-111111111111'), /invite_invalid/);
      redeem('AAAAAAAAA2', 'friend', '62222222-2222-4222-8222-222222222222');
      assert.throws(() => redeem('AAAAAAAAA2', 'other', '63333333-3333-4333-8333-333333333333'), /invite_invalid/);
      assert.throws(() => redeem('AAAAAAAAA3', 'friend', '64444444-4444-4444-8444-444444444444'), /invite_used/);
      // Redeeming freed an open slot; the third code of the day is the last.
      create('AAAAAAAAA4');
      assert.throws(() => create('AAAAAAAAA5'), /invite_limit/);
      assert.throws(() => rpc('invite_create', { userId: V, code: 'lowercase1', browserHash: 'v', dailyLimit: 3, openLimit: 2, ttlDays: 7 }), /check constraint/);
      sql("update hosted_invites set expires_at=now()-interval '1 second' where code='AAAAAAAAA3';");
      assert.throws(() => redeem('AAAAAAAAA3', 'late', '65555555-5555-4555-8555-555555555555'), /invite_invalid/);
      assert.equal(sql(`select hosted_invite_convert('friend','${U}');`), 'f');
      assert.equal(sql(`select hosted_invite_convert('friend','${V}');`), 't');
      assert.deepEqual(JSON.parse(sql(`select hosted_invite_list('${U}');`)).map(i => i.status).sort(), ['expired', 'joined', 'open']);
    });

    await t.test('Google identities, activity, metrics and account deletion', () => {
      reset();
      const first = rpc('user_upsert', { provider: 'google', subject: 'google-sub-1', email: 'a@example.test' });
      assert.equal(first.created, true);
      const again = rpc('user_upsert', { provider: 'google', subject: 'google-sub-1', email: 'new@example.test' });
      assert.equal(again.id, first.id); assert.equal(again.created, false); assert.equal(again.email, 'new@example.test');
      assert.throws(() => rpc('user_upsert', { provider: 'github', subject: 'x', email: 'a@example.test' }), /not_found/);
      sql(`select hosted_touch_activity('${first.id}'); select hosted_touch_activity('${first.id}');`);
      sql(`update hosted_identities set created_at=now()-interval '1 day' where user_id='${first.id}'; insert into hosted_user_activity values('${first.id}',(now() at time zone 'Asia/Taipei')::date-1);`);
      const chart = { title: 'x', goal: 'g', themes: [{ id: 't0', title: 'a', actions: Array.from({ length: 8 }, (_, i) => ({ id: `a${i}`, text: `step ${i}`, done: false })) }] };
      sql(`insert into hosted_documents(user_id,product,kind,title,data) values('${first.id}','mandala','goal','x',${literal(chart)});`);
      rpc('invite_create', { userId: first.id, code: 'BBBBBBBBB2', browserHash: 'b', dailyLimit: 3, openLimit: 3, ttlDays: 7 });
      const metrics = JSON.parse(sql('select hosted_metrics(7);'));
      assert.equal(metrics.signups, 1); assert.deepEqual(metrics.retention.d1, { eligible: 1, retained: 1 });
      assert.equal(metrics.retention.d7.eligible, 0); assert.equal(metrics.activated, 1); assert.equal(metrics.invites.created, 1);
      // Free test period: ten cloud charts and Mandala history without Pro.
      assert.equal(JSON.parse(sql(`select hosted_entitlements('${first.id}');`)).mandala.limits.goals, 10);
      const doc = sql(`select id from hosted_documents where user_id='${first.id}';`);
      assert.equal(JSON.parse(sql(`select hosted_document_versions('${first.id}','${doc}');`)).length, 0);
      sql(`insert into hosted_credit_usage(owner_key,product,period,used) values('u:${first.id}','mandala','trial-charts:2026-10-31',1);`);
      assert.equal(sql(`select hosted_account_delete('${first.id}');`), 't');
      assert.equal(sql(`select count(*) from auth.users where id='${first.id}';`), '0');
      assert.equal(sql(`select (select count(*) from hosted_identities)+(select count(*) from hosted_documents)+(select count(*) from hosted_invites)+(select count(*) from hosted_user_activity)+(select count(*) from hosted_credit_usage);`), '0');
      sql(`insert into hosted_payments values('txn_keep','${U}','mandala','sub',now(),now()+interval '1 month',false,now());`);
      assert.throws(() => sql(`select hosted_account_delete('${U}');`), /billing_conflict/);
      sql("delete from hosted_payments;");
      // Anonymous and authenticated roles cannot reach the new tables or RPCs.
      assert.throws(() => sql('set role authenticated; select count(*) from hosted_invites;'), /permission denied/);
      assert.throws(() => sql(`set role authenticated; select hosted_metrics(7);`), /permission denied/);
    });

    await t.test('public feed: profile required, snapshot without notes, encourage, copy, report hides, operator review, ranking', () => {
      reset(); const W = '33333333-3333-4333-8333-333333333333'; sql(`insert into auth.users values('${W}') on conflict do nothing;`);
      const chartData = { schemaVersion: 1, title: '讀書', goal: '半年讀 12 本', themes: Array.from({ length: 8 }, (_, t) => ({ id: `t${t}`, title: `主題${t}`, actions: Array.from({ length: 8 }, (_, a) => ({ id: `a${t}_${a}`, text: `行動${t}-${a}`, done: a < 2, notes: 'private note', dueDate: '2026-12-01' })) })) };
      const doc = JSON.parse(sql(`select hosted_document_create('${U}',${literal({ product: 'mandala', kind: 'goal', title: '讀書', data: chartData })});`));
      const publish = (user, value) => JSON.parse(sql(`select hosted_public_publish('${user}',${literal(value)});`));
      assert.throws(() => publish(U, { documentId: doc.id, tags: ['learning'] }), /profile_required/);
      sql(`select hosted_profile_set('${U}',${literal({ nickname: '小明', avatar: 'a03' })});`);
      assert.throws(() => sql(`select hosted_profile_set('${V}',${literal({ nickname: 'x', avatar: 'a99' })});`), /check constraint/);
      sql(`select hosted_profile_set('${V}',${literal({ nickname: '阿華', avatar: 'a01' })}); select hosted_profile_set('${W}',${literal({ nickname: '小美', avatar: 'a02' })});`);
      // Someone else's document cannot be published, and unknown tags are rejected.
      assert.throws(() => publish(V, { documentId: doc.id, tags: [] }), /not_found/);
      assert.throws(() => publish(U, { documentId: doc.id, tags: ['politics'] }), /check constraint/);
      const chart = publish(U, { documentId: doc.id, tags: ['learning', 'learning'] });
      assert.equal(chart.progress, 16); assert.deepEqual(chart.tags, ['learning']); assert.equal(chart.author.nickname, '小明');
      assert.ok(!JSON.stringify(chart).includes('private note') && !JSON.stringify(chart).includes('2026-12-01'));
      assert.equal(publish(U, { documentId: doc.id, tags: ['health'] }).id, chart.id);
      const encourage = (user, on) => JSON.parse(sql(`select hosted_public_encourage('${user}','${chart.id}',${on});`));
      assert.equal(encourage(V, true).encourages, 1); assert.equal(encourage(V, true).encourages, 1); assert.equal(encourage(V, true).encouraged, true);
      assert.equal(JSON.parse(sql(`select hosted_public_copy('${V}','${chart.id}');`)).copies, 1);
      assert.equal(JSON.parse(sql(`select hosted_public_copy('${U}','${chart.id}');`)).copies, 1);
      const feed = (viewer, query) => JSON.parse(sql(`select hosted_public_feed('${viewer}',${literal(query)});`));
      assert.equal(feed(V, { sort: 'hot' })[0].id, chart.id); assert.equal(feed(V, { tag: 'health' }).length, 1); assert.equal(feed(V, { tag: 'money' }).length, 0);
      assert.equal(feed(V, {})[0].mine, false); assert.equal(feed(U, {})[0].mine, true); assert.equal(feed(V, {})[0].documentId, null);
      // Reports: the author cannot report; three users hide it; the operator restores it.
      assert.throws(() => sql(`select hosted_public_report('${U}','${chart.id}','spam');`), /not_found/);
      const reporters = [V, W, '44444444-4444-4444-8444-444444444444'];
      sql(`insert into auth.users values('${reporters[2]}') on conflict do nothing;`);
      for (const r of reporters) sql(`select hosted_public_report('${r}','${chart.id}','personal_data');`);
      assert.equal(feed(V, {}).length, 0);
      assert.throws(() => sql(`select hosted_public_get('${V}','${chart.id}');`), /not_found/);
      assert.equal(JSON.parse(sql(`select hosted_public_get('${U}','${chart.id}');`)).id, chart.id);
      assert.equal(JSON.parse(sql('select hosted_public_review_list();'))[0].reasons.personal_data, 3);
      sql(`select hosted_public_moderate('${chart.id}',false);`);
      assert.equal(feed(V, {}).length, 1);
      // Deleting the cloud document unpublishes it; deleting the account removes the profile.
      sql(`select hosted_document_delete('${U}','${doc.id}');`);
      assert.equal(sql('select count(*) from hosted_public_charts;'), '0');
      assert.equal(JSON.parse(sql('select hosted_feed_metrics(30);')).copies, 0);
      assert.throws(() => sql('set role authenticated; select count(*) from hosted_public_charts;'), /permission denied/);
    });

    await t.test('public feed: brand examples rank by the same rules, windows, views break ties, language filter', () => {
      reset(); sql(`select hosted_profile_set('${U}',${literal({ nickname: '小明', avatar: 'a03' })});`);
      const ex = (id, locale, tags) => ({ id, locale, tags, chart: { title: `範例 ${id}`, goal: `目標 ${id}`, themes: [{ title: '主題', actions: [{ text: '行動', done: true }] }] } });
      assert.equal(sql(`select hosted_public_seed(${literal([ex('ex-a', 'zh', ['learning']), ex('ex-b', 'zh', []), ex('ex-en', 'en', [])])});`), '3');
      const feed = (viewer, query) => JSON.parse(sql(`select hosted_public_feed(${viewer ? `'${viewer}'` : 'null'},${literal(query)});`));
      const zh = feed(U, { lang: 'zh' });
      assert.equal(zh.length, 2); assert.equal(zh[0].example, true); assert.deepEqual(zh[0].author, { brand: true, avatar: 'brand' });
      assert.equal(zh[0].progress, 0); assert.equal(zh[0].encourages, 0); assert.equal(zh[0].themes[0].actions[0].done, false);
      assert.equal(feed(U, {}).length, 3); assert.equal(feed(U, { lang: 'zh', source: 'users' }).length, 0);
      const [a, b] = ['ex-a', 'ex-b'].map(id => sql(`select id from hosted_public_charts where example_id='${id}';`));
      // A copy outranks an encouragement; old interactions leave the 7-day window but stay in "all".
      sql(`select hosted_public_encourage('${U}','${a}',true); select hosted_public_copy('${V}','${b}');`);
      assert.equal(feed(U, { sort: 'hot', lang: 'zh' })[0].id, b);
      sql(`update hosted_copies set created_at=now()-interval '10 days';`);
      assert.equal(feed(U, { sort: 'hot', lang: 'zh' })[0].id, a);
      assert.equal(feed(U, { sort: 'hot', lang: 'zh', window: '30d' })[0].id, b);
      assert.equal(feed(U, { sort: 'copied', lang: 'zh', window: 'all' })[0].id, b);
      // Views: once per viewer per day; they break ties only.
      sql(`select hosted_public_encourage('${V}','${b}',true); delete from hosted_copies;`);
      assert.equal(sql(`select hosted_public_view('${V}','${b}');`), 't'); assert.equal(sql(`select hosted_public_view('${V}','${b}');`), 'f');
      assert.equal(feed(U, { sort: 'hot', lang: 'zh' })[0].id, b); assert.equal(feed(U, { sort: 'hot', lang: 'zh' })[0].views, 1);
      // Re-seeding refreshes the content and keeps the counts; examples can be reported like any chart.
      sql(`select hosted_public_seed(${literal([{ ...ex('ex-b', 'zh', ['money']), chart: { ...ex('ex-b').chart, title: '新標題' } }])});`);
      const refreshed = JSON.parse(sql(`select hosted_public_get(null,'${b}');`)); assert.equal(refreshed.title, '新標題'); assert.equal(refreshed.encourages, 1);
      assert.equal(sql(`select hosted_public_report('${U}','${b}','spam');`), 't');
      assert.throws(() => sql(`select hosted_public_feed('${U}',${literal({ window: '1y' })});`), /not_found/);
      assert.throws(() => sql(`insert into hosted_public_charts(title,goal,snapshot,progress) values('x','y','[]',0);`), /check constraint/);
    });

    await t.test('topics: private per user, link documents across tools, unlink on delete, export, limit', () => {
      reset();
      const save = (user, value) => JSON.parse(sql(`select hosted_topic_save('${user}',${literal(value)});`));
      const topic = save(U, { title: ' 轉職 ' }); assert.equal(topic.title, '轉職'); assert.deepEqual(topic.documents, []);
      assert.throws(() => save(U, { title: '   ' }), /check constraint/);
      const chart = JSON.parse(sql(`select hosted_document_create('${U}',${literal({ product: 'mandala', kind: 'goal', title: '轉職', data: { schemaVersion: 1, title: '轉職', goal: 'g', themes: [] } })});`));
      const work = JSON.parse(sql(`select hosted_document_create('${U}',${literal({ product: 'studio', kind: 'work', title: '要不要轉職', data: { contract: {} } })});`));
      for (const doc of [chart, work]) sql(`select hosted_document_set_topic('${U}','${doc.id}','${topic.id}');`);
      const listed = JSON.parse(sql(`select hosted_topic_list('${U}');`));
      assert.equal(listed.length, 1); assert.deepEqual(listed[0].documents.map(d => d.product).sort(), ['mandala', 'studio']);
      // Another user sees nothing, cannot link into it, rename it, export it or link their document to it.
      assert.deepEqual(JSON.parse(sql(`select hosted_topic_list('${V}');`)), []);
      assert.throws(() => sql(`select hosted_document_set_topic('${V}','${chart.id}',null);`), /not_found/);
      const other = JSON.parse(sql(`select hosted_document_create('${V}',${literal({ product: 'mandala', kind: 'goal', title: 'x', data: { schemaVersion: 1, title: 'x', goal: 'g', themes: [] } })});`));
      assert.throws(() => sql(`select hosted_document_set_topic('${V}','${other.id}','${topic.id}');`), /not_found/);
      assert.throws(() => save(V, { id: topic.id, title: 'mine' }), /not_found/);
      assert.throws(() => sql(`select hosted_topic_export('${V}','${topic.id}');`), /not_found/);
      const exported = JSON.parse(sql(`select hosted_topic_export('${U}','${topic.id}');`));
      assert.equal(exported.format, 'intent-galaxy.topic-export'); assert.equal(exported.documents.length, 2); assert.ok(exported.documents[0].data);
      assert.equal(save(U, { id: topic.id, title: '轉職工程師' }).title, '轉職工程師');
      // Unlinking and deleting the topic keep the documents.
      sql(`select hosted_document_set_topic('${U}','${work.id}',null);`);
      assert.equal(JSON.parse(sql(`select hosted_topic_list('${U}');`))[0].documents.length, 1);
      sql(`select hosted_topic_delete('${U}','${topic.id}');`);
      assert.equal(sql(`select count(*) from hosted_documents where user_id='${U}';`), '2');
      assert.equal(sql(`select count(*) from hosted_documents where topic_id is not null;`), '0');
      sql(`insert into hosted_topics(user_id,title) select '${U}','t'||g from generate_series(1,200) g;`);
      assert.throws(() => save(U, { title: 'one more' }), /topic_limit/);
      assert.throws(() => sql('set role authenticated; select count(*) from hosted_topics;'), /permission denied/);
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
