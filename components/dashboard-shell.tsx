import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import type { Profile } from "@/lib/auth";
import { Badge, ButtonLink, Container, Notice } from "./ui";

export type DashboardConfig = {
  roleLabel: string;
  heading: string;
  stats: { label: string; value: string; hint: string }[];
  nav: { label: string; milestone?: string }[]; // milestone = not built yet
  empty: { title: string; text: string; cta?: { label: string; href: string } };
  checklist: string[];
};

const previews = [
  { href: "/seller", label: "Seller" },
  { href: "/influencer", label: "Influencer" },
  { href: "/library", label: "Buyer" },
  { href: "/admin", label: "Admin" },
];

export function DashboardShell({
  config,
  preview,
  profile,
}: {
  config: DashboardConfig;
  preview: boolean;
  profile: Profile | null;
}) {
  return (
    <Container className="py-8 sm:py-12">
      {preview ? (
        <div className="mb-8 rounded-2xl border border-dashed border-ink/30 p-4">
          <p className="text-sm text-ink-soft">
            Preview mode. No one is logged in because the database is not connected yet. Switch role:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {previews.map((p) => (
              <Link key={p.href} href={p.href} className="rounded-full border border-line bg-card px-4 py-1.5 text-sm hover:border-ink">
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <Badge tone="clay">{config.roleLabel}</Badge>
          <h1 className="mt-3 text-4xl sm:text-5xl">
            {profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : config.heading}
          </h1>
        </div>
        {!preview ? (
          <form action={signOut}>
            <button className="min-h-11 rounded-full border border-line px-5 text-sm hover:border-ink">Log out</button>
          </form>
        ) : null}
      </div>

      {profile?.status === "pending" ? (
        <div className="mt-6">
          <Notice>Your account is waiting for review. You can set things up now; listings go live after approval.</Notice>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Dashboard" className="-mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
          {config.nav.map((item, i) => (
            <span
              key={item.label}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-full px-4 py-2 text-sm lg:rounded-lg ${
                i === 0 ? "bg-ink text-paper" : "text-ink-soft"
              }`}
            >
              {item.label}
              {item.milestone ? <span className="text-[10px] uppercase tracking-wider opacity-60">{item.milestone}</span> : null}
            </span>
          ))}
        </nav>

        <div>
          <dl className="grid gap-4 sm:grid-cols-3">
            {config.stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-card p-6">
                <dt className="text-sm text-ink-soft">{s.label}</dt>
                <dd className="mt-3 font-display text-4xl tabular-nums">{s.value}</dd>
                <p className="mt-2 text-xs text-ink-soft">{s.hint}</p>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-2xl bg-paper-deep p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl">{config.empty.title}</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">{config.empty.text}</p>
            {config.empty.cta ? (
              <div className="mt-6">
                <ButtonLink href={config.empty.cta.href}>{config.empty.cta.label}</ButtonLink>
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-2xl border border-line p-6 sm:p-8">
            <h2 className="text-xl">Getting started</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {config.checklist.map((c, i) => (
                <li key={c} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs text-ink-soft">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-ink-soft">{c}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Container>
  );
}
