import Link from "next/link";
import type { Profile, Role } from "@/lib/auth";
import { hubs, launchSettings, liveHubs, site } from "@/lib/site";
import { Container } from "./ui";

type Column = { title: string; links: { href: string; label: string; note?: string }[] };

const policies: Column = {
  title: "Policies",
  links: [
    { href: "/legal/terms", label: "Terms" },
    { href: "/legal/privacy", label: "Privacy" },
    { href: "/legal/refunds", label: "Refunds" },
  ],
};

// Visitors get the full marketing footer. Each kind of account gets a footer built around what they do.
const guestColumns: Column[] = [
  { title: "Hubs", links: hubs.map((h) => ({ href: `/hubs/${h.slug}`, label: h.name, note: h.status === "coming_soon" ? "Soon" : undefined })) },
  {
    title: "Join",
    links: [
      { href: "/sell", label: "Sell your products" },
      { href: "/promote", label: "Promote & earn" },
      { href: "/signup", label: "Create account" },
      { href: "/login", label: "Log in" },
    ],
  },
  policies,
];

const roleFooter: Record<Role, { blurb: string; tip: string; columns: Column[] }> = {
  buyer: {
    blurb: "Everything you buy stays in your library, ready to download again.",
    tip: "Tip: if a seller offers a promo discount, a creator's code takes it off at checkout.",
    columns: [
      { title: "Shop", links: [{ href: "/search", label: "Browse products" }, ...liveHubs.map((h) => ({ href: `/hubs/${h.slug}`, label: h.name }))] },
      { title: "Your account", links: [{ href: "/library", label: "My library and downloads" }, { href: "/legal/refunds", label: "Problem with a file?" }] },
      policies,
    ],
  },
  seller: {
    blurb: `You keep everything after the ${launchSettings.platformFeePct}% platform fee, the gateway charge and any commission you chose to offer.`,
    tip: "Tip: a clear content brief gets you better posts and fewer change requests.",
    columns: [
      { title: "Your shop", links: [{ href: "/seller/products", label: "Products" }, { href: "/seller/products/new", label: "Add a product" }, { href: "/seller/profile", label: "Brand profile" }] },
      { title: "Sales", links: [{ href: "/seller/submissions", label: "Influencers and posts" }, { href: "/seller/earnings", label: "Orders and earnings" }, { href: "/sell#fees", label: "Fees explained" }] },
      policies,
    ],
  },
  influencer: {
    blurb: "You earn a commission on every sale made through your link or promo code.",
    tip: "Tip: always mark posts as a paid partnership. Posts without a disclosure are rejected.",
    columns: [
      { title: "Promote", links: [{ href: "/influencer/browse", label: "Find products" }, { href: "/influencer/joins", label: "My posts, links and codes" }] },
      { title: "Your account", links: [{ href: "/influencer/earnings", label: "Earnings" }, { href: "/influencer/channels", label: "Profile and channels" }, { href: "/promote", label: "How promoting works" }] },
      policies,
    ],
  },
  admin: {
    blurb: "Admin area. Approvals, refunds and suspensions are recorded in the activity log.",
    tip: "Payments are in test mode until a payment gateway is connected.",
    columns: [
      { title: "Moderation", links: [{ href: "/admin/review", label: "Review queue" }, { href: "/admin/users", label: "Users" }] },
      { title: "Money", links: [{ href: "/admin/orders", label: "Orders and refunds" }, { href: "/admin/ledger", label: "Ledger" }, { href: "/admin/settings", label: "Settings" }] },
      policies,
    ],
  },
};

function Columns({ columns, dark }: { columns: Column[]; dark: boolean }) {
  return (
    <>
      {columns.map((c) => (
        <div key={c.title}>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-sky" : "text-accent"}`}>{c.title}</p>
          <ul className={`mt-4 space-y-3 text-sm ${dark ? "text-white/75" : "text-ink-soft"}`}>
            {c.links.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className={`transition-colors ${dark ? "hover:text-white" : "hover:text-ink"}`}>
                  {l.label}
                  {l.note ? <span className="ml-2 text-xs text-sky">{l.note}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function SiteFooter({ profile }: { profile: Profile | null }) {
  // Visitors: the full dark marketing footer.
  if (!profile) {
    return (
      <footer className="mt-24 bg-ink text-white">
        <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl font-semibold">
              Creator <span className="text-sky">Marketing</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">{site.description}</p>
          </div>
          <Columns columns={guestColumns} dark />
        </Container>
        <Container className="border-t border-white/15 py-6 text-xs text-white/60">
          © 2026 {site.name}. Pre-launch build. Listings shown are samples.
        </Container>
      </footer>
    );
  }

  // Logged in: a lighter, quieter footer with only what this person needs.
  const f = roleFooter[profile.role];
  return (
    <footer className="mt-20 border-t border-line bg-card">
      <Container className="grid max-w-7xl gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-semibold">
            Creator <span className="text-accent">Marketing</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">{f.blurb}</p>
          <p className="mt-4 max-w-sm rounded-2xl bg-paper-deep px-4 py-3 text-sm leading-relaxed text-accent-deep">{f.tip}</p>
        </div>
        <Columns columns={f.columns} dark={false} />
      </Container>
      <Container className="flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-xs text-ink-soft">
        <span>© 2026 {site.name}. Pre-launch build.</span>
        <span>
          Need help? Write to {site.supportEmail}
        </span>
      </Container>
    </footer>
  );
}
