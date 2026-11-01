-- Public Mandala feed (2026-10-31): signed-in users publish a snapshot of a
-- cloud chart under a nickname and a preset avatar. Other signed-in users
-- browse it, encourage it, copy it into their own chart or report it.
-- Three reports hide a chart until an operator reviews it. The pre-generated
-- examples are published under the brand account (user_id null) and ranked by
-- the same rules, so the feed is never empty; their counts start at zero.
begin;

create table public.hosted_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (length(btrim(nickname)) between 1 and 24),
  avatar text not null check (avatar ~ '^a(0[1-9]|1[0-2])$'),
  updated_at timestamptz not null default now()
);
create table public.hosted_public_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  example_id text unique check (example_id ~ '^[a-z0-9-]{1,64}$'), locale text check (locale in ('zh','en')),
  document_id uuid unique references public.hosted_documents(id) on delete cascade,
  title text not null check (length(title) between 1 and 200), goal text not null check (length(goal) <= 500),
  snapshot jsonb not null check (octet_length(snapshot::text) <= 65536),
  tags text[] not null default '{}' check (cardinality(tags) <= 3 and tags <@ array['health','learning','career','money','sports','creative','family','life']::text[]),
  progress integer not null check (progress between 0 and 64),
  published_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  hidden boolean not null default false, encourage_count integer not null default 0, copy_count integer not null default 0, report_count integer not null default 0,
  view_count integer not null default 0,
  check ((user_id is null) = (example_id is not null))
);
create index hosted_public_charts_new on public.hosted_public_charts(published_at desc) where not hidden;
create index hosted_public_charts_tags on public.hosted_public_charts using gin(tags);
create table public.hosted_encouragements (
  chart_id uuid not null references public.hosted_public_charts(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (chart_id, user_id)
);
create table public.hosted_copies (
  chart_id uuid not null references public.hosted_public_charts(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (chart_id, user_id)
);
-- One view per signed-in viewer per chart per day (Asia/Taipei). Views break
-- ties and feed the metrics; they never rank on their own.
create table public.hosted_public_views (
  chart_id uuid not null references public.hosted_public_charts(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Taipei')::date, primary key (chart_id, user_id, day)
);
create table public.hosted_reports (
  chart_id uuid not null references public.hosted_public_charts(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('personal_data','harmful','spam','other')), created_at timestamptz not null default now(), primary key (chart_id, user_id)
);

create function public.hosted_profile_get(p_user_id uuid) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('nickname',nickname,'avatar',avatar) from hosted_profiles where user_id=p_user_id;
$$;
create function public.hosted_profile_set(p_user_id uuid,p_profile jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into hosted_profiles(user_id,nickname,avatar) values(p_user_id,btrim(p_profile->>'nickname'),p_profile->>'avatar')
    on conflict(user_id) do update set nickname=excluded.nickname,avatar=excluded.avatar,updated_at=now();
  return hosted_profile_get(p_user_id);
end $$;

-- What other people see: titles, action texts and done flags. Notes and due
-- dates never leave the owner's document.
create function public.hosted_public_json(c hosted_public_charts,p_viewer uuid) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('id',c.id,'title',c.title,'goal',c.goal,'themes',c.snapshot,'tags',to_jsonb(c.tags),'progress',c.progress,
    'publishedAt',c.published_at,'updatedAt',c.updated_at,'encourages',c.encourage_count,'copies',c.copy_count,
    'views',c.view_count,'example',c.example_id is not null,
    'author',case when c.example_id is not null then jsonb_build_object('brand',true,'avatar','brand')
      else (select jsonb_build_object('nickname',p.nickname,'avatar',p.avatar) from hosted_profiles p where p.user_id=c.user_id) end,
    'mine',c.user_id=p_viewer,'documentId',case when c.user_id=p_viewer then c.document_id end,
    'encouraged',exists(select 1 from hosted_encouragements e where e.chart_id=c.id and e.user_id=p_viewer));
$$;
create function public.hosted_public_publish(p_user_id uuid,p_publish jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d hosted_documents; c hosted_public_charts; snap jsonb; done integer; tag_list text[];
begin
  if not exists(select 1 from hosted_profiles where user_id=p_user_id) then raise exception 'profile_required'; end if;
  select * into d from hosted_documents where id=(p_publish->>'documentId')::uuid and user_id=p_user_id and product='mandala';
  if not found then raise exception 'not_found'; end if;
  select coalesce(array_agg(distinct t),'{}') into tag_list from jsonb_array_elements_text(coalesce(p_publish->'tags','[]')) t;
  if coalesce(btrim(d.data->>'goal'),'')='' then raise exception 'goal_required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('title',coalesce(t->>'title',''),'actions',
      (select coalesce(jsonb_agg(jsonb_build_object('text',coalesce(a->>'text',''),'done',coalesce((a->>'done')::boolean,false)) order by ai),'[]') from jsonb_array_elements(t->'actions') with ordinality as x(a,ai)))
    order by ti),'[]') into snap from jsonb_array_elements(d.data->'themes') with ordinality as y(t,ti);
  select count(*) into done from jsonb_array_elements(d.data->'themes') t, jsonb_array_elements(t->'actions') a where coalesce((a->>'done')::boolean,false);
  insert into hosted_public_charts(user_id,document_id,title,goal,snapshot,tags,progress)
    values(p_user_id,d.id,coalesce(nullif(btrim(d.data->>'title'),''),d.title),d.data->>'goal',snap,tag_list,done)
    on conflict(document_id) do update set title=excluded.title,goal=excluded.goal,snapshot=excluded.snapshot,tags=excluded.tags,progress=excluded.progress,updated_at=now()
    returning * into c;
  return hosted_public_json(c,p_user_id);
end $$;
create function public.hosted_public_unpublish(p_user_id uuid,p_id uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin delete from hosted_public_charts where id=p_id and user_id=p_user_id; if not found then raise exception 'not_found'; end if; return true; end $$;

-- Feed pages: newest, hot (encouragements plus double-weighted copies),
-- most copied, or most completed. Hot and copied count only interactions in
-- the chosen window (7d, 30d or all); views in that window break ties.
-- Examples show in the viewer's language. Offsets stop at 500.
create function public.hosted_public_feed(p_viewer uuid,p_query jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare sort_by text:=coalesce(p_query->>'sort','new'); tag text:=p_query->>'tag'; lang text:=p_query->>'lang';
  win text:=coalesce(p_query->>'window','7d'); src text:=coalesce(p_query->>'source','all');
  lim integer:=least(greatest(coalesce((p_query->>'limit')::integer,20),1),50);
  off integer:=least(greatest(coalesce((p_query->>'offset')::integer,0),0),500); since timestamptz; output jsonb;
begin
  if sort_by not in ('new','hot','copied','done') or win not in ('7d','30d','all') or src not in ('all','users','examples') then raise exception 'not_found'; end if;
  since:=case win when '7d' then now()-interval '7 days' when '30d' then now()-interval '30 days' else '-infinity'::timestamptz end;
  select coalesce(jsonb_agg(x.item order by x.rank desc,x.views desc,x.published_at desc,x.id),'[]') into output from (
    select hosted_public_json(c,p_viewer) as item, c.published_at, c.id, case sort_by
      when 'hot' then (select count(*) from hosted_encouragements e where e.chart_id=c.id and e.created_at>=since)
        +2*(select count(*) from hosted_copies k where k.chart_id=c.id and k.created_at>=since)
      when 'copied' then (select count(*) from hosted_copies k where k.chart_id=c.id and k.created_at>=since)
      when 'done' then c.progress else 0 end as rank,
      case when sort_by in ('hot','copied') then (select count(*) from hosted_public_views v where v.chart_id=c.id and v.day>=(since at time zone 'Asia/Taipei')::date) else 0 end as views
    from hosted_public_charts c where not c.hidden and (tag is null or tag=any(c.tags))
      and (src='all' or (src='users')=(c.example_id is null)) and (c.example_id is null or lang is null or c.locale=lang)
    order by rank desc,views desc,c.published_at desc,c.id limit lim offset off) x;
  return output;
end $$;
-- A signed-in viewer opened a chart: count it once per day, never the owner's.
create function public.hosted_public_view(p_user_id uuid,p_id uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not exists(select 1 from hosted_public_charts where id=p_id and not hidden and user_id is distinct from p_user_id) then return false; end if;
  insert into hosted_public_views(chart_id,user_id) values(p_id,p_user_id) on conflict do nothing;
  if not found then return false; end if;
  update hosted_public_charts set view_count=view_count+1 where id=p_id; return true;
end $$;
-- Publishes or refreshes the brand examples from mandala-examples.json. The
-- content is replaced; encouragements, copies and views are kept.
create function public.hosted_public_seed(p_examples jsonb) returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare e jsonb; n integer:=0; snap jsonb; tag_list text[];
begin
  for e in select * from jsonb_array_elements(p_examples) loop
    select coalesce(jsonb_agg(jsonb_build_object('title',coalesce(t->>'title',''),'actions',
        (select coalesce(jsonb_agg(jsonb_build_object('text',coalesce(a->>'text',''),'done',false) order by ai),'[]') from jsonb_array_elements(t->'actions') with ordinality as x(a,ai)))
      order by ti),'[]') into snap from jsonb_array_elements(e->'chart'->'themes') with ordinality as y(t,ti);
    select coalesce(array_agg(distinct t),'{}') into tag_list from jsonb_array_elements_text(coalesce(e->'tags','[]')) t;
    insert into hosted_public_charts(example_id,locale,title,goal,snapshot,tags,progress)
      values(e->>'id',e->>'locale',e->'chart'->>'title',e->'chart'->>'goal',snap,tag_list,0)
      on conflict(example_id) do update set locale=excluded.locale,title=excluded.title,goal=excluded.goal,snapshot=excluded.snapshot,tags=excluded.tags,updated_at=now();
    n:=n+1;
  end loop;
  return n;
end $$;
create function public.hosted_public_get(p_viewer uuid,p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c hosted_public_charts;
begin
  select * into c from hosted_public_charts where id=p_id and (not hidden or user_id=p_viewer);
  if not found then raise exception 'not_found'; end if; return hosted_public_json(c,p_viewer);
end $$;
create function public.hosted_public_mine(p_user_id uuid) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select coalesce(jsonb_agg(hosted_public_json(c,p_user_id)||jsonb_build_object('hidden',c.hidden) order by c.updated_at desc),'[]') from hosted_public_charts c where c.user_id=p_user_id;
$$;
create function public.hosted_public_encourage(p_user_id uuid,p_id uuid,p_on boolean) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c hosted_public_charts;
begin
  select * into c from hosted_public_charts where id=p_id and not hidden for update;
  if not found then raise exception 'not_found'; end if;
  if p_on then insert into hosted_encouragements(chart_id,user_id) values(p_id,p_user_id) on conflict do nothing;
  else delete from hosted_encouragements where chart_id=p_id and user_id=p_user_id; end if;
  update hosted_public_charts set encourage_count=(select count(*) from hosted_encouragements where chart_id=p_id) where id=p_id returning * into c;
  return hosted_public_json(c,p_user_id);
end $$;
-- Copying returns the snapshot; one copy per user is counted.
create function public.hosted_public_copy(p_user_id uuid,p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c hosted_public_charts;
begin
  select * into c from hosted_public_charts where id=p_id and not hidden for update;
  if not found then raise exception 'not_found'; end if;
  if c.user_id is distinct from p_user_id then
    insert into hosted_copies(chart_id,user_id) values(p_id,p_user_id) on conflict do nothing;
    update hosted_public_charts set copy_count=(select count(*) from hosted_copies where chart_id=p_id) where id=p_id returning * into c;
  end if;
  return hosted_public_json(c,p_user_id);
end $$;
create function public.hosted_public_report(p_user_id uuid,p_id uuid,p_reason text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare c hosted_public_charts;
begin
  select * into c from hosted_public_charts where id=p_id for update;
  if not found or c.user_id is not distinct from p_user_id then raise exception 'not_found'; end if;
  insert into hosted_reports(chart_id,user_id,reason) values(p_id,p_user_id,p_reason) on conflict do nothing;
  update hosted_public_charts set report_count=(select count(*) from hosted_reports where chart_id=p_id) where id=p_id returning * into c;
  if c.report_count>=3 then update hosted_public_charts set hidden=true where id=p_id; end if;
  return true;
end $$;
-- Operator review queue and decision. Unhiding clears the reports.
create function public.hosted_public_review_list() returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select coalesce(jsonb_agg(hosted_public_json(c,null)||jsonb_build_object('hidden',c.hidden,'reports',c.report_count,
    'reasons',(select jsonb_object_agg(reason,n) from (select reason,count(*) n from hosted_reports r where r.chart_id=c.id group by reason) x)) order by c.report_count desc,c.updated_at desc),'[]')
  from hosted_public_charts c where c.report_count>0 or c.hidden;
$$;
create function public.hosted_public_moderate(p_id uuid,p_hidden boolean) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update hosted_public_charts set hidden=p_hidden where id=p_id; if not found then raise exception 'not_found'; end if;
  if not p_hidden then delete from hosted_reports where chart_id=p_id; update hosted_public_charts set report_count=0 where id=p_id; end if;
  return true;
end $$;

create or replace function public.hosted_record_event(p_user_id uuid,p_name text,p_product text,p_template_id text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_name not in ('page_view','template_selected','analysis_started','generation_started','evaluation_viewed','signup_started','checkout_started','document_saved','job_started','job_completed','mandala_action_toggled','mandala_example_opened','invite_link_copied','feed_viewed','chart_shared','chart_exported','chart_saved_drive') or p_product not in ('studio','mandala') or length(coalesce(p_template_id,''))>64 then raise exception 'not_found'; end if;
  insert into hosted_events(name,product,template_id) values(p_name,p_product,coalesce(p_template_id,'')) on conflict(day,name,product,template_id) do update set count=least(hosted_events.count+1,1000000);
  return true;
end $$;

-- Feed figures for the operator summary.
create function public.hosted_feed_metrics(p_days integer) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object(
    'published',(select count(*) from hosted_public_charts where published_at>=now()-make_interval(days=>least(greatest(coalesce(p_days,30),1),180))),
    'publishers',(select count(distinct user_id) from hosted_public_charts where user_id is not null),
    'views',(select count(*) from hosted_public_views where day>=(now()-make_interval(days=>least(greatest(coalesce(p_days,30),1),180)))::date),
    'encouragements',(select count(*) from hosted_encouragements where created_at>=now()-make_interval(days=>least(greatest(coalesce(p_days,30),1),180))),
    'copies',(select count(*) from hosted_copies where created_at>=now()-make_interval(days=>least(greatest(coalesce(p_days,30),1),180))),
    'hidden',(select count(*) from hosted_public_charts where hidden));
$$;

do $$ declare t text; begin
  foreach t in array array['hosted_profiles','hosted_public_charts','hosted_public_views','hosted_encouragements','hosted_copies','hosted_reports'] loop
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
