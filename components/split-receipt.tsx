import { formatINR, split } from "@/lib/money";
import { launchSettings } from "@/lib/site";

// Shows exactly where the money from one sale goes, using the real split() function.
export function SplitReceipt({
  listPricePaise = 100000,
  promoDiscountPct = 10,
  commissionPct = 20,
  title = "One sale, split automatically",
}: {
  listPricePaise?: number;
  promoDiscountPct?: number;
  commissionPct?: number;
  title?: string;
}) {
  const r = split({
    listPricePaise,
    promoDiscountPct,
    commissionPct,
    platformFeePct: launchSettings.platformFeePct,
    gatewayFeePct: launchSettings.gatewayFeeEstPct,
    gatewayFeeBorneBy: launchSettings.gatewayFeeBorneBy,
  });

  const rows = [
    { label: "List price", value: formatINR(r.listPricePaise) },
    ...(r.discountPaise > 0
      ? [{ label: `Promo code (${promoDiscountPct}% off)`, value: `− ${formatINR(r.discountPaise)}` }]
      : []),
    { label: "Buyer pays", value: formatINR(r.netPaise), strong: true },
    { label: `Influencer commission (${commissionPct}%)`, value: formatINR(r.influencerCommissionPaise) },
    { label: `Platform fee (${launchSettings.platformFeePct}%)`, value: formatINR(r.platformFeePaise) },
    { label: "Payment gateway (estimate)", value: formatINR(r.gatewayFeePaise) },
  ];

  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-7">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">{title}</p>
      <dl className="mt-5 divide-y divide-line text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className={row.strong ? "font-medium" : "text-ink-soft"}>{row.label}</dt>
            <dd className={`tabular-nums ${row.strong ? "font-medium" : ""}`}>{row.value}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 pt-4">
          <dt className="font-medium">Seller keeps</dt>
          <dd className="font-display text-3xl tabular-nums text-moss">{formatINR(r.sellerEarningPaise)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Example figures. The gateway line is an estimate and is replaced by the actual charge on each order.
      </p>
    </div>
  );
}
