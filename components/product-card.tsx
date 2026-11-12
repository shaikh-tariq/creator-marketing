import Link from "next/link";
import { formatINR } from "@/lib/money";
import type { SampleProduct } from "@/lib/sample-data";
import { Badge } from "./ui";

// Placeholder cover art drawn in CSS, so the layout can be judged before real preview images exist.
const artStyles = [
  { bg: "bg-[#d9c7a5]", a: "bg-[#a84a24]", b: "bg-[#fbf9f4]", c: "bg-[#211d18]" },
  { bg: "bg-[#c9b8a0]", a: "bg-[#45563a]", b: "bg-[#f5f1e8]", c: "bg-[#a84a24]" },
  { bg: "bg-[#e3dccb]", a: "bg-[#211d18]", b: "bg-[#dcc9a3]", c: "bg-[#45563a]" },
  { bg: "bg-[#bfa98a]", a: "bg-[#fbf9f4]", b: "bg-[#873a1b]", c: "bg-[#211d18]" },
];

export function ProductArt({ product, className = "" }: { product: SampleProduct; className?: string }) {
  const s = artStyles[product.art];
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
      <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-medium tracking-wide text-paper">
        {product.format}
      </span>
    </div>
  );
}

export function ProductCard({ product }: { product: SampleProduct }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-shadow hover:shadow-md"
    >
      <ProductArt product={product} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <Badge>Sample</Badge>
          <span className="text-xs text-ink-soft">by {product.seller}</span>
        </div>
        <h3 className="mt-3 text-xl leading-snug group-hover:text-clay-deep">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{product.summary}</p>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between border-t border-line pt-4">
            <span className="font-display text-2xl">{formatINR(product.pricePaise)}</span>
            <span className="text-xs text-moss">Influencers earn {product.commissionPct}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
