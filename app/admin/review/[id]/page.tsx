import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminReviewProduct, adminSetUser, downloadFile } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { ProductCover } from "@/components/product-card";
import { Badge, Card, Flash, Notice, StatusBadge, inputClass, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { PRODUCT_COLS, shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Review listing" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-line py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
      <dt className="text-sm font-medium text-ink-soft">{label}</dt>
      <dd className="text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

export default async function ReviewListing({ params, searchParams }: Props) {
  const { id } = await params;
  const flash = await searchParams;
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data } = await supabase.from("products").select(PRODUCT_COLS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as unknown as Product;
  const [{ data: files }, { data: owner }, { count: otherLive }] = await Promise.all([
    supabase.from("product_files").select("id, file_name, size_bytes").eq("product_id", p.id),
    supabase.from("profiles").select("id, full_name, email, status, created_at").eq("id", p.seller_id).single(),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("seller_id", p.seller_id).eq("status", "published"),
  ]);
  const waiting = p.status === "pending_review";
  const commission = Math.round((p.price_paise * Number(p.commission_pct)) / 100);

  return (
    <>
      <Flash params={flash} />
      <Link href="/admin/review" className="text-sm text-ink-soft hover:text-ink">← Back to the review queue</Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-5">
          <ProductCover cover={p.cover_path} art={p.art} title={p.title} format={p.format} className="aspect-[4/3] rounded-2xl" />
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Seller</p>
            <p className="mt-2 font-display text-xl">{p.seller_profiles?.brand_name || "Unnamed brand"}</p>
            <p className="text-sm text-ink-soft">{owner?.full_name} · {owner?.email}</p>
            <p className="mt-1 text-xs text-ink-soft">Joined {owner ? shortDate(owner.created_at) : ""} · {otherLive ?? 0} live products</p>
            <p className="mt-3"><StatusBadge status={owner?.status ?? "pending"} /></p>
            {owner && owner.status !== "active" ? (
              <form action={adminSetUser} className="mt-3">
                <input type="hidden" name="user_id" value={owner.id} />
                <input type="hidden" name="back" value={`/admin/review/${p.id}`} />
                <SubmitButton name="status" value="active" className={smallButton("outline")}>Approve this seller</SubmitButton>
              </form>
            ) : null}
          </Card>
        </div>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-ink-soft">{p.hubs?.name} · submitted {shortDate(p.created_at)}</p>
              <h2 className="mt-1 text-3xl">{p.title}</h2>
            </div>
            <StatusBadge status={p.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="success">{formatINR(p.price_paise)}</Badge>
            <Badge>{Number(p.commission_pct)}% commission · {formatINR(commission)} a sale</Badge>
            <Badge>{Number(p.promo_discount_pct) > 0 ? `${Number(p.promo_discount_pct)}% promo discount` : "No promo discount"}</Badge>
            <Badge>{p.join_mode === "apply" ? "Influencers apply" : "Open to all influencers"}</Badge>
          </div>

          <dl className="mt-6">
            <Row label="Summary">{p.summary || <span className="text-ink-soft">None</span>}</Row>
            <Row label="Description"><span className="whitespace-pre-line">{p.description || "None"}</span></Row>
            <Row label="What is included">
              {p.includes.length ? (
                <ul className="flex flex-wrap gap-2">{p.includes.map((i) => <li key={i} className="rounded-full border border-line px-3 py-1 text-xs">{i}</li>)}</ul>
              ) : "Nothing listed"}
            </Row>
            <Row label="Licence">{p.license_text || "None"}</Row>
            <Row label="Brief for influencers">{p.brief_text || "None"}</Row>
            <Row label="Product file">
              {(files ?? []).length === 0 ? (
                <span className="text-alert">No file uploaded</span>
              ) : (
                <span className="flex flex-wrap gap-2">
                  {(files ?? []).map((f) => (
                    <form key={f.id} action={downloadFile}>
                      <input type="hidden" name="file_id" value={f.id} />
                      <input type="hidden" name="back" value={`/admin/review/${p.id}`} />
                      <SubmitButton className={smallButton("outline")}>Download {f.file_name} ({(f.size_bytes / 1048576).toFixed(1)} MB)</SubmitButton>
                    </form>
                  ))}
                </span>
              )}
            </Row>
          </dl>

          <div className="mt-2 border-t border-line pt-6">
            {waiting ? (
              <form action={adminReviewProduct}>
                <input type="hidden" name="product_id" value={p.id} />
                <label className="block text-sm font-medium">
                  Reason (shown to the seller if you reject)
                  <input name="reason" maxLength={300} placeholder="For example: the preview does not match the file" className={inputClass} />
                </label>
                <div className="mt-4 flex flex-wrap gap-3">
                  <SubmitButton name="decision" value="approve" className={smallButton("primary", "min-h-11 px-6 text-sm")}>Approve and publish</SubmitButton>
                  <SubmitButton name="decision" value="reject" className={smallButton("danger", "min-h-11 px-6 text-sm")}>Reject</SubmitButton>
                </div>
              </form>
            ) : (
              <Notice>This listing is not waiting for review. {p.status === "published" ? <Link href={`/products/${p.slug}`} className="underline">See the live page</Link> : null}</Notice>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
