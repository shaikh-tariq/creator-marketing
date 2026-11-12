"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "./config";

// Supabase client for the browser. Used only for file uploads (large files go straight to storage).
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
