-- Post previews: an influencer can attach a screenshot of the post and report its impressions.
-- (Applied to the live database on 13 Nov 2026. Kept here so the database can be rebuilt from scratch.)
alter table public.submissions add column image_path text, add column impressions integer check (impressions is null or impressions >= 0);

drop function public.submit_content(uuid, public.social_platform, text, text, boolean);

create or replace function public.submit_content(p_join uuid, p_platform public.social_platform, p_url text, p_caption text, p_disclosure boolean, p_image text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare j public.joins; sid uuid; img text := nullif(trim(coalesce(p_image, '')), '');
begin
  select * into j from public.joins where id = p_join and influencer_id = (select auth.uid());
  if not found then raise exception 'Join not found'; end if;
  if j.status <> 'active' then raise exception 'The seller has not accepted you on this product yet'; end if;
  if not coalesce(p_disclosure, false) then raise exception 'Tick the paid-partnership disclosure to submit'; end if;
  if p_url !~* '^https?://' then raise exception 'Enter the full link to your post, starting with https://'; end if;
  if img is not null and split_part(img, '/', 1) <> (select auth.uid())::text then raise exception 'Invalid image'; end if;
  if exists (select 1 from public.submissions where join_id = j.id and status = 'pending') then
    raise exception 'You already have a post waiting for review on this product';
  end if;
  insert into public.submissions (join_id, product_id, influencer_id, seller_id, platform, content_url, caption, disclosure_ok, image_path)
  values (j.id, j.product_id, j.influencer_id, j.seller_id, p_platform, left(p_url, 500), left(coalesce(p_caption, ''), 2000), true, img)
  returning id into sid;
  return sid;
end;
$$;

-- Impressions are typed in by the influencer (the platforms do not share them with us yet).
create or replace function public.set_post_impressions(p_submission uuid, p_impressions integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_impressions is null or p_impressions < 0 or p_impressions > 1000000000 then raise exception 'Enter a number of impressions'; end if;
  update public.submissions set impressions = p_impressions
  where id = p_submission and influencer_id = (select auth.uid());
  if not found then raise exception 'Post not found'; end if;
end;
$$;

revoke execute on function public.submit_content(uuid, public.social_platform, text, text, boolean, text) from public, anon;
revoke execute on function public.set_post_impressions(uuid, integer) from public, anon;
grant execute on function public.submit_content(uuid, public.social_platform, text, text, boolean, text) to authenticated;
grant execute on function public.set_post_impressions(uuid, integer) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "post images: influencer uploads to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "post images: influencer deletes own" on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
