import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Badge, ButtonLink, Container, Eyebrow } from "@/components/ui";
import { productsInHub } from "@/lib/sample-data";
import { hubs } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return hubs.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hub = hubs.find((h) => h.slug === slug);
  return { title: hub?.name ?? "Hub" };
}

export default async function HubPage({ params }: Props) {
  const { slug } = await params;
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
            <li key={e} className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft">
              {e}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/signup?role=seller">Create a seller account now</ButtonLink>
          <ButtonLink href="/" variant="outline">
            See the open hubs
          </ButtonLink>
        </div>
      </Container>
    );
  }

  const products = productsInHub(hub.slug);

  return (
    <>
      <section className="border-b border-line bg-paper-deep">
        <Container className="py-14 sm:py-20">
          <Eyebrow>Hub</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-5xl leading-tight sm:text-6xl">{hub.name}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{hub.blurb}</p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {hub.examples.map((e) => (
              <li key={e} className="rounded-full border border-ink/20 bg-paper px-3 py-1 text-sm">
                {e}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="py-12">
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <p className="text-sm text-ink-soft">{products.length} sample listings</p>
          <p className="text-sm text-ink-soft">Search and filters arrive with real listings</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Container>
    </>
  );
}
