import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { roleHome, type Profile, type Role } from "@/lib/auth";
import { liveHubs, site } from "@/lib/site";
import { NavLink, SubmitButton } from "./client-bits";
import { Avatar, buttonClass, Container } from "./ui";

type Item = { href: string; label: string; exact?: boolean };

// Each kind of account gets its own header. Visitors see the public one.
// Visitors get a clean header with no menu: logo on the left, log in and one button on the right.
const guestNav: Item[] = [];

const roleNav: Record<Role, Item[]> = {
  buyer: [
    { href: "/search", label: "Browse" },
    ...liveHubs.map((h) => ({ href: `/hubs/${h.slug}`, label: h.name })),
    { href: "/library", label: "My library" },
  ],
  seller: [
    { href: "/seller", label: "Overview", exact: true },
    { href: "/seller/products", label: "Products" },
    { href: "/seller/submissions", label: "Influencers" },
    { href: "/seller/earnings", label: "Earnings" },
    { href: "/search", label: "Marketplace" },
  ],
  influencer: [
    { href: "/influencer", label: "Overview", exact: true },
    { href: "/influencer/browse", label: "Find products" },
    { href: "/influencer/joins", label: "My posts" },
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

// The three ways in for a visitor, shown side by side so nobody has to guess which button is theirs.
const joinDoors = [
  { role: "buyer", label: "Buy", hint: "Find and download products", className: "text-ink hover:bg-paper-deep" },
  { role: "seller", label: "Sell", hint: "List your digital products", className: "text-ink hover:bg-paper-deep" },
  { role: "influencer", label: "Promote", hint: "Post about products and earn commission", className: "text-ink hover:bg-paper-deep" },
];

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

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/85 backdrop-blur-md">
      <Container className={`flex h-16 items-center justify-between gap-4 ${profile ? "max-w-7xl" : ""}`}>
        <div className="flex shrink-0 items-center gap-3">
          <Link href={profile ? roleHome[profile.role] : "/"} className="shrink-0 whitespace-nowrap font-display text-xl font-semibold tracking-tight transition-opacity hover:opacity-80">
            <span className="mr-2 inline-flex size-7 -translate-y-px items-center justify-center rounded-lg bg-accent align-middle text-sm font-bold text-white">C</span>
            Creator <span className="text-accent">Marketing</span>
            <span className="sr-only"> {site.tagline}</span>
          </Link>
          {tag ? <span className={`hidden shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider sm:inline ${tag.className}`}>{tag.label}</span> : null}
        </div>

        <nav aria-label="Main" className="hidden min-w-0 items-center gap-0.5 text-sm lg:flex">
          {nav.map((l) => (
            <NavLink key={l.href} href={l.href} exact={l.exact}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-sm lg:flex">
          {profile ? (
            <>
              {profile.role === "admin" ? <NavLink href="/library">My library</NavLink> : null}
              <Link href="/account" title="Profile and settings" className="flex max-w-40 items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 shadow-sm transition-all hover:border-ink/40 active:scale-[0.97]">
                <Avatar url={profile.avatar_url} name={first} size={28} />
                <span className="truncate">{first}</span>
              </Link>
              <form action={signOut}>
                <SubmitButton className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-ink-soft transition-all hover:bg-paper-deep hover:text-ink active:scale-[0.97]">Log out</SubmitButton>
              </form>
            </>
          ) : (
            <>
              <NavLink href="/login">Log in</NavLink>
              <span className="ml-1 text-xs text-ink-soft">Join to</span>
              <span className="flex items-center gap-1 rounded-2xl border border-line bg-card p-1 shadow-sm">
                {joinDoors.map((d) => (
                  <Link key={d.role} href={`/signup?role=${d.role}`} title={d.hint} className={`inline-flex min-h-9 items-center rounded-xl px-4 text-sm font-semibold transition-all active:scale-[0.97] ${d.className}`}>
                    {d.label}
                  </Link>
                ))}
              </span>
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
              {[...nav, ...(profile ? [{ href: "/account", label: "Profile & settings" }] : [{ href: "/signup?role=buyer", label: "Join to buy" }, { href: "/signup?role=seller", label: "Join to sell" }, { href: "/signup?role=influencer", label: "Join to promote" }, { href: "/search", label: "Browse products" }, { href: "/login", label: "Log in" }])].map((l) => (
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
              null
            )}
          </div>
        </details>
      </Container>
    </header>
  );
}
