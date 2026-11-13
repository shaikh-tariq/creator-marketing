import { headers } from "next/headers";
import { supabaseConfigured, supabaseUrl } from "./supabase/config";
import { createClient } from "./supabase/server";
import type { LedgerEntry, Product } from "./types";

export const PRODUCT_COLS =
  "id, seller_id, hub_id, title, slug, summary, description, format, includes, price_paise, commission_pct, promo_discount_pct, join_mode, brief_text, license_text, art, cover_path, status, rejected_reason, created_at, seller_profiles(brand_name), hubs!inner(name, slug)";

// Live products for the public pages.
export async function listProducts(opts: { hubSlug?: string; q?: string; limit?: number } = {}): Promise<Product[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  let query = supabase.from("products").select(PRODUCT_COLS).eq("status", "published");
  if (opts.hubSlug) query = query.eq("hubs.slug", opts.hubSlug);
  if (opts.q) query = query.ilike("title", `%${opts.q.replace(/[%_]/g, "")}%`);
  const { data } = await query.order("created_at", { ascending: false }).limit(opts.limit ?? 60);
  return (data ?? []) as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_COLS).eq("slug", slug).maybeSingle();
  return (data as unknown as Product | null) ?? null;
}

// Display names for a list of user ids (no emails).
export async function nameMap(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("profile_names").select("id, full_name").in("id", unique);
  return Object.fromEntries((data ?? []).map((r: { id: string; full_name: string | null }) => [r.id, r.full_name ?? "Unnamed"]));
}

// Splits ledger rows into money still on hold and money past the hold period.
// Refund rows are negative and carry the same date, so they cancel the original automatically.
export function balances(entries: LedgerEntry[]) {
  const now = Date.now();
  let onHold = 0;
  let released = 0;
  for (const e of entries) {
    if (new Date(e.available_at).getTime() > now) onHold += e.amount_paise;
    else released += e.amount_paise;
  }
  return { onHold, released, total: onHold + released };
}

export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

// Public address of a post screenshot an influencer uploaded.
export function postImageUrl(path: string | null) {
  return path ? `${supabaseUrl}/storage/v1/object/public/post-images/${path}` : null;
}
