import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { downloadFile } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { ButtonLink, Container, Flash, Notice, StatusBadge, buttonClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Order" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const flash = await searchParams;
  const profile = await requireRole(["buyer", "seller", "influencer", "admin"]);
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, product_id, buyer_id, list_price_paise, discount_paise, net_paise, status, payment_ref, is_test, created_at, products(title, slug)")
    .eq("id", id)
    .maybeSingle();
  if (!order || order.buyer_id !== profile.id) notFound();

  const product = order.products as unknown as { title: string; slug: string };
  const { data: files } = await supabase.from("product_files").select("id, file_name, size_bytes").eq("product_id", order.product_id);
  const paid = order.status === "paid";

  return (
    <Container className="max-w-2xl py-12 sm:py-16">
      <Flash params={flash} />
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-success">{paid ? "Payment received" : "Order"}</p>
      <h1 className="mt-4 text-5xl leading-tight">{paid ? "Thank you. Your files are ready." : "This order was refunded."}</h1>

      <div className="mt-8 rounded-2xl border border-line bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl">{product.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{shortDate(order.created_at)} · Ref {order.payment_ref}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <dl className="mt-5 divide-y divide-line text-sm">
          <div className="flex justify-between py-3"><dt className="text-ink-soft">Price</dt><dd>{formatINR(order.list_price_paise)}</dd></div>
          {order.discount_paise > 0 ? (
            <div className="flex justify-between py-3"><dt className="text-ink-soft">Promo discount</dt><dd>− {formatINR(order.discount_paise)}</dd></div>
          ) : null}
          <div className="flex justify-between py-3 font-medium"><dt>Paid</dt><dd>{formatINR(order.net_paise)}</dd></div>
        </dl>

        {paid ? (
          <div className="mt-6 space-y-3">
            {(files ?? []).length === 0 ? (
              <Notice>The seller has not attached a file to this listing yet (demo listing).</Notice>
            ) : (
              (files ?? []).map((f) => (
                <form key={f.id} action={downloadFile}>
                  <input type="hidden" name="file_id" value={f.id} />
                  <input type="hidden" name="back" value={`/order/${order.id}`} />
                  <SubmitButton className={buttonClass("primary", "w-full")}>Download {f.file_name}</SubmitButton>
                </form>
              ))
            )}
          </div>
        ) : null}
      </div>

      {order.is_test ? <p className="mt-4 text-xs text-ink-soft">Test order. No money was taken.</p> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/library" variant="outline">Go to my library</ButtonLink>
        <ButtonLink href="/" variant="outline">Keep browsing</ButtonLink>
      </div>
    </Container>
  );
}
