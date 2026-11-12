import type { Metadata } from "next";
import { DashboardShell, type DashboardConfig } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Seller dashboard" };

const config: DashboardConfig = {
  roleLabel: "Seller",
  heading: "Seller dashboard",
  stats: [
    { label: "Sales", value: "₹0", hint: "Paid orders, all time" },
    { label: "Posts to review", value: "0", hint: "Influencer submissions waiting for you" },
    { label: "Available earnings", value: "₹0", hint: "Past the hold period" },
  ],
  nav: [
    { label: "Overview" },
    { label: "Products", milestone: "M1" },
    { label: "Submissions", milestone: "M5" },
    { label: "Influencers", milestone: "M5" },
    { label: "Earnings", milestone: "M4" },
    { label: "Profile", milestone: "M1" },
  ],
  empty: {
    title: "No products yet",
    text: "Product listing opens in the next build (Milestone M1). You will upload a file, set a price and commission, and write a short brief for influencers.",
  },
  checklist: [
    "Complete your brand profile.",
    "List your first product and submit it for review.",
    "Finish the payment gateway's identity and bank check so you can be paid.",
    "Approve your first influencer post.",
  ],
};

export default async function SellerDashboard() {
  const { preview, profile } = await requireRole(["seller"]);
  return <DashboardShell config={config} preview={preview} profile={profile} />;
}
