-- Internal helper functions should not be callable from the public API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated; -- needed by the row-level security rules
