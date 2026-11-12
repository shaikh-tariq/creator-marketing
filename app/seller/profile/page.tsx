import type { Metadata } from "next";
import { saveSellerProfile } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { Card, Field, Flash, PageTitle, buttonClass, inputClass, textareaClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Brand profile" };

export default async function SellerProfile({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const profile = await requireRole(["seller"]);
  const supabase = await createClient();
  const { data } = await supabase.from("seller_profiles").select("brand_name, bio").eq("user_id", profile.id).single();

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Brand profile" intro="Your brand name appears on every product you list." />
      <Card>
        <form action={saveSellerProfile} className="max-w-xl space-y-5">
          <Field label="Brand name">
            <input name="brand_name" required minLength={2} maxLength={60} defaultValue={data?.brand_name ?? ""} className={inputClass} />
          </Field>
          <Field label="About your brand" hint="A sentence or two. Up to 500 characters.">
            <textarea name="bio" rows={4} maxLength={500} defaultValue={data?.bio ?? ""} className={textareaClass} />
          </Field>
          <Field label="Login email">
            <input value={profile.email} disabled className={`${inputClass} opacity-60`} />
          </Field>
          <SubmitButton className={buttonClass("primary")}>Save profile</SubmitButton>
        </form>
      </Card>
    </>
  );
}
