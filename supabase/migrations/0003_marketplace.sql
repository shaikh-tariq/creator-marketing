-- Creator Marketing: the full marketplace pipeline
-- products, files, influencer joins, submissions, links and codes, orders, ledger, reviews.
-- Sensitive steps (approvals, checkout, refunds) run through database functions so the rules
-- cannot be bypassed from the browser.

-- ---------- Types ----------
create type public.product_status as enum ('draft', 'pending_review', 'published', 'paused', 'rejected', 'archived');
create type public.join_mode as enum ('open', 'apply');
create type public.join_status as enum ('applied', 'active', 'rejected', 'paused');
create type public.submission_status as enum ('pending', 'changes_requested', 'approved', 'rejected');
create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');

-- ---------- Tables ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles (user_id) on delete cascade,
  hub_id uuid not null references public.hubs (id),
  title text not null check (char_length(title) between 3 and 120),
  slug text not null unique,
  summary text not null default '' check (char_length(summary) <= 300),
  description text not null default '',
  format text not null default '',
  includes text[] not null default '{}',
  price_paise int not null check (price_paise between 4900 and 5000000),
  commission_pct numeric(5,2) not null,
  promo_discount_pct numeric(5,2) not null default 0 check (promo_discount_pct between 0 and 50),
  join_mode public.join_mode not null default 'open',
  brief_text text not null default '',
  license_text text not null default '',
  art smallint not null default 0 check (art between 0 and 3),
  status public.product_status not null default 'draft',
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (status, hub_id);
create index on public.products (seller_id);

create table public.product_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create table public.joins (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  influencer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  status public.join_status not null,
  pitch text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, influencer_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  join_id uuid not null references public.joins (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  influencer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  platform public.social_platform not null,
  content_url text not null,
  caption text not null default '',
  disclosure_ok boolean not null default false,
  status public.submission_status not null default 'pending',
  seller_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  join_id uuid not null unique references public.joins (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  influencer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  ref_slug text not null unique,
  promo_code text not null,
  discount_pct numeric(5,2) not null default 0,
  commission_pct numeric(5,2) not null,   -- locked at approval time
  clicks int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index tracking_links_code_unique on public.tracking_links (upper(promo_code));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  buyer_id uuid not null references public.profiles (id),
  buyer_email text not null,
  seller_id uuid not null references public.profiles (id),
  influencer_id uuid references public.profiles (id),
  tracking_link_id uuid references public.tracking_links (id),
  list_price_paise int not null,
  discount_paise int not null default 0,
  net_paise int not null,
  status public.order_status not null default 'pending',
  payment_ref text,
  is_test boolean not null default false,
  terms_snapshot jsonb not null,
  refund_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders (buyer_id);
create index on public.orders (seller_id);
create index on public.orders (influencer_id);

-- Append-only money record. A refund adds negative rows; nothing is edited.
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  account_type text not null check (account_type in ('platform', 'seller', 'influencer', 'gateway')),
  account_id uuid references public.profiles (id),
  kind text not null check (kind in ('platform_fee', 'influencer_commission', 'seller_earning', 'gateway_fee', 'refund_reversal')),
  amount_paise int not null,
  available_at timestamptz not null,
  reverses_id uuid references public.ledger_entries (id),
  created_at timestamptz not null default now()
);
create index on public.ledger_entries (account_id);
create index on public.ledger_entries (order_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  order_id uuid not null unique references public.orders (id),
  buyer_id uuid not null references public.profiles (id),
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
create trigger joins_updated before update on public.joins for each row execute function public.set_updated_at();
create trigger submissions_updated before update on public.submissions for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

-- ---------- Small helpers ----------
create or replace function public._setting_num(k text)
returns numeric language sql stable security definer set search_path = '' as $$
  select (value #>> '{}')::numeric from public.settings where key = k;
$$;

create or replace function public._setting_text(k text)
returns text language sql stable security definer set search_path = '' as $$
  select value #>> '{}' from public.settings where key = k;
$$;

-- Role of the logged-in user, or null if logged out or suspended.
create or replace function public.my_role()
returns public.user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid()) and status <> 'suspended';
$$;

-- Display names only (no emails), so sellers and influencers can see who they work with.
create view public.profile_names as select id, full_name, role from public.profiles;

-- Builds the URL slug and checks the commission against the admin's limits.
create or replace function public.products_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.slug := trim(both '-' from regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g'))
                || '-' || substr(new.id::text, 1, 6);
  end if;
  if new.commission_pct < public._setting_num('commission_min_pct')
     or new.commission_pct > public._setting_num('commission_max_pct') then
    raise exception 'Commission must be between % and % percent',
      public._setting_num('commission_min_pct'), public._setting_num('commission_max_pct');
  end if;
  return new;
end;
$$;
create trigger products_before_write before insert or update on public.products
  for each row execute function public.products_before_write();

-- ---------- Seller actions ----------
create or replace function public.seller_product_action(p_product uuid, p_action text)
returns void language plpgsql security definer set search_path = '' as $$
declare pr public.products;
begin
  select * into pr from public.products where id = p_product and seller_id = (select auth.uid());
  if not found or public.my_role() is distinct from 'seller' then raise exception 'Product not found'; end if;

  if p_action = 'submit' then
    if pr.status not in ('draft', 'rejected') then raise exception 'Only drafts can be submitted'; end if;
    if not exists (select 1 from public.product_files where product_id = pr.id) then
      raise exception 'Upload the product file before submitting';
    end if;
    update public.products set status = 'pending_review', rejected_reason = null where id = pr.id;
  elsif p_action = 'pause' then
    if pr.status <> 'published' then raise exception 'Only live products can be paused'; end if;
    update public.products set status = 'paused' where id = pr.id;
  elsif p_action = 'resume' then
    if pr.status <> 'paused' then raise exception 'Only paused products can be resumed'; end if;
    update public.products set status = 'published' where id = pr.id;
  elsif p_action = 'archive' then
    update public.products set status = 'archived' where id = pr.id;
  else
    raise exception 'Unknown action';
  end if;
end;
$$;

create or replace function public.seller_set_join(p_join uuid, p_status public.join_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status = 'applied' then raise exception 'Not allowed'; end if;
  update public.joins set status = p_status where id = p_join and seller_id = (select auth.uid());
  if not found then raise exception 'Request not found'; end if;
  update public.tracking_links set active = (p_status = 'active') where join_id = p_join;
end;
$$;

-- Approve, request changes or reject a post. Approval creates the tracked link and promo code.
create or replace function public.review_submission(p_submission uuid, p_decision public.submission_status, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  s public.submissions; pr public.products; base text; code text; tries int := 0;
begin
  if p_decision = 'pending' then raise exception 'Not allowed'; end if;
  select * into s from public.submissions where id = p_submission and seller_id = (select auth.uid());
  if not found then raise exception 'Submission not found'; end if;
  if s.status <> 'pending' then raise exception 'This post has already been reviewed'; end if;

  update public.submissions set status = p_decision, seller_note = nullif(trim(coalesce(p_note, '')), '')
  where id = s.id;

  if p_decision = 'approved' and not exists (select 1 from public.tracking_links where join_id = s.join_id) then
    select * into pr from public.products where id = s.product_id;
    select upper(left(regexp_replace(split_part(coalesce(full_name, ''), ' ', 1), '[^A-Za-z]', '', 'g'), 8))
      into base from public.profiles where id = s.influencer_id;
    if coalesce(base, '') = '' then base := 'CREATOR'; end if;
    loop
      code := base || (100 + floor(random() * 900))::int::text;
      exit when not exists (select 1 from public.tracking_links where upper(promo_code) = code);
      tries := tries + 1;
      if tries > 20 then code := base || substr(md5(random()::text), 1, 6); exit; end if;
    end loop;
    insert into public.tracking_links (join_id, product_id, influencer_id, seller_id, ref_slug, promo_code, discount_pct, commission_pct)
    values (s.join_id, s.product_id, s.influencer_id, s.seller_id,
            substr(md5(random()::text || clock_timestamp()::text), 1, 8), code, pr.promo_discount_pct, pr.commission_pct);
  end if;
end;
$$;

-- ---------- Influencer actions ----------
create or replace function public.join_product(p_product uuid, p_pitch text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare pr public.products; jid uuid;
begin
  if public.my_role() is distinct from 'influencer' then raise exception 'Only influencer accounts can join products'; end if;
  select * into pr from public.products where id = p_product and status = 'published';
  if not found then raise exception 'This product is not available'; end if;
  insert into public.joins (product_id, influencer_id, seller_id, status, pitch)
  values (pr.id, (select auth.uid()), pr.seller_id,
          case when pr.join_mode = 'open' then 'active'::public.join_status else 'applied'::public.join_status end,
          left(coalesce(p_pitch, ''), 500))
  on conflict (product_id, influencer_id) do nothing
  returning id into jid;
  if jid is null then raise exception 'You have already joined this product'; end if;
  return jid;
end;
$$;

create or replace function public.submit_content(p_join uuid, p_platform public.social_platform, p_url text, p_caption text, p_disclosure boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare j public.joins; sid uuid;
begin
  select * into j from public.joins where id = p_join and influencer_id = (select auth.uid());
  if not found then raise exception 'Join not found'; end if;
  if j.status <> 'active' then raise exception 'The seller has not accepted you on this product yet'; end if;
  if not coalesce(p_disclosure, false) then raise exception 'Tick the paid-partnership disclosure to submit'; end if;
  if p_url !~* '^https?://' then raise exception 'Enter the full link to your post, starting with https://'; end if;
  if exists (select 1 from public.submissions where join_id = j.id and status = 'pending') then
    raise exception 'You already have a post waiting for review on this product';
  end if;
  insert into public.submissions (join_id, product_id, influencer_id, seller_id, platform, content_url, caption, disclosure_ok)
  values (j.id, j.product_id, j.influencer_id, j.seller_id, p_platform, left(p_url, 500), left(coalesce(p_caption, ''), 2000), true)
  returning id into sid;
  return sid;
end;
$$;

-- ---------- Links ----------
-- Called when someone opens a creator's link. Counts the click and says which product to show.
create or replace function public.resolve_ref(p_ref text)
returns text language plpgsql security definer set search_path = '' as $$
declare s text;
begin
  update public.tracking_links t set clicks = clicks + 1
  from public.products p
  where t.ref_slug = p_ref and t.active and p.id = t.product_id
  returning p.slug into s;
  return s;
end;
$$;

-- ---------- Checkout ----------
-- Works out the price and the split for one purchase. Promo code beats link; your own code never counts.
create or replace function public._order_terms(p_product uuid, p_code text, p_ref text, p_buyer uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  pr public.products; lk public.tracking_links; used_code boolean := false; code_error text;
  fee numeric := public._setting_num('platform_fee_pct');
  gw numeric := public._setting_num('gateway_fee_est_pct');
  borne text := public._setting_text('gateway_fee_borne_by');
  discount int := 0; net int; pf int; ic int := 0; gf int; se int;
begin
  select * into pr from public.products where id = p_product and status = 'published';
  if not found then raise exception 'This product is not available'; end if;

  if coalesce(trim(p_code), '') <> '' then
    select * into lk from public.tracking_links
      where upper(promo_code) = upper(trim(p_code)) and product_id = pr.id and active;
    if not found then
      code_error := 'That promo code is not valid for this product';
    elsif p_buyer is not null and lk.influencer_id = p_buyer then
      code_error := 'You cannot use your own promo code';
      lk := null;
    else
      used_code := true;
    end if;
  end if;

  if lk.id is null and coalesce(p_ref, '') <> '' then
    select * into lk from public.tracking_links where ref_slug = p_ref and product_id = pr.id and active;
    if found and p_buyer is not null and lk.influencer_id = p_buyer then lk := null; end if;
  end if;

  if used_code then discount := round(pr.price_paise * lk.discount_pct / 100.0); end if;
  net := pr.price_paise - discount;
  pf := round(net * fee / 100.0);
  if lk.id is not null then ic := round(net * lk.commission_pct / 100.0); end if;
  gf := round(net * gw / 100.0);
  se := net - pf - ic - (case when borne = 'seller' then gf else 0 end);
  if se < 0 then raise exception 'This product''s terms do not add up. Please contact support.'; end if;

  return jsonb_build_object(
    'product_id', pr.id, 'seller_id', pr.seller_id,
    'list_price_paise', pr.price_paise, 'discount_paise', discount, 'net_paise', net,
    'platform_fee_paise', pf, 'influencer_commission_paise', ic, 'gateway_fee_paise', gf, 'seller_earning_paise', se,
    'platform_fee_pct', fee, 'gateway_fee_pct', gw, 'gateway_fee_borne_by', borne,
    'commission_pct', case when lk.id is not null then lk.commission_pct else 0 end,
    'discount_pct', case when used_code then lk.discount_pct else 0 end,
    'tracking_link_id', lk.id, 'influencer_id', lk.influencer_id,
    'promo_code', case when used_code then lk.promo_code else null end,
    'hold_days', public._setting_num('hold_days'),
    'code_error', code_error);
end;
$$;

-- Price preview for the checkout page (hides who the seller and influencer are).
create or replace function public.checkout_quote(p_product uuid, p_code text, p_ref text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select public._order_terms(p_product, p_code, p_ref, (select auth.uid()))
         - 'seller_id' - 'influencer_id' - 'tracking_link_id';
$$;

-- TEST-MODE purchase: behaves exactly like a paid order but no money moves.
-- It is switched off automatically when settings.payments_mode is changed from "test".
create or replace function public.place_test_order(p_product uuid, p_code text, p_ref text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid()); me public.profiles; t jsonb; oid uuid;
  avail timestamptz; inf uuid;
begin
  if public._setting_text('payments_mode') <> 'test' then
    raise exception 'Test checkout is switched off';
  end if;
  select * into me from public.profiles where id = uid and status <> 'suspended';
  if not found then raise exception 'Please log in to buy'; end if;

  t := public._order_terms(p_product, p_code, p_ref, uid);
  if t ->> 'code_error' is not null then raise exception '%', t ->> 'code_error'; end if;
  if (t ->> 'seller_id')::uuid = uid then raise exception 'You cannot buy your own product'; end if;
  if exists (select 1 from public.orders where product_id = p_product and buyer_id = uid and status = 'paid') then
    raise exception 'You already own this product. It is in your library.';
  end if;

  inf := nullif(t ->> 'influencer_id', '')::uuid;
  avail := now() + make_interval(days => (t ->> 'hold_days')::int);

  insert into public.orders (product_id, buyer_id, buyer_email, seller_id, influencer_id, tracking_link_id,
    list_price_paise, discount_paise, net_paise, status, payment_ref, is_test, terms_snapshot)
  values (p_product, uid, me.email, (t ->> 'seller_id')::uuid, inf, nullif(t ->> 'tracking_link_id', '')::uuid,
    (t ->> 'list_price_paise')::int, (t ->> 'discount_paise')::int, (t ->> 'net_paise')::int,
    'paid', 'TEST-' || upper(substr(md5(random()::text), 1, 10)), true, t)
  returning id into oid;

  insert into public.ledger_entries (order_id, account_type, account_id, kind, amount_paise, available_at) values
    (oid, 'platform', null, 'platform_fee', (t ->> 'platform_fee_paise')::int, avail),
    (oid, 'gateway', null, 'gateway_fee', (t ->> 'gateway_fee_paise')::int, avail),
    (oid, 'seller', (t ->> 'seller_id')::uuid, 'seller_earning', (t ->> 'seller_earning_paise')::int, avail);
  if inf is not null then
    insert into public.ledger_entries (order_id, account_type, account_id, kind, amount_paise, available_at)
    values (oid, 'influencer', inf, 'influencer_commission', (t ->> 'influencer_commission_paise')::int, avail);
  end if;
  return oid;
end;
$$;

-- ---------- Admin actions ----------
create or replace function public.admin_review_product(p_product uuid, p_approve boolean, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare pr public.products;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into pr from public.products where id = p_product;
  if not found then raise exception 'Product not found'; end if;
  if p_approve then
    if not exists (select 1 from public.profiles where id = pr.seller_id and status = 'active') then
      raise exception 'Approve the seller''s account first';
    end if;
    update public.products set status = 'published', rejected_reason = null where id = pr.id;
  else
    update public.products set status = 'rejected',
      rejected_reason = coalesce(nullif(trim(p_reason), ''), 'Did not meet the listing guidelines') where id = pr.id;
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), case when p_approve then 'product_approved' else 'product_rejected' end,
          'product', pr.id::text, jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function public.admin_set_user_status(p_user uuid, p_status public.account_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_user = (select auth.uid()) then raise exception 'You cannot change your own status'; end if;
  update public.profiles set status = p_status where id = p_user;
  insert into public.audit_log (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'user_status', 'profile', p_user::text, jsonb_build_object('status', p_status));
end;
$$;

-- Full refund: marks the order refunded and adds negative ledger rows that cancel the originals.
create or replace function public.admin_refund_order(p_order uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.orders set status = 'refunded', refund_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_order and status = 'paid';
  if not found then raise exception 'Only paid orders can be refunded'; end if;
  insert into public.ledger_entries (order_id, account_type, account_id, kind, amount_paise, available_at, reverses_id)
  select order_id, account_type, account_id, 'refund_reversal', -amount_paise, available_at, id
  from public.ledger_entries where order_id = p_order and reverses_id is null;
  insert into public.audit_log (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'order_refunded', 'order', p_order::text, jsonb_build_object('reason', p_reason));
end;
$$;

-- Who may call what
revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_ref(text) to anon, authenticated;
grant execute on function public.checkout_quote(uuid, text, text) to anon, authenticated;
revoke execute on function public._order_terms(uuid, text, text, uuid) from authenticated;
revoke execute on function public._setting_num(text) from authenticated;
revoke execute on function public._setting_text(text) from authenticated;
revoke execute on function public.products_before_write() from authenticated;
revoke execute on function public.handle_new_user() from authenticated;

-- ---------- Row-level security ----------
alter table public.products enable row level security;
alter table public.product_files enable row level security;
alter table public.joins enable row level security;
alter table public.submissions enable row level security;
alter table public.tracking_links enable row level security;
alter table public.orders enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.reviews enable row level security;

-- products
create policy "products: public reads live" on public.products for select to anon using (status = 'published');
create policy "products: signed-in read" on public.products for select to authenticated using (
  status = 'published' or seller_id = (select auth.uid()) or public.is_admin()
  or exists (select 1 from public.orders o where o.product_id = products.id and o.buyer_id = (select auth.uid()))
  or exists (select 1 from public.joins j where j.product_id = products.id and j.influencer_id = (select auth.uid()))
);
create policy "products: seller creates own" on public.products for insert to authenticated
  with check (seller_id = (select auth.uid()) and public.my_role() = 'seller');
create policy "products: seller edits own" on public.products for update to authenticated
  using (seller_id = (select auth.uid()) and public.my_role() = 'seller') with check (seller_id = (select auth.uid()));
revoke insert, update, delete on public.products from anon, authenticated;
grant insert (seller_id, hub_id, title, summary, description, format, includes, price_paise, commission_pct,
              promo_discount_pct, join_mode, brief_text, license_text, art) on public.products to authenticated;
grant update (hub_id, title, summary, description, format, includes, price_paise, commission_pct,
              promo_discount_pct, join_mode, brief_text, license_text, art) on public.products to authenticated;

-- product files
create policy "files: read" on public.product_files for select to authenticated using (
  seller_id = (select auth.uid()) or public.is_admin()
  or exists (select 1 from public.orders o where o.product_id = product_files.product_id
             and o.buyer_id = (select auth.uid()) and o.status = 'paid')
);
create policy "files: seller adds" on public.product_files for insert to authenticated with check (
  seller_id = (select auth.uid())
  and exists (select 1 from public.products p where p.id = product_id and p.seller_id = (select auth.uid()))
);
create policy "files: seller removes" on public.product_files for delete to authenticated
  using (seller_id = (select auth.uid()));
revoke all on public.product_files from anon;
revoke update on public.product_files from authenticated;

-- joins, submissions, links: the influencer, the seller and admins
create policy "joins: read" on public.joins for select to authenticated
  using (influencer_id = (select auth.uid()) or seller_id = (select auth.uid()) or public.is_admin());
create policy "submissions: read" on public.submissions for select to authenticated
  using (influencer_id = (select auth.uid()) or seller_id = (select auth.uid()) or public.is_admin());
create policy "links: read" on public.tracking_links for select to authenticated
  using (influencer_id = (select auth.uid()) or seller_id = (select auth.uid()) or public.is_admin());
revoke all on public.joins, public.submissions, public.tracking_links from anon;
revoke insert, update, delete on public.joins, public.submissions, public.tracking_links from authenticated;

-- orders and ledger
create policy "orders: read" on public.orders for select to authenticated using (
  buyer_id = (select auth.uid()) or seller_id = (select auth.uid())
  or influencer_id = (select auth.uid()) or public.is_admin());
create policy "ledger: read" on public.ledger_entries for select to authenticated
  using (account_id = (select auth.uid()) or public.is_admin());
revoke all on public.orders, public.ledger_entries from anon;
revoke insert, update, delete on public.orders, public.ledger_entries from authenticated;

-- reviews: anyone reads, only a buyer with a paid order writes (one per order)
create policy "reviews: read" on public.reviews for select to anon, authenticated using (true);
create policy "reviews: buyer writes" on public.reviews for insert to authenticated with check (
  buyer_id = (select auth.uid())
  and exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = (select auth.uid())
              and o.product_id = reviews.product_id and o.status = 'paid'));
revoke insert, update, delete on public.reviews from anon;
revoke update, delete on public.reviews from authenticated;

-- sellers can see the channels of influencers who joined their products
create policy "channels: seller of a joined product reads" on public.influencer_channels for select to authenticated
  using (exists (select 1 from public.joins j where j.influencer_id = influencer_channels.user_id
                 and j.seller_id = (select auth.uid())));

revoke all on public.profile_names from anon;
grant select on public.profile_names to authenticated;

-- ---------- File storage (private) ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('product-files', 'product-files', false, 52428800)
on conflict (id) do nothing;

create policy "product files: seller uploads to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "product files: seller deletes own" on storage.objects for delete to authenticated
  using (bucket_id = 'product-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "product files: owner, admin or paid buyer downloads" on storage.objects for select to authenticated
  using (bucket_id = 'product-files' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
    or exists (select 1 from public.product_files pf join public.orders o on o.product_id = pf.product_id
               where pf.storage_path = storage.objects.name and o.buyer_id = (select auth.uid()) and o.status = 'paid')));

insert into public.settings (key, value) values ('payments_mode', '"test"') on conflict (key) do nothing;
