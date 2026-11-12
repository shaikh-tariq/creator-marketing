import type { Metadata } from "next";
import { adminRefund } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { Empty, Flash, PageTitle, StatusBadge, Table, inputClass, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Orders and refunds" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, buyer_email, net_paise, status, payment_ref, refund_reason, created_at, terms_snapshot, products(title)")
    .order("created_at", { ascending: false })
    .limit(200);
  const orders = data ?? [];

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Orders & refunds" intro="Sales are final, so refund only when a file was missing, broken, not as described, or paid for twice. A refund reverses every share of the sale." />
      {orders.length === 0 ? (
        <Empty title="No orders yet" text="Every order on the platform appears here." />
      ) : (
        <Table
          head={["Date", "Product", "Buyer", "Paid", "Code", "Status", "Refund"]}
          rows={orders.map((o) => {
            const t = o.terms_snapshot as Record<string, string | number | null>;
            return [
              shortDate(o.created_at),
              (o.products as unknown as { title: string })?.title,
              o.buyer_email,
              formatINR(o.net_paise),
              t.promo_code ? <span key="c" className="font-mono text-xs">{t.promo_code}</span> : "–",
              <StatusBadge key="s" status={o.status} />,
              o.status === "paid" ? (
                <form key="f" action={adminRefund} className="flex min-w-56 gap-2">
                  <input type="hidden" name="order_id" value={o.id} />
                  <input name="reason" required maxLength={200} placeholder="Reason" className={`${inputClass} mt-0 h-9 text-xs`} />
                  <SubmitButton className={smallButton("danger")} confirmText="Refund this order in full?">Refund</SubmitButton>
                </form>
              ) : (
                <span key="r" className="text-xs text-ink-soft">{o.refund_reason ?? ""}</span>
              ),
            ];
          })}
        />
      )}
    </>
  );
}
