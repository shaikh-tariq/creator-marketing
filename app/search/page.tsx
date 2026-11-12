import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { Container, Empty, buttonClass, inputClass } from "@/components/ui";
import { listProducts } from "@/lib/data";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await listProducts({ q });

  return (
    <Container className="py-12">
      <h1 className="text-5xl">{q ? `Results for “${q}”` : "All products"}</h1>
      <form className="mt-6 flex max-w-lg gap-2">
        <input name="q" defaultValue={q} placeholder="Search templates, presets, kits…" aria-label="Search products" className={`${inputClass} mt-0 rounded-full px-5`} />
        <button className={buttonClass("primary", "shrink-0")}>Search</button>
      </form>
      {products.length === 0 ? (
        <div className="mt-10"><Empty title="No matches" text="Try a shorter or different word, or browse the hubs from the menu." /></div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Container>
  );
}
