import type { Metadata } from "next";
import { adminSaveSettings } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { Card, Field, Flash, Notice, PageTitle, buttonClass, inputClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettings({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value");
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, string | number>;

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Settings" intro="These numbers drive the split on every new order. Old orders keep the terms they were sold under." />
      <Card>
        <form action={adminSaveSettings} className="max-w-2xl space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Platform fee (%)" hint="Your share of each sale.">
              <input name="platform_fee_pct" type="number" step="0.01" min={0} max={30} required defaultValue={s.platform_fee_pct} className={inputClass} />
            </Field>
            <Field label="Gateway fee estimate (%)" hint="Roughly 2% plus GST. Replaced by the real figure once a gateway is connected.">
              <input name="gateway_fee_est_pct" type="number" step="0.01" min={0} max={10} required defaultValue={s.gateway_fee_est_pct} className={inputClass} />
            </Field>
            <Field label="Who bears the gateway fee">
              <select name="gateway_fee_borne_by" defaultValue={String(s.gateway_fee_borne_by)} className={inputClass}>
                <option value="seller">The seller</option>
                <option value="platform">The platform</option>
              </select>
            </Field>
            <Field label="Hold period (days)" hint="How long earnings wait before release. Covers payment disputes.">
              <input name="hold_days" type="number" min={0} max={90} required defaultValue={s.hold_days} className={inputClass} />
            </Field>
            <Field label="Minimum commission (%)">
              <input name="commission_min_pct" type="number" min={0} max={100} required defaultValue={s.commission_min_pct} className={inputClass} />
            </Field>
            <Field label="Maximum commission (%)">
              <input name="commission_max_pct" type="number" min={0} max={100} required defaultValue={s.commission_max_pct} className={inputClass} />
            </Field>
          </div>
          <SubmitButton className={buttonClass("primary")}>Save settings</SubmitButton>
        </form>
      </Card>
      <div className="mt-6">
        <Notice>Payments are in test mode. Checkout creates real orders and splits, but no money moves until a payment gateway is connected.</Notice>
      </div>
    </>
  );
}
