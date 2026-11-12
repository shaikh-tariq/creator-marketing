import Link from "next/link";
import { hubs, site } from "@/lib/site";
import { Container } from "./ui";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl">
            Creator <span className="italic text-sand">Marketing</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/70">{site.description}</p>
        </div>

        <FooterColumn title="Hubs">
          {hubs.map((h) => (
            <li key={h.slug}>
              <Link href={`/hubs/${h.slug}`} className="hover:text-paper">
                {h.name}
                {h.status === "coming_soon" ? <span className="ml-2 text-xs text-sand">Soon</span> : null}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Join">
          <li><Link href="/sell" className="hover:text-paper">Sell your products</Link></li>
          <li><Link href="/promote" className="hover:text-paper">Promote & earn</Link></li>
          <li><Link href="/signup" className="hover:text-paper">Create account</Link></li>
          <li><Link href="/login" className="hover:text-paper">Log in</Link></li>
        </FooterColumn>

        <FooterColumn title="Policies">
          <li><Link href="/legal/terms" className="hover:text-paper">Terms</Link></li>
          <li><Link href="/legal/privacy" className="hover:text-paper">Privacy</Link></li>
          <li><Link href="/legal/refunds" className="hover:text-paper">Refunds</Link></li>
        </FooterColumn>
      </Container>
      <Container className="border-t border-paper/15 py-6 text-xs text-paper/60">
        © 2026 {site.name}. Pre-launch build. Listings shown are samples.
      </Container>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-sand">{title}</p>
      <ul className="mt-4 space-y-3 text-sm text-paper/75">{children}</ul>
    </div>
  );
}
