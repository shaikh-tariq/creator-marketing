import Link from "next/link";
import { liveHubs, site } from "@/lib/site";
import { buttonClass, Container } from "./ui";

const links = [
  ...liveHubs.map((h) => ({ href: `/hubs/${h.slug}`, label: h.name })),
  { href: "/sell", label: "Sell" },
  { href: "/promote", label: "Promote & earn" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-xl tracking-tight">
          Creator <span className="italic text-clay">Marketing</span>
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
          <Link href="/login" className="text-sm text-ink-soft hover:text-ink">
            Log in
          </Link>
          <Link href="/signup" className={buttonClass("primary", "min-h-10 px-5")}>
            Create account
          </Link>
        </div>

        {/* Mobile menu: opens without any JavaScript */}
        <details className="group lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full border border-line px-4 text-sm [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Close</span>
          </summary>
          <div className="absolute inset-x-0 top-16 border-b border-line bg-paper px-5 pb-6 pt-2 shadow-sm">
            <nav aria-label="Mobile" className="flex flex-col">
              {[...links, { href: "/login", label: "Log in" }].map((l) => (
                <Link key={l.href} href={l.href} className="border-b border-line py-4 font-display text-xl">
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link href="/signup" className={buttonClass("primary", "mt-5 w-full")}>
              Create account
            </Link>
          </div>
        </details>
      </Container>
    </header>
  );
}
