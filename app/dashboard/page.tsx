import { redirect } from "next/navigation";
import { getProfile, roleHome } from "@/lib/auth";

// Sends each person to the dashboard for their role.
export default async function DashboardRedirect() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  redirect(roleHome[profile.role]);
}
