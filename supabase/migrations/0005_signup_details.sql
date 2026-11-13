-- Sign-up now collects a brand name (sellers) and channels, niche and audience size (influencers).
-- The details travel with the sign-up and this function files them when the account is created.
-- (Applied to the live database on 13 Nov 2026.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested text := meta ->> 'role';
  safe_role public.user_role := 'buyer';
begin
  if requested in ('seller', 'influencer', 'buyer') then
    safe_role := requested::public.user_role;
  end if;

  insert into public.profiles (id, role, full_name, email, status, consent_at)
  values (
    new.id, safe_role, nullif(left(trim(coalesce(meta ->> 'full_name', '')), 80), ''), new.email,
    case when safe_role = 'seller' then 'pending'::public.account_status else 'active'::public.account_status end,
    now()
  );

  if safe_role = 'seller' then
    insert into public.seller_profiles (user_id, brand_name)
    values (new.id, nullif(left(trim(coalesce(meta ->> 'brand_name', '')), 60), ''));
  elsif safe_role = 'influencer' then
    insert into public.influencer_profiles (user_id, niche)
    values (new.id, nullif(left(trim(coalesce(meta ->> 'niche', '')), 80), ''));
    begin
      if jsonb_typeof(meta -> 'channels') = 'array' then
        insert into public.influencer_channels (user_id, platform, profile_url, follower_range)
        select new.id, (c ->> 'platform')::public.social_platform, left(c ->> 'url', 300),
               nullif(left(coalesce(meta ->> 'follower_range', ''), 30), '')
        from jsonb_array_elements(meta -> 'channels') c
        where c ->> 'platform' in ('instagram', 'linkedin', 'pinterest', 'x', 'facebook')
          and c ->> 'url' ~* '^https?://'
        on conflict (user_id, platform) do nothing;
      end if;
    exception when others then
      null; -- never block a sign-up because a channel link was malformed
    end;
  end if;

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
