import type { Metadata } from "next";
import { Empty, PageTitle, StatCards, Table } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { nameMap, shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ledger" };

const kindLabels: Record<string, string> = {
  platform_fee: "Platform fee",
  influencer_commission: "Influencer commission",
  seller_earning: "Seller earning",
  gateway_fee: "Gateway fee (estimate)",
  refund_reversal: "Refund reversal",
};

export default async function AdminLedger() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("ledger_entries")
    .select("id, order_id, account_type, account_id, kind, amount_paise, available_at, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const entries = data ?? [];
  const names = await nameMap(entries.map((e) => e.account_id).filter(Boolean) as string[]);
  const total = (type: string) => entries.filter((e) => e.account_type === type).reduce((s, e) => s + e.amount_paise, 0);

  return (
    <>
      <PageTitle title="Ledger" intro="Every rupee of every sale, split by who it belongs to. Rows are never edited; a refund adds matching negative rows." />
      <StatCards
        stats={[
          { label: "Sellers", value: formatINR(total("seller")), hint: "Owed to sellers" },
          { label: "Influencers", value: formatINR(total("influencer")), hint: "Owed to influencers" },
          { label: "Platform", value: formatINR(total("platform")), hint: `Gateway fees: ${formatINR(total("gateway"))}` },
        ]}
      />
      <div className="mt-6">
        {entries.length === 0 ? (
          <Empty title="No entries yet" text="Ledger rows are written the moment an order is paid." />
        ) : (
          <Table
            head={["Date", "Order", "Entry", "Account", "Amount", "Released on"]}
            rows={entries.map((e) => [
              shortDate(e.created_at),
              <span key="o" className="font-mono text-xs">{e.order_id.slice(0, 8)}</span>,
              kindLabels[e.kind] ?? e.kind,
              e.account_id ? names[e.account_id] : e.account_type === "platform" ? "Creator Marketing" : "Payment gateway",
              <span key="a" className={`tabular-nums ${e.amount_paise < 0 ? "text-clay-deep" : ""}`}>{formatINR(e.amount_paise)}</span>,
              shortDate(e.available_at),
            ])}
          />
        )}
      </div>
    </>
  );
}
