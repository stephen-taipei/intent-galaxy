-- Free Mandala AI trial (2026-10-30).
-- Replaces hosted_reserve_job so the Mandala trial operations (themes,
-- expand_theme, expand_empty, perspectives) can run for guests and every
-- signed-in plan within per-owner and platform-wide daily caps. Everything
-- else in the reservation is unchanged from 0001_hosted.sql.
begin;
create or replace function public.hosted_reserve_job(p_job jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  uid uuid:=(p_job->'owner'->>'userId')::uuid; gid uuid:=(p_job->'owner'->>'guestId')::uuid; owner text;
  prod text:=p_job->'request'->>'product'; operation text:=p_job->'request'->>'operation'; plan jsonb;
  credit_period text; cost integer:=(p_job->>'creditCost')::integer; allowance integer; estimate bigint:=(p_job->>'reservedMicros')::bigint;
  j hosted_jobs; bucket text; cap bigint; idx integer; buckets text[]; caps bigint[]; used_count integer; trial_kind text; platform_cap integer;
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
    -- Free Mandala trial: open to guests and every signed-in plan, capped per
    -- owner and across the whole platform for the current Asia/Taipei day.
    if p_job->'request'->>'mode'<>'standard' or cost<>1 then raise exception 'trial_limit'; end if;
    if gid is not null and not exists(select 1 from hosted_guests where id=gid and expires_at>now()) then raise exception 'guest_limit'; end if;
    trial_kind:=case when operation='themes' then 'charts' else 'calls' end;
    credit_period:='trial-'||trial_kind||':'||to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
    allowance:=(p_job->>case when trial_kind='charts' then 'mandalaOwnerDailyCharts' else 'mandalaOwnerDailyCalls' end)::integer;
    platform_cap:=(p_job->>case when trial_kind='charts' then 'mandalaPlatformDailyCharts' else 'mandalaPlatformDailyCalls' end)::integer;
    if allowance is null or allowance<=0 or platform_cap is null or platform_cap<=0 then raise exception 'trial_limit'; end if;
    -- The platform counter is not refunded when a job fails, so a failing
    -- provider cannot be retried past the daily total.
    insert into hosted_credit_usage(owner_key,product,period) values('platform',prod,credit_period) on conflict do nothing;
    select used into used_count from hosted_credit_usage where owner_key='platform' and product=prod and period=credit_period for update;
    if used_count+cost>platform_cap then raise exception 'trial_limit'; end if;
    insert into hosted_credit_usage(owner_key,product,period) values(owner,prod,credit_period) on conflict do nothing;
    select used into used_count from hosted_credit_usage where owner_key=owner and product=prod and period=credit_period for update;
    if used_count+cost>allowance then raise exception 'trial_limit'; end if;
    update hosted_credit_usage set used=used+cost where owner_key='platform' and product=prod and period=credit_period;
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
revoke all on function public.hosted_reserve_job(jsonb) from public,anon,authenticated;
grant execute on function public.hosted_reserve_job(jsonb) to service_role;
commit;
