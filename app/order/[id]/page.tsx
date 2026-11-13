import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { downloadFile } from "@/app/actions";
import { PrintButton, SubmitButton } from "@/components/client-bits";
import { ButtonLink, Container, Flash, Notice, StatusBadge, buttonClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Receipt" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

const fullDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const flash = await searchParams;
  const profile = await requireRole(["buyer", "seller", "influencer", "admin"]);
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, product_id, buyer_id, buyer_email, seller_id, list_price_paise, discount_paise, net_paise, status, payment_ref, is_test, created_at, terms_snapshot, products(title, slug, format)")
    .eq("id", id)
    .maybeSingle();
  if (!order || order.buyer_id !== profile.id) notFound();

  const product = order.products as unknown as { title: string; slug: string; format: string };
  const [{ data: files }, { data: seller }, { data: gstSetting }] = await Promise.all([
    supabase.from("product_files").select("id, file_name, size_bytes").eq("product_id", order.product_id),
    supabase.from("seller_profiles").select("brand_name, gstin").eq("user_id", order.seller_id).maybeSingle(),
    supabase.from("settings").select("value").eq("key", "gst_rate_pct").maybeSingle(),
  ]);
  const paid = order.status === "paid";
  const terms = order.terms_snapshot as { promo_code?: string | null; discount_pct?: number };

  // GST is shown only when the seller has given a GST number. The price already includes it.
  const gstRate = Number(gstSetting?.value ?? 18);
  const hasGst = Boolean(seller?.gstin);
  const taxable = hasGst ? Math.round(order.net_paise / (1 + gstRate / 100)) : order.net_paise;
  const gst = order.net_paise - taxable;
  const receiptNo = `CM-${new Date(order.created_at).getFullYear()}-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <div className="print:hidden">
        <Flash params={flash} />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">{paid ? "Payment received" : "Order refunded"}</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{paid ? "Thank you. Your files are ready." : "This order was refunded."}</h1>

        {paid ? (
          <div className="mt-6 space-y-3">
            {(files ?? []).length === 0 ? (
              <Notice>The seller has not attached a file to this listing yet (demo listing).</Notice>
            ) : (
              (files ?? []).map((f) => (
                <form key={f.id} action={downloadFile}>
                  <input type="hidden" name="file_id" value={f.id} />
                  <input type="hidden" name="back" value={`/order/${order.id}`} />
                  <SubmitButton className={buttonClass("primary", "h-12 w-full text-base")}>Download {f.file_name}</SubmitButton>
                </form>
              ))
            )}
          </div>
        ) : null}
      </div>

      {/* The receipt */}
      <article className="mt-8 overflow-hidden rounded-3xl border border-line bg-card shadow-sm print:mt-0 print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 bg-ink p-6 text-white sm:p-8">
          <div>
            <p className="font-display text-2xl font-semibold">
              Creator <span className="text-sky">Marketing</span>
            </p>
            <p className="mt-1 text-sm text-white/70">Receipt</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono">{receiptNo}</p>
            <p className="mt-1 text-white/70">{fullDate(order.created_at)}</p>
            <p className="mt-2 inline-block"><StatusBadge status={order.status} /></p>
          </div>
        </header>

        <div className="grid gap-6 border-b border-line p-6 text-sm sm:grid-cols-2 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Billed to</p>
            <p className="mt-2 font-medium">{profile.full_name ?? "Buyer"}</p>
            <p className="text-ink-soft">{order.buyer_email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Sold by</p>
            <p className="mt-2 font-medium">{seller?.brand_name || "Independent seller"}</p>
            <p className="text-ink-soft">{hasGst ? `GSTIN ${seller!.gstin}` : "Not registered for GST"}</p>
            <p className="mt-1 text-xs text-ink-soft">Sold through {site.name}</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
                <th className="pb-3 font-semibold">Item</th>
                <th className="pb-3 text-center font-semibold">Qty</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="py-4">
                  <p className="font-medium">{product.title}</p>
                  <p className="text-xs text-ink-soft">Digital download{product.format ? ` · ${product.format}` : ""} · single-user licence</p>
                </td>
                <td className="py-4 text-center tabular-nums">1</td>
                <td className="py-4 text-right tabular-nums">{formatINR(order.list_price_paise)}</td>
              </tr>
            </tbody>
          </table>

          <dl className="ml-auto mt-5 max-w-xs space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Price</dt><dd className="tabular-nums">{formatINR(order.list_price_paise)}</dd></div>
            {order.discount_paise > 0 ? (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Promo code {terms.promo_code}{terms.discount_pct ? ` (${Number(terms.discount_pct)}% off)` : ""}</dt>
                <dd className="tabular-nums text-success">− {formatINR(order.discount_paise)}</dd>
              </div>
            ) : null}
            {hasGst ? (
              <>
                <div className="flex justify-between border-t border-line pt-2.5"><dt className="text-ink-soft">Taxable value</dt><dd className="tabular-nums">{formatINR(taxable)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-soft">GST at {gstRate}% (included)</dt><dd className="tabular-nums">{formatINR(gst)}</dd></div>
              </>
            ) : (
              <div className="flex justify-between border-t border-line pt-2.5"><dt className="text-ink-soft">GST</dt><dd className="text-ink-soft">Not charged</dd></div>
            )}
            <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
              <dt className="font-semibold">Total paid</dt>
              <dd className="font-display text-3xl font-semibold tabular-nums">{formatINR(order.net_paise)}</dd>
            </div>
          </dl>
        </div>

        <footer className="grid gap-4 border-t border-line bg-paper p-6 text-xs leading-relaxed text-ink-soft sm:grid-cols-2 sm:p-8">
          <div>
            <p className="font-semibold text-ink">Payment</p>
            <p className="mt-1">Reference {order.payment_ref}</p>
            <p>{order.is_test ? "Test payment. No money was taken." : "Paid online"}</p>
          </div>
          <div>
            <p className="font-semibold text-ink">Good to know</p>
            <p className="mt-1">Digital products are final sale. If a file is missing, broken or not as described, write to {site.supportEmail}.</p>
          </div>
        </footer>
      </article>

      <div className="mt-8 flex flex-wrap gap-3 print:hidden">
        <PrintButton className={buttonClass("outline")}>Print or save as PDF</PrintButton>
        <ButtonLink href="/library" variant="outline">Go to my library</ButtonLink>
        <ButtonLink href="/search">Keep browsing</ButtonLink>
      </div>
    </Container>
  );
}
