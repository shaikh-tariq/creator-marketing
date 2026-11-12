-- Creator Marketing: Milestone M0 foundation
-- Run this once in the Supabase SQL editor (or with the Supabase CLI).
-- Creates accounts, roles, hubs, settings and the security rules for them.

-- ---------- Types ----------
create type public.user_role as enum ('seller', 'influencer', 'buyer', 'admin');
create type public.account_status as enum ('pending', 'active', 'suspended');
create type public.social_platform as enum ('instagram', 'linkedin', 'pinterest', 'x', 'facebook');
create type public.hub_status as enum ('live', 'coming_soon');

-- ---------- Tables ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'buyer',
  full_name text,
  email text not null,
  phone text,
  status public.account_status not null default 'active',
  avatar_url text,
  consent_at timestamptz,            -- when they accepted the terms and privacy policy
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  brand_name text,
  bio text,
  gateway_account_id text,           -- the payment gateway's id for this seller; no bank details stored here
  kyc_status text not null default 'not_started',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.influencer_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  niche text,
  bio text,
  gateway_account_id text,
  kyc_status text not null default 'not_started',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per platform an influencer posts on.
create table public.influencer_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.influencer_profiles (user_id) on delete cascade,
  platform public.social_platform not null,
  profile_url text not null,
  follower_range text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

create table public.hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status public.hub_status not null default 'coming_soon',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Helper functions ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger seller_profiles_updated before update on public.seller_profiles
  for each row execute function public.set_updated_at();
create trigger influencer_profiles_updated before update on public.influencer_profiles
  for each row execute function public.set_updated_at();
create trigger influencer_channels_updated before update on public.influencer_channels
  for each row execute function public.set_updated_at();
create trigger hubs_updated before update on public.hubs
  for each row execute function public.set_updated_at();
create trigger settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

-- True when the logged-in user is an active admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'active'
  );
$$;

-- Creates the profile row whenever someone signs up.
-- The role comes from the sign-up form, but only seller / influencer / buyer are accepted.
-- Nobody can make themselves an admin through sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
  safe_role public.user_role := 'buyer';
begin
  if requested in ('seller', 'influencer', 'buyer') then
    safe_role := requested::public.user_role;
  end if;

  insert into public.profiles (id, role, full_name, email, status, consent_at)
  values (
    new.id,
    safe_role,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    case when safe_role = 'seller' then 'pending'::public.account_status else 'active'::public.account_status end,
    now()
  );

  if safe_role = 'seller' then
    insert into public.seller_profiles (user_id) values (new.id);
  elsif safe_role = 'influencer' then
    insert into public.influencer_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row-level security ----------
alter table public.profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.influencer_profiles enable row level security;
alter table public.influencer_channels enable row level security;
alter table public.hubs enable row level security;
alter table public.settings enable row level security;
alter table public.audit_log enable row level security;

-- profiles: you see and edit your own; admins see and edit all.
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles: admin update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- People may change only harmless columns on their own profile. Role and status stay locked.
revoke insert, update, delete on public.profiles from authenticated, anon;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

-- A trigger enforces the same rule for safety: only admins (or the server's service role) change role or status.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change role or status';
  end if;
  return new;
end;
$$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- seller_profiles: public brand info is readable by everyone; the owner edits brand_name and bio only.
create policy "seller_profiles: read all" on public.seller_profiles
  for select to anon, authenticated using (true);
create policy "seller_profiles: update own" on public.seller_profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.seller_profiles from authenticated, anon;
revoke select on public.seller_profiles from anon, authenticated;
grant select (user_id, brand_name, bio, verified, kyc_status, created_at) on public.seller_profiles to authenticated;
grant select (user_id, brand_name, bio, verified) on public.seller_profiles to anon;
grant update (brand_name, bio) on public.seller_profiles to authenticated;

-- influencer_profiles: owner and admin read; owner edits niche and bio.
create policy "influencer_profiles: read own or admin" on public.influencer_profiles
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "influencer_profiles: update own" on public.influencer_profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.influencer_profiles from authenticated, anon;
grant update (niche, bio) on public.influencer_profiles to authenticated;

-- influencer_channels: the owner manages their own rows; admin reads all.
create policy "channels: read own or admin" on public.influencer_channels
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "channels: insert own" on public.influencer_channels
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "channels: update own" on public.influencer_channels
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "channels: delete own" on public.influencer_channels
  for delete to authenticated using (user_id = (select auth.uid()));

-- hubs and settings: everyone reads, only admins change.
create policy "hubs: read all" on public.hubs for select to anon, authenticated using (true);
create policy "hubs: admin write" on public.hubs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "settings: read all" on public.settings for select to anon, authenticated using (true);
create policy "settings: admin write" on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- audit_log: admins read. Rows are written by server code using the service role.
create policy "audit: admin read" on public.audit_log
  for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.audit_log from authenticated, anon;

-- ---------- Starting data ----------
insert into public.hubs (name, slug, description, status, sort_order) values
  ('Design & Creative', 'design-creative', 'Templates and assets for people who make things look good.', 'live', 1),
  ('Creators & Social Media', 'creators-social', 'Everything a creator needs to post better and more often.', 'live', 2),
  ('Productivity & Business', 'productivity-business', 'Notion systems, trackers, resume packs and pitch decks.', 'coming_soon', 3),
  ('Students & Exams', 'students', 'Original notes, planners and flashcards.', 'coming_soon', 4);

insert into public.settings (key, value) values
  ('platform_fee_pct', '3'),
  ('standard_platform_fee_pct', '8'),
  ('gateway_fee_est_pct', '2.36'),
  ('gateway_fee_borne_by', '"seller"'),
  ('hold_days', '14'),
  ('commission_min_pct', '10'),
  ('commission_max_pct', '40'),
  ('refund_window_days', '0');

-- ---------- Making yourself the admin ----------
-- After you sign up on the site with your own email, run this once (replace the email):
--   update public.profiles set role = 'admin', status = 'active' where email = 'you@example.com';
