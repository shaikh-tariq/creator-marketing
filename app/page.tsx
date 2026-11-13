import Image from "next/image";
import { Reveal } from "@/components/client-bits";
import { PipelineGuide } from "@/components/pipeline-guide";
import { SplitReceipt } from "@/components/split-receipt";
import { ButtonLink, Container, Eyebrow, inputClass, buttonClass } from "@/components/ui";
import { launchSettings, platforms } from "@/lib/site";


// The comparison table on the home page. Edit the wording here.
const comparison = [
  { what: "Finding promoters", before: "Cold messages, one by one", after: "They come to your listing" },
  { what: "Agreeing the deal", before: "Negotiated with each creator", after: "One commission, set once" },
  { what: "What you pay", before: "A fixed fee per post", after: "Only when a sale happens" },
  { what: "Control over posts", before: "Hope they follow the brief", after: "You approve every post" },
  { what: "Knowing what sold", before: "Screenshots and spreadsheets", after: "A link and code per creator" },
  { what: "Paying creators", before: "Manual transfers", after: "Split on every sale" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero: the main hook. Big promise, two clear buttons, and a crowd of creators underneath. */}
      <section className="relative overflow-hidden border-b border-line bg-card">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(50rem_20rem_at_50%_0%,#dbe7ff_0%,transparent_70%)]" />
        <Container className="relative pt-14 text-center sm:pt-20">
          <p className="rise mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-xs font-medium shadow-sm">
            <span className="size-2 rounded-full bg-success" />
            {launchSettings.platformFeePct}% launch fee · No listing fee · Made in India
          </p>
          <h1 className="rise mx-auto mt-6 max-w-4xl text-[2.7rem] font-semibold leading-[1.03] sm:text-7xl" style={{ ["--d" as string]: "0.08s" }}>
            Make it once.
            <br />
            Let creators <em>sell it for you.</em>
          </h1>
          <p className="rise mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft" style={{ ["--d" as string]: "0.16s" }}>
            List your templates, presets and creator tools. Influencers post about the ones they love and earn on
            every sale. You approve every post first.
          </p>
          <div className="rise mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ ["--d" as string]: "0.24s" }}>
            <ButtonLink href="/signup" className="h-12 px-7 text-base">Join for free →</ButtonLink>
            <ButtonLink href="/search" variant="outline" className="h-12 px-7 text-base">Explore products</ButtonLink>
          </div>
        </Container>

        <div className="rise relative mx-auto mt-12 max-w-7xl px-2" style={{ ["--d" as string]: "0.3s" }}>
          {/* Floating examples of what each side sees */}
          <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
            <span className="float absolute left-[1%] top-[-4%] rounded-2xl border border-line bg-card px-4 py-2.5 text-sm font-medium shadow-lg">✓ Post approved</span>
            <span className="float absolute left-[19%] top-[-8%] rounded-2xl bg-ink px-4 py-2.5 font-mono text-sm text-white shadow-lg" style={{ ["--d" as string]: "1.2s" }}>AMAN10</span>
            <span className="float absolute right-[17%] top-[-9%] rounded-2xl border border-line bg-card px-4 py-2.5 text-sm font-medium text-success shadow-lg" style={{ ["--d" as string]: "0.6s" }}>+ ₹180 commission</span>
            <span className="float absolute right-[1%] top-[-5%] rounded-2xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg" style={{ ["--d" as string]: "1.8s" }}>New sale · ₹900</span>
          </div>
          <Image
            src="/hero-crowd.webp"
            alt="A cheerful group of creators posing together for a selfie"
            width={2000}
            height={848}
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="block h-auto w-full"
          />
        </div>
      </section>

      {/* Why here: the old way of working with influencers next to this one */}
      <Container className="pt-16 sm:pt-24">
        <Reveal>
          <div className="text-center">
            <Eyebrow>Why sell here</Eyebrow>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl leading-tight sm:text-5xl">Influencer marketing, without the chasing.</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-ink-soft">
              Working with creators usually means cold messages, one-off negotiations and paying before you know if a
              post will sell. Here the deal is set once and you pay only when a sale happens.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl overflow-x-auto">
            <div className="grid min-w-[40rem] grid-cols-[1.2fr_1fr_1.1fr] items-stretch">
              <div />
              <div className="flex items-center justify-center px-4 pb-6 pt-8 text-center font-display text-lg font-semibold">Doing it yourself</div>
              <div className="flex items-center justify-center rounded-t-3xl border-x-2 border-t-4 border-accent bg-paper-deep px-4 pb-6 pt-8 text-center font-display text-lg font-semibold">
                With&nbsp;<span className="text-accent">Creator Marketing</span>
              </div>
              {comparison.map((row, i) => {
                const last = i === comparison.length - 1;
                return (
                  <div key={row.what} className="contents">
                    <div className="flex items-center border-t border-line py-6 pr-4 text-lg text-ink-soft">{row.what}</div>
                    <div className="flex items-center justify-center border-t border-line px-4 py-6 text-center text-lg">{row.before}</div>
                    <div className={`flex items-center justify-center border-x-2 border-accent bg-paper-deep px-4 py-6 text-center font-display text-lg font-semibold text-accent ${last ? "rounded-b-3xl border-b-2 pb-8" : ""}`}>
                      {row.after}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Where the money goes */}
      <Container className="pt-16 sm:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow>Clear money, every sale</Eyebrow>
            <h2 className="mt-4 max-w-md text-3xl leading-tight sm:text-4xl">Everyone sees exactly who gets what.</h2>
            <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
              The seller sets the price and the commission. The moment a buyer pays, the sale is split between the
              seller, the influencer and the platform. No invoices to chase.
            </p>
            <form action="/search" className="mt-6 flex max-w-md items-center gap-2">
              <input name="q" placeholder="Search templates, presets, kits…" aria-label="Search products" className={`${inputClass} mt-0 rounded-full px-5 shadow-sm`} />
              <button className={buttonClass("outline", "shrink-0")}>Search</button>
            </form>
          </div>
          <div className="rounded-3xl shadow-xl shadow-accent/10">
            <SplitReceipt />
          </div>
        </div>
      </Container>


      {/* How it works: the animated guide for sellers, influencers and buyers */}
      <Container className="pt-16 sm:pt-24">
        <Reveal>
          <div className="text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl leading-tight sm:text-5xl">One marketplace, three ways in.</h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-soft">
              Choose who you are and watch your side of it, step by step.
            </p>
          </div>
          <div className="mt-10">
            <PipelineGuide />
          </div>
        </Reveal>
      </Container>


      <Container className="pt-16 sm:pt-24">
        <div className="border-t border-line pt-10 text-center">
          <Eyebrow>Where creators post</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl leading-tight sm:text-4xl">Six platforms, one dashboard.</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-soft">
            Promote where your audience already is. Every approved post gets its own tracked link and promo code.
          </p>
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl border border-line">
          {platforms.map((p, i) => (
            <div
              key={p.id}
              className={`grid gap-1 bg-card px-6 py-5 sm:grid-cols-[1fr_1.2fr_1.6fr] sm:items-baseline sm:gap-6 ${i > 0 ? "border-t border-line" : ""}`}
            >
              <p className="font-display text-2xl">{p.name}</p>
              <p className="text-sm text-ink-soft">{p.formats}</p>
              <p className="text-sm">{p.link}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="pt-16 sm:pt-24">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col rounded-2xl bg-ink p-8 text-paper sm:p-10">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky">For sellers</p>
            <h2 className="mt-5 text-3xl leading-tight sm:text-4xl">Your products. Their audience. Your approval.</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-paper/80">
              <li>· {launchSettings.platformFeePct}% platform fee at launch, no listing fee</li>
              <li>· You set the commission and the brief</li>
              <li>· You approve every post before a code is issued</li>
            </ul>
            <div className="mt-8"><ButtonLink href="/sell" variant="light">How selling works</ButtonLink></div>
          </div>
          <div className="flex flex-col rounded-2xl bg-paper-deep p-8 sm:p-10">
            <Eyebrow>For influencers</Eyebrow>
            <h2 className="mt-5 text-3xl leading-tight sm:text-4xl">Earn from products worth recommending.</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-soft">
              <li>· Commission of {launchSettings.commissionMinPct}% to {launchSettings.commissionMaxPct}% per sale</li>
              <li>· No follower minimum to start</li>
              <li>· See clicks, orders and earnings for every link</li>
            </ul>
            <div className="mt-8"><ButtonLink href="/promote" variant="accent">How promoting works</ButtonLink></div>
          </div>
        </div>
      </Container>
    </>
  );
}
