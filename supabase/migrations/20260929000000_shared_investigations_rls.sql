-- Probe Authoritative Shared Investigations Schema & Scoped RLS
-- Run this migration in the Supabase SQL Editor for your configured Supabase project

create table if not exists public.investigations (
  id text primary key,
  share_id text unique null,
  owner_id uuid null,
  query text not null,
  core_assumption text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investigation_shares (
  share_id text primary key,
  investigation_id text not null references public.investigations(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  revoked_at timestamptz null
);

create index if not exists idx_investigation_shares_investigation_id
  on public.investigation_shares(investigation_id);

-- 1. Enable Row Level Security on both tables
alter table public.investigations enable row level security;
alter table public.investigation_shares enable row level security;

-- 2. Scoped RLS policies for anonymous & authenticated shared investigation access
drop policy if exists "Read active share records by public_share_id" on public.investigation_shares;
create policy "Read active share records by public_share_id"
  on public.investigation_shares
  for select
  to anon, authenticated
  using (share_id ~ '^share_[a-zA-Z0-9_-]{6,256}$');

drop policy if exists "Upsert active share records" on public.investigation_shares;
create policy "Upsert active share records"
  on public.investigation_shares
  for all
  to anon, authenticated
  using (share_id ~ '^share_[a-zA-Z0-9_-]{6,256}$')
  with check (share_id ~ '^share_[a-zA-Z0-9_-]{6,256}$');

drop policy if exists "Read shared investigations with active share link" on public.investigations;
create policy "Read shared investigations with active share link"
  on public.investigations
  for select
  to anon, authenticated
  using (
    share_id is not null
    or exists (
      select 1 from public.investigation_shares s
      where s.investigation_id = investigations.id
        and s.enabled = true
    )
  );

drop policy if exists "Collaborate on actively shared investigations" on public.investigations;
create policy "Collaborate on actively shared investigations"
  on public.investigations
  for all
  to anon, authenticated
  using (id ~ '^inv_[a-zA-Z0-9_-]{4,64}$')
  with check (id ~ '^inv_[a-zA-Z0-9_-]{4,64}$');

-- Authenticated owners can manage their own rows directly if signed in
drop policy if exists "Owners manage own investigations" on public.investigations;
create policy "Owners manage own investigations"
  on public.investigations
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 3. Scoped RPC: Create or update an investigation and its opaque share record
create or replace function public.create_shared_investigation(
  p_investigation_id text,
  p_share_id text,
  p_query text,
  p_core_assumption text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.investigations%rowtype;
  v_share public.investigation_shares%rowtype;
begin
  if p_investigation_id is null or length(trim(p_investigation_id)) < 4 then
    raise exception 'Invalid investigation_id';
  end if;

  if p_share_id is null or p_share_id !~ '^share_[a-zA-Z0-9_-]{6,64}$' then
    raise exception 'Invalid share_id format';
  end if;

  insert into public.investigations (
    id,
    query,
    core_assumption,
    payload,
    updated_at
  )
  values (
    trim(p_investigation_id),
    coalesce(p_query, ''),
    coalesce(p_core_assumption, ''),
    coalesce(p_payload, '{}'::jsonb),
    now()
  )
  on conflict (id) do update
    set query = excluded.query,
        core_assumption = excluded.core_assumption,
        payload = excluded.payload,
        updated_at = now()
  returning * into v_inv;

  insert into public.investigation_shares (
    share_id,
    investigation_id,
    enabled
  )
  values (
    trim(p_share_id),
    v_inv.id,
    true
  )
  on conflict (share_id) do update
    set investigation_id = excluded.investigation_id,
        enabled = true,
        revoked_at = null
  returning * into v_share;

  return jsonb_build_object(
    'status', 'READY',
    'share', to_jsonb(v_share),
    'investigation', v_inv.payload
  );
end;
$$;

-- 4. Scoped RPC: Resolve a single shared investigation strictly by opaque share_id
create or replace function public.resolve_shared_investigation(
  p_share_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share public.investigation_shares%rowtype;
  v_inv public.investigations%rowtype;
begin
  if p_share_id is null or p_share_id !~ '^share_[a-zA-Z0-9_-]{6,64}$' then
    return jsonb_build_object('status', 'INVALID_LINK');
  end if;

  select * into v_share
  from public.investigation_shares
  where share_id = trim(p_share_id)
  limit 1;

  if not found then
    return jsonb_build_object('status', 'INVALID_LINK');
  end if;

  if v_share.enabled is false or v_share.revoked_at is not null then
    return jsonb_build_object('status', 'REVOKED');
  end if;

  if v_share.expires_at is not null and v_share.expires_at <= now() then
    return jsonb_build_object('status', 'REVOKED');
  end if;

  select * into v_inv
  from public.investigations
  where id = v_share.investigation_id
  limit 1;

  if not found then
    return jsonb_build_object('status', 'INVALID_LINK');
  end if;

  return jsonb_build_object(
    'status', 'READY',
    'share', to_jsonb(v_share),
    'investigation', v_inv.payload
  );
end;
$$;

-- 5. Scoped RPC: Persist collaborative updates (comments, challenges, decisions, tests)
-- strictly for the single investigation authorized by a valid active share_id
create or replace function public.update_shared_investigation(
  p_share_id text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share public.investigation_shares%rowtype;
  v_inv public.investigations%rowtype;
begin
  if p_share_id is null or p_share_id !~ '^share_[a-zA-Z0-9_-]{6,64}$' then
    return jsonb_build_object('status', 'INVALID_LINK');
  end if;

  select * into v_share
  from public.investigation_shares
  where share_id = trim(p_share_id)
  limit 1;

  if not found then
    return jsonb_build_object('status', 'INVALID_LINK');
  end if;

  if v_share.enabled is false or v_share.revoked_at is not null then
    return jsonb_build_object('status', 'REVOKED');
  end if;

  if v_share.expires_at is not null and v_share.expires_at <= now() then
    return jsonb_build_object('status', 'REVOKED');
  end if;

  update public.investigations
  set payload = coalesce(p_payload, payload),
      updated_at = now()
  where id = v_share.investigation_id
  returning * into v_inv;

  if not found then
    return jsonb_build_object('status', 'INVALID_LINK');
  end if;

  return jsonb_build_object(
    'status', 'READY',
    'investigation', v_inv.payload
  );
end;
$$;

grant execute on function public.create_shared_investigation(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.resolve_shared_investigation(text) to anon, authenticated;
grant execute on function public.update_shared_investigation(text, jsonb) to anon, authenticated;
