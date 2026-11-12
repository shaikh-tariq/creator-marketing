import type { Metadata } from "next";
import Link from "next/link";
import { joinProduct } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { ProductArt, sellerName } from "@/components/product-card";
import { Badge, Empty, Flash, PageTitle, buttonClass, inputClass, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { listProducts } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { liveHubs } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Find products" };

type Props = { searchParams: Promise<{ ok?: string; error?: string; hub?: string; q?: string }> };

export default async function Browse({ searchParams }: Props) {
  const { hub, q, ...flash } = await searchParams;
  const profile = await requireRole(["influencer"]);
  const supabase = await createClient();
  const [products, joins] = await Promise.all([
    listProducts({ hubSlug: hub || undefined, q }),
    supabase.from("joins").select("product_id").eq("influencer_id", profile.id),
  ]);
  const joined = new Set((joins.data ?? []).map((j) => j.product_id));
  const sorted = [...products].sort((a, b) => b.price_paise * Number(b.commission_pct) - a.price_paise * Number(a.commission_pct));

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Find products" intro="Sorted by what you earn per sale. Join the ones you would recommend anyway." />
      <form className="mb-6 flex flex-wrap gap-2">
        <select name="hub" defaultValue={hub ?? ""} aria-label="Hub" className={`${inputClass} mt-0 w-auto`}>
          <option value="">All hubs</option>
          {liveHubs.map((h) => (
            <option key={h.slug} value={h.slug}>{h.name}</option>
          ))}
        </select>
        <input name="q" defaultValue={q} placeholder="Search" aria-label="Search" className={`${inputClass} mt-0 w-auto flex-1`} />
        <button className={buttonClass("outline")}>Filter</button>
      </form>

      {sorted.length === 0 ? (
        <Empty title="No products match" text="Clear the filter to see everything that is live." />
      ) : (
        <ul className="space-y-4">
          {sorted.map((p) => (
            <li key={p.id} className="grid gap-4 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
              <ProductArt art={p.art} className="aspect-[4/3] rounded-xl" />
              <div>
                <Link href={`/products/${p.slug}`} className="font-display text-xl hover:underline">{p.title}</Link>
                <p className="mt-1 text-xs text-ink-soft">by {sellerName(p)} · {formatINR(p.price_paise)}</p>
                {p.brief_text ? <p className="mt-2 text-sm leading-relaxed text-ink-soft"><span className="font-medium text-ink">Brief:</span> {p.brief_text}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="moss">Earn {Number(p.commission_pct)}% · {formatINR(Math.round((p.price_paise * Number(p.commission_pct)) / 100))} a sale</Badge>
                  {Number(p.promo_discount_pct) > 0 ? <Badge>Buyers get {Number(p.promo_discount_pct)}% off</Badge> : null}
                  {p.join_mode === "apply" ? <Badge tone="clay">Seller approves who joins</Badge> : null}
                </div>
              </div>
              {joined.has(p.id) ? (
                <Link href="/influencer/joins" className={smallButton("outline")}>Joined</Link>
              ) : (
                <form action={joinProduct} className="flex flex-col gap-2 sm:w-44">
                  <input type="hidden" name="product_id" value={p.id} />
                  <input type="hidden" name="back" value="/influencer/browse" />
                  {p.join_mode === "apply" ? <input name="pitch" maxLength={500} placeholder="Why you? (optional)" className={`${inputClass} mt-0 h-9 text-xs`} /> : null}
                  <SubmitButton className={smallButton("accent")}>{p.join_mode === "apply" ? "Apply" : "Join"}</SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
