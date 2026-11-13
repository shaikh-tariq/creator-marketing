import { DashLayout } from "@/components/dash-layout";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["seller"]);
  const supabase = await createClient();
  const [subs, joins] = await Promise.all([
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).eq("status", "pending"),
    supabase.from("joins").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).eq("status", "applied"),
  ]);
  const waiting = (subs.count ?? 0) + (joins.count ?? 0);

  return (
    <DashLayout
      roleLabel="Seller"
      profile={profile}
      alert={waiting > 0 ? { href: "/seller/submissions", label: `${waiting} waiting for your review` } : null}
    >
      {children}
    </DashLayout>
  );
}
