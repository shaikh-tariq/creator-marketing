import Link from "next/link";
import { coverUrl } from "@/lib/media";
import { formatINR } from "@/lib/money";
import type { Product } from "@/lib/types";

// Cover art drawn in CSS from four colour schemes. Used when a seller has not uploaded their own cover image.
const artStyles = [
  { bg: "bg-[#dbe7ff]", a: "bg-[#2f62d8]", b: "bg-[#ffffff]", c: "bg-[#0f172a]" },
  { bg: "bg-[#fff1c2]", a: "bg-[#0f172a]", b: "bg-[#ffd45a]", c: "bg-[#2f62d8]" },
  { bg: "bg-[#dff3ea]", a: "bg-[#17805a]", b: "bg-[#ffffff]", c: "bg-[#0f172a]" },
  { bg: "bg-[#e8e3ff]", a: "bg-[#6a58d6]", b: "bg-[#ffffff]", c: "bg-[#0f172a]" },
];

export function ProductArt({ art, format, className = "" }: { art: number; format?: string; className?: string }) {
  const s = artStyles[((art % 4) + 4) % 4];
  return (
    <div aria-hidden className={`relative overflow-hidden ${s.bg} ${className}`}>
      <div className={`absolute left-[12%] top-[16%] h-[62%] w-[44%] -rotate-6 rounded-md shadow-lg ${s.b}`}>
        <div className={`m-[10%] h-[34%] rounded-sm ${s.a}`} />
        <div className="mx-[10%] h-1 w-[60%] rounded bg-black/25" />
        <div className="mx-[10%] mt-1.5 h-1 w-[40%] rounded bg-black/15" />
      </div>
      <div className={`absolute right-[10%] top-[24%] h-[62%] w-[44%] rotate-3 rounded-md shadow-xl ${s.a}`}>
        <div className={`m-[10%] h-[46%] rounded-sm ${s.b} opacity-90`} />
        <div className={`mx-[10%] h-1.5 w-[50%] rounded ${s.c} opacity-70`} />
      </div>
      {format ? (
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-medium tracking-wide text-paper">
          {format}
        </span>
      ) : null}
    </div>
  );
}

// The seller's uploaded cover image if there is one, otherwise the cover style they picked.
export function ProductCover({
  cover,
  art,
  title = "",
  format,
  className = "",
}: {
  cover?: string | null;
  art: number;
  title?: string;
  format?: string;
  className?: string;
}) {
  const url = coverUrl(cover);
  if (!url) return <ProductArt art={art} format={format} className={className} />;
  return (
    <div className={`relative overflow-hidden bg-paper-deep ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={title} loading="lazy" className="size-full object-cover" />
      {format ? (
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-medium tracking-wide text-paper">
          {format}
        </span>
      ) : null}
    </div>
  );
}

export function sellerName(product: Product) {
  return product.seller_profiles?.brand_name || "Independent seller";
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-card"
    >
      <ProductCover cover={product.cover_path} art={product.art} title={product.title} format={product.format} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs text-ink-soft">by {sellerName(product)}</span>
        <h3 className="mt-2 text-xl leading-snug group-hover:text-accent-deep">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{product.summary}</p>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between border-t border-line pt-4">
            <span className="font-display text-2xl">{formatINR(product.price_paise)}</span>
            <span className="text-xs text-success">Influencers earn {Number(product.commission_pct)}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
