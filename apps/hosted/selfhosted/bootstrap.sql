-- Self-hosted PostgreSQL only: run once as a superuser before migrations/0001.
-- Supabase already provides these objects; never run this file there.
-- It recreates the small part of the Supabase surface the migrations rely on:
-- the anon/authenticated/service_role roles, auth.users and auth.uid().
-- Set the authenticator password separately (\password authenticator); it is not stored here.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then create role authenticator login noinherit; end if;
end $$;
-- PostgREST connects as authenticator and switches to the role named in the request JWT.
grant anon, authenticated, service_role to authenticator;

create schema if not exists auth;
-- Without Supabase Auth nothing inserts users, so only guest sessions exist until sign-in is added.
create table if not exists auth.users(id uuid primary key);
-- PostgREST 12 exposes claims as request.jwt.claims; older releases used request.jwt.claim.sub.
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'), '')::uuid
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
