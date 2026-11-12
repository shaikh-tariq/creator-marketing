import { redirect } from "next/navigation";
import { getProfile, roleHome } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/config";

// Sends each person to the dashboard for their role.
export default async function DashboardRedirect() {
  if (!supabaseConfigured) redirect("/seller"); // preview mode
  const profile = await getProfile();
  if (!profile) redirect("/login");
  redirect(roleHome[profile.role]);
}
