import type { Metadata } from "next";
import { DashboardShell, type DashboardConfig } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Influencer dashboard" };

const config: DashboardConfig = {
  roleLabel: "Influencer",
  heading: "Influencer dashboard",
  stats: [
    { label: "Clicks", value: "0", hint: "On your tracked links" },
    { label: "Orders", value: "0", hint: "Paid orders credited to you" },
    { label: "Available earnings", value: "₹0", hint: "Past the hold period" },
  ],
  nav: [
    { label: "Overview" },
    { label: "Browse products", milestone: "M5" },
    { label: "My joins", milestone: "M5" },
    { label: "Links & codes", milestone: "M5" },
    { label: "Earnings", milestone: "M5" },
    { label: "Channels", milestone: "M5" },
  ],
  empty: {
    title: "No products joined yet",
    text: "Joining and submitting posts opens in Milestone M5. Until then you can look through the sample listings to see commissions and briefs.",
    cta: { label: "See sample listings", href: "/hubs/creators-social" },
  },
  checklist: [
    "Add the platforms you post on: Instagram, LinkedIn, Pinterest, X or Facebook.",
    "Join a product you would use yourself.",
    "Submit your post for the seller's approval, with the disclosure ticked.",
    "Share your link and promo code once approved.",
  ],
};

export default async function InfluencerDashboard() {
  const { preview, profile } = await requireRole(["influencer"]);
  return <DashboardShell config={config} preview={preview} profile={profile} />;
}
