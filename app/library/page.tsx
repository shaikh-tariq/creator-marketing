import type { Metadata } from "next";
import Link from "next/link";
import { addReview, downloadFile } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { ProductCover } from "@/components/product-card";
import { ButtonLink, Container, Empty, Flash, StatusBadge, inputClass, smallButton, textareaClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My library" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  // Sellers and influencers can buy too, so every role has a library.
  const profile = await requireRole(["buyer", "seller", "influencer", "admin"]);
  const supabase = await createClient();

  const { data: ordersData } = await supabase
    .from("orders")
    .select("id, product_id, net_paise, status, payment_ref, created_at, products(title, slug, art, cover_path, format)")
    .eq("buyer_id", profile.id)
    .order("created_at", { ascending: false });
  const orders = ordersData ?? [];
  const productIds = orders.map((o) => o.product_id);
  const [filesRes, reviewsRes] = await Promise.all([
    productIds.length ? supabase.from("product_files").select("id, product_id, file_name").in("product_id", productIds) : Promise.resolve({ data: [] }),
    supabase.from("reviews").select("order_id, rating").eq("buyer_id", profile.id),
  ]);
  const files = filesRes.data ?? [];
  const reviewed = Object.fromEntries((reviewsRes.data ?? []).map((r) => [r.order_id, r.rating]));

  return (
    <Container className="py-10 sm:py-12">
      <Flash params={flash} />
      <div className="border-b border-line pb-6">
        <h1 className="text-4xl sm:text-5xl">My library</h1>
        <p className="mt-3 text-sm text-ink-soft">Everything you have bought, ready to download any time.</p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8">
          <Empty title="Nothing here yet" text="Products you buy appear here with a fresh download link.">
            <ButtonLink href="/search">Browse products</ButtonLink>
          </Empty>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {orders.map((o) => {
            const product = o.products as unknown as { title: string; slug: string; art: number; cover_path: string | null; format: string };
            const mine = files.filter((f) => f.product_id === o.product_id);
            const paid = o.status === "paid";
            return (
              <li key={o.id} className="grid gap-5 rounded-2xl border border-line bg-card p-5 sm:grid-cols-[10rem_1fr]">
                <ProductCover cover={product.cover_path} art={product.art} title={product.title} format={product.format} className="aspect-[4/3] rounded-xl" />
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/products/${product.slug}`} className="font-display text-2xl hover:underline">{product.title}</Link>
                      <p className="mt-1 text-xs text-ink-soft">
                        {shortDate(o.created_at)} · {formatINR(o.net_paise)} · <Link href={`/order/${o.id}`} className="underline">Receipt</Link>
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  {paid ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {mine.length === 0 ? (
                        <p className="text-sm text-ink-soft">No file attached to this listing yet (demo listing).</p>
                      ) : (
                        mine.map((f) => (
                          <form key={f.id} action={downloadFile}>
                            <input type="hidden" name="file_id" value={f.id} />
                            <input type="hidden" name="back" value="/library" />
                            <SubmitButton className={smallButton("primary")}>Download {f.file_name}</SubmitButton>
                          </form>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-ink-soft">This order was refunded, so the download is switched off.</p>
                  )}

                  {paid ? (
                    reviewed[o.id] ? (
                      <p className="mt-4 text-sm text-ink-soft">You rated this {reviewed[o.id]} out of 5. Thank you.</p>
                    ) : (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm underline">Write a review</summary>
                        <form action={addReview} className="mt-3 max-w-md space-y-3">
                          <input type="hidden" name="order_id" value={o.id} />
                          <input type="hidden" name="product_id" value={o.product_id} />
                          <select name="rating" required defaultValue="5" aria-label="Rating" className={`${inputClass} mt-0`}>
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={n}>{n} out of 5</option>
                            ))}
                          </select>
                          <textarea name="body" rows={3} maxLength={2000} placeholder="What was good, what could be better?" className={`${textareaClass} mt-0`} />
                          <SubmitButton className={smallButton("outline")}>Post review</SubmitButton>
                        </form>
                      </details>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
