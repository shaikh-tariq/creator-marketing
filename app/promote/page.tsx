import type { Metadata } from "next";
import { ButtonLink, Container, Eyebrow, SectionHeading } from "@/components/ui";
import { launchSettings, platforms } from "@/lib/site";

export const metadata: Metadata = { title: "Promote and earn" };

const steps = [
  { t: "Create your profile", d: "Add the platforms you post on. No follower minimum." },
  { t: "Pick a product", d: "Browse by hub, price and commission. Join the ones you would use yourself." },
  { t: "Make the post", d: "Follow the seller's brief and tick the paid-partnership disclosure." },
  { t: "Get approved", d: "The seller reviews it. Once approved you receive your own link and promo code." },
  { t: "Earn on every sale", d: "Track clicks, orders and earnings. Your share is paid out by the payment gateway." },
];

const rules = [
  { q: "How much can I earn?", a: `Sellers set a commission between ${launchSettings.commissionMinPct}% and ${launchSettings.commissionMaxPct}% of what the buyer pays. It is shown on every product before you join.` },
  { q: "When am I paid?", a: `${launchSettings.holdDays} days after each sale, to cover payment disputes. You complete a one-time identity and bank check with the payment gateway first.` },
  { q: "Why does the seller approve my post?", a: "It protects both sides: the seller's brand, and you from being credited for content they did not agree to." },
  { q: "Who owns my content?", a: "You do. Approval lets the seller repost it with credit. If it is declined, the seller may not use it." },
  { q: "What is not allowed?", a: "Buying through your own link, income claims, and posts without a disclosure tag. These cancel the commission." },
];

export default function PromotePage() {
  return (
    <>
      <section className="border-b border-line bg-paper-deep">
        <Container className="py-14 sm:py-20">
          <Eyebrow>For influencers</Eyebrow>
          <h1 className="mt-5 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
            Recommend products you rate. Earn on <em className="text-clay">every sale.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            No stock, no upfront cost and no cold-pitching brands. Choose a product, make a post, get a tracked
            link and promo code.
          </p>
          <div className="mt-8">
            <ButtonLink href="/signup?role=influencer" variant="accent">
              Create influencer account
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-2">
            {platforms.map((p) => (
              <li key={p.id} className="rounded-full border border-ink/20 bg-paper px-4 py-1.5 text-sm">
                {p.name}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="pt-16 sm:pt-24">
        <SectionHeading number="01" eyebrow="Steps" title="From sign-up to first commission." />
        <ol className="mt-10 divide-y divide-line border-y border-line">
          {steps.map((s, i) => (
            <li key={s.t} className="grid gap-2 py-6 sm:grid-cols-[4rem_1fr_1.4fr] sm:items-baseline sm:gap-6">
              <span className="font-display text-3xl text-clay">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-xl">{s.t}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>
      </Container>

      <Container className="pt-16 sm:pt-24">
        <SectionHeading number="02" eyebrow="The fine print, in plain words" title="What to expect." />
        <dl className="mt-10 grid gap-5 sm:grid-cols-2">
          {rules.map((f) => (
            <div key={f.q} className="rounded-2xl border border-line bg-card p-6">
              <dt className="font-display text-xl">{f.q}</dt>
              <dd className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </>
  );
}
