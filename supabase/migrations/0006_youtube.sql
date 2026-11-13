-- YouTube added as a sixth platform. (Applied to the live database on 13 Nov 2026.)
alter type public.social_platform add value if not exists 'youtube';
-- handle_new_user() was updated at the same time to accept 'youtube' in the sign-up channel list:
-- in 0005, the platform list in that function now reads
--   ('instagram', 'youtube', 'linkedin', 'pinterest', 'x', 'facebook')
