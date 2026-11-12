import type { Metadata } from "next";
import { ButtonLink, Card, StatCards } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { shortDate } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };

const actionLabels: Record<string, string> = {
  product_approved: "Approved a product",
  product_rejected: "Rejected a product",
  user_status: "Changed an account's status",
  order_refunded: "Refunded an order",
};

export default async function AdminOverview() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const [sellers, products, orders, ledger, users, live, audit] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "seller").eq("status", "pending"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("orders").select("net_paise, status"),
    supabase.from("ledger_entries").select("amount_paise").eq("account_type", "platform"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("audit_log").select("id, action, created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const all = orders.data ?? [];
  const paid = all.filter((o) => o.status === "paid");
  const gmv = paid.reduce((s, o) => s + o.net_paise, 0);
  const fees = (ledger.data ?? []).reduce((s, e) => s + e.amount_paise, 0);
  const waiting = (sellers.count ?? 0) + (products.count ?? 0);

  return (
    <div className="space-y-6">
      <StatCards
        stats={[
          { label: "Awaiting review", value: String(waiting), hint: `${sellers.count ?? 0} sellers · ${products.count ?? 0} listings` },
          { label: "Sales through the platform", value: formatINR(gmv), hint: `${paid.length} paid · ${all.length - paid.length} refunded or other` },
          { label: "Platform fees earned", value: formatINR(fees), hint: "After refunds (test mode)" },
        ]}
      />
      <StatCards
        stats={[
          { label: "Accounts", value: String(users.count ?? 0) },
          { label: "Live products", value: String(live.count ?? 0) },
          { label: "Orders", value: String(all.length) },
        ]}
      />
      {waiting > 0 ? <ButtonLink href="/admin/review">Open the review queue</ButtonLink> : null}
      <Card>
        <h2 className="text-xl">Recent admin activity</h2>
        {(audit.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Nothing yet. Approvals, refunds and suspensions are logged here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line text-sm">
            {(audit.data ?? []).map((a) => (
              <li key={a.id} className="flex justify-between py-2.5">
                <span>{actionLabels[a.action] ?? a.action}</span>
                <span className="text-xs text-ink-soft">{shortDate(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
