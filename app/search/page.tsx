import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Container, Empty, buttonClass, inputClass } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { listProducts } from "@/lib/data";
import { liveHubs } from "@/lib/site";

export const metadata: Metadata = { title: "Browse products" };

// The product browse page. It is also the home page for buyers after they log in.
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; hub?: string }> }) {
  const { q, hub } = await searchParams;
  const [products, profile] = await Promise.all([listProducts({ q, hubSlug: hub || undefined }), getProfile()]);
  const first = profile?.full_name?.split(" ")[0];
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-all active:scale-[0.97] ${
      active ? "border-ink bg-ink text-white" : "border-line bg-card text-ink-soft hover:border-ink/40 hover:text-ink"
    }`;
  const withQ = (base: string) => (q ? `${base}${base.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}` : base);

  return (
    <Container className="py-10 sm:py-12">
      <h1 className="text-4xl sm:text-5xl">
        {q ? `Results for “${q}”` : profile?.role === "buyer" && first ? `Welcome, ${first}. What are you making today?` : "Browse products"}
      </h1>
      <form className="mt-6 flex max-w-xl items-center gap-2">
        {hub ? <input type="hidden" name="hub" value={hub} /> : null}
        <input name="q" defaultValue={q} placeholder="Search templates, presets, kits…" aria-label="Search products" className={`${inputClass} mt-0 rounded-full px-5 shadow-sm`} />
        <button className={buttonClass("primary", "shrink-0")}>Search</button>
      </form>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={withQ("/search")} className={chip(!hub)}>All</Link>
        {liveHubs.map((h) => (
          <Link key={h.slug} href={withQ(`/search?hub=${h.slug}`)} className={chip(hub === h.slug)}>{h.name}</Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="mt-10">
          <Empty title="No matches" text="Try a shorter or different word, or clear the filters.">
            <Link href="/search" className={buttonClass("outline")}>Show everything</Link>
          </Empty>
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm text-ink-soft">{products.length} {products.length === 1 ? "product" : "products"}</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </Container>
  );
}
