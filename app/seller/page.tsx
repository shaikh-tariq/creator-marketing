import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, Empty, StatCards, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { balances, shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Seller dashboard" };

export default async function SellerOverview() {
  const profile = await requireRole(["seller"]);
  const supabase = await createClient();
  const [products, orders, pending, ledger] = await Promise.all([
    supabase.from("products").select("id, title, status").eq("seller_id", profile.id).neq("status", "archived").order("created_at", { ascending: false }),
    supabase.from("orders").select("id, net_paise, status, created_at, influencer_id, terms_snapshot, products(title)").eq("seller_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).eq("status", "pending"),
    supabase.from("ledger_entries").select("amount_paise, available_at, kind, account_type").eq("account_id", profile.id),
  ]);

  const paid = (orders.data ?? []).filter((o) => o.status === "paid");
  const sales = paid.reduce((s, o) => s + o.net_paise, 0);
  const bal = balances(ledger.data ?? []);
  const list = products.data ?? [];

  return (
    <div className="space-y-6">
      <StatCards
        stats={[
          { label: "Sales", value: formatINR(sales), hint: `${paid.length} paid ${paid.length === 1 ? "order" : "orders"}` },
          { label: "Posts to review", value: String(pending.count ?? 0), hint: "Influencer posts waiting for you" },
          { label: "Released earnings", value: formatINR(bal.released), hint: `${formatINR(bal.onHold)} still on hold` },
        ]}
      />

      {list.length === 0 ? (
        <Empty title="List your first product" text="Upload a file, set a price and a commission, and write a short brief for influencers. An admin reviews it before it goes live.">
          <ButtonLink href="/seller/products/new">Create a product</ButtonLink>
        </Empty>
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Your products</h2>
            <Link href="/seller/products/new" className="text-sm underline">Add product</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {list.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Link href={`/seller/products/${p.id}`} className="hover:underline">{p.title}</Link>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(orders.data ?? []).length > 0 ? (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Recent orders</h2>
            <Link href="/seller/earnings" className="text-sm underline">See all</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {(orders.data ?? []).slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  {(o.products as unknown as { title: string })?.title}
                  <span className="ml-2 text-xs text-ink-soft">
                    {shortDate(o.created_at)} ·{" "}
                    {(o.terms_snapshot as { promo_code?: string | null }).promo_code
                      ? `promo code ${(o.terms_snapshot as { promo_code?: string }).promo_code}`
                      : o.influencer_id
                        ? "influencer link"
                        : "direct sale"}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{formatINR(o.net_paise)}</span>
                  <StatusBadge status={o.status} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
