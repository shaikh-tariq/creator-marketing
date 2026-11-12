import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Badge, ButtonLink, Container, Empty, Eyebrow, buttonClass, inputClass } from "@/components/ui";
import { listProducts } from "@/lib/data";
import { hubs } from "@/lib/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: hubs.find((h) => h.slug === slug)?.name ?? "Hub" };
}

export default async function HubPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { q } = await searchParams;
  const hub = hubs.find((h) => h.slug === slug);
  if (!hub) notFound();

  if (hub.status === "coming_soon") {
    return (
      <Container className="py-20 sm:py-28">
        <Badge>Coming soon</Badge>
        <h1 className="mt-6 max-w-2xl text-5xl leading-tight sm:text-6xl">{hub.name}</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          {hub.blurb} This hub opens after the first two have steady sales.
        </p>
        <ul className="mt-8 flex flex-wrap gap-2">
          {hub.examples.map((e) => (
            <li key={e} className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft">{e}</li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/signup?role=seller">Create a seller account now</ButtonLink>
          <ButtonLink href="/" variant="outline">See the open hubs</ButtonLink>
        </div>
      </Container>
    );
  }

  const products = await listProducts({ hubSlug: hub.slug, q });

  return (
    <>
      <section className="border-b border-line bg-paper-deep">
        <Container className="py-14 sm:py-20">
          <Eyebrow>Hub</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-5xl leading-tight sm:text-6xl">{hub.name}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{hub.blurb}</p>
        </Container>
      </section>

      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <p className="text-sm text-ink-soft">
            {products.length} {products.length === 1 ? "product" : "products"}
            {q ? ` matching “${q}”` : ""}
          </p>
          <form className="flex w-full max-w-sm gap-2 sm:w-auto">
            <input name="q" defaultValue={q} placeholder="Search this hub" aria-label="Search this hub" className={`${inputClass} mt-0 rounded-full px-5`} />
            <button className={buttonClass("outline", "shrink-0")}>Search</button>
          </form>
        </div>
        {products.length === 0 ? (
          <div className="mt-8">
            <Empty title="Nothing here yet" text={q ? "No products match that search. Try a shorter word." : "The first sellers are being onboarded."}>
              <ButtonLink href={`/hubs/${hub.slug}`} variant="outline">Clear search</ButtonLink>
            </Empty>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
