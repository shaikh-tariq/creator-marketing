import { DashLayout } from "@/components/dash-layout";
import { requireRole } from "@/lib/auth";

export default async function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["influencer"]);
  return (
    <DashLayout
      roleLabel="Influencer"
      profile={profile}
      subtitle="Pick products you rate, post about them, and earn on every sale."
      actions={[
        { href: "/influencer/browse", label: "Find products", primary: true },
        { href: "/influencer/joins", label: "My posts" },
      ]}
    >
      {children}
    </DashLayout>
  );
}
