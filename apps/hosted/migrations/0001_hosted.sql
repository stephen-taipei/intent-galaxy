-- Apply with the Supabase migration owner. Never expose service_role to a client.
-- All money amounts below are integer micro-USD; Paddle prices are TWD minor units.
begin;
create extension if not exists pgcrypto;

create table public.hosted_sessions (
  id text primary key check (length(id) = 43), user_id uuid not null references auth.users(id) on delete cascade,
  email text not null, csrf text not null, tokens text, access_expires_at timestamptz not null,
  expires_at timestamptz not null, refresh_until timestamptz, created_at timestamptz not null default now()
);
create table public.hosted_guests (id uuid primary key, expires_at timestamptz not null, created_at timestamptz not null default now());
create table public.hosted_trials (
  browser_hash text primary key, ip_hash text not null, day date not null default (now() at time zone 'UTC')::date,
  created_at timestamptz not null default now()
);
create index hosted_trials_ip_day on public.hosted_trials(ip_hash, day);
create table public.hosted_credit_usage (
  owner_key text not null, product text not null check (product in ('studio','mandala')), period text not null,
  used integer not null default 0 check (used >= 0), primary key(owner_key,product,period)
);
create table public.hosted_budgets (period text primary key, spent_micros bigint not null default 0 check (spent_micros >= 0));
create table public.hosted_jobs (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  guest_id uuid references public.hosted_guests(id) on delete cascade, owner_key text not null,
  product text not null check (product in ('studio','mandala')), idempotency_key text not null,
  request_hash text not null, request jsonb not null check (octet_length(request::text) <= 262144),
  credit_cost integer not null check (credit_cost in (1,10)), credit_period text not null,
  reserved_micros bigint not null check (reserved_micros > 0), actual_micros bigint,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','unknown')),
  dispatched boolean not null default false, result jsonb, error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((user_id is null) <> (guest_id is null)), unique(owner_key,idempotency_key)
);
create index hosted_jobs_owner_created on public.hosted_jobs(user_id,created_at desc);
create index hosted_jobs_status_time on public.hosted_jobs(status,updated_at);
create table public.hosted_job_budgets (
  job_id uuid not null references public.hosted_jobs(id) on delete cascade,
  period text not null references public.hosted_budgets(period), primary key(job_id,period)
);
create table public.hosted_ledger (
  id bigint generated always as identity primary key, job_id uuid references public.hosted_jobs(id) on delete set null,
  entry_type text not null check (entry_type in ('reserve','settle')), product text not null check (product in ('studio','mandala')),
  delta_credits integer not null, delta_micros bigint not null, created_at timestamptz not null default now(),
  unique(job_id,entry_type)
);
create table public.hosted_documents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  product text not null, kind text not null, title text not null check (length(title) between 1 and 200),
  data jsonb not null check (octet_length(data::text) <= 262144), revision integer not null default 1 check(revision > 0),
  updated_at timestamptz not null default now(),
  check ((product='studio' and kind in ('work','template')) or (product='mandala' and kind='goal'))
);
create index hosted_documents_owner on public.hosted_documents(user_id,product,kind);
create table public.hosted_document_versions (
  document_id uuid not null references public.hosted_documents(id) on delete cascade, revision integer not null,
  data jsonb not null, created_at timestamptz not null default now(), primary key(document_id,revision)
);
create table public.hosted_checkouts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  product text not null check(product in ('studio','mandala')), idempotency_key text not null,
  status text not null default 'pending' check(status in ('pending','completed','failed','unknown')),
  transaction_id text unique, url text, created_at timestamptz not null default now(), unique(user_id,idempotency_key)
);
create table public.hosted_billing_links (
  subscription_id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  product text not null check(product in ('studio','mandala')), customer_id text not null,
  checkout_id uuid references public.hosted_checkouts(id), created_at timestamptz not null default now()
);
create table public.hosted_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade, product text not null check(product in ('studio','mandala')),
  subscription_id text not null, customer_id text not null, status text not null default 'pending',
  period_start timestamptz, period_end timestamptz, payment_id text, revoked boolean not null default false,
  scheduled_cancel_at timestamptz, last_event_at timestamptz not null, checkout_created_at timestamptz,
  primary key(user_id,product)
);
create table public.hosted_payments (
  transaction_id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  product text not null check(product in ('studio','mandala')), subscription_id text not null,
  period_start timestamptz not null, period_end timestamptz not null, refunded boolean not null default false,
  occurred_at timestamptz not null
);
create table public.hosted_webhook_events (event_id text primary key, event_type text not null, occurred_at timestamptz not null, received_at timestamptz not null default now());
create table public.hosted_events (
  day date not null default (now() at time zone 'UTC')::date, name text not null, product text not null,
  template_id text not null default '', count bigint not null default 1, primary key(day,name,product,template_id)
);

create function public.hosted_session_get(p_id text) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('id',id,'user',jsonb_build_object('id',user_id,'email',email),'csrf',csrf,'tokens',tokens,'accessExpiresAt',access_expires_at,'expiresAt',expires_at)
  from hosted_sessions where id=p_id and expires_at>now();
$$;
create function public.hosted_session_create(p_session jsonb) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into hosted_sessions(id,user_id,email,csrf,tokens,access_expires_at,expires_at) values
    (p_session->>'id',(p_session->'user'->>'id')::uuid,p_session->'user'->>'email',p_session->>'csrf',p_session->>'tokens',(p_session->>'accessExpiresAt')::timestamptz,(p_session->>'expiresAt')::timestamptz);
  return true;
end $$;
create function public.hosted_session_refresh_claim(p_id text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare s hosted_sessions;
begin
  select * into s from hosted_sessions where id=p_id and expires_at>now() for update;
  if not found then raise exception 'session_expired'; end if;
  if s.refresh_until>now() then raise exception 'session_busy'; end if;
  update hosted_sessions set refresh_until=now()+interval '30 seconds' where id=p_id;
  return true;
end $$;
create function public.hosted_session_refresh(p_id text,p_tokens text,p_access_expires_at timestamptz) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update hosted_sessions set tokens=p_tokens,access_expires_at=p_access_expires_at,refresh_until=null where id=p_id and expires_at>now();
  if not found then raise exception 'session_expired'; end if; return true;
end $$;
create function public.hosted_session_delete(p_id text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin delete from hosted_sessions where id=p_id; return true; end $$;

create function public.hosted_guest_get(p_id uuid) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('id',g.id,'expiresAt',g.expires_at,
    'remainingAnalyses',greatest(0,1-coalesce((select used from hosted_credit_usage where owner_key='g:'||g.id::text and product='studio' and period='analyze'),0)),
    'remainingGenerations',greatest(0,1-coalesce((select used from hosted_credit_usage where owner_key='g:'||g.id::text and product='studio' and period='generate'),0)))
  from hosted_guests g where g.id=p_id and g.expires_at>now();
$$;
create function public.hosted_guest_create(p_guest jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare today date:=(now() at time zone 'UTC')::date; ip_limit integer:=(p_guest->>'ipDailyLimit')::integer; global_limit integer:=(p_guest->>'globalDailyLimit')::integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('hosted-trial-cap',0));
  if ip_limit is null or global_limit is null or ip_limit not between 1 and 100 or global_limit not between 1 and 1000 then raise exception 'guest_limit'; end if;
  if exists(select 1 from hosted_trials where browser_hash=p_guest->>'browserHash')
    or (select count(*) from hosted_trials where day=today)>=global_limit
    or (select count(*) from hosted_trials where day=today and ip_hash=p_guest->>'ipHash')>=ip_limit then raise exception 'guest_limit'; end if;
  if (p_guest->>'expiresAt') is null or (p_guest->>'expiresAt')::timestamptz<=now() or (p_guest->>'expiresAt')::timestamptz > now()+interval '24 hours 1 minute' then raise exception 'guest_limit'; end if;
  insert into hosted_trials(browser_hash,ip_hash,day) values(p_guest->>'browserHash',p_guest->>'ipHash',today);
  insert into hosted_guests(id,expires_at) values((p_guest->>'id')::uuid,(p_guest->>'expiresAt')::timestamptz);
  return hosted_guest_get((p_guest->>'id')::uuid);
end $$;

create function public.hosted_plan(p_user_id uuid,p_product text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s hosted_subscriptions; paid boolean; period text; allowance integer;
begin
  if p_product not in ('studio','mandala') then raise exception 'not_found'; end if;
  select * into s from hosted_subscriptions where user_id=p_user_id and product=p_product;
  paid:=s.period_start<=now() and s.period_end>now() and not s.revoked and s.payment_id is not null
    and exists(select 1 from hosted_payments where transaction_id=s.payment_id and not refunded);
  period:=case when paid then to_char(s.period_start at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') else to_char(now() at time zone 'Asia/Taipei','YYYY-MM') end;
  allowance:=case when paid then case when p_product='studio' then 200 else 100 end else case when p_product='studio' then 20 else 0 end end;
  return jsonb_build_object('plan',case when paid then 'pro' else 'free' end,'period',period,'allowance',allowance);
end $$;
create function public.hosted_entitlements(p_user_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare product_name text; p jsonb; output jsonb:='{}'; used_count integer; pro boolean; limits jsonb;
begin
  for product_name in select unnest(array['studio','mandala']) loop
    p:=hosted_plan(p_user_id,product_name); pro:=p->>'plan'='pro';
    select used into used_count from hosted_credit_usage where owner_key='u:'||p_user_id::text and product=product_name and period=p->>'period';
    limits:=case when product_name='studio' then jsonb_build_object('works',case when pro then 100 else 5 end,'templates',case when pro then 50 else 3 end,'goals',0)
      else jsonb_build_object('works',0,'templates',0,'goals',case when pro then 20 else 1 end) end;
    output:=output||jsonb_build_object(product_name,jsonb_build_object('plan',p->>'plan','credits',greatest(0,(p->>'allowance')::integer-coalesce(used_count,0)),'limits',limits));
  end loop; return output;
end $$;

create function public.hosted_job_json(j hosted_jobs) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('id',j.id,'status',j.status,'owner',case when j.user_id is not null then jsonb_build_object('userId',j.user_id) else jsonb_build_object('guestId',j.guest_id) end,
    'request',j.request,'requestHash',j.request_hash,'result',j.result,'error',j.error,'dispatched',j.dispatched,'createdAt',j.created_at,'updatedAt',j.updated_at);
$$;
create function public.hosted_reserve_job(p_job jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  uid uuid:=(p_job->'owner'->>'userId')::uuid; gid uuid:=(p_job->'owner'->>'guestId')::uuid; owner text;
  prod text:=p_job->'request'->>'product'; operation text:=p_job->'request'->>'operation'; plan jsonb;
  credit_period text; cost integer:=(p_job->>'creditCost')::integer; allowance integer; estimate bigint:=(p_job->>'reservedMicros')::bigint;
  j hosted_jobs; bucket text; cap bigint; idx integer; buckets text[]; caps bigint[]; used_count integer;
begin
  if (uid is null)=(gid is null) or prod not in ('studio','mandala') or cost not in (1,10) or estimate<=0 then raise exception 'quota_exceeded'; end if;
  owner:=case when uid is not null then 'u:'||uid::text else 'g:'||gid::text end;
  perform pg_advisory_xact_lock(hashtextextended('hosted-platform-budget',0));
  select * into j from hosted_jobs where owner_key=owner and idempotency_key=p_job->>'key';
  if found then
    if j.request_hash<>p_job->>'requestHash' then raise exception 'idempotency_conflict'; end if;
    return hosted_job_json(j)||jsonb_build_object('created',false);
  end if;
  if uid is not null then
    plan:=hosted_plan(uid,prod); credit_period:=plan->>'period'; allowance:=(plan->>'allowance')::integer;
  else
    if not exists(select 1 from hosted_guests where id=gid and expires_at>now()) or prod<>'studio' or p_job->'request'->>'mode'<>'standard' or operation not in ('analyze','generate') or cost<>1 then raise exception 'guest_limit'; end if;
    credit_period:=operation; allowance:=1;
  end if;
  insert into hosted_credit_usage(owner_key,product,period) values(owner,prod,credit_period) on conflict do nothing;
  select used into used_count from hosted_credit_usage where owner_key=owner and product=prod and period=credit_period for update;
  if used_count+cost>allowance then if gid is not null then raise exception 'guest_limit'; else raise exception 'quota_exceeded'; end if; end if;
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
create function public.hosted_job_get(p_id uuid,p_owner jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j hosted_jobs;
begin
  select * into j from hosted_jobs where id=p_id and ((user_id=(p_owner->>'userId')::uuid) or (guest_id=(p_owner->>'guestId')::uuid and exists(select 1 from hosted_guests where id=guest_id and expires_at>now())));
  if not found then raise exception 'not_found'; end if; return hosted_job_json(j);
end $$;
create function public.hosted_job_claim(p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j hosted_jobs;
begin
  -- Every job transition uses budget -> row ordering, including transitions
  -- that do not change money. Cleanup cannot classify an in-flight dispatch.
  perform pg_advisory_xact_lock(hashtextextended('hosted-platform-budget',0));
  update hosted_jobs set status='running',updated_at=clock_timestamp() where id=p_id and status='queued' and (guest_id is null or exists(select 1 from hosted_guests where id=hosted_jobs.guest_id and expires_at>clock_timestamp())) returning * into j;
  if found then return hosted_job_json(j)||jsonb_build_object('claimed',true); end if;
  select * into j from hosted_jobs where id=p_id; if not found then return null; end if;
  return hosted_job_json(j)||jsonb_build_object('claimed',false);
end $$;
create function public.hosted_job_dispatched(p_id uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('hosted-platform-budget',0));
  update hosted_jobs set dispatched=true,updated_at=clock_timestamp() where id=p_id and status='running' and (guest_id is null or exists(select 1 from hosted_guests where id=hosted_jobs.guest_id and expires_at>clock_timestamp()));
  if not found then raise exception 'not_found'; end if; return true;
end $$;
create function public.hosted_job_finish(p_id uuid,p_status text,p_result jsonb,p_error text,p_actual_micros bigint) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare j hosted_jobs; settled bigint; delta bigint;
begin
  if p_status not in ('completed','failed','unknown') then raise exception 'not_found'; end if;
  perform pg_advisory_xact_lock(hashtextextended('hosted-platform-budget',0));
  select * into j from hosted_jobs where id=p_id for update;
  if not found or j.status in ('completed','failed','unknown') then return false; end if;
  settled:=case when p_status='failed' then 0 when p_status='unknown' or p_actual_micros is null then j.reserved_micros else greatest(0,p_actual_micros) end;
  delta:=settled-j.reserved_micros;
  update hosted_budgets set spent_micros=spent_micros+delta where period in(select period from hosted_job_budgets where job_id=p_id);
  if p_status='failed' then update hosted_credit_usage set used=greatest(0,used-j.credit_cost) where owner_key=j.owner_key and product=j.product and period=j.credit_period; end if;
  update hosted_jobs set status=p_status,result=case when p_status='completed' then p_result else null end,error=p_error,actual_micros=settled,updated_at=clock_timestamp() where id=p_id;
  insert into hosted_ledger(job_id,entry_type,product,delta_credits,delta_micros) values(p_id,'settle',j.product,case when p_status='failed' then -j.credit_cost else 0 end,delta);
  return true;
end $$;

create function public.hosted_document_json(d hosted_documents) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('id',d.id,'product',d.product,'kind',d.kind,'title',d.title,'data',d.data,'revision',d.revision,'updatedAt',d.updated_at);
$$;
create function public.hosted_document_list(p_user_id uuid,p_product text,p_kind text) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select coalesce(jsonb_agg(hosted_document_json(d) order by d.updated_at desc),'[]') from hosted_documents d where user_id=p_user_id and product=p_product and kind=p_kind;
$$;
create function public.hosted_document_get(p_user_id uuid,p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d hosted_documents;
begin select * into d from hosted_documents where id=p_id and user_id=p_user_id; if not found then raise exception 'not_found'; end if; return hosted_document_json(d); end $$;
create function public.hosted_document_create(p_user_id uuid,p_document jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d hosted_documents; prod text:=p_document->>'product'; k text:=p_document->>'kind'; ent jsonb; max_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('hosted-documents:'||p_user_id::text||':'||prod,0));
  ent:=hosted_entitlements(p_user_id)->prod;
  max_count:=(ent->'limits'->>(case k when 'work' then 'works' when 'template' then 'templates' when 'goal' then 'goals' end))::integer;
  if max_count is null or (select count(*) from hosted_documents where user_id=p_user_id and product=prod and kind=k)>=max_count then raise exception 'document_limit'; end if;
  insert into hosted_documents(user_id,product,kind,title,data) values(p_user_id,prod,k,p_document->>'title',p_document->'data') returning * into d;
  insert into hosted_document_versions(document_id,revision,data) values(d.id,1,d.data);
  return hosted_document_json(d);
end $$;
create function public.hosted_document_update(p_user_id uuid,p_id uuid,p_document jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d hosted_documents;
begin
  select * into d from hosted_documents where id=p_id and user_id=p_user_id for update;
  if not found then raise exception 'not_found'; end if;
  if d.revision<>(p_document->>'revision')::integer then raise exception 'stale_revision'; end if;
  update hosted_documents set title=p_document->>'title',data=p_document->'data',revision=revision+1,updated_at=now() where id=p_id returning * into d;
  insert into hosted_document_versions(document_id,revision,data) values(d.id,d.revision,d.data);
  delete from hosted_document_versions where document_id=d.id and revision<=d.revision-100;
  return hosted_document_json(d);
end $$;
create function public.hosted_document_delete(p_user_id uuid,p_id uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin delete from hosted_documents where id=p_id and user_id=p_user_id; if not found then raise exception 'not_found'; end if; return true; end $$;
create function public.hosted_document_versions(p_user_id uuid,p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d hosted_documents; output jsonb;
begin
  select * into d from hosted_documents where id=p_id and user_id=p_user_id; if not found then raise exception 'not_found'; end if;
  if hosted_plan(p_user_id,d.product)->>'plan'<>'pro' then raise exception 'pro_required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'data',data,'createdAt',created_at) order by revision desc),'[]') into output from hosted_document_versions where document_id=p_id;
  return output;
end $$;

create function public.hosted_checkout_begin(p_user_id uuid,p_product text,p_key text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c hosted_checkouts;
begin
  perform pg_advisory_xact_lock(hashtextextended('hosted-checkout:'||p_user_id::text,0));
  select * into c from hosted_checkouts where user_id=p_user_id and idempotency_key=p_key;
  if found then
    if c.product<>p_product then raise exception 'idempotency_conflict'; end if;
    return jsonb_build_object('id',c.id,'status',c.status,'url',c.url,'created',false);
  end if;
  if hosted_plan(p_user_id,p_product)->>'plan'='pro' then raise exception 'billing_conflict'; end if;
  if exists(select 1 from hosted_checkouts where user_id=p_user_id and product=p_product and status in ('pending','unknown','completed') and created_at>now()-interval '24 hours') then raise exception 'checkout_pending'; end if;
  insert into hosted_checkouts(user_id,product,idempotency_key) values(p_user_id,p_product,p_key) returning * into c;
  return jsonb_build_object('id',c.id,'status',c.status,'created',true);
end $$;
create function public.hosted_checkout_finish(p_id uuid,p_status text,p_transaction_id text,p_url text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update hosted_checkouts set status=p_status,transaction_id=coalesce(p_transaction_id,transaction_id),url=coalesce(p_url,url) where id=p_id and status<>'completed';
  return true;
end $$;
create function public.hosted_billing_account(p_user_id uuid,p_product text) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('customerId',customer_id,'subscriptionId',subscription_id) from hosted_subscriptions where user_id=p_user_id and product=p_product;
$$;
create function public.hosted_billing_lookup(p_transaction_id text,p_subscription_id text) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('userId',user_id,'product',product) from (
    select user_id,product from hosted_payments where transaction_id=p_transaction_id
    union all select user_id,product from hosted_billing_links where subscription_id=p_subscription_id
  ) known limit 1;
$$;
create function public.hosted_webhook_apply(p_event jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  uid uuid:=(p_event->>'userId')::uuid; prod text:=p_event->>'product'; action_name text:=p_event->>'action'; occurred timestamptz:=(p_event->>'occurredAt')::timestamptz;
  c hosted_checkouts; s hosted_subscriptions; link hosted_billing_links; payment hosted_payments; has_subscription boolean; is_new boolean; can_replace boolean; checkout_time timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended('hosted-billing-webhooks',0));
  if exists(select 1 from hosted_webhook_events where event_id=p_event->>'id') then return jsonb_build_object('received',true,'duplicate',true); end if;
  if action_name<>'ignored' then
    if uid is null or prod not in ('studio','mandala') then raise exception 'billing_conflict'; end if;
    if p_event->>'checkoutId' is not null then
      select * into c from hosted_checkouts where id=(p_event->>'checkoutId')::uuid for update;
      if not found or c.user_id<>uid or c.product<>prod or (c.transaction_id is not null and action_name='payment' and c.transaction_id<>p_event->>'transactionId') then raise exception 'billing_conflict'; end if;
      checkout_time:=c.created_at;
    end if;
    select * into s from hosted_subscriptions where user_id=uid and product=prod for update; has_subscription:=found;
    if p_event->>'subscriptionId' is not null then
      select * into link from hosted_billing_links where subscription_id=p_event->>'subscriptionId';
      if found and (link.user_id<>uid or link.product<>prod or link.customer_id<>p_event->>'customerId') then raise exception 'billing_conflict'; end if;
      if not found then
        if c.id is null then raise exception 'billing_conflict'; end if;
        insert into hosted_billing_links(subscription_id,user_id,product,customer_id,checkout_id) values(p_event->>'subscriptionId',uid,prod,p_event->>'customerId',c.id);
      end if;
      if checkout_time is null and link.checkout_id is not null then select created_at into checkout_time from hosted_checkouts where id=link.checkout_id; end if;
    end if;
    if action_name='payment' then
      select * into payment from hosted_payments where transaction_id=p_event->>'transactionId'; is_new:=not found;
      if not is_new and (payment.user_id<>uid or payment.product<>prod or payment.subscription_id<>p_event->>'subscriptionId') then raise exception 'billing_conflict'; end if;
      if is_new then
        insert into hosted_payments(transaction_id,user_id,product,subscription_id,period_start,period_end,occurred_at) values(p_event->>'transactionId',uid,prod,p_event->>'subscriptionId',(p_event->>'periodStart')::timestamptz,(p_event->>'periodEnd')::timestamptz,occurred);
      end if;
      if c.id is not null and c.transaction_id is null then update hosted_checkouts set transaction_id=p_event->>'transactionId' where id=c.id; end if;
      can_replace:=not has_subscription or s.subscription_id=p_event->>'subscriptionId' or checkout_time>s.checkout_created_at;
      if can_replace and (not has_subscription or not s.revoked or occurred>s.last_event_at) and (not has_subscription or s.period_start is null or (p_event->>'periodStart')::timestamptz>=s.period_start) and not coalesce(payment.refunded,false) then
        insert into hosted_subscriptions(user_id,product,subscription_id,customer_id,status,period_start,period_end,payment_id,revoked,last_event_at,checkout_created_at)
          values(uid,prod,p_event->>'subscriptionId',p_event->>'customerId','active',(p_event->>'periodStart')::timestamptz,(p_event->>'periodEnd')::timestamptz,p_event->>'transactionId',false,occurred,checkout_time)
          on conflict(user_id,product) do update set subscription_id=excluded.subscription_id,customer_id=excluded.customer_id,status='active',period_start=excluded.period_start,period_end=excluded.period_end,payment_id=excluded.payment_id,revoked=false,last_event_at=greatest(hosted_subscriptions.last_event_at,excluded.last_event_at),checkout_created_at=excluded.checkout_created_at;
      end if;
    elsif action_name='refund' then
      update hosted_payments set refunded=true where transaction_id=p_event->>'transactionId' and user_id=uid and product=prod;
      if not found then raise exception 'billing_conflict'; end if;
      update hosted_subscriptions set revoked=true where user_id=uid and product=prod and payment_id=p_event->>'transactionId';
    elsif action_name in ('revoke','lifecycle') then
      if not has_subscription then
        insert into hosted_subscriptions(user_id,product,subscription_id,customer_id,status,revoked,last_event_at,checkout_created_at)
          values(uid,prod,p_event->>'subscriptionId',p_event->>'customerId',coalesce(p_event->>'status','pending'),action_name='revoke',occurred,checkout_time);
      elsif s.subscription_id=p_event->>'subscriptionId' and occurred>s.last_event_at then
        update hosted_subscriptions set status=coalesce(p_event->>'status',status),revoked=(revoked or action_name='revoke'),scheduled_cancel_at=(p_event->>'scheduledCancelAt')::timestamptz,last_event_at=occurred where user_id=uid and product=prod;
      end if;
    else raise exception 'billing_conflict'; end if;
  end if;
  insert into hosted_webhook_events(event_id,event_type,occurred_at) values(p_event->>'id',p_event->>'type',occurred);
  return jsonb_build_object('received',true);
end $$;

create function public.hosted_record_event(p_user_id uuid,p_name text,p_product text,p_template_id text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_name not in ('page_view','template_selected','analysis_started','generation_started','evaluation_viewed','signup_started','checkout_started','document_saved','job_started','job_completed','mandala_action_toggled') or p_product not in ('studio','mandala') or length(coalesce(p_template_id,''))>64 then raise exception 'not_found'; end if;
  insert into hosted_events(name,product,template_id) values(p_name,p_product,coalesce(p_template_id,'')) on conflict(day,name,product,template_id) do update set count=least(hosted_events.count+1,1000000);
  return true;
end $$;
create function public.hosted_cleanup() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare candidate uuid; j hosted_jobs; expired_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('hosted-platform-budget',0));
  for candidate in select id from hosted_jobs where (status='running' and updated_at<clock_timestamp()-interval '20 minutes') or (status='queued' and updated_at<clock_timestamp()-interval '1 hour') loop
    -- Candidate selection is not authority to settle. Re-read the current row
    -- under the same lock order as claim/dispatched/finish, then classify it.
    select * into j from hosted_jobs where id=candidate for update;
    if found and ((j.status='running' and j.updated_at<clock_timestamp()-interval '20 minutes') or (j.status='queued' and j.updated_at<clock_timestamp()-interval '1 hour')) then
      perform hosted_job_finish(j.id,case when j.dispatched then 'unknown' else 'failed' end,null,case when j.dispatched then 'provider_outcome_unknown' else 'dispatch_abandoned' end,null);
    end if;
  end loop;
  delete from hosted_guests where expires_at<=now(); get diagnostics expired_count=row_count;
  delete from hosted_sessions where expires_at<=now();
  delete from hosted_trials where created_at<now()-interval '30 days';
  return jsonb_build_object('expiredGuests',expired_count);
end $$;

-- RLS remains defense in depth even though BFF RPCs also bind every ownership check.
do $$ declare t text; begin
  foreach t in array array['hosted_sessions','hosted_guests','hosted_trials','hosted_credit_usage','hosted_budgets','hosted_jobs','hosted_job_budgets','hosted_ledger','hosted_documents','hosted_document_versions','hosted_checkouts','hosted_billing_links','hosted_subscriptions','hosted_payments','hosted_webhook_events','hosted_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
grant usage,select on sequence public.hosted_ledger_id_seq to service_role;
grant select on public.hosted_documents,public.hosted_document_versions,public.hosted_jobs,public.hosted_subscriptions to authenticated;
create policy hosted_documents_owner_read on public.hosted_documents for select to authenticated using(user_id=auth.uid());
create policy hosted_versions_owner_read on public.hosted_document_versions for select to authenticated using(exists(select 1 from public.hosted_documents d where d.id=document_id and d.user_id=auth.uid()) and exists(select 1 from public.hosted_subscriptions s where s.user_id=auth.uid() and s.product=(select d.product from public.hosted_documents d where d.id=document_id) and s.period_start<=now() and s.period_end>now() and not s.revoked and s.payment_id is not null));
create policy hosted_jobs_owner_read on public.hosted_jobs for select to authenticated using(user_id=auth.uid());
create policy hosted_subscriptions_owner_read on public.hosted_subscriptions for select to authenticated using(user_id=auth.uid());
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'hosted\_%' escape '\' loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
commit;
