import type { Metadata } from "next";
import { DashboardShell, type DashboardConfig } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin" };

const config: DashboardConfig = {
  roleLabel: "Admin",
  heading: "Admin overview",
  stats: [
    { label: "Awaiting review", value: "0", hint: "New sellers and listings" },
    { label: "Disputes", value: "0", hint: "Refund requests and chargebacks" },
    { label: "Transfers on hold", value: "₹0", hint: "Released by the gateway after the hold" },
  ],
  nav: [
    { label: "Overview" },
    { label: "Review queue", milestone: "M1" },
    { label: "Users", milestone: "M1" },
    { label: "Orders", milestone: "M2" },
    { label: "Ledger", milestone: "M4" },
    { label: "Settings", milestone: "M6" },
    { label: "Audit log", milestone: "M6" },
  ],
  empty: {
    title: "Nothing to review",
    text: "New sellers and listings will queue here for approval once Milestone M1 is built.",
  },
  checklist: [
    "Register the business and get written answers from the payment gateway (docs/decisions.md, section C).",
    "Have the seller and influencer agreements and the three policy pages reviewed by a lawyer.",
    "Confirm TDS and GST handling with a CA.",
    "Onboard the first ten sellers by hand.",
  ],
};

export default async function AdminDashboard() {
  const { preview, profile } = await requireRole(["admin"]);
  return <DashboardShell config={config} preview={preview} profile={profile} />;
}
