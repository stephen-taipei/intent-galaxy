-- Free test period (2026-10-31): direct Google sign-in, Mandala invite codes,
-- cloud history for free accounts, activity tracking and an operator metrics
-- summary. Guests no longer run the Mandala AI trial unless they redeemed an
-- invite; they browse the fixed example library instead.
begin;

-- Direct Google OIDC (self-hosted). Each Google subject maps to one auth.users row.
create table public.hosted_identities (
  provider text not null check (provider in ('google')), subject text not null check (length(subject) between 1 and 255),
  user_id uuid not null unique references auth.users(id) on delete cascade, email text not null check (length(email) <= 320),
  created_at timestamptz not null default now(), last_login_at timestamptz not null default now(),
  primary key (provider, subject)
);
create function public.hosted_user_upsert(p_identity jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare i hosted_identities; uid uuid;
begin
  if p_identity->>'provider' is distinct from 'google' or coalesce(p_identity->>'subject','')='' or coalesce(p_identity->>'email','')='' then raise exception 'not_found'; end if;
  perform pg_advisory_xact_lock(hashtextextended('hosted-identity:'||(p_identity->>'subject'),0));
  select * into i from hosted_identities where provider='google' and subject=p_identity->>'subject';
  if found then
    update hosted_identities set email=p_identity->>'email',last_login_at=now() where provider='google' and subject=i.subject;
    return jsonb_build_object('id',i.user_id,'email',p_identity->>'email','created',false);
  end if;
  uid:=gen_random_uuid();
  insert into auth.users(id) values(uid);
  insert into hosted_identities(provider,subject,user_id,email) values('google',p_identity->>'subject',uid,p_identity->>'email');
  return jsonb_build_object('id',uid,'email',p_identity->>'email','created',true);
end $$;

-- One row per user per Asia/Taipei day with a meaningful action, for retention.
create table public.hosted_user_activity (
  user_id uuid not null references auth.users(id) on delete cascade, day date not null, primary key (user_id, day)
);
create function public.hosted_touch_activity(p_user_id uuid) returns boolean language sql security definer set search_path=public,pg_temp as $$
  insert into hosted_user_activity(user_id,day) values(p_user_id,(now() at time zone 'Asia/Taipei')::date) on conflict do nothing returning true;
$$;

-- Invite codes. The code is a short bearer value the inviter can see again,
-- so it is stored as is; it only unlocks one capped guest chart.
create table public.hosted_invites (
  code text primary key check (code ~ '^[A-HJ-NP-Z2-9]{10}$'),
  inviter_id uuid not null references auth.users(id) on delete cascade, created_browser_hash text not null,
  created_day date not null, created_at timestamptz not null default now(), expires_at timestamptz not null,
  redeemed_at timestamptz, redeemed_browser_hash text, converted_user_id uuid references auth.users(id) on delete set null, converted_at timestamptz
);
create index hosted_invites_inviter on public.hosted_invites(inviter_id, created_at desc);
create index hosted_invites_redeemed_browser on public.hosted_invites(redeemed_browser_hash) where redeemed_browser_hash is not null;
create table public.hosted_invite_redemptions (
  browser_hash text primary key, ip_hash text not null, day date not null, code text not null, created_at timestamptz not null default now()
);
create index hosted_invite_redemptions_ip_day on public.hosted_invite_redemptions(ip_hash, day);
alter table public.hosted_guests add column invite_code text;

create function public.hosted_invite_json(i hosted_invites) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('code',i.code,'createdAt',i.created_at,'expiresAt',i.expires_at,
    'status',case when i.converted_user_id is not null then 'joined' when i.redeemed_at is not null then 'redeemed' when i.expires_at<=now() then 'expired' else 'open' end);
$$;
create function public.hosted_invite_create(p_invite jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=(p_invite->>'userId')::uuid; today date:=(now() at time zone 'Asia/Taipei')::date; i hosted_invites;
  daily integer:=(p_invite->>'dailyLimit')::integer; open_limit integer:=(p_invite->>'openLimit')::integer; ttl integer:=(p_invite->>'ttlDays')::integer;
begin
  if uid is null or daily not between 1 and 20 or open_limit not between 1 and 20 or ttl not between 1 and 30 then raise exception 'invite_limit'; end if;
  perform pg_advisory_xact_lock(hashtextextended('hosted-invites:'||uid::text,0));
  if (select count(*) from hosted_invites where inviter_id=uid and created_day=today)>=daily
    or (select count(*) from hosted_invites where inviter_id=uid and redeemed_at is null and expires_at>now())>=open_limit then raise exception 'invite_limit'; end if;
  insert into hosted_invites(code,inviter_id,created_browser_hash,created_day,expires_at)
    values(p_invite->>'code',uid,p_invite->>'browserHash',today,now()+make_interval(days=>ttl)) returning * into i;
  return hosted_invite_json(i);
end $$;
create function public.hosted_invite_list(p_user_id uuid) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select coalesce(jsonb_agg(hosted_invite_json(i) order by i.created_at desc),'[]') from (select * from hosted_invites where inviter_id=p_user_id order by created_at desc limit 30) i;
$$;
-- Redeeming creates a 24-hour guest that may run one capped Mandala chart.
create function public.hosted_invite_redeem(p_redeem jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare i hosted_invites; today date:=(now() at time zone 'UTC')::date; ip_limit integer:=(p_redeem->>'ipDailyLimit')::integer; gid uuid:=(p_redeem->>'guestId')::uuid;
begin
  if ip_limit is null or ip_limit not between 1 and 100 or gid is null then raise exception 'guest_limit'; end if;
  if (p_redeem->>'expiresAt')::timestamptz<=now() or (p_redeem->>'expiresAt')::timestamptz>now()+interval '24 hours 1 minute' then raise exception 'guest_limit'; end if;
  perform pg_advisory_xact_lock(hashtextextended('hosted-invite-redeem',0));
  select * into i from hosted_invites where code=upper(p_redeem->>'code') for update;
  if not found or i.redeemed_at is not null or i.expires_at<=now() or i.created_browser_hash=p_redeem->>'browserHash' then raise exception 'invite_invalid'; end if;
  if exists(select 1 from hosted_invite_redemptions where browser_hash=p_redeem->>'browserHash') then raise exception 'invite_used'; end if;
  if (select count(*) from hosted_invite_redemptions where ip_hash=p_redeem->>'ipHash' and day=today)>=ip_limit then raise exception 'guest_limit'; end if;
  insert into hosted_invite_redemptions(browser_hash,ip_hash,day,code) values(p_redeem->>'browserHash',p_redeem->>'ipHash',today,i.code);
  insert into hosted_guests(id,expires_at,invite_code) values(gid,(p_redeem->>'expiresAt')::timestamptz,i.code);
  update hosted_invites set redeemed_at=now(),redeemed_browser_hash=p_redeem->>'browserHash' where code=i.code;
  return hosted_guest_get(gid);
end $$;
-- A browser that redeemed an invite and then signs in counts as a joined invite.
create function public.hosted_invite_convert(p_browser_hash text,p_user_id uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update hosted_invites set converted_user_id=p_user_id,converted_at=now()
    where redeemed_browser_hash=p_browser_hash and converted_user_id is null and inviter_id<>p_user_id;
  return found;
end $$;

-- Guests now report whether they came from an invite.
create or replace function public.hosted_guest_get(p_id uuid) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('id',g.id,'expiresAt',g.expires_at,'invite',g.invite_code is not null,
    'remainingAnalyses',greatest(0,1-coalesce((select used from hosted_credit_usage where owner_key='g:'||g.id::text and product='studio' and period='analyze'),0)),
    'remainingGenerations',greatest(0,1-coalesce((select used from hosted_credit_usage where owner_key='g:'||g.id::text and product='studio' and period='generate'),0)))
  from hosted_guests g where g.id=p_id and g.expires_at>now();
$$;

-- Trial reservation: signed-in owners get a daily allowance; guests only an
-- invite allowance for the guest's lifetime. The platform cap is shared.
create or replace function public.hosted_reserve_job(p_job jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  uid uuid:=(p_job->'owner'->>'userId')::uuid; gid uuid:=(p_job->'owner'->>'guestId')::uuid; owner text;
  prod text:=p_job->'request'->>'product'; operation text:=p_job->'request'->>'operation'; plan jsonb;
  credit_period text; cost integer:=(p_job->>'creditCost')::integer; allowance integer; estimate bigint:=(p_job->>'reservedMicros')::bigint;
  j hosted_jobs; bucket text; cap bigint; idx integer; buckets text[]; caps bigint[]; used_count integer; trial_kind text; platform_cap integer; platform_period text; g hosted_guests;
begin
  if (uid is null)=(gid is null) or prod not in ('studio','mandala') or cost not in (1,10) or estimate<=0 then raise exception 'quota_exceeded'; end if;
  owner:=case when uid is not null then 'u:'||uid::text else 'g:'||gid::text end;
  perform pg_advisory_xact_lock(hashtextextended('hosted-platform-budget',0));
  select * into j from hosted_jobs where owner_key=owner and idempotency_key=p_job->>'key';
  if found then
    if j.request_hash<>p_job->>'requestHash' then raise exception 'idempotency_conflict'; end if;
    return hosted_job_json(j)||jsonb_build_object('created',false);
  end if;
  if prod='mandala' and operation in ('themes','expand_theme','expand_empty','perspectives') then
    if p_job->'request'->>'mode'<>'standard' or cost<>1 then raise exception 'trial_limit'; end if;
    trial_kind:=case when operation='themes' then 'charts' else 'calls' end;
    platform_period:='trial-'||trial_kind||':'||to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
    if gid is not null then
      select * into g from hosted_guests where id=gid and expires_at>now();
      if not found then raise exception 'guest_limit'; end if;
      if g.invite_code is null then raise exception 'trial_login_required'; end if;
      credit_period:='trial-'||trial_kind||':invite';
      allowance:=(p_job->>case when trial_kind='charts' then 'mandalaInviteCharts' else 'mandalaInviteCalls' end)::integer;
    else
      credit_period:=platform_period;
      allowance:=(p_job->>case when trial_kind='charts' then 'mandalaOwnerDailyCharts' else 'mandalaOwnerDailyCalls' end)::integer;
    end if;
    platform_cap:=(p_job->>case when trial_kind='charts' then 'mandalaPlatformDailyCharts' else 'mandalaPlatformDailyCalls' end)::integer;
    if allowance is null or allowance<=0 or platform_cap is null or platform_cap<=0 then raise exception 'trial_limit'; end if;
    -- The platform counter is not refunded when a job fails, so a failing
    -- provider cannot be retried past the daily total.
    insert into hosted_credit_usage(owner_key,product,period) values('platform',prod,platform_period) on conflict do nothing;
    select used into used_count from hosted_credit_usage where owner_key='platform' and product=prod and period=platform_period for update;
    if used_count+cost>platform_cap then raise exception 'trial_limit'; end if;
    insert into hosted_credit_usage(owner_key,product,period) values(owner,prod,credit_period) on conflict do nothing;
    select used into used_count from hosted_credit_usage where owner_key=owner and product=prod and period=credit_period for update;
    if used_count+cost>allowance then raise exception 'trial_limit'; end if;
    update hosted_credit_usage set used=used+cost where owner_key='platform' and product=prod and period=platform_period;
  elsif uid is not null then
    plan:=hosted_plan(uid,prod); credit_period:=plan->>'period'; allowance:=(plan->>'allowance')::integer;
  else
    if not exists(select 1 from hosted_guests where id=gid and expires_at>now()) or prod<>'studio' or p_job->'request'->>'mode'<>'standard' or operation not in ('analyze','generate') or cost<>1 then raise exception 'guest_limit'; end if;
    credit_period:=operation; allowance:=1;
  end if;
  if trial_kind is null then
    insert into hosted_credit_usage(owner_key,product,period) values(owner,prod,credit_period) on conflict do nothing;
    select used into used_count from hosted_credit_usage where owner_key=owner and product=prod and period=credit_period for update;
    if used_count+cost>allowance then if gid is not null then raise exception 'guest_limit'; else raise exception 'quota_exceeded'; end if; end if;
  end if;
  buckets:=array['day:'||to_char(now() at time zone 'UTC','YYYY-MM-DD'),'month:'||to_char(now() at time zone 'UTC','YYYY-MM')];
  caps:=array[(p_job->>'dailyLimitMicros')::bigint,(p_job->>'monthlyLimitMicros')::bigint];
  if gid is not null then buckets:=array_append(buckets,'trial:'||to_char(now() at time zone 'UTC','YYYY-MM-DD')); caps:=array_append(caps,(p_job->>'trialDailyLimitMicros')::bigint); end if;
  for idx in 1..array_length(buckets,1) loop
    bucket:=buckets[idx]; cap:=caps[idx];
    if cap is null or cap<=0 then raise exception 'budget_exceeded'; end if;
    insert into hosted_budgets(period) values(bucket) on conflict do nothing;
    if (select spent_micros from hosted_budgets where period=bucket)+estimate>cap then raise exception 'budget_exceeded'; end if;
  end loop;
  insert into hosted_jobs(user_id,guest_id,owner_key,product,idempotency_key,request_hash,request,credit_cost,credit_period,reserved_micros)
    values(uid,gid,owner,prod,p_job->>'key',p_job->>'requestHash',p_job->'request',cost,credit_period,estimate) returning * into j;
  update hosted_credit_usage set used=used+cost where owner_key=owner and product=prod and period=credit_period;
  foreach bucket in array buckets loop
    update hosted_budgets set spent_micros=spent_micros+estimate where period=bucket;
    insert into hosted_job_budgets(job_id,period) values(j.id,bucket);
  end loop;
  insert into hosted_ledger(job_id,entry_type,product,delta_credits,delta_micros) values(j.id,'reserve',prod,cost,estimate);
  return hosted_job_json(j)||jsonb_build_object('created',true);
end $$;

-- Test period: free accounts keep up to 10 cloud charts with version history.
create or replace function public.hosted_entitlements(p_user_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare product_name text; p jsonb; output jsonb:='{}'; used_count integer; pro boolean; limits jsonb;
begin
  for product_name in select unnest(array['studio','mandala']) loop
    p:=hosted_plan(p_user_id,product_name); pro:=p->>'plan'='pro';
    select used into used_count from hosted_credit_usage where owner_key='u:'||p_user_id::text and product=product_name and period=p->>'period';
    limits:=case when product_name='studio' then jsonb_build_object('works',case when pro then 100 else 5 end,'templates',case when pro then 50 else 3 end,'goals',0)
      else jsonb_build_object('works',0,'templates',0,'goals',case when pro then 20 else 10 end) end;
    output:=output||jsonb_build_object(product_name,jsonb_build_object('plan',p->>'plan','credits',greatest(0,(p->>'allowance')::integer-coalesce(used_count,0)),'limits',limits));
  end loop; return output;
end $$;
create or replace function public.hosted_document_versions(p_user_id uuid,p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d hosted_documents; output jsonb;
begin
  select * into d from hosted_documents where id=p_id and user_id=p_user_id; if not found then raise exception 'not_found'; end if;
  if d.product<>'mandala' and hosted_plan(p_user_id,d.product)->>'plan'<>'pro' then raise exception 'pro_required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'data',data,'createdAt',created_at) order by revision desc),'[]') into output from hosted_document_versions where document_id=p_id;
  return output;
end $$;

create or replace function public.hosted_record_event(p_user_id uuid,p_name text,p_product text,p_template_id text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_name not in ('page_view','template_selected','analysis_started','generation_started','evaluation_viewed','signup_started','checkout_started','document_saved','job_started','job_completed','mandala_action_toggled','mandala_example_opened','invite_link_copied') or p_product not in ('studio','mandala') or length(coalesce(p_template_id,''))>64 then raise exception 'not_found'; end if;
  insert into hosted_events(name,product,template_id) values(p_name,p_product,coalesce(p_template_id,'')) on conflict(day,name,product,template_id) do update set count=least(hosted_events.count+1,1000000);
  return true;
end $$;

-- Deletes the account and everything it owns. Paid history is kept for
-- accounting, so an account with payments must be closed by the operator.
create function public.hosted_account_delete(p_user_id uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if exists(select 1 from hosted_payments where user_id=p_user_id) or exists(select 1 from hosted_checkouts where user_id=p_user_id and status in ('pending','unknown','completed')) then raise exception 'billing_conflict'; end if;
  delete from hosted_credit_usage where owner_key='u:'||p_user_id::text;
  delete from auth.users where id=p_user_id;
  return true;
end $$;

-- Operator summary for the free test period. Days use Asia/Taipei.
create function public.hosted_metrics(p_days integer) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare days integer:=least(greatest(coalesce(p_days,30),1),180); today date:=(now() at time zone 'Asia/Taipei')::date; since date; output jsonb;
begin
  since:=today-days+1;
  with signups as (
    select user_id,(created_at at time zone 'Asia/Taipei')::date as d0 from hosted_identities where (created_at at time zone 'Asia/Taipei')::date>=since
  ), retention as (
    select n, count(*) filter (where s.d0+n<=today) as eligible,
      count(*) filter (where s.d0+n<=today and exists(select 1 from hosted_user_activity a where a.user_id=s.user_id and a.day=s.d0+n)) as retained
    from signups s cross join (values (1),(7),(30)) as v(n) group by n
  )
  select jsonb_build_object(
    'since',since,'until',today,
    'signups',(select count(*) from signups),
    'signupsByDay',(select coalesce(jsonb_object_agg(d0,c),'{}') from (select d0,count(*) c from signups group by d0) x),
    'activeByDay',(select coalesce(jsonb_object_agg(day,c),'{}') from (select day,count(*) c from hosted_user_activity where day>=since group by day) x),
    'retention',(select coalesce(jsonb_object_agg('d'||n,jsonb_build_object('eligible',eligible,'retained',retained)),'{}') from retention),
    'activated',(select count(distinct d.user_id) from hosted_documents d where d.product='mandala' and d.updated_at>=since
      and (select count(*) from jsonb_array_elements(d.data->'themes') t, jsonb_array_elements(t->'actions') a where coalesce(a->>'text','')<>'')>=8),
    'invites',jsonb_build_object(
      'created',(select count(*) from hosted_invites where created_day>=since),
      'redeemed',(select count(*) from hosted_invites where created_day>=since and redeemed_at is not null),
      'joined',(select count(*) from hosted_invites where created_day>=since and converted_user_id is not null),
      'inviters',(select count(distinct inviter_id) from hosted_invites where created_day>=since)),
    'trialChartsByDay',(select coalesce(jsonb_object_agg(substr(period,14),used),'{}') from hosted_credit_usage where owner_key='platform' and product='mandala' and period like 'trial-charts:%' and substr(period,14)>=since::text),
    'events',(select coalesce(jsonb_object_agg(name,c),'{}') from (select name,sum(count) c from hosted_events where product='mandala' and day>=since group by name) x)
  ) into output;
  return output;
end $$;

do $$ declare t text; begin
  foreach t in array array['hosted_identities','hosted_user_activity','hosted_invites','hosted_invite_redemptions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'hosted\_%' escape '\' loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
commit;
