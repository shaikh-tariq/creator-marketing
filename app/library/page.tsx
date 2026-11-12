import type { Metadata } from "next";
import { DashboardShell, type DashboardConfig } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "My library" };

const config: DashboardConfig = {
  roleLabel: "Buyer",
  heading: "My library",
  stats: [
    { label: "Products owned", value: "0", hint: "Ready to download any time" },
    { label: "Orders", value: "0", hint: "All time" },
    { label: "Reviews written", value: "0", hint: "Only buyers can review" },
  ],
  nav: [{ label: "Library" }, { label: "Orders", milestone: "M3" }, { label: "Reviews", milestone: "M6" }],
  empty: {
    title: "Nothing here yet",
    text: "Everything you buy appears here with a fresh download link. Checkout opens in Milestone M2.",
    cta: { label: "Browse the hubs", href: "/" },
  },
  checklist: [
    "Find a product in one of the open hubs.",
    "Enter a creator's promo code at checkout if you have one.",
    "Download instantly; the file also stays in this library.",
  ],
};

export default async function LibraryPage() {
  // Sellers and influencers can buy too, so every role may open the library.
  const { preview, profile } = await requireRole(["buyer", "seller", "influencer", "admin"]);
  return <DashboardShell config={config} preview={preview} profile={profile} />;
}
