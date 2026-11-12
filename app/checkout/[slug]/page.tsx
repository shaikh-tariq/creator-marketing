import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { placeOrder } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { ProductArt, sellerName } from "@/components/product-card";
import { ButtonLink, Container, Notice, buttonClass, inputClass } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { getProductBySlug } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Checkout" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ code?: string; error?: string }> };

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { code = "", error } = await searchParams;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "published") notFound();

  const profile = await getProfile();
  const supabase = await createClient();
  const ref = (await cookies()).get("cm_ref")?.value ?? null;
  const { data: quote, error: quoteError } = await supabase.rpc("checkout_quote", {
    p_product: product.id,
    p_code: code || null,
    p_ref: ref,
  });
  if (quoteError || !quote) notFound();

  const codeApplied = Boolean(quote.promo_code);

  return (
    <Container className="max-w-4xl py-10 sm:py-14">
      <Link href={`/products/${product.slug}`} className="text-sm text-ink-soft hover:text-ink">← Back to product</Link>
      <h1 className="mt-4 text-5xl">Checkout</h1>

      <div className="mt-5 space-y-3">
        <Notice>
          Test mode. No money is taken. Pressing pay creates a real order, download and earnings split so the whole
          flow can be tested before a payment gateway is connected.
        </Notice>
        {error ? <Notice>{error}</Notice> : null}
        {quote.code_error ? <Notice>{quote.code_error}</Notice> : null}
        {codeApplied ? <Notice tone="moss">Code {quote.promo_code} applied: {Number(quote.discount_pct)}% off.</Notice> : null}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1fr]">
        <div className="flex gap-4 rounded-2xl border border-line bg-card p-5 md:flex-col">
          <ProductArt art={product.art} className="aspect-[4/3] w-28 shrink-0 rounded-xl md:w-full" />
          <div>
            <h2 className="text-2xl leading-snug">{product.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">by {sellerName(product)}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">Instant download after payment. Final sale.</p>
          </div>
        </div>

        <div>
          <form className="flex gap-2">
            <input name="code" defaultValue={code} placeholder="Promo code" aria-label="Promo code" className={`${inputClass} mt-0 uppercase`} />
            <button className={buttonClass("outline", "shrink-0")}>Apply</button>
          </form>

          <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card px-5 text-sm">
            <div className="flex justify-between py-3.5">
              <dt className="text-ink-soft">Price</dt>
              <dd className="tabular-nums">{formatINR(quote.list_price_paise)}</dd>
            </div>
            {quote.discount_paise > 0 ? (
              <div className="flex justify-between py-3.5">
                <dt className="text-ink-soft">Promo discount</dt>
                <dd className="tabular-nums text-moss">− {formatINR(quote.discount_paise)}</dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between py-4">
              <dt className="font-medium">Total</dt>
              <dd className="font-display text-3xl tabular-nums">{formatINR(quote.net_paise)}</dd>
            </div>
          </dl>

          {profile ? (
            <form action={placeOrder} className="mt-6">
              <input type="hidden" name="product_id" value={product.id} />
              <input type="hidden" name="slug" value={product.slug} />
              <input type="hidden" name="code" value={codeApplied ? code : ""} />
              <SubmitButton className={buttonClass("primary", "h-12 w-full")}>
                Pay {formatINR(quote.net_paise)} (test payment)
              </SubmitButton>
              <p className="mt-3 text-xs text-ink-soft">Buying as {profile.email}. The file is added to your library.</p>
            </form>
          ) : (
            <div className="mt-6">
              <ButtonLink href={`/login?next=${encodeURIComponent(`/checkout/${product.slug}${code ? `?code=${code}` : ""}`)}`} className="h-12 w-full">
                Log in to buy
              </ButtonLink>
              <p className="mt-3 text-xs text-ink-soft">
                New here? <Link href="/signup?role=buyer" className="underline">Create a buyer account</Link>, then come back to this page.
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
