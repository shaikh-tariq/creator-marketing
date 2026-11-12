import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Empty, Flash, PageTitle, StatusBadge, Table } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Products" };

export default async function SellerProducts({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const profile = await requireRole(["seller"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, title, slug, price_paise, commission_pct, status")
    .eq("seller_id", profile.id)
    .order("created_at", { ascending: false });
  const products = data ?? [];

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Products" intro="Drafts are private. A product goes live after you submit it and an admin approves it." action={<ButtonLink href="/seller/products/new">Add product</ButtonLink>} />
      {products.length === 0 ? (
        <Empty title="No products yet" text="Create a draft, upload the file, then submit it for review.">
          <ButtonLink href="/seller/products/new">Create a product</ButtonLink>
        </Empty>
      ) : (
        <Table
          head={["Product", "Price", "Commission", "Status", ""]}
          rows={products.map((p) => [
            <Link key="t" href={`/seller/products/${p.id}`} className="font-medium hover:underline">{p.title}</Link>,
            formatINR(p.price_paise),
            `${Number(p.commission_pct)}%`,
            <StatusBadge key="s" status={p.status} />,
            <span key="a" className="flex gap-3 text-xs">
              <Link href={`/seller/products/${p.id}`} className="underline">Edit</Link>
              {p.status === "published" ? <Link href={`/products/${p.slug}`} className="underline">View</Link> : null}
            </span>,
          ])}
        />
      )}
    </>
  );
}
