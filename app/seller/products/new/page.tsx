import type { Metadata } from "next";
import { ProductForm } from "@/components/product-form";
import { Flash, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New product" };

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  await requireRole(["seller"]);
  const supabase = await createClient();
  const { data: hubs } = await supabase.from("hubs").select("id, name").eq("status", "live").order("sort_order");

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="New product" intro="Step 1 of 3: describe it. Next you upload the file, then submit it for review." />
      <ProductForm hubs={hubs ?? []} />
    </>
  );
}
