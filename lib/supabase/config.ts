// Supabase connection details come from environment variables (see .env.example).
// Until they are set, the site runs in "preview mode": public pages work, sign-up is switched off.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
