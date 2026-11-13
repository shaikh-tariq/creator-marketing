-- 13 Nov 2026: draft-first post flow, influencer details for sellers, avatars, GST number,
-- banning and deleting accounts.

-- ---------- Posts: draft first, live link after approval ----------
alter table public.submissions alter column content_url drop not null;
alter table public.submissions add column published_at timestamptz;

drop function public.submit_content(uuid, public.social_platform, text, text, boolean, text);

-- The influencer sends a draft (screenshot and/or caption). No live link yet.
create or replace function public.submit_content(p_join uuid, p_platform public.social_platform, p_caption text, p_disclosure boolean, p_image text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare j public.joins; sid uuid; img text := nullif(trim(coalesce(p_image, '')), ''); cap text := trim(coalesce(p_caption, ''));
begin
  select * into j from public.joins where id = p_join and influencer_id = (select auth.uid());
  if not found then raise exception 'Join not found'; end if;
  if j.status <> 'active' then raise exception 'The seller has not accepted you on this product yet'; end if;
  if not coalesce(p_disclosure, false) then raise exception 'Tick the paid-partnership disclosure to submit'; end if;
  if img is null and char_length(cap) < 10 then raise exception 'Add a screenshot of your draft or write the caption, so the seller has something to review'; end if;
  if img is not null and split_part(img, '/', 1) <> (select auth.uid())::text then raise exception 'Invalid image'; end if;
  if exists (select 1 from public.submissions where join_id = j.id and status in ('pending', 'changes_requested')) then
    raise exception 'You already have a draft in review for this product. Edit that one instead.';
  end if;
  insert into public.submissions (join_id, product_id, influencer_id, seller_id, platform, caption, disclosure_ok, image_path)
  values (j.id, j.product_id, j.influencer_id, j.seller_id, p_platform, left(cap, 2000), true, img)
  returning id into sid;
  return sid;
end;
$$;

-- After the seller asks for changes, the influencer edits the same draft and sends it back.
create or replace function public.resubmit_content(p_submission uuid, p_platform public.social_platform, p_caption text, p_image text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare img text := nullif(trim(coalesce(p_image, '')), '');
begin
  if img is not null and split_part(img, '/', 1) <> (select auth.uid())::text then raise exception 'Invalid image'; end if;
  update public.submissions
  set platform = p_platform, caption = left(trim(coalesce(p_caption, '')), 2000),
      image_path = coalesce(img, image_path), status = 'pending'
  where id = p_submission and influencer_id = (select auth.uid()) and status = 'changes_requested';
  if not found then raise exception 'This draft cannot be edited right now'; end if;
end;
$$;

-- Once approved and posted, the influencer adds the link to the live post.
create or replace function public.publish_post(p_submission uuid, p_url text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(p_url, '') !~* '^https?://' then raise exception 'Enter the full link to your live post, starting with https://'; end if;
  update public.submissions set content_url = left(p_url, 500), published_at = now()
  where id = p_submission and influencer_id = (select auth.uid()) and status = 'approved';
  if not found then raise exception 'Only approved posts can be published'; end if;
end;
$$;

-- ---------- Sellers can vet an influencer before accepting ----------
create policy "influencer_profiles: seller of a join reads" on public.influencer_profiles for select to authenticated
  using (exists (select 1 from public.joins j where j.influencer_id = influencer_profiles.user_id and j.seller_id = (select auth.uid())));

-- Track record across the whole marketplace (counts only, no private details).
create or replace function public.influencer_card(p_influencer uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.is_admin() or exists (select 1 from public.joins where influencer_id = p_influencer and seller_id = (select auth.uid()))) then
    raise exception 'Not allowed';
  end if;
  return jsonb_build_object(
    'member_since', (select created_at from public.profiles where id = p_influencer),
    'products_promoted', (select count(*) from public.joins where influencer_id = p_influencer and status = 'active'),
    'approved_posts', (select count(*) from public.submissions where influencer_id = p_influencer and status = 'approved'),
    'rejected_posts', (select count(*) from public.submissions where influencer_id = p_influencer and status = 'rejected'),
    'sales', (select count(*) from public.orders where influencer_id = p_influencer and status = 'paid'));
end;
$$;

-- ---------- Profile pictures ----------
drop view public.profile_names;
create view public.profile_names as select id, full_name, role, avatar_url, created_at from public.profiles;
revoke all on public.profile_names from anon;
grant select on public.profile_names to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
create policy "avatars: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- GST number on the seller, shown on receipts ----------
alter table public.seller_profiles add column gstin text check (gstin is null or gstin ~ '^[0-9A-Z]{15}$');
grant select (gstin) on public.seller_profiles to authenticated;
grant update (gstin) on public.seller_profiles to authenticated;
insert into public.settings (key, value) values ('gst_rate_pct', '18') on conflict (key) do nothing;

-- ---------- Banning and deleting accounts ----------
-- Gmail ignores dots and +tags, so they are stripped before comparing.
create or replace function public._norm_email(e text)
returns text language sql immutable set search_path = '' as $$
  select case
    when split_part(lower(trim(e)), '@', 2) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(trim(e)), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else lower(trim(e))
  end;
$$;

create table public.banned_emails (
  email text primary key,          -- normalised
  original_email text not null,
  reason text,
  banned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.banned_emails enable row level security;
create policy "bans: admin reads" on public.banned_emails for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.banned_emails from anon, authenticated;
revoke all on public.banned_emails from anon;

-- A banned address cannot create a new account in any role.
create or replace function public.block_banned_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.banned_emails where email = public._norm_email(new.email)) then
    raise exception 'This email address cannot be used on Creator Marketing';
  end if;
  return new;
end;
$$;
create trigger block_banned_signup before insert on auth.users
  for each row execute function public.block_banned_signup();

create or replace function public.admin_ban_user(p_user uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare em text;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_user = (select auth.uid()) then raise exception 'You cannot ban yourself'; end if;
  select email into em from public.profiles where id = p_user;
  if em is null then raise exception 'User not found'; end if;
  insert into public.banned_emails (email, original_email, reason, banned_by)
  values (public._norm_email(em), em, nullif(trim(coalesce(p_reason, '')), ''), (select auth.uid()))
  on conflict (email) do nothing;
  update public.profiles set status = 'suspended' where id = p_user;
  begin
    delete from auth.sessions where user_id = p_user;  -- log them out everywhere
  exception when others then null;
  end;
  insert into public.audit_log (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'user_banned', 'profile', p_user::text, jsonb_build_object('email', em, 'reason', p_reason));
end;
$$;

create or replace function public.admin_unban_email(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  delete from public.banned_emails where email = p_email;
  insert into public.audit_log (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'user_unbanned', 'email', p_email, '{}'::jsonb);
end;
$$;

-- Deleting removes the login and everything the person created, so the email can sign up fresh.
-- Accounts with orders on record cannot be deleted, because sales records have to be kept.
create or replace function public.admin_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare em text;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_user = (select auth.uid()) then raise exception 'You cannot delete yourself'; end if;
  select email into em from public.profiles where id = p_user;
  if em is null then raise exception 'User not found'; end if;
  if exists (select 1 from public.orders where buyer_id = p_user or seller_id = p_user or influencer_id = p_user) then
    raise exception 'This account has orders on record, which must be kept. Suspend or ban it instead.';
  end if;
  update public.audit_log set actor_id = null where actor_id = p_user;
  insert into public.audit_log (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'user_deleted', 'profile', p_user::text, jsonb_build_object('email', em));
  delete from auth.users where id = p_user;
end;
$$;

revoke execute on function public.submit_content(uuid, public.social_platform, text, boolean, text) from public, anon;
revoke execute on function public.resubmit_content(uuid, public.social_platform, text, text) from public, anon;
revoke execute on function public.publish_post(uuid, text) from public, anon;
revoke execute on function public.influencer_card(uuid) from public, anon;
revoke execute on function public.admin_ban_user(uuid, text) from public, anon;
revoke execute on function public.admin_unban_email(text) from public, anon;
revoke execute on function public.admin_delete_user(uuid) from public, anon;
revoke execute on function public.block_banned_signup() from public, anon, authenticated;
revoke execute on function public._norm_email(text) from public, anon, authenticated;
grant execute on function public.submit_content(uuid, public.social_platform, text, boolean, text) to authenticated;
grant execute on function public.resubmit_content(uuid, public.social_platform, text, text) to authenticated;
grant execute on function public.publish_post(uuid, text) to authenticated;
grant execute on function public.influencer_card(uuid) to authenticated;
grant execute on function public.admin_ban_user(uuid, text) to authenticated;
grant execute on function public.admin_unban_email(text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
