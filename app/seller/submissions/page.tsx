import type { Metadata } from "next";
import { reviewSubmission, setJoin } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { PlatformIcon } from "@/components/platform-icon";
import { Avatar, Badge, Card, Empty, Flash, PageTitle, StatusBadge, inputClass, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { postImageUrl, shortDate } from "@/lib/data";
import { platforms } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Influencers and posts" };

const platformName = (id: string) => platforms.find((p) => p.id === id)?.name ?? id;

type Person = {
  id: string;
  name: string;
  avatar: string | null;
  niche: string | null;
  bio: string | null;
  channels: { platform: string; profile_url: string; follower_range: string | null }[];
  record: { member_since?: string; products_promoted?: number; approved_posts?: number; rejected_posts?: number; sales?: number };
};

// Everything a seller needs to judge an influencer: who they are, where they post, and their track record here.
function InfluencerDetails({ p }: { p: Person }) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <Avatar url={p.avatar} name={p.name} size={56} />
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold">{p.name}</p>
          <p className="text-sm text-ink-soft">
            {p.niche || "No niche added"}
            {p.record.member_since ? ` · on Creator Marketing since ${shortDate(p.record.member_since)}` : ""}
          </p>
          {p.bio ? <p className="mt-2 max-w-xl text-sm leading-relaxed">{p.bio}</p> : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {p.channels.length === 0 ? (
          <Badge tone="accent">No channels added yet. Ask before accepting.</Badge>
        ) : (
          p.channels.map((c) => (
            <a key={c.platform} href={c.profile_url} target="_blank" rel="noopener noreferrer nofollow" className="lift inline-flex items-center gap-2.5 rounded-xl border border-line bg-card py-1.5 pl-1.5 pr-3 text-sm">
              <PlatformIcon id={c.platform} size={30} />
              <span>
                <span className="font-medium">{platformName(c.platform)}</span>
                {c.follower_range ? <span className="text-ink-soft"> · {c.follower_range} followers</span> : null}
                <span className="text-ink-soft"> ↗</span>
              </span>
            </a>
          ))
        )}
      </div>

      <dl className="mt-4 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Products promoted", p.record.products_promoted ?? 0],
          ["Approved posts", p.record.approved_posts ?? 0],
          ["Rejected posts", p.record.rejected_posts ?? 0],
          ["Sales made", p.record.sales ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-paper px-3 py-2.5 text-center">
            <dd className="font-display text-xl tabular-nums">{value}</dd>
            <dt className="text-[11px] text-ink-soft">{label}</dt>
          </div>
        ))}
      </dl>
      {p.channels.length > 0 ? <p className="mt-2 text-xs text-ink-soft">Follower numbers are entered by the influencer. Open their profile to check for yourself.</p> : null}
    </div>
  );
}

export default async function SellerSubmissions({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const profile = await requireRole(["seller"]);
  const supabase = await createClient();

  const [joinsRes, subsRes, linksRes, ordersRes] = await Promise.all([
    supabase.from("joins").select("id, influencer_id, status, pitch, created_at, products(title)").eq("seller_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("submissions").select("id, join_id, influencer_id, platform, content_url, caption, status, seller_note, image_path, created_at, products(title)").eq("seller_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("tracking_links").select("id, join_id, promo_code, clicks, active").eq("seller_id", profile.id),
    supabase.from("orders").select("tracking_link_id").eq("seller_id", profile.id).eq("status", "paid").not("tracking_link_id", "is", null),
  ]);
  const joins = joinsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const links = Object.fromEntries((linksRes.data ?? []).map((l) => [l.join_id, l]));
  const salesByLink: Record<string, number> = {};
  for (const o of ordersRes.data ?? []) salesByLink[o.tracking_link_id as string] = (salesByLink[o.tracking_link_id as string] ?? 0) + 1;
  const title = (row: { products: unknown }) => (row.products as { title: string } | null)?.title ?? "";

  // Load each influencer's details once
  const ids = [...new Set(joins.map((j) => j.influencer_id))];
  const [namesRes, infoRes, channelsRes, records] = await Promise.all([
    ids.length ? supabase.from("profile_names").select("id, full_name, avatar_url").in("id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("influencer_profiles").select("user_id, niche, bio").in("user_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("influencer_channels").select("user_id, platform, profile_url, follower_range").in("user_id", ids) : Promise.resolve({ data: [] }),
    Promise.all(ids.map((id) => supabase.rpc("influencer_card", { p_influencer: id }).then((r) => [id, r.data ?? {}] as const))),
  ]);
  const recordMap = Object.fromEntries(records);
  const people: Record<string, Person> = {};
  for (const id of ids) {
    const n = (namesRes.data ?? []).find((x) => x.id === id);
    const info = (infoRes.data ?? []).find((x) => x.user_id === id);
    people[id] = {
      id,
      name: n?.full_name ?? "Unnamed",
      avatar: n?.avatar_url ?? null,
      niche: info?.niche ?? null,
      bio: info?.bio ?? null,
      channels: (channelsRes.data ?? []).filter((c) => c.user_id === id),
      record: recordMap[id] ?? {},
    };
  }

  const requests = joins.filter((j) => j.status === "applied");
  const teamIds = [...new Set(joins.filter((j) => j.status !== "applied").map((j) => j.influencer_id))];
  const pendingCount = subs.filter((s) => s.status === "pending").length;
  // Influencers with a draft waiting come first
  teamIds.sort((a, b) => Number(subs.some((s) => s.influencer_id === b && s.status === "pending")) - Number(subs.some((s) => s.influencer_id === a && s.status === "pending")));

  return (
    <>
      <Flash params={flash} />
      <PageTitle
        title="Influencers & posts"
        intro="Check who is asking to promote your products, then review their drafts. Nothing is posted under your brand until you approve it."
      />

      {requests.length > 0 ? (
        <section className="space-y-4">
          <h3 className="text-xl">Requests to promote ({requests.length})</h3>
          {requests.map((j) => (
            <Card key={j.id}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                <p className="text-sm">
                  Wants to promote <span className="font-semibold">{title(j)}</span>
                  <span className="text-ink-soft"> · asked {shortDate(j.created_at)}</span>
                </p>
                <StatusBadge status={j.status} />
              </div>
              <InfluencerDetails p={people[j.influencer_id]} />
              {j.pitch ? <p className="mt-4 rounded-xl bg-paper p-4 text-sm leading-relaxed"><span className="font-medium">Their message:</span> {j.pitch}</p> : null}
              <form action={setJoin} className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <input type="hidden" name="join_id" value={j.id} />
                <SubmitButton name="status" value="active" className={smallButton("primary", "min-h-10 px-5 text-sm")}>Accept</SubmitButton>
                <SubmitButton name="status" value="rejected" className={smallButton("danger", "min-h-10 px-5 text-sm")}>Decline</SubmitButton>
              </form>
            </Card>
          ))}
        </section>
      ) : null}

      <section className={`space-y-5 ${requests.length > 0 ? "mt-10" : ""}`}>
        <h3 className="text-xl">
          Your influencers ({teamIds.length})
          {pendingCount > 0 ? <span className="ml-3 rounded-full bg-sun px-3 py-1 align-middle text-xs font-semibold text-ink">{pendingCount} draft{pendingCount === 1 ? "" : "s"} to review</span> : null}
        </h3>

        {teamIds.length === 0 ? (
          <Empty title="No influencers yet" text="When an influencer joins one of your products, they appear here with their posts grouped under them." />
        ) : (
          teamIds.map((id) => {
            const theirJoins = joins.filter((j) => j.influencer_id === id && j.status !== "applied");
            const theirSubs = subs.filter((s) => s.influencer_id === id);
            const pending = theirSubs.filter((s) => s.status === "pending");
            const reviewed = theirSubs.filter((s) => s.status !== "pending");
            return (
              <Card key={id} className={pending.length > 0 ? "border-accent/40 shadow-md shadow-accent/5" : ""}>
                <InfluencerDetails p={people[id]} />

                {/* Products this influencer promotes for you */}
                <ul className="mt-5 divide-y divide-line rounded-2xl border border-line">
                  {theirJoins.map((j) => {
                    const link = links[j.id];
                    return (
                      <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{title(j)}</span>
                          <StatusBadge status={j.status} />
                        </span>
                        <span className="flex flex-wrap items-center gap-4 text-ink-soft">
                          {link ? (
                            <>
                              <span>Code <span className="font-mono text-ink">{link.promo_code}</span></span>
                              <span>{link.clicks} clicks</span>
                              <span>{salesByLink[link.id] ?? 0} sales</span>
                            </>
                          ) : (
                            <span>No approved post yet</span>
                          )}
                          <form action={setJoin}>
                            <input type="hidden" name="join_id" value={j.id} />
                            {j.status === "active" ? (
                              <SubmitButton name="status" value="paused" className={smallButton("outline")} confirmText="Pause this influencer on this product? Their link and code stop working.">Pause</SubmitButton>
                            ) : (
                              <SubmitButton name="status" value="active" className={smallButton("outline")}>Reactivate</SubmitButton>
                            )}
                          </form>
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Drafts waiting for this seller */}
                {pending.map((s) => (
                  <div key={s.id} className="mt-5 rounded-2xl bg-paper-deep p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <PlatformIcon id={s.platform} size={28} />
                        Draft for {platformName(s.platform)} · {title(s)}
                      </p>
                      <span className="text-xs text-ink-soft">Sent {shortDate(s.created_at)}</span>
                    </div>
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                      {postImageUrl(s.image_path) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={postImageUrl(s.image_path)!} alt="The draft post" className="w-full max-w-52 rounded-xl border border-line bg-card object-cover" />
                      ) : null}
                      <p className="flex-1 whitespace-pre-line rounded-xl bg-card p-4 text-sm leading-relaxed">{s.caption || "No caption written."}</p>
                    </div>
                    <form action={reviewSubmission} className="mt-4">
                      <input type="hidden" name="submission_id" value={s.id} />
                      <input name="note" maxLength={500} placeholder="Note to the influencer (say what to change if you ask for changes)" className={`${inputClass} mt-0`} />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <SubmitButton name="decision" value="approved" className={smallButton("primary", "min-h-10 px-5 text-sm")}>Approve</SubmitButton>
                        <SubmitButton name="decision" value="changes_requested" className={smallButton("outline", "min-h-10 px-5 text-sm")}>Request changes</SubmitButton>
                        <SubmitButton name="decision" value="rejected" className={smallButton("danger", "min-h-10 px-5 text-sm")}>Reject</SubmitButton>
                      </div>
                    </form>
                  </div>
                ))}

                {/* Their earlier posts, tucked away until needed */}
                {reviewed.length > 0 ? (
                  <details className="mt-5">
                    <summary className="cursor-pointer text-sm font-medium">Reviewed posts ({reviewed.length})</summary>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {reviewed.map((s) => (
                        <li key={s.id} className="flex gap-3 rounded-2xl border border-line p-3">
                          {postImageUrl(s.image_path) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={postImageUrl(s.image_path)!} alt="" className="size-20 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-paper-deep"><PlatformIcon id={s.platform} size={36} /></span>
                          )}
                          <div className="min-w-0 text-sm">
                            <p className="truncate font-medium">{title(s)}</p>
                            <p className="mt-0.5 text-xs text-ink-soft">{platformName(s.platform)} · {shortDate(s.created_at)}</p>
                            <p className="mt-2 flex flex-wrap items-center gap-2">
                              <StatusBadge status={s.status} />
                              {s.status === "approved" ? (
                                s.content_url ? (
                                  <a href={s.content_url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs underline">See live post ↗</a>
                                ) : (
                                  <span className="text-xs text-ink-soft">Not posted yet</span>
                                )
                              ) : null}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </Card>
            );
          })
        )}
      </section>
    </>
  );
}
