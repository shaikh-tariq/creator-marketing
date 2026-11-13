import type { Metadata } from "next";
import Link from "next/link";
import { LinkPending } from "@/components/client-bits";
import { ProductCover } from "@/components/product-card";
import { ButtonLink, Empty, Flash, PageTitle, StatusBadge, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Products" };

export default async function SellerProducts({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const profile = await requireRole(["seller"]);
  const supabase = await createClient();
  const [productsRes, ordersRes, joinsRes] = await Promise.all([
    supabase.from("products").select("id, title, slug, summary, format, art, cover_path, price_paise, commission_pct, promo_discount_pct, status").eq("seller_id", profile.id).neq("status", "archived").order("created_at", { ascending: false }),
    supabase.from("orders").select("product_id").eq("seller_id", profile.id).eq("status", "paid"),
    supabase.from("joins").select("product_id").eq("seller_id", profile.id).eq("status", "active"),
  ]);
  const products = productsRes.data ?? [];
  const count = (rows: { product_id: string }[] | null, id: string) => (rows ?? []).filter((r) => r.product_id === id).length;

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Products" intro="Drafts are private. A product goes live after you submit it and an admin approves it." action={<ButtonLink href="/seller/products/new">Add product</ButtonLink>} />
      {products.length === 0 ? (
        <Empty title="No products yet" text="Create a draft, upload the file, then submit it for review.">
          <ButtonLink href="/seller/products/new">Create a product</ButtonLink>
        </Empty>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <li key={p.id} className="lift flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
              <div className="relative">
                <ProductCover cover={p.cover_path} art={p.art} title={p.title} format={p.format} className="aspect-[16/10]" />
                <span className="absolute right-3 top-3"><StatusBadge status={p.status} /></span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl leading-snug">{p.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{p.summary || "No summary yet."}</p>
                <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Price", formatINR(p.price_paise)],
                    ["Commission", `${Number(p.commission_pct)}%`],
                    ["Sales", String(count(ordersRes.data, p.id))],
                    ["Influencers", String(count(joinsRes.data, p.id))],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-paper px-1 py-2">
                      <dd className="font-display text-base tabular-nums">{value}</dd>
                      <dt className="text-[10px] uppercase tracking-wider text-ink-soft">{label}</dt>
                    </div>
                  ))}
                </dl>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                  <Link href={`/products/${p.slug}`} className={smallButton("outline", "min-h-10 text-sm")}>View<LinkPending /></Link>
                  <Link href={`/seller/products/${p.id}`} className={smallButton("primary", "min-h-10 text-sm")}>Edit<LinkPending /></Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
