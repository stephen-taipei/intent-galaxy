-- Topics (2026-11-01): one private folder per subject that ties a user's
-- outputs across tools together (Intent Galaxy works, Mandala charts, and
-- later Mind Galaxy). Topics are never public and never shared.
begin;

create table public.hosted_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index hosted_topics_owner on public.hosted_topics(user_id, updated_at desc);
-- Deleting a topic keeps its documents and only unlinks them.
alter table public.hosted_documents add column topic_id uuid references public.hosted_topics(id) on delete set null;
create index hosted_documents_topic on public.hosted_documents(topic_id) where topic_id is not null;

create function public.hosted_topic_json(t hosted_topics) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('id',t.id,'title',t.title,'updatedAt',t.updated_at,'documents',
    (select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'product',d.product,'kind',d.kind,'title',d.title,'updatedAt',d.updated_at) order by d.updated_at desc),'[]')
     from hosted_documents d where d.topic_id=t.id and d.user_id=t.user_id));
$$;
create function public.hosted_topic_list(p_user_id uuid) returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select coalesce(jsonb_agg(hosted_topic_json(t) order by t.updated_at desc),'[]') from hosted_topics t where t.user_id=p_user_id;
$$;
-- Creates a topic, or renames one when an id is given. At most 200 per user.
create function public.hosted_topic_save(p_user_id uuid,p_topic jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare t hosted_topics;
begin
  if p_topic ? 'id' then
    update hosted_topics set title=btrim(p_topic->>'title'),updated_at=now() where id=(p_topic->>'id')::uuid and user_id=p_user_id returning * into t;
    if not found then raise exception 'not_found'; end if;
  else
    perform pg_advisory_xact_lock(hashtextextended('topics:'||p_user_id::text,0));
    if (select count(*) from hosted_topics where user_id=p_user_id)>=200 then raise exception 'topic_limit'; end if;
    insert into hosted_topics(user_id,title) values(p_user_id,btrim(p_topic->>'title')) returning * into t;
  end if;
  return hosted_topic_json(t);
end $$;
create function public.hosted_topic_delete(p_user_id uuid,p_id uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin delete from hosted_topics where id=p_id and user_id=p_user_id; if not found then raise exception 'not_found'; end if; return true; end $$;
-- Links a document to one of the owner's topics, or unlinks it with null.
create function public.hosted_document_set_topic(p_user_id uuid,p_document_id uuid,p_topic_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare t hosted_topics;
begin
  if p_topic_id is not null then
    update hosted_topics set updated_at=now() where id=p_topic_id and user_id=p_user_id returning * into t;
    if not found then raise exception 'not_found'; end if;
  end if;
  update hosted_documents set topic_id=p_topic_id where id=p_document_id and user_id=p_user_id;
  if not found then raise exception 'not_found'; end if;
  return case when p_topic_id is null then null else hosted_topic_json(t) end;
end $$;
-- Everything under one topic with its content, for export to Mind Galaxy.
create function public.hosted_topic_export(p_user_id uuid,p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare t hosted_topics;
begin
  select * into t from hosted_topics where id=p_id and user_id=p_user_id;
  if not found then raise exception 'not_found'; end if;
  return jsonb_build_object('format','intent-galaxy.topic-export','version',1,'exportedAt',now(),
    'topic',jsonb_build_object('id',t.id,'title',t.title,'createdAt',t.created_at,'updatedAt',t.updated_at),
    'documents',(select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'product',d.product,'kind',d.kind,'title',d.title,'revision',d.revision,'updatedAt',d.updated_at,'data',d.data) order by d.updated_at),'[]')
      from hosted_documents d where d.topic_id=t.id and d.user_id=p_user_id));
end $$;

alter table public.hosted_topics enable row level security;
alter table public.hosted_topics force row level security;
revoke all on public.hosted_topics from anon,authenticated;
grant all on public.hosted_topics to service_role;
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'hosted\_%' escape '\' loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
commit;
