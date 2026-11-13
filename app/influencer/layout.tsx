import { DashLayout } from "@/components/dash-layout";
import { requireRole } from "@/lib/auth";

export default async function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["influencer"]);
  return (
    <DashLayout
      roleLabel="Influencer"
      profile={profile}
    >
      {children}
    </DashLayout>
  );
}
