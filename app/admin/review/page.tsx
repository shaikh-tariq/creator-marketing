import type { Metadata } from "next";
import { adminReviewProduct, adminSetUser, downloadFile } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { Badge, Card, Empty, Flash, PageTitle, StatusBadge, Table, inputClass, smallButton } from "@/components/ui";
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
  const ids = products.map((p) => p.id);
  const sellerIds = [...new Set(products.map((p) => p.seller_id))];
  const [filesRes, ownersRes] = await Promise.all([
    ids.length ? supabase.from("product_files").select("id, product_id, file_name, size_bytes").in("product_id", ids) : Promise.resolve({ data: [] }),
    sellerIds.length ? supabase.from("profiles").select("id, status").in("id", sellerIds) : Promise.resolve({ data: [] }),
  ]);
  const files = filesRes.data ?? [];
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
          <Empty title="No listings waiting" text="When a seller submits a product for review it appears here." />
        ) : (
          products.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-2xl">{p.title}</h4>
                  <p className="mt-1 text-sm text-ink-soft">
                    by {p.seller_profiles?.brand_name || "Unnamed brand"} · {p.hubs?.name} · {formatINR(p.price_paise)} ·{" "}
                    {Number(p.commission_pct)}% commission · {Number(p.promo_discount_pct)}% promo discount
                  </p>
                </div>
                <span className="flex items-center gap-2">
                  {ownerStatus[p.seller_id] !== "active" ? <Badge tone="clay">Seller not approved yet</Badge> : null}
                  <StatusBadge status={p.status} />
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">{p.summary}</p>
              {p.description ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{p.description}</p> : null}
              {p.brief_text ? <p className="mt-3 text-sm text-ink-soft"><span className="font-medium text-ink">Brief:</span> {p.brief_text}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {files.filter((f) => f.product_id === p.id).map((f) => (
                  <form key={f.id} action={downloadFile}>
                    <input type="hidden" name="file_id" value={f.id} />
                    <input type="hidden" name="back" value="/admin/review" />
                    <SubmitButton className={smallButton("outline")}>Check file: {f.file_name}</SubmitButton>
                  </form>
                ))}
              </div>
              <form action={adminReviewProduct} className="mt-5 border-t border-line pt-4">
                <input type="hidden" name="product_id" value={p.id} />
                <input name="reason" maxLength={300} placeholder="Reason (shown to the seller if you reject)" className={`${inputClass} mt-0`} />
                <div className="mt-3 flex gap-2">
                  <SubmitButton name="decision" value="approve" className={smallButton("primary")}>Approve and publish</SubmitButton>
                  <SubmitButton name="decision" value="reject" className={smallButton("danger")}>Reject</SubmitButton>
                </div>
              </form>
            </Card>
          ))
        )}
      </section>
    </>
  );
}
