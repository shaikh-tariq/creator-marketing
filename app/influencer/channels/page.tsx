import type { Metadata } from "next";
import { deleteChannel, saveChannel, saveInfluencerProfile } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { Card, Field, Flash, PageTitle, buttonClass, inputClass, smallButton, textareaClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { platforms } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile and channels" };

const ranges = ["Under 1k", "1k to 5k", "5k to 20k", "20k to 50k", "50k to 200k", "Over 200k"];

export default async function Channels({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const profile = await requireRole(["influencer"]);
  const supabase = await createClient();
  const [info, channels] = await Promise.all([
    supabase.from("influencer_profiles").select("niche, bio").eq("user_id", profile.id).single(),
    supabase.from("influencer_channels").select("id, platform, profile_url, follower_range").eq("user_id", profile.id),
  ]);
  const list = channels.data ?? [];

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Profile & channels" intro="Sellers see this when you ask to promote their product." />

      <Card className="mb-6">
        <h3 className="text-xl">Where you post</h3>
        {list.length > 0 ? (
          <ul className="mt-4 divide-y divide-line">
            {list.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="font-medium">{platforms.find((p) => p.id === c.platform)?.name}</span>
                  <a href={c.profile_url} target="_blank" rel="noopener noreferrer" className="ml-3 break-all text-ink-soft underline">{c.profile_url}</a>
                  {c.follower_range ? <span className="ml-3 text-xs text-ink-soft">{c.follower_range}</span> : null}
                </span>
                <form action={deleteChannel}>
                  <input type="hidden" name="id" value={c.id} />
                  <SubmitButton className={smallButton("danger")}>Remove</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">No channels yet. Add at least one.</p>
        )}
        <form action={saveChannel} className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-[10rem_1fr_10rem_auto] sm:items-end">
          <Field label="Platform">
            <select name="platform" required className={inputClass}>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Profile link">
            <input name="profile_url" type="url" required placeholder="https://" className={inputClass} />
          </Field>
          <Field label="Followers">
            <select name="follower_range" className={inputClass}>
              {ranges.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <SubmitButton className={buttonClass("primary")}>Save</SubmitButton>
        </form>
        <p className="mt-3 text-xs text-ink-soft">Saving a platform you already added replaces it.</p>
      </Card>

      <Card>
        <h3 className="text-xl">About you</h3>
        <form action={saveInfluencerProfile} className="mt-4 max-w-xl space-y-5">
          <Field label="Niche" hint="For example design tips, creator growth, small business.">
            <input name="niche" maxLength={80} defaultValue={info.data?.niche ?? ""} className={inputClass} />
          </Field>
          <Field label="Short bio">
            <textarea name="bio" rows={3} maxLength={500} defaultValue={info.data?.bio ?? ""} className={textareaClass} />
          </Field>
          <SubmitButton className={buttonClass("primary")}>Save</SubmitButton>
        </form>
      </Card>
    </>
  );
}
