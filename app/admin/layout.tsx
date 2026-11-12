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

  return (
    <DashLayout
      roleLabel="Admin"
      profile={profile}
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/review", label: "Review queue", count: (sellers.count ?? 0) + (products.count ?? 0) },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/orders", label: "Orders & refunds" },
        { href: "/admin/ledger", label: "Ledger" },
        { href: "/admin/settings", label: "Settings" },
      ]}
    >
      {children}
    </DashLayout>
  );
}
