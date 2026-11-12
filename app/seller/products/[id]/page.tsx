import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteFile, downloadFile, productAction } from "@/app/actions";
import { FileUploader, SubmitButton } from "@/components/client-bits";
import { ProductForm } from "@/components/product-form";
import { Card, Flash, Notice, PageTitle, StatusBadge, buttonClass, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { PRODUCT_COLS } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Edit product" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

const nextStep: Record<string, string> = {
  draft: "Upload the product file below, then submit for review.",
  rejected: "Fix the points in the admin's note, then submit again.",
  pending_review: "Waiting for an admin to review it. You can still edit.",
  published: "Live. Buyers can purchase it and influencers can join.",
  paused: "Hidden from buyers. Existing buyers keep their downloads.",
  archived: "Archived.",
};

export default async function EditProduct({ params, searchParams }: Props) {
  const { id } = await params;
  const flash = await searchParams;
  const profile = await requireRole(["seller"]);
  const supabase = await createClient();

  const [{ data: product }, { data: hubs }, { data: files }] = await Promise.all([
    supabase.from("products").select(PRODUCT_COLS).eq("id", id).eq("seller_id", profile.id).maybeSingle(),
    supabase.from("hubs").select("id, name").eq("status", "live").order("sort_order"),
    supabase.from("product_files").select("id, file_name, size_bytes").eq("product_id", id).order("created_at"),
  ]);
  if (!product) notFound();
  const p = product as unknown as Product;
  const fileList = files ?? [];

  const actions: { action: string; label: string; variant: "primary" | "outline" | "danger"; confirm?: string }[] = [];
  if (p.status === "draft" || p.status === "rejected") actions.push({ action: "submit", label: "Submit for review", variant: "primary" });
  if (p.status === "published") actions.push({ action: "pause", label: "Pause sales", variant: "outline" });
  if (p.status === "paused") actions.push({ action: "resume", label: "Resume sales", variant: "primary" });
  if (p.status !== "archived") actions.push({ action: "archive", label: "Archive", variant: "danger", confirm: "Archive this product? It will be hidden everywhere." });

  return (
    <>
      <Flash params={flash} />
      <PageTitle
        title={p.title}
        action={p.status === "published" ? <Link href={`/products/${p.slug}`} className="text-sm underline">View live page</Link> : undefined}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={p.status} />
            <p className="text-sm text-ink-soft">{nextStep[p.status]}</p>
          </div>
          <form action={productAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={p.id} />
            {actions.map((a) => (
              <SubmitButton key={a.action} name="action" value={a.action} confirmText={a.confirm} className={buttonClass(a.variant, "min-h-10 px-5")}>
                {a.label}
              </SubmitButton>
            ))}
          </form>
        </div>
        {p.status === "rejected" && p.rejected_reason ? (
          <div className="mt-4"><Notice>Admin&apos;s note: {p.rejected_reason}</Notice></div>
        ) : null}
      </Card>

      <Card className="mb-6">
        <h3 className="text-xl">Product file</h3>
        <p className="mt-2 text-sm text-ink-soft">This is what buyers download. It is stored privately; only paying buyers get a link.</p>
        {fileList.length > 0 ? (
          <ul className="mt-4 divide-y divide-line">
            {fileList.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>
                  {f.file_name} <span className="text-xs text-ink-soft">{(f.size_bytes / 1048576).toFixed(1)} MB</span>
                </span>
                <span className="flex gap-2">
                  <form action={downloadFile}>
                    <input type="hidden" name="file_id" value={f.id} />
                    <input type="hidden" name="back" value={`/seller/products/${p.id}`} />
                    <SubmitButton className={smallButton("outline")}>Download</SubmitButton>
                  </form>
                  <form action={deleteFile}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="product_id" value={p.id} />
                    <SubmitButton className={smallButton("danger")} confirmText="Remove this file?">Remove</SubmitButton>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4"><FileUploader productId={p.id} userId={profile.id} /></div>
      </Card>

      <ProductForm product={p} hubs={hubs ?? []} />
    </>
  );
}
