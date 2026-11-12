import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { joinProduct } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { ProductArt, sellerName } from "@/components/product-card";
import { Badge, ButtonLink, Container, Notice, StatusBadge, buttonClass, inputClass } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { getProductBySlug, shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { platforms, site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.title ?? "Product", description: product?.summary };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error } = await searchParams;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const profile = await getProfile();
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })
    .limit(20);

  let owned = false;
  let joined = false;
  if (profile) {
    const [o, j] = await Promise.all([
      supabase.from("orders").select("id").eq("product_id", product.id).eq("buyer_id", profile.id).eq("status", "paid").limit(1),
      supabase.from("joins").select("id").eq("product_id", product.id).eq("influencer_id", profile.id).limit(1),
    ]);
    owned = (o.data?.length ?? 0) > 0;
    joined = (j.data?.length ?? 0) > 0;
  }

  const live = product.status === "published";
  const isOwner = profile?.id === product.seller_id;
  const commissionPaise = Math.round((product.price_paise * Number(product.commission_pct)) / 100);
  const list = reviews ?? [];
  const average = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  return (
    <Container className="py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span>{" "}
        {product.hubs ? <Link href={`/hubs/${product.hubs.slug}`} className="hover:text-ink">{product.hubs.name}</Link> : null}
      </nav>

      {error ? <div className="mt-4"><Notice>{error}</Notice></div> : null}
      {!live ? (
        <div className="mt-4">
          <Notice>This product is not live for buyers. Status: <StatusBadge status={product.status} /></Notice>
        </div>
      ) : null}

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <ProductArt art={product.art} format={product.format} className="aspect-[4/3] rounded-2xl" />

          {product.description ? (
            <section className="mt-10 border-t border-line pt-8">
              <h2 className="text-2xl">About this product</h2>
              <p className="mt-4 max-w-2xl whitespace-pre-line leading-relaxed text-ink-soft">{product.description}</p>
            </section>
          ) : null}

          {product.includes.length > 0 ? (
            <section className="mt-10 border-t border-line pt-8">
              <h2 className="text-2xl">What is included</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {product.includes.map((item) => (
                  <li key={item} className="rounded-xl border border-line bg-card px-4 py-3 text-sm">{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-10 border-t border-line pt-8">
            <h2 className="text-2xl">Licence and delivery</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
              {product.license_text || "Single-user licence."} Instant download after payment, also saved in your
              library. Digital products are final sale; if a file is missing, broken or not as described, write to{" "}
              {site.supportEmail}.
            </p>
          </section>

          <section className="mt-10 border-t border-line pt-8">
            <h2 className="text-2xl">
              Reviews{" "}
              {list.length > 0 ? <span className="text-base text-ink-soft">· {average.toFixed(1)} out of 5 from {list.length}</span> : null}
            </h2>
            {list.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">No reviews yet. Only buyers can leave one.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {list.map((r) => (
                  <li key={r.id} className="rounded-xl border border-line bg-card p-4">
                    <p className="text-sm">
                      <span aria-label={`${r.rating} out of 5`} className="text-clay">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                      <span className="ml-3 text-xs text-ink-soft">Verified buyer · {shortDate(r.created_at)}</span>
                    </p>
                    {r.body ? <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.body}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {product.format ? <Badge tone="moss">{product.format}</Badge> : null}
          <h1 className="mt-4 text-4xl leading-tight">{product.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">by {sellerName(product)}</p>
          <p className="mt-5 text-base leading-relaxed text-ink-soft">{product.summary}</p>

          <div className="mt-7 rounded-2xl border border-line bg-card p-6">
            <p className="font-display text-4xl">{formatINR(product.price_paise)}</p>
            {owned ? (
              <ButtonLink href="/library" className="mt-5 w-full">In your library · Download</ButtonLink>
            ) : isOwner ? (
              <ButtonLink href={`/seller/products/${product.id}`} variant="outline" className="mt-5 w-full">Edit this product</ButtonLink>
            ) : live ? (
              <ButtonLink href={`/checkout/${product.slug}`} className="mt-5 w-full">Buy now</ButtonLink>
            ) : (
              <span className={buttonClass("primary", "mt-5 w-full opacity-40")}>Not available</span>
            )}
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">Have a creator&apos;s promo code? Enter it at checkout.</p>
          </div>

          <div className="mt-5 rounded-2xl bg-paper-deep p-6">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-clay">For influencers</p>
            <p className="mt-3 font-display text-2xl">
              Earn {Number(product.commission_pct)}% · up to {formatINR(commissionPaise)} a sale
            </p>
            {product.brief_text ? (
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">Brief:</span> {product.brief_text}
              </p>
            ) : null}
            {Number(product.promo_discount_pct) > 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Your code gives buyers {Number(product.promo_discount_pct)}% off.</p>
            ) : null}
            <p className="mt-3 text-xs text-ink-soft">Post on {platforms.map((p) => p.name).join(", ")}.</p>

            {joined ? (
              <ButtonLink href="/influencer/joins" variant="outline" className="mt-5 w-full">You have joined · Open my joins</ButtonLink>
            ) : profile?.role === "influencer" && live ? (
              <form action={joinProduct} className="mt-5">
                <input type="hidden" name="product_id" value={product.id} />
                <input type="hidden" name="back" value={`/products/${product.slug}`} />
                {product.join_mode === "apply" ? (
                  <input name="pitch" maxLength={500} placeholder="One line on why you are a fit (optional)" className={`${inputClass} mb-3 mt-0`} />
                ) : null}
                <SubmitButton className={buttonClass("accent", "w-full")}>
                  {product.join_mode === "apply" ? "Apply to promote" : "Join to promote"}
                </SubmitButton>
              </form>
            ) : !profile ? (
              <ButtonLink href="/signup?role=influencer" variant="accent" className="mt-5 w-full">Join to promote</ButtonLink>
            ) : (
              <p className="mt-4 text-xs text-ink-soft">Promoting needs an influencer account.</p>
            )}
          </div>

          <div className="mt-5">
            <Notice>Own this design and did not list it? Email {site.supportEmail} for a takedown review.</Notice>
          </div>
        </aside>
      </div>
    </Container>
  );
}
