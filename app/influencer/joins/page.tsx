import type { Metadata } from "next";
import Link from "next/link";
import { submitContent } from "@/app/actions";
import { CopyText, SubmitButton } from "@/components/client-bits";
import { ButtonLink, Card, Empty, Field, Flash, Notice, PageTitle, StatusBadge, buttonClass, inputClass, textareaClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { shortDate, siteOrigin } from "@/lib/data";
import { platforms } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My joins and posts" };

const platformName = (id: string) => platforms.find((p) => p.id === id)?.name ?? id;

export default async function MyJoins({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const profile = await requireRole(["influencer"]);
  const supabase = await createClient();
  const origin = await siteOrigin();

  const [joinsRes, subsRes, linksRes] = await Promise.all([
    supabase.from("joins").select("id, status, created_at, products(title, slug, brief_text, commission_pct)").eq("influencer_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("submissions").select("id, join_id, platform, content_url, status, seller_note, created_at").eq("influencer_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("tracking_links").select("join_id, ref_slug, promo_code, discount_pct, commission_pct, clicks, active").eq("influencer_id", profile.id),
  ]);
  const joins = joinsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const links = Object.fromEntries((linksRes.data ?? []).map((l) => [l.join_id, l]));

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="My joins & posts" intro="Make your post, submit the link here, and you get a tracked link and promo code once the seller approves it." />

      {joins.length === 0 ? (
        <Empty title="You have not joined a product yet" text="Browse what is live and join something you would recommend.">
          <ButtonLink href="/influencer/browse" variant="accent">Find products</ButtonLink>
        </Empty>
      ) : (
        <div className="space-y-5">
          {joins.map((j) => {
            const product = j.products as unknown as { title: string; slug: string; brief_text: string; commission_pct: number };
            const mine = subs.filter((s) => s.join_id === j.id);
            const link = links[j.id];
            const waiting = mine.some((s) => s.status === "pending");
            return (
              <Card key={j.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/products/${product.slug}`} className="font-display text-2xl hover:underline">{product.title}</Link>
                    <p className="mt-1 text-xs text-ink-soft">Joined {shortDate(j.created_at)} · {Number(product.commission_pct)}% commission</p>
                  </div>
                  <StatusBadge status={j.status} />
                </div>

                {j.status === "applied" ? <div className="mt-4"><Notice>The seller is reviewing your request. You can submit a post once they accept.</Notice></div> : null}
                {j.status === "rejected" ? <div className="mt-4"><Notice>The seller declined this request.</Notice></div> : null}
                {j.status === "paused" ? <div className="mt-4"><Notice>The seller paused you on this product. Your link and code are switched off.</Notice></div> : null}

                {link ? (
                  <div className="mt-5 rounded-xl bg-paper-deep p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-success">{link.active ? "Your link and code" : "Link and code (switched off)"}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <CopyText text={`${origin}/r/${link.ref_slug}`} />
                      <CopyText text={link.promo_code} />
                    </div>
                    <p className="mt-3 text-xs text-ink-soft">
                      {link.clicks} {link.clicks === 1 ? "click" : "clicks"} · you earn {Number(link.commission_pct)}% per sale
                      {Number(link.discount_pct) > 0 ? ` · the code gives buyers ${Number(link.discount_pct)}% off` : ""}
                    </p>
                  </div>
                ) : null}

                {mine.length > 0 ? (
                  <ul className="mt-5 divide-y divide-line border-y border-line">
                    {mine.map((s) => (
                      <li key={s.id} className="py-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <a href={s.content_url} target="_blank" rel="noopener noreferrer" className="underline">{platformName(s.platform)} post ↗</a>
                          <span className="flex items-center gap-3">
                            <span className="text-xs text-ink-soft">{shortDate(s.created_at)}</span>
                            <StatusBadge status={s.status} />
                          </span>
                        </div>
                        {s.seller_note ? <p className="mt-2 text-sm text-ink-soft"><span className="font-medium text-ink">Seller&apos;s note:</span> {s.seller_note}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {j.status === "active" && !waiting ? (
                  <details className="mt-5" open={mine.length === 0}>
                    <summary className="cursor-pointer text-sm font-medium underline">{mine.length === 0 ? "Submit your post" : "Submit another post"}</summary>
                    {product.brief_text ? <p className="mt-3 rounded-xl bg-paper p-4 text-sm leading-relaxed"><span className="font-medium">Brief:</span> {product.brief_text}</p> : null}
                    <form action={submitContent} className="mt-4 space-y-4">
                      <input type="hidden" name="join_id" value={j.id} />
                      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                        <Field label="Platform">
                          <select name="platform" required className={inputClass}>
                            {platforms.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Link to your post or draft">
                          <input name="content_url" type="url" required placeholder="https://" className={inputClass} />
                        </Field>
                      </div>
                      <Field label="Caption">
                        <textarea name="caption" rows={3} maxLength={2000} className={textareaClass} />
                      </Field>
                      <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
                        <input type="checkbox" name="disclosure" required className="mt-1 size-4 accent-[#0f172a]" />
                        <span>My post is clearly marked as a paid partnership (for example #ad or the platform&apos;s paid-partnership label).</span>
                      </label>
                      <SubmitButton className={buttonClass("accent")}>Submit for approval</SubmitButton>
                    </form>
                  </details>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
