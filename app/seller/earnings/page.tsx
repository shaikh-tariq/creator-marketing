import type { Metadata } from "next";
import { Empty, Notice, PageTitle, StatCards, StatusBadge, Table } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { balances, nameMap, shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Orders and earnings" };

export default async function SellerEarnings() {
  const profile = await requireRole(["seller"]);
  const supabase = await createClient();
  const [ordersRes, ledgerRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id, net_paise, discount_paise, status, influencer_id, is_test, created_at, terms_snapshot, products(title)")
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase.from("ledger_entries").select("amount_paise, available_at, kind, account_type").eq("account_id", profile.id),
  ]);
  const orders = ordersRes.data ?? [];
  const bal = balances(ledgerRes.data ?? []);
  const names = await nameMap(orders.map((o) => o.influencer_id).filter(Boolean) as string[]);

  return (
    <>
      <PageTitle title="Orders & earnings" intro="Your share of each sale is held for the hold period, then released." />
      <StatCards
        stats={[
          { label: "On hold", value: formatINR(bal.onHold), hint: "Inside the hold period" },
          { label: "Released", value: formatINR(bal.released), hint: "Past the hold period" },
          { label: "Total earned", value: formatINR(bal.total), hint: "After fees, commission and refunds" },
        ]}
      />
      <div className="mt-6">
        <Notice>Test mode: these are test orders, so no money is paid out. Real payouts start when the payment gateway is connected.</Notice>
      </div>
      <div className="mt-6">
        {orders.length === 0 ? (
          <Empty title="No orders yet" text="Orders appear here the moment a buyer pays." />
        ) : (
          <Table
            head={["Date", "Product", "Buyer paid", "Influencer", "Commission", "Fees", "You keep", "Status"]}
            rows={orders.map((o) => {
              const t = o.terms_snapshot as Record<string, number | string | null>;
              const fees = Number(t.platform_fee_paise) + (t.gateway_fee_borne_by === "seller" ? Number(t.gateway_fee_paise) : 0);
              return [
                shortDate(o.created_at),
                (o.products as unknown as { title: string })?.title,
                formatINR(o.net_paise),
                o.influencer_id ? names[o.influencer_id] : <span key="n" className="text-ink-soft">Direct</span>,
                formatINR(Number(t.influencer_commission_paise)),
                formatINR(fees),
                <span key="k" className="font-medium">{o.status === "paid" ? formatINR(Number(t.seller_earning_paise)) : formatINR(0)}</span>,
                <StatusBadge key="s" status={o.status} />,
              ];
            })}
          />
        )}
      </div>
    </>
  );
}
