-- Seller-uploaded cover images. A product can now carry its own image; when there is none the
-- CSS cover style (products.art) is shown as before.
-- Safe to run more than once.

alter table public.products add column if not exists cover_path text;

-- The cover must live in the seller's own folder: <seller id>/<file>.
alter table public.products drop constraint if exists products_cover_path_owner;
alter table public.products add constraint products_cover_path_owner
  check (cover_path is null or split_part(cover_path, '/', 1) = seller_id::text);

-- Sellers may only write the columns granted to them (see 0003), so the new column needs its own grants.
grant insert (cover_path) on public.products to authenticated;
grant update (cover_path) on public.products to authenticated;

-- Public bucket (covers are shown on the open shop pages). 5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-covers', 'product-covers', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

drop policy if exists "product covers: seller uploads to own folder" on storage.objects;
create policy "product covers: seller uploads to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-covers' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "product covers: seller deletes own" on storage.objects;
create policy "product covers: seller deletes own" on storage.objects for delete to authenticated
  using (bucket_id = 'product-covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
