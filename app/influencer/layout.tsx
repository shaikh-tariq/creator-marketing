import { DashLayout } from "@/components/dash-layout";
import { requireRole } from "@/lib/auth";

export default async function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["influencer"]);
  return (
    <DashLayout
      roleLabel="Influencer"
      profile={profile}
      nav={[
        { href: "/influencer", label: "Overview" },
        { href: "/influencer/browse", label: "Find products" },
        { href: "/influencer/joins", label: "My joins & posts" },
        { href: "/influencer/earnings", label: "Earnings" },
        { href: "/influencer/channels", label: "Profile & channels" },
      ]}
    >
      {children}
    </DashLayout>
  );
}
