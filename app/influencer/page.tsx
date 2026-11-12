import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, Empty, Notice, StatCards, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { balances } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Influencer dashboard" };

export default async function InfluencerOverview() {
  const profile = await requireRole(["influencer"]);
  const supabase = await createClient();
  const [links, orders, ledger, joins, channels] = await Promise.all([
    supabase.from("tracking_links").select("clicks").eq("influencer_id", profile.id),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("influencer_id", profile.id).eq("status", "paid"),
    supabase.from("ledger_entries").select("amount_paise, available_at, kind, account_type").eq("account_id", profile.id),
    supabase.from("joins").select("id, status, products(title)").eq("influencer_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("influencer_channels").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
  ]);
  const clicks = (links.data ?? []).reduce((s, l) => s + l.clicks, 0);
  const bal = balances(ledger.data ?? []);
  const list = joins.data ?? [];

  return (
    <div className="space-y-6">
      <StatCards
        stats={[
          { label: "Clicks", value: String(clicks), hint: "On your tracked links" },
          { label: "Orders", value: String(orders.count ?? 0), hint: "Paid orders credited to you" },
          { label: "Released earnings", value: formatINR(bal.released), hint: `${formatINR(bal.onHold)} still on hold` },
        ]}
      />

      {(channels.count ?? 0) === 0 ? (
        <Notice>
          Add the platforms you post on so sellers can see where you promote.{" "}
          <Link href="/influencer/channels" className="underline">Add channels</Link>
        </Notice>
      ) : null}

      {list.length === 0 ? (
        <Empty title="Pick your first product" text="Join a product you would use yourself, make a post that follows the seller's brief, and submit it for approval.">
          <ButtonLink href="/influencer/browse" variant="accent">Find products</ButtonLink>
        </Empty>
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Products you promote</h2>
            <Link href="/influencer/joins" className="text-sm underline">Open my joins</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {list.slice(0, 6).map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>{(j.products as unknown as { title: string })?.title}</span>
                <StatusBadge status={j.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
