import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { roleHome, type Profile } from "@/lib/auth";
import { liveHubs, site } from "@/lib/site";
import { buttonClass, Container } from "./ui";

const links = [
  ...liveHubs.map((h) => ({ href: `/hubs/${h.slug}`, label: h.name })),
  { href: "/sell", label: "Sell" },
  { href: "/promote", label: "Promote & earn" },
];

const dashLabel = { seller: "Seller dashboard", influencer: "Influencer dashboard", buyer: "My library", admin: "Admin" };

export function SiteHeader({ profile }: { profile: Profile | null }) {
  const home = profile ? roleHome[profile.role] : "/login";
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-xl tracking-tight">
          Creator <span className="text-accent">Marketing</span>
          <span className="sr-only"> {site.tagline}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 text-sm lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink-soft transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {profile ? (
            <>
              {profile.role !== "buyer" ? (
                <Link href="/library" className="text-sm text-ink-soft hover:text-ink">My library</Link>
              ) : null}
              <Link href={home} className={buttonClass("primary", "min-h-10 px-5")}>{dashLabel[profile.role]}</Link>
              <form action={signOut}>
                <button className="cursor-pointer text-sm text-ink-soft hover:text-ink">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-ink-soft hover:text-ink">Log in</Link>
              <Link href="/signup" className={buttonClass("primary", "min-h-10 px-5")}>Create account</Link>
            </>
          )}
        </div>

        {/* Mobile menu: opens without any JavaScript */}
        <details className="group lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full border border-line px-4 text-sm [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Close</span>
          </summary>
          <div className="absolute inset-x-0 top-16 border-b border-line bg-paper px-5 pb-6 pt-2 shadow-sm">
            <nav aria-label="Mobile" className="flex flex-col">
              {[...links, ...(profile ? [{ href: "/library", label: "My library" }] : [{ href: "/login", label: "Log in" }])].map((l) => (
                <Link key={l.href} href={l.href} className="border-b border-line py-4 font-display text-xl">
                  {l.label}
                </Link>
              ))}
            </nav>
            {profile ? (
              <div className="mt-5 flex flex-col gap-3">
                <Link href={home} className={buttonClass("primary", "w-full")}>{dashLabel[profile.role]}</Link>
                <form action={signOut}>
                  <button className={buttonClass("outline", "w-full")}>Log out</button>
                </form>
              </div>
            ) : (
              <Link href="/signup" className={buttonClass("primary", "mt-5 w-full")}>Create account</Link>
            )}
          </div>
        </details>
      </Container>
    </header>
  );
}
