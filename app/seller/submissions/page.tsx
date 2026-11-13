import type { Metadata } from "next";
import { reviewSubmission, setJoin } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { Card, Empty, Flash, PageTitle, StatusBadge, Table, inputClass, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { nameMap, postImageUrl, shortDate } from "@/lib/data";
import { platforms } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Influencers and posts" };

const platformName = (id: string) => platforms.find((p) => p.id === id)?.name ?? id;

export default async function SellerSubmissions({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const profile = await requireRole(["seller"]);
  const supabase = await createClient();

  const [joinsRes, subsRes, linksRes] = await Promise.all([
    supabase.from("joins").select("id, influencer_id, status, pitch, created_at, products(title)").eq("seller_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("submissions").select("id, influencer_id, platform, content_url, caption, status, seller_note, image_path, created_at, products(title)").eq("seller_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("tracking_links").select("join_id, promo_code, clicks, active").eq("seller_id", profile.id),
  ]);
  const joins = joinsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const links = Object.fromEntries((linksRes.data ?? []).map((l) => [l.join_id, l]));
  const names = await nameMap([...joins.map((j) => j.influencer_id), ...subs.map((s) => s.influencer_id)]);
  const title = (row: { products: unknown }) => (row.products as { title: string } | null)?.title ?? "";

  const requests = joins.filter((j) => j.status === "applied");
  const pending = subs.filter((s) => s.status === "pending");
  const team = joins.filter((j) => j.status !== "applied");
  const reviewed = subs.filter((s) => s.status !== "pending");

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Influencers & posts" intro="Nothing is promoted under your brand until you approve the post. Approval creates the influencer's tracked link and promo code." />

      <section className="space-y-4">
        <h3 className="text-xl">Posts to review ({pending.length})</h3>
        {pending.length === 0 ? (
          <Empty title="No posts waiting" text="When an influencer submits a post for one of your products it appears here." />
        ) : (
          pending.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{names[s.influencer_id]} · {platformName(s.platform)}</p>
                  <p className="mt-1 text-sm text-ink-soft">{title(s)} · submitted {shortDate(s.created_at)}</p>
                </div>
                <a href={s.content_url} target="_blank" rel="noopener noreferrer nofollow" className={smallButton("outline")}>Open the post ↗</a>
              </div>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                {postImageUrl(s.image_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={postImageUrl(s.image_path)!} alt="Screenshot of the post" className="w-full max-w-48 rounded-xl border border-line object-cover" />
                ) : null}
                {s.caption ? <p className="flex-1 whitespace-pre-line rounded-xl bg-paper p-4 text-sm leading-relaxed">{s.caption}</p> : null}
              </div>
              <form action={reviewSubmission} className="mt-4">
                <input type="hidden" name="submission_id" value={s.id} />
                <input name="note" maxLength={500} placeholder="Note to the influencer (needed if you ask for changes)" className={`${inputClass} mt-0`} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <SubmitButton name="decision" value="approved" className={smallButton("primary")}>Approve</SubmitButton>
                  <SubmitButton name="decision" value="changes_requested" className={smallButton("outline")}>Request changes</SubmitButton>
                  <SubmitButton name="decision" value="rejected" className={smallButton("danger")}>Reject</SubmitButton>
                </div>
              </form>
            </Card>
          ))
        )}
      </section>

      {requests.length > 0 ? (
        <section className="mt-10 space-y-4">
          <h3 className="text-xl">Requests to promote ({requests.length})</h3>
          <Table
            head={["Influencer", "Product", "Their pitch", ""]}
            rows={requests.map((j) => [
              names[j.influencer_id],
              title(j),
              j.pitch || <span className="text-ink-soft">No message</span>,
              <form key="f" action={setJoin} className="flex gap-2">
                <input type="hidden" name="join_id" value={j.id} />
                <SubmitButton name="status" value="active" className={smallButton("primary")}>Accept</SubmitButton>
                <SubmitButton name="status" value="rejected" className={smallButton("danger")}>Decline</SubmitButton>
              </form>,
            ])}
          />
        </section>
      ) : null}

      <section className="mt-10 space-y-4">
        <h3 className="text-xl">Your influencers ({team.length})</h3>
        {team.length === 0 ? (
          <p className="text-sm text-ink-soft">No influencers have joined your products yet.</p>
        ) : (
          <Table
            head={["Influencer", "Product", "Status", "Code", "Clicks", ""]}
            rows={team.map((j) => {
              const link = links[j.id];
              return [
                names[j.influencer_id],
                title(j),
                <StatusBadge key="s" status={j.status} />,
                link ? <span key="c" className="font-mono text-xs">{link.promo_code}</span> : <span key="c" className="text-ink-soft">No approved post yet</span>,
                link ? String(link.clicks) : "0",
                <form key="f" action={setJoin}>
                  <input type="hidden" name="join_id" value={j.id} />
                  {j.status === "active" ? (
                    <SubmitButton name="status" value="paused" className={smallButton("outline")} confirmText="Pause this influencer? Their link and code stop working.">Pause</SubmitButton>
                  ) : (
                    <SubmitButton name="status" value="active" className={smallButton("outline")}>Reactivate</SubmitButton>
                  )}
                </form>,
              ];
            })}
          />
        )}
      </section>

      {reviewed.length > 0 ? (
        <section className="mt-10 space-y-4">
          <h3 className="text-xl">Reviewed posts</h3>
          <Table
            head={["Influencer", "Product", "Platform", "Decision", "Post"]}
            rows={reviewed.map((s) => [
              names[s.influencer_id],
              title(s),
              platformName(s.platform),
              <StatusBadge key="s" status={s.status} />,
              <a key="a" href={s.content_url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs underline">Open ↗</a>,
            ])}
          />
        </section>
      ) : null}
    </>
  );
}
