import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductArt } from "@/components/product-card";
import { Badge, ButtonLink, Container, Notice } from "@/components/ui";
import { formatINR } from "@/lib/money";
import { sampleProducts } from "@/lib/sample-data";
import { hubs, platforms, site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sampleProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = sampleProducts.find((p) => p.slug === slug);
  return { title: product?.title ?? "Product", description: product?.summary };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = sampleProducts.find((p) => p.slug === slug);
  if (!product) notFound();
  const hub = hubs.find((h) => h.slug === product.hubSlug)!;
  const commissionPaise = Math.round((product.pricePaise * product.commissionPct) / 100);

  return (
    <Container className="py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span>{" "}
        <Link href={`/hubs/${hub.slug}`} className="hover:text-ink">{hub.name}</Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <ProductArt product={product} className="aspect-[4/3] rounded-2xl" />
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <ProductArt
                key={i}
                product={{ ...product, art: ((product.art + i) % 4) as 0 | 1 | 2 | 3 }}
                className="aspect-[4/3] rounded-xl"
              />
            ))}
          </div>

          <section className="mt-12 border-t border-line pt-8">
            <h2 className="text-2xl">What is included</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {product.includes.map((item) => (
                <li key={item} className="rounded-xl border border-line bg-card px-4 py-3 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12 border-t border-line pt-8">
            <h2 className="text-2xl">Licence and delivery</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
              Instant download after payment, also saved in your library. Digital products are final sale. If a
              file is missing, broken or not as described, write to {site.supportEmail} and it will be fixed or
              refunded.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-2">
            <Badge>Sample listing</Badge>
            <Badge tone="moss">{product.format}</Badge>
          </div>
          <h1 className="mt-4 text-4xl leading-tight">{product.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">by {product.seller}</p>
          <p className="mt-5 text-base leading-relaxed text-ink-soft">{product.summary}</p>

          <div className="mt-7 rounded-2xl border border-line bg-card p-6">
            <p className="font-display text-4xl">{formatINR(product.pricePaise)}</p>
            <label htmlFor="promo" className="mt-5 block text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
              Promo code
            </label>
            <input
              id="promo"
              disabled
              placeholder="From a creator's post"
              className="mt-2 h-11 w-full rounded-full border border-line bg-paper px-4 text-sm"
            />
            <button
              disabled
              className="mt-4 h-12 w-full cursor-not-allowed rounded-full bg-ink/40 text-sm font-medium text-paper"
            >
              Buy now
            </button>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Checkout opens once the payment gateway is connected (Milestone M2).
            </p>
          </div>

          <div className="mt-5 rounded-2xl bg-paper-deep p-6">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-clay">For influencers</p>
            <p className="mt-3 font-display text-2xl">
              Earn {product.commissionPct}% · up to {formatINR(commissionPaise)} a sale
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">Brief:</span> {product.brief}
            </p>
            {product.promoDiscountPct > 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Your code gives buyers {product.promoDiscountPct}% off.</p>
            ) : null}
            <p className="mt-3 text-xs text-ink-soft">Post on {platforms.map((p) => p.name).join(", ")}.</p>
            <ButtonLink href="/signup?role=influencer" variant="accent" className="mt-5 w-full">
              Join to promote
            </ButtonLink>
          </div>

          <div className="mt-5">
            <Notice>
              Own this design and did not list it? Email {site.supportEmail} for a takedown review.
            </Notice>
          </div>
        </aside>
      </div>
    </Container>
  );
}
