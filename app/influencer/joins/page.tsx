import type { Metadata } from "next";
import Link from "next/link";
import { publishPost, resubmitContent, setImpressions, submitContent } from "@/app/actions";
import { CopyText, PostImagePicker, SubmitButton } from "@/components/client-bits";
import { PlatformIcon } from "@/components/platform-icon";
import { ButtonLink, Card, Empty, Field, Flash, Notice, PageTitle, StatusBadge, buttonClass, inputClass, smallButton, textareaClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { postImageUrl, shortDate, siteOrigin } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { platforms } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My posts" };

const platformName = (id: string) => platforms.find((p) => p.id === id)?.name ?? id;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-3 text-center">
      <dd className="font-display text-2xl tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-xs text-ink-soft">{label}</dt>
      {hint ? <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-soft/70">{hint}</p> : null}
    </div>
  );
}

function PlatformSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <select name="platform" required defaultValue={defaultValue} className={inputClass}>
      {platforms.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}

export default async function MyJoins({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const profile = await requireRole(["influencer"]);
  const supabase = await createClient();
  const origin = await siteOrigin();

  const [joinsRes, subsRes, linksRes, ordersRes] = await Promise.all([
    supabase.from("joins").select("id, status, created_at, products(title, slug, brief_text, commission_pct)").eq("influencer_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("submissions").select("id, join_id, platform, content_url, caption, status, seller_note, image_path, impressions, created_at").eq("influencer_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("tracking_links").select("id, join_id, ref_slug, promo_code, discount_pct, commission_pct, clicks, active").eq("influencer_id", profile.id),
    supabase.from("orders").select("tracking_link_id, status, terms_snapshot").eq("influencer_id", profile.id).eq("status", "paid"),
  ]);
  const joins = joinsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const links = Object.fromEntries((linksRes.data ?? []).map((l) => [l.join_id, l]));

  const sales: Record<string, { count: number; earned: number }> = {};
  for (const o of ordersRes.data ?? []) {
    if (!o.tracking_link_id) continue;
    const s = (sales[o.tracking_link_id] ??= { count: 0, earned: 0 });
    s.count += 1;
    s.earned += Number((o.terms_snapshot as { influencer_commission_paise?: number }).influencer_commission_paise ?? 0);
  }

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="My posts" intro="Send a draft first. Post it only after the seller approves, then add the live link here." />

      <ol className="mb-8 grid gap-3 text-sm sm:grid-cols-4">
        {["Send a draft", "Seller approves", "You post it with your code", "Add the live link"].map((t, i) => (
          <li key={t} className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-paper-deep font-display text-sm font-semibold text-accent-deep">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>

      {joins.length === 0 ? (
        <Empty title="You have not joined a product yet" text="Browse what is live and join something you would recommend.">
          <ButtonLink href="/influencer/browse" variant="accent">Find products</ButtonLink>
        </Empty>
      ) : (
        <div className="space-y-8">
          {joins.map((j) => {
            const product = j.products as unknown as { title: string; slug: string; brief_text: string; commission_pct: number };
            const mine = subs.filter((s) => s.join_id === j.id);
            const link = links[j.id];
            const sold = link ? sales[link.id] ?? { count: 0, earned: 0 } : { count: 0, earned: 0 };
            const inReview = mine.some((s) => s.status === "pending" || s.status === "changes_requested");
            return (
              <Card key={j.id} className="p-0 sm:p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5 sm:p-6">
                  <div>
                    <Link href={`/products/${product.slug}`} className="font-display text-2xl hover:underline">{product.title}</Link>
                    <p className="mt-1 text-xs text-ink-soft">Joined {shortDate(j.created_at)} · {Number(product.commission_pct)}% commission</p>
                  </div>
                  <StatusBadge status={j.status} />
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  {j.status === "applied" ? <Notice>The seller is looking at your profile. You can send a draft once they accept.</Notice> : null}
                  {j.status === "rejected" ? <Notice>The seller declined this request.</Notice> : null}
                  {j.status === "paused" ? <Notice>The seller paused you on this product. Your link and code are switched off.</Notice> : null}

                  {link ? (
                    <div className="rounded-2xl bg-paper-deep p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-deep">{link.active ? "Your link and code for this product" : "Link and code (switched off)"}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <CopyText text={`${origin}/r/${link.ref_slug}`} />
                        <CopyText text={link.promo_code} />
                      </div>
                      <p className="mt-3 text-xs text-ink-soft">
                        Put these in your post. You earn {Number(link.commission_pct)}% per sale
                        {Number(link.discount_pct) > 0 ? ` · the code gives buyers ${Number(link.discount_pct)}% off` : " · the seller has not added a buyer discount"}
                      </p>
                    </div>
                  ) : null}

                  {mine.length > 0 ? (
                    <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {mine.map((s) => {
                        const img = postImageUrl(s.image_path);
                        const approved = s.status === "approved";
                        const live = approved && Boolean(s.content_url);
                        return (
                          <li key={s.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
                            <div className="relative aspect-[4/5] bg-paper-deep">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt={`Your ${platformName(s.platform)} post`} className="size-full object-cover" />
                              ) : (
                                <span className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-ink-soft">
                                  <PlatformIcon id={s.platform} size={56} />
                                  No screenshot added
                                </span>
                              )}
                              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card/95 py-1 pl-1 pr-3 text-xs font-medium shadow-sm">
                                <PlatformIcon id={s.platform} size={22} />
                                {platformName(s.platform)}
                              </span>
                              <span className="absolute right-3 top-3">
                                {live ? <span className="rounded-full bg-success px-2.5 py-0.5 text-xs font-medium text-white">Live</span> : <StatusBadge status={s.status} />}
                              </span>
                            </div>

                            <div className="flex flex-1 flex-col p-4">
                              <p className="text-xs text-ink-soft">Sent {shortDate(s.created_at)}</p>
                              {s.caption ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed">{s.caption}</p> : null}
                              {s.seller_note ? <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm text-ink-soft"><span className="font-medium text-ink">Seller:</span> {s.seller_note}</p> : null}

                              {s.status === "pending" ? <p className="mt-4 text-xs text-ink-soft">Waiting for the seller. Do not post it yet.</p> : null}
                              {s.status === "rejected" ? <p className="mt-4 text-xs text-ink-soft">The seller rejected this draft. You can send a new one.</p> : null}

                              {/* Seller asked for changes: edit this same draft */}
                              {s.status === "changes_requested" ? (
                                <details className="mt-4 rounded-xl border border-accent/40 bg-paper-deep p-3" open>
                                  <summary className="cursor-pointer text-sm font-semibold text-accent-deep">Edit this draft</summary>
                                  <form action={resubmitContent} className="mt-3 space-y-3">
                                    <input type="hidden" name="submission_id" value={s.id} />
                                    <PostImagePicker userId={profile.id} />
                                    <Field label="Platform"><PlatformSelect defaultValue={s.platform} /></Field>
                                    <Field label="Caption">
                                      <textarea name="caption" rows={4} maxLength={2000} defaultValue={s.caption} className={textareaClass} />
                                    </Field>
                                    <SubmitButton className={smallButton("accent", "min-h-10 w-full text-sm")}>Send updated draft</SubmitButton>
                                  </form>
                                </details>
                              ) : null}

                              {/* Approved but not posted yet: the extra publish step */}
                              {approved && !live ? (
                                <div className="mt-4 rounded-xl border border-success/40 bg-success/10 p-3">
                                  <p className="text-sm font-semibold text-success">Approved. You can post it now.</p>
                                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">Post it on {platformName(s.platform)} with your link or code, then paste the link to the live post here.</p>
                                  <form action={publishPost} className="mt-3 space-y-2">
                                    <input type="hidden" name="submission_id" value={s.id} />
                                    <input name="content_url" type="url" required placeholder="https:// link to your live post" aria-label="Link to your live post" className={`${inputClass} mt-0 h-10 text-sm`} />
                                    <SubmitButton className={smallButton("primary", "min-h-10 w-full text-sm")}>Publish</SubmitButton>
                                  </form>
                                </div>
                              ) : null}

                              {live ? (
                                <>
                                  <a href={s.content_url!} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm underline">Open the live post ↗</a>
                                  <dl className="mt-3 grid grid-cols-2 gap-2">
                                    <Stat label="Impressions" value={s.impressions != null ? s.impressions.toLocaleString("en-IN") : "–"} hint="You entered" />
                                    <Stat label="Link clicks" value={String(link?.clicks ?? 0)} hint="Tracked" />
                                    <Stat label="Sold" value={String(sold.count)} hint="Tracked" />
                                    <Stat label="Earned" value={formatINR(sold.earned)} hint="Tracked" />
                                  </dl>
                                  <form action={setImpressions} className="mt-3 flex items-center gap-2">
                                    <input type="hidden" name="submission_id" value={s.id} />
                                    <input name="impressions" type="number" min={0} step={1} defaultValue={s.impressions ?? ""} placeholder="Impressions from the app" aria-label="Impressions" className={`${inputClass} mt-0 h-9 text-xs`} />
                                    <SubmitButton className={smallButton("outline", "shrink-0")}>Save</SubmitButton>
                                  </form>
                                </>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}

                  {j.status === "active" && !inReview ? (
                    <details open={mine.length === 0} className="rounded-2xl border border-line p-4">
                      <summary className="cursor-pointer text-sm font-medium">{mine.length === 0 ? "Send your first draft" : "Send another draft"}</summary>
                      {product.brief_text ? <p className="mt-3 rounded-xl bg-paper p-4 text-sm leading-relaxed"><span className="font-medium">Brief:</span> {product.brief_text}</p> : null}
                      <form action={submitContent} className="mt-4 space-y-4">
                        <input type="hidden" name="join_id" value={j.id} />
                        <PostImagePicker userId={profile.id} />
                        <div className="max-w-xs">
                          <Field label="Where will you post it?"><PlatformSelect /></Field>
                        </div>
                        <Field label="Caption" hint="Write it as you plan to post it. No link is needed yet; you post only after the seller approves.">
                          <textarea name="caption" rows={4} maxLength={2000} className={textareaClass} />
                        </Field>
                        <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
                          <input type="checkbox" name="disclosure" required className="mt-1 size-4 accent-[#0f172a]" />
                          <span>I will mark the post as a paid partnership (for example #ad or the platform&apos;s paid-partnership label).</span>
                        </label>
                        <SubmitButton className={buttonClass("accent")}>Send draft for approval</SubmitButton>
                      </form>
                    </details>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
