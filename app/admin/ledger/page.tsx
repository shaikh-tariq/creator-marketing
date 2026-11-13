import type { Metadata } from "next";
import { Badge, Empty, PageTitle, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { nameMap, shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ledger" };

type Entry = {
  id: string;
  order_id: string;
  account_type: "platform" | "seller" | "influencer" | "gateway";
  account_id: string | null;
  kind: string;
  amount_paise: number;
  available_at: string | null;
  created_at: string;
  reverses_id: string | null;
};

const kindLabels: Record<string, string> = {
  platform_fee: "Platform fee",
  influencer_commission: "Influencer commission",
  seller_earning: "Seller earning",
  gateway_fee: "Gateway fee (estimate)",
  refund_reversal: "Refund reversal",
};

// One colour per party, used in the split bar and next to each amount.
const parties = [
  { key: "seller", label: "Seller gets", dot: "bg-accent" },
  { key: "influencer", label: "Influencer commission", dot: "bg-sun" },
  { key: "platform", label: "Platform fee", dot: "bg-ink" },
  { key: "gateway", label: "Gateway fee", dot: "bg-sky" },
] as const;

export default async function AdminLedger({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  await requireRole(["admin"]);
  const supabase = await createClient();

  const [{ data: orderRows }, { data: entryRows }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, buyer_email, seller_id, influencer_id, list_price_paise, discount_paise, net_paise, status, is_test, terms_snapshot, created_at, products(title)")
      .in("status", ["paid", "refunded"])
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("ledger_entries")
      .select("id, order_id, account_type, account_id, kind, amount_paise, available_at, created_at, reverses_id")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  const orders = orderRows ?? [];
  const entries = (entryRows ?? []) as Entry[];
  const names = await nameMap(
    [...orders.flatMap((o) => [o.seller_id, o.influencer_id]), ...entries.map((e) => e.account_id)].filter(Boolean) as string[],
  );

  // Original split of each sale (refund rows are shown separately as the status).
  const byOrder = new Map<string, Entry[]>();
  for (const e of entries) {
    if (e.reverses_id) continue;
    byOrder.set(e.order_id, [...(byOrder.get(e.order_id) ?? []), e]);
  }
  const share = (list: Entry[], type: string) => list.filter((e) => e.account_type === type).reduce((s, e) => s + e.amount_paise, 0);
  const totalFor = (type: string) => entries.filter((e) => e.account_type === type).reduce((s, e) => s + e.amount_paise, 0);
  const paidOrders = orders.filter((o) => o.status === "paid");
  const now = Date.now();

  const totals = [
    { label: "Buyers paid", value: formatINR(paidOrders.reduce((s, o) => s + o.net_paise, 0)), hint: `${paidOrders.length} sale${paidOrders.length === 1 ? "" : "s"}, refunds excluded`, dot: "bg-success" },
    { label: "Sellers get", value: formatINR(totalFor("seller")), hint: "After all fees", dot: "bg-accent" },
    { label: "Influencers get", value: formatINR(totalFor("influencer")), hint: "Commission on their sales", dot: "bg-sun" },
    { label: "Platform keeps", value: formatINR(totalFor("platform")), hint: `Gateway fees: ${formatINR(totalFor("gateway"))}`, dot: "bg-ink" },
  ];

  return (
    <>
      <PageTitle
        title="Ledger"
        intro="Every sale and where its money went: what the buyer paid, the influencer's commission, our fee, the gateway fee, and what the seller gets."
      />

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {totals.map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-card p-5">
            <dt className="flex items-center gap-2 text-sm text-ink-soft">
              <span className={`size-2.5 rounded-full ${t.dot}`} />
              {t.label}
            </dt>
            <dd className="mt-3 font-display text-3xl tabular-nums">{t.value}</dd>
            <p className="mt-1 text-xs text-ink-soft">{t.hint}</p>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex items-center gap-2 text-sm">
        <a href="/admin/ledger" className={`rounded-full px-4 py-1.5 ${view !== "rows" ? "bg-ink text-white" : "border border-line bg-card"}`}>By sale</a>
        <a href="/admin/ledger?view=rows" className={`rounded-full px-4 py-1.5 ${view === "rows" ? "bg-ink text-white" : "border border-line bg-card"}`}>Raw entries</a>
      </div>

      {view === "rows" ? (
        <RawEntries entries={entries} names={names} />
      ) : orders.length === 0 ? (
        <div className="mt-5">
          <Empty title="No sales yet" text="Each sale shows up here the moment it is paid, with its full money split." />
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {orders.map((o) => {
            const list = byOrder.get(o.id) ?? [];
            const amounts = {
              seller: share(list, "seller"),
              influencer: share(list, "influencer"),
              platform: share(list, "platform"),
              gateway: share(list, "gateway"),
            };
            const t = (o.terms_snapshot ?? {}) as Record<string, string | number | null>;
            const refunded = o.status === "refunded";
            const sellerEntry = list.find((e) => e.account_type === "seller");
            const releaseAt = sellerEntry?.available_at ? new Date(sellerEntry.available_at).getTime() : null;
            const title = (o.products as unknown as { title: string } | null)?.title ?? "Product";

            return (
              <li key={o.id} className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold leading-snug">{title}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Sold by <span className="text-ink">{names[o.seller_id] ?? "Seller"}</span>
                      {" · "}
                      {o.influencer_id ? (
                        <>via <span className="text-ink">{names[o.influencer_id] ?? "Influencer"}</span>{t.promo_code ? <> with code <span className="font-mono text-xs text-ink">{t.promo_code}</span></> : " (tracked link)"}</>
                      ) : (
                        "direct sale, no influencer"
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {shortDate(o.created_at)} · {o.buyer_email} · order <span className="font-mono">{o.id.slice(0, 8)}</span>
                      {o.is_test ? " · test payment" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-soft">Buyer paid</p>
                    <p className={`font-display text-2xl tabular-nums ${refunded ? "text-ink-soft line-through" : ""}`}>{formatINR(o.net_paise)}</p>
                    {o.discount_paise > 0 ? (
                      <p className="text-xs text-ink-soft">
                        {formatINR(o.list_price_paise)} − {formatINR(o.discount_paise)} code discount
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Split bar: each party's share of what the buyer paid. */}
                {o.net_paise > 0 ? (
                  <div className={`mt-5 flex h-3 overflow-hidden rounded-full bg-paper-deep ${refunded ? "opacity-40" : ""}`}>
                    {parties.map((p) =>
                      amounts[p.key] > 0 ? (
                        <span key={p.key} className={p.dot} style={{ width: `${(amounts[p.key] / o.net_paise) * 100}%` }} title={`${p.label}: ${formatINR(amounts[p.key])}`} />
                      ) : null,
                    )}
                  </div>
                ) : null}

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                  {parties.map((p) => (
                    <div key={p.key} className={refunded ? "opacity-60" : ""}>
                      <dt className="flex items-center gap-1.5 text-xs text-ink-soft">
                        <span className={`size-2 rounded-full ${p.dot}`} />
                        {p.label}
                        {p.key === "influencer" && t.commission_pct ? ` (${t.commission_pct}%)` : ""}
                        {p.key === "platform" && t.platform_fee_pct ? ` (${t.platform_fee_pct}%)` : ""}
                      </dt>
                      <dd className={`mt-0.5 font-semibold tabular-nums ${p.key === "seller" ? "text-lg text-accent-deep" : ""}`}>
                        {p.key === "influencer" && !o.influencer_id ? <span className="font-normal text-ink-soft">None</span> : formatINR(amounts[p.key])}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 border-t border-line pt-3 text-xs">
                  {refunded ? (
                    <span className="flex items-center gap-2"><StatusBadge status="refunded" /> Refunded in full. Every share above was reversed.</span>
                  ) : releaseAt && releaseAt > now ? (
                    <span className="flex items-center gap-2"><Badge>On hold</Badge> Seller and influencer shares release on {shortDate(sellerEntry!.available_at!)}.</span>
                  ) : (
                    <span className="flex items-center gap-2"><Badge tone="success">Released</Badge> Shares are available to pay out.</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

// The underlying rows, for checking the numbers line by line.
function RawEntries({ entries, names }: { entries: Entry[]; names: Record<string, string> }) {
  if (entries.length === 0) return <div className="mt-5"><Empty title="No entries yet" text="Ledger rows are written the moment an order is paid." /></div>;
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-card shadow-sm">
      <p className="border-b border-line px-5 py-3 text-xs text-ink-soft">Rows are never edited. A refund adds matching negative rows.</p>
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead>
          <tr className="bg-paper-deep/70 text-xs uppercase tracking-wider">
            <th className="px-5 py-3 font-semibold">Date</th>
            <th className="px-5 py-3 font-semibold">Order</th>
            <th className="px-5 py-3 font-semibold">Entry</th>
            <th className="px-5 py-3 font-semibold">Who</th>
            <th className="px-5 py-3 text-right font-semibold">Amount</th>
            <th className="px-5 py-3 font-semibold">Releases</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-line even:bg-paper/60">
              <td className="px-5 py-3 whitespace-nowrap">{shortDate(e.created_at)}</td>
              <td className="px-5 py-3 font-mono text-xs">{e.order_id.slice(0, 8)}</td>
              <td className="px-5 py-3">{kindLabels[e.kind] ?? e.kind}</td>
              <td className="px-5 py-3">{e.account_id ? names[e.account_id] : e.account_type === "platform" ? "Creator Marketing" : "Payment gateway"}</td>
              <td className={`px-5 py-3 text-right tabular-nums ${e.amount_paise < 0 ? "text-alert" : ""}`}>{formatINR(e.amount_paise)}</td>
              <td className="px-5 py-3 whitespace-nowrap">{e.available_at ? shortDate(e.available_at) : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
