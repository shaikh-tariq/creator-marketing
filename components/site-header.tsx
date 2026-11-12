import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { roleHome, type Profile, type Role } from "@/lib/auth";
import { liveHubs, site } from "@/lib/site";
import { NavLink, SubmitButton } from "./client-bits";
import { buttonClass, Container } from "./ui";

type Item = { href: string; label: string; exact?: boolean };

// Each kind of account gets its own header. Visitors see the public one.
const guestNav: Item[] = [
  ...liveHubs.map((h) => ({ href: `/hubs/${h.slug}`, label: h.name })),
  { href: "/sell", label: "Sell" },
  { href: "/promote", label: "Promote & earn" },
];

const roleNav: Record<Role, Item[]> = {
  buyer: [
    { href: "/search", label: "Browse" },
    ...liveHubs.map((h) => ({ href: `/hubs/${h.slug}`, label: h.name })),
    { href: "/library", label: "My library" },
  ],
  seller: [
    { href: "/seller", label: "Overview", exact: true },
    { href: "/seller/products", label: "Products" },
    { href: "/seller/submissions", label: "Influencers & posts" },
    { href: "/seller/earnings", label: "Orders & earnings" },
    { href: "/search", label: "Marketplace" },
  ],
  influencer: [
    { href: "/influencer", label: "Overview", exact: true },
    { href: "/influencer/browse", label: "Find products" },
    { href: "/influencer/joins", label: "My joins & posts" },
    { href: "/influencer/earnings", label: "Earnings" },
  ],
  admin: [
    { href: "/admin", label: "Overview", exact: true },
    { href: "/admin/review", label: "Review queue" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/ledger", label: "Ledger" },
    { href: "/admin/settings", label: "Settings" },
  ],
};

// A coloured tag so it is always obvious which kind of account is logged in.
const roleTag: Record<Role, { label: string; className: string }> = {
  buyer: { label: "Buyer", className: "bg-paper-deep text-accent-deep" },
  seller: { label: "Seller", className: "bg-ink text-white" },
  influencer: { label: "Influencer", className: "bg-accent text-white" },
  admin: { label: "Admin", className: "bg-sun text-ink" },
};

export function SiteHeader({ profile }: { profile: Profile | null }) {
  const nav = profile ? roleNav[profile.role] : guestNav;
  const tag = profile ? roleTag[profile.role] : null;
  const first = profile?.full_name?.split(" ")[0] ?? "Account";
  const initial = first.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={profile ? roleHome[profile.role] : "/"} className="font-display text-xl font-semibold tracking-tight transition-opacity hover:opacity-80">
            Creator <span className="text-accent">Marketing</span>
            <span className="sr-only"> {site.tagline}</span>
          </Link>
          {tag ? <span className={`hidden rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider sm:inline ${tag.className}`}>{tag.label}</span> : null}
        </div>

        <nav aria-label="Main" className="hidden items-center gap-1 text-sm lg:flex">
          {nav.map((l) => (
            <NavLink key={l.href} href={l.href} exact={l.exact}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 text-sm lg:flex">
          {profile ? (
            <>
              {profile.role !== "buyer" ? <NavLink href="/library">My library</NavLink> : null}
              <span className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 shadow-sm">
                <span className="flex size-7 items-center justify-center rounded-full bg-paper-deep text-xs font-semibold text-accent-deep">{initial}</span>
                {first}
              </span>
              <form action={signOut}>
                <SubmitButton className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-soft transition-all hover:bg-paper-deep hover:text-ink active:scale-[0.97]">Log out</SubmitButton>
              </form>
            </>
          ) : (
            <>
              <NavLink href="/login">Log in</NavLink>
              <Link href="/signup" className={buttonClass("primary", "min-h-10 px-5")}>Join for free →</Link>
            </>
          )}
        </div>

        {/* Mobile menu: opens without any JavaScript */}
        <details className="group lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full border border-line bg-card px-4 text-sm shadow-sm [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Close</span>
          </summary>
          <div className="absolute inset-x-0 top-16 border-b border-line bg-card px-5 pb-6 pt-2 shadow-lg">
            {tag ? <p className="pt-3 text-xs text-ink-soft">Logged in as {first} · {tag.label}</p> : null}
            <nav aria-label="Mobile" className="flex flex-col">
              {[...nav, ...(profile ? (profile.role !== "buyer" ? [{ href: "/library", label: "My library" }] : []) : [{ href: "/login", label: "Log in" }])].map((l) => (
                <Link key={l.href} href={l.href} className="border-b border-line py-4 font-display text-xl active:bg-paper-deep">
                  {l.label}
                </Link>
              ))}
            </nav>
            {profile ? (
              <form action={signOut} className="mt-5">
                <SubmitButton className={buttonClass("outline", "w-full")}>Log out</SubmitButton>
              </form>
            ) : (
              <Link href="/signup" className={buttonClass("primary", "mt-5 w-full")}>Join for free →</Link>
            )}
          </div>
        </details>
      </Container>
    </header>
  );
}
