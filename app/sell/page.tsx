import type { Metadata } from "next";
import { SplitReceipt } from "@/components/split-receipt";
import { ButtonLink, Container, Eyebrow, SectionHeading } from "@/components/ui";
import { launchSettings, liveHubs } from "@/lib/site";

export const metadata: Metadata = { title: "Sell your digital products" };

const steps = [
  { t: "Create your seller account", d: "Tell us your brand name. We review new sellers by hand to keep copied work out." },
  { t: "List a product", d: "Upload the file, add previews and a licence, and set the price." },
  { t: "Set the deal", d: "Choose the commission, an optional promo discount, and write a short content brief." },
  { t: "Approve posts", d: "Influencers submit their content. You approve, ask for changes or decline." },
  { t: "Get paid by the gateway", d: "Each sale is split automatically. Your share is paid out by the payment gateway after the hold period." },
];

const faqs = [
  {
    q: "What does it cost?",
    a: `${launchSettings.platformFeePct}% of each sale during launch (${launchSettings.standardPlatformFeePct}% later, with notice), plus the payment gateway's own charge. No listing fee and no monthly fee.`,
  },
  {
    q: "Who pays the influencer?",
    a: "The commission comes out of the sale itself. You never pay upfront and you only pay for sales that happened.",
  },
  {
    q: "When does the money arrive?",
    a: `Your share is released ${launchSettings.holdDays} days after the sale. The delay covers payment disputes.`,
  },
  {
    q: "Can I refuse a post?",
    a: "Yes. No link or code exists until you approve the content, so nothing runs under your name without your say.",
  },
  {
    q: "What can I sell?",
    a: `Original digital products in the open hubs: ${liveHubs.map((h) => h.name).join(" and ")}. You must own the rights to everything you list.`,
  },
];

export default function SellPage() {
  return (
    <>
      <section className="border-b border-line">
        <Container className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Eyebrow>For sellers</Eyebrow>
            <h1 className="mt-5 text-5xl leading-[1.05] sm:text-6xl">
              Sell your work. Let creators bring the <em className="text-clay">buyers.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              List once. Influencers across five platforms promote your product for a commission you choose, and
              only after you approve what they post.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup?role=seller">Create seller account</ButtonLink>
              <ButtonLink href="#fees" variant="outline">
                See the fees
              </ButtonLink>
            </div>
          </div>
          <SplitReceipt title="What you keep on a ₹1,000 product" />
        </Container>
      </section>

      <Container className="pt-16 sm:pt-24">
        <SectionHeading number="01" eyebrow="Steps" title="From file to first sale." />
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
        <div id="fees" className="scroll-mt-24">
          <SectionHeading number="02" eyebrow="Fees and questions" title="Plain answers." />
        </div>
        <dl className="mt-10 grid gap-5 sm:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-line bg-card p-6">
              <dt className="font-display text-xl">{f.q}</dt>
              <dd className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-12">
          <ButtonLink href="/signup?role=seller">Create seller account</ButtonLink>
        </div>
      </Container>
    </>
  );
}
