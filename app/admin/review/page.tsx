import type { Metadata } from "next";
import Link from "next/link";
import { adminSetUser } from "@/app/actions";
import { LinkPending, SubmitButton } from "@/components/client-bits";
import { ProductCover } from "@/components/product-card";
import { Badge, Empty, Flash, PageTitle, Table, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { PRODUCT_COLS, shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Review queue" };

export default async function ReviewQueue({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  await requireRole(["admin"]);
  const supabase = await createClient();
  const [sellersRes, productsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, created_at").eq("role", "seller").eq("status", "pending").order("created_at"),
    supabase.from("products").select(PRODUCT_COLS).eq("status", "pending_review").order("created_at"),
  ]);
  const sellers = sellersRes.data ?? [];
  const products = (productsRes.data ?? []) as unknown as Product[];
  const sellerIds = [...new Set(products.map((p) => p.seller_id))];
  const ownersRes = sellerIds.length ? await supabase.from("profiles").select("id, status").in("id", sellerIds) : { data: [] };
  const ownerStatus = Object.fromEntries((ownersRes.data ?? []).map((o) => [o.id, o.status]));

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Review queue" intro="New sellers and listings wait here. Nothing goes live without your approval." />

      <section className="space-y-4">
        <h3 className="text-xl">Sellers waiting ({sellers.length})</h3>
        {sellers.length === 0 ? (
          <p className="text-sm text-ink-soft">No sellers waiting.</p>
        ) : (
          <Table
            head={["Name", "Email", "Signed up", ""]}
            rows={sellers.map((s) => [
              s.full_name ?? "Unnamed",
              s.email,
              shortDate(s.created_at),
              <form key="f" action={adminSetUser} className="flex gap-2">
                <input type="hidden" name="user_id" value={s.id} />
                <input type="hidden" name="back" value="/admin/review" />
                <SubmitButton name="status" value="active" className={smallButton("primary")}>Approve seller</SubmitButton>
                <SubmitButton name="status" value="suspended" className={smallButton("danger")}>Reject</SubmitButton>
              </form>,
            ])}
          />
        )}
      </section>

      <section className="mt-10 space-y-4">
        <h3 className="text-xl">Listings waiting ({products.length})</h3>
        {products.length === 0 ? (
          <Empty title="No listings waiting" text="When a seller submits a product for review it appears here as a card. Open it to see everything and decide." />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/review/${p.id}`} className="lift flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card">
                  <ProductCover cover={p.cover_path} art={p.art} title={p.title} format={p.format} className="aspect-[16/10]" />
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs text-ink-soft">by {p.seller_profiles?.brand_name || "Unnamed brand"} · {p.hubs?.name}</p>
                    <h4 className="mt-2 font-display text-xl leading-snug">{p.title}</h4>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{p.summary}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge>{formatINR(p.price_paise)}</Badge>
                      <Badge>{Number(p.commission_pct)}% commission</Badge>
                      {ownerStatus[p.seller_id] !== "active" ? <Badge tone="accent">Seller not approved</Badge> : null}
                    </div>
                    <span className={smallButton("primary", "mt-5 min-h-10 w-full text-sm")}>Open to review<LinkPending /></span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
