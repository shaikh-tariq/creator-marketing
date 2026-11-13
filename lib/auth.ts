import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

export type Role = "seller" | "influencer" | "buyer" | "admin";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  email: string;
  status: "pending" | "active" | "suspended";
};

export const roleHome: Record<Role, string> = {
  seller: "/seller",
  influencer: "/influencer",
  buyer: "/search", // buyers land on the product browse page
  admin: "/admin",
};

// Who is logged in. Cached so the header and the page share one lookup per request.
export const getProfile = cache(async (): Promise<Profile | null> => {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  // getClaims checks the login token locally when it can, which saves a network round trip per page.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, status")
    .eq("id", userId)
    .single();
  return (data as Profile | null) ?? null;
});

// Guards a dashboard: must be logged in, not suspended, and have one of the allowed roles.
export async function requireRole(roles: Role[]): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status === "suspended") redirect("/login?error=suspended");
  if (!roles.includes(profile.role)) redirect(roleHome[profile.role]);
  return profile;
}
