import { DashLayout } from "@/components/dash-layout";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();
  const [sellers, products] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "seller").eq("status", "pending"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
  ]);

  const waiting = (sellers.count ?? 0) + (products.count ?? 0);

  return (
    <DashLayout
      roleLabel="Admin"
      profile={profile}
      alert={waiting > 0 ? { href: "/admin/review", label: `${waiting} waiting in the review queue` } : null}
    >
      {children}
    </DashLayout>
  );
}
