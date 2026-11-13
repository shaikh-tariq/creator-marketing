import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/client-bits";
import { PipelineGuide } from "@/components/pipeline-guide";
import { ProductCard } from "@/components/product-card";
import { SplitReceipt } from "@/components/split-receipt";
import { Badge, ButtonLink, Container, Eyebrow, SectionHeading, inputClass, buttonClass } from "@/components/ui";
import { listProducts } from "@/lib/data";
import { hubs, launchSettings, platforms } from "@/lib/site";


export default async function HomePage() {
  const featured = await listProducts({ limit: 4 });

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

      <Container className="pt-16 sm:pt-24">
        <SectionHeading
          number="01"
          eyebrow="Hubs"
          title="Two hubs open first. More on the way."
          intro="Each hub is a focused shelf with its own sellers and its own creators, so the right people find the right products."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {hubs.map((hub) => {
            const live = hub.status === "live";
            return (
              <Link
                key={hub.slug}
                href={`/hubs/${hub.slug}`}
                className={`group flex flex-col rounded-2xl border p-7 transition-colors ${
                  live ? "border-ink/15 bg-card hover:border-ink/40" : "border-dashed border-line bg-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge tone={live ? "success" : "neutral"}>{live ? "Open" : "Coming soon"}</Badge>
                  <span aria-hidden className="text-ink-soft transition-transform group-hover:translate-x-1">→</span>
                </div>
                <h3 className={`mt-6 text-2xl sm:text-3xl ${live ? "" : "text-ink-soft"}`}>{hub.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{hub.blurb}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {hub.examples.map((e) => (
                    <li key={e} className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">{e}</li>
                  ))}
                </ul>
              </Link>
            );
          })}
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

      {featured.length > 0 ? (
        <Container className="pt-16 sm:pt-24">
          <SectionHeading number="03" eyebrow="On the shelf" title="New in the hubs." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      ) : null}

      <Container className="pt-16 sm:pt-24">
        <SectionHeading
          number="04"
          eyebrow="Where creators post"
          title="Five platforms, one dashboard."
          intro="Promote where your audience already is. Every approved post gets its own tracked link and promo code."
        />
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
