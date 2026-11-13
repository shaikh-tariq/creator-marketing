import type { Metadata } from "next";
import Link from "next/link";
import { changePassword, saveAccount } from "@/app/actions";
import { AvatarUploader, LinkPending, SubmitButton } from "@/components/client-bits";
import { Badge, Card, Container, Field, Flash, buttonClass, inputClass } from "@/components/ui";
import { requireRole, roleHome } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile and settings" };

// Opened by clicking your name in the header. Same page for every kind of account.
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const profile = await requireRole(["buyer", "seller", "influencer", "admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("phone").eq("id", profile.id).single();

  const extra =
    profile.role === "seller"
      ? { href: "/seller/profile", title: "Brand profile", text: "Brand name, description and GST number shown to buyers." }
      : profile.role === "influencer"
        ? { href: "/influencer/channels", title: "Channels and niche", text: "The platforms you post on, which sellers see before accepting you." }
        : null;

  return (
    <Container className="max-w-3xl py-10 sm:py-12">
      <Flash params={flash} />
      <Link href={roleHome[profile.role]} className="text-sm text-ink-soft hover:text-ink">← Back</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl sm:text-5xl">Profile & settings</h1>
        <Badge tone="accent">{profile.role}</Badge>
      </div>

      <Card className="mt-8">
        <h2 className="text-xl">Profile picture</h2>
        <div className="mt-4">
          <AvatarUploader userId={profile.id} current={profile.avatar_url} />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl">Your details</h2>
        <form action={saveAccount} className="mt-4 max-w-xl space-y-5">
          <Field label="Name">
            <input name="full_name" required minLength={2} maxLength={80} defaultValue={profile.full_name ?? ""} autoComplete="name" className={inputClass} />
          </Field>
          <Field label="Phone" hint="Optional. Only used if we need to reach you about an order.">
            <input name="phone" type="tel" maxLength={20} defaultValue={data?.phone ?? ""} autoComplete="tel" className={inputClass} />
          </Field>
          <Field label="Email" hint="Your login email cannot be changed here.">
            <input value={profile.email} disabled className={`${inputClass} opacity-60`} />
          </Field>
          <SubmitButton className={buttonClass("primary")}>Save details</SubmitButton>
        </form>
      </Card>

      {extra ? (
        <Link href={extra.href} className="lift mt-6 flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5 sm:p-6">
          <span>
            <span className="block font-display text-xl">{extra.title}</span>
            <span className="mt-1 block text-sm text-ink-soft">{extra.text}</span>
          </span>
          <span className="flex items-center text-ink-soft">→<LinkPending /></span>
        </Link>
      ) : null}

      <Card className="mt-6">
        <h2 className="text-xl">Change password</h2>
        <form action={changePassword} className="mt-4 max-w-xl space-y-5">
          <Field label="New password" hint="At least 8 characters.">
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
          <Field label="Type it again">
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
          <SubmitButton className={buttonClass("outline")}>Change password</SubmitButton>
        </form>
      </Card>
    </Container>
  );
}
