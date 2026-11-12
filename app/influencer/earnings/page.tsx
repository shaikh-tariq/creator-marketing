import type { Metadata } from "next";
import { Empty, Notice, PageTitle, StatCards, StatusBadge, Table } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { balances, shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Earnings" };

export default async function InfluencerEarnings() {
  const profile = await requireRole(["influencer"]);
  const supabase = await createClient();
  const [ordersRes, ledgerRes] = await Promise.all([
    supabase.from("orders").select("id, net_paise, status, created_at, terms_snapshot, products(title)").eq("influencer_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("ledger_entries").select("amount_paise, available_at, kind, account_type").eq("account_id", profile.id),
  ]);
  const orders = ordersRes.data ?? [];
  const bal = balances(ledgerRes.data ?? []);

  return (
    <>
      <PageTitle title="Earnings" intro="Commission from each sale is held for the hold period, then released." />
      <StatCards
        stats={[
          { label: "On hold", value: formatINR(bal.onHold), hint: "Inside the hold period" },
          { label: "Released", value: formatINR(bal.released), hint: "Past the hold period" },
          { label: "Total earned", value: formatINR(bal.total), hint: "After refunds" },
        ]}
      />
      <div className="mt-6">
        <Notice>Test mode: these are test orders, so no money is paid out. Real payouts start when the payment gateway is connected.</Notice>
      </div>
      <div className="mt-6">
        {orders.length === 0 ? (
          <Empty title="No sales yet" text="Sales made through your link or promo code appear here." />
        ) : (
          <Table
            head={["Date", "Product", "Buyer paid", "How", "Your commission", "Status"]}
            rows={orders.map((o) => {
              const t = o.terms_snapshot as Record<string, number | string | null>;
              return [
                shortDate(o.created_at),
                (o.products as unknown as { title: string })?.title,
                formatINR(o.net_paise),
                t.promo_code ? `Code ${t.promo_code}` : "Link",
                <span key="c" className="font-medium">{o.status === "paid" ? formatINR(Number(t.influencer_commission_paise)) : formatINR(0)}</span>,
                <StatusBadge key="s" status={o.status} />,
              ];
            })}
          />
        )}
      </div>
    </>
  );
}
