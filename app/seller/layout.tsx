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
      nav={[
        { href: "/seller", label: "Overview" },
        { href: "/seller/products", label: "Products" },
        { href: "/seller/submissions", label: "Influencers & posts", count: waiting },
        { href: "/seller/earnings", label: "Orders & earnings" },
        { href: "/seller/profile", label: "Brand profile" },
      ]}
    >
      {children}
    </DashLayout>
  );
}
