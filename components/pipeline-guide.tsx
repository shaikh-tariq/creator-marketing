"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// The animated "how it works" guide on the home page.
// Pick a role, and the steps play one after another with a small animated screen for each.
// It pauses while the pointer is over it, and any step can be clicked.

type Step = {
  title: string;
  text: string;
  screen: { label: string; rows: string[]; result: string };
};

type Track = { id: string; name: string; tagline: string; cta: { href: string; label: string }; steps: Step[] };

const tracks: Track[] = [
  {
    id: "seller",
    name: "Sellers",
    tagline: "Make it once. Let creators bring the buyers.",
    cta: { href: "/signup?role=seller", label: "Start selling" },
    steps: [
      { title: "List your product", text: "Upload the file, set the price, and add a cover and description.", screen: { label: "New product", rows: ["Studio Brand Kit for Canva", "Price  ₹999", "File  brand-kit.zip"], result: "Draft saved" } },
      { title: "Set the deal", text: "Choose the commission influencers earn and write a short content brief.", screen: { label: "The influencer deal", rows: ["Commission  25%", "Promo discount  optional", "Brief  Show it in under a minute"], result: "Sent for review" } },
      { title: "Approve the posts", text: "Influencers submit their content. Nothing goes out under your brand until you say yes.", screen: { label: "Post to review", rows: ["Aman · Instagram reel", "“Rebranding a café in 60 seconds”", "Paid partnership tag  ✓"], result: "Approved" } },
      { title: "Watch the sales", text: "Every order shows how it sold: promo code, influencer link or direct.", screen: { label: "New order", rows: ["Buyer paid  ₹999", "Sold via promo code AMAN10", "Commission  ₹249.75"], result: "You keep ₹695.70" } },
    ],
  },
  {
    id: "influencer",
    name: "Influencers",
    tagline: "Recommend what you rate. Earn on every sale.",
    cta: { href: "/signup?role=influencer", label: "Start promoting" },
    steps: [
      { title: "Pick a product", text: "Browse by hub and commission. Join the ones you would use yourself.", screen: { label: "Find products", rows: ["Studio Brand Kit  ·  earn 25%", "Reel Hooks Pack  ·  earn 35%", "Content Calendar  ·  earn 30%"], result: "Joined" } },
      { title: "Make your post", text: "Follow the seller's brief on Instagram, YouTube, LinkedIn, Pinterest, X or Facebook.", screen: { label: "Submit your post", rows: ["Platform  Instagram", "Link  instagram.com/reel/…", "Marked as paid partnership  ✓"], result: "Submitted" } },
      { title: "Get your link and code", text: "Once the seller approves, you receive a tracked link and your own promo code.", screen: { label: "Post approved", rows: ["Your code  AMAN10", "Your link  /r/43b32362", "Buyers get the seller's discount"], result: "Ready to share" } },
      { title: "Earn on every sale", text: "See clicks, sales and earnings for each post, all in one place.", screen: { label: "This post", rows: ["Clicks  312", "Sales  9", "Earned  ₹2,247.75"], result: "+ ₹249.75 just now" } },
    ],
  },
  {
    id: "buyer",
    name: "Buyers",
    tagline: "Find it, pay, download. That is all.",
    cta: { href: "/search", label: "Browse products" },
    steps: [
      { title: "Find something good", text: "Browse the hubs, search, or follow a creator's link.", screen: { label: "Browse", rows: ["Design & Creative", "Creators & Social Media", "Search  “brand kit”"], result: "8 products" } },
      { title: "Use a creator's code", text: "If the seller offers a promo discount, a creator's code takes it off at checkout.", screen: { label: "Checkout", rows: ["Studio Brand Kit  ₹999", "Promo code  AMAN10", "Discount  − ₹99.90"], result: "Total ₹899.10" } },
      { title: "Download instantly", text: "The file is yours the moment you pay, and stays in your library.", screen: { label: "My library", rows: ["Studio Brand Kit for Canva", "brand-kit.zip  ·  24 MB", "Receipt saved"], result: "Download" } },
      { title: "Leave a review", text: "Only real buyers can review, so ratings mean something.", screen: { label: "Your review", rows: ["★★★★★", "“Saved me a week of work.”", "Verified buyer"], result: "Posted" } },
    ],
  },
];

const STEP_MS = 4200;

export function PipelineGuide() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const track = tracks[trackIndex];
  const step = track.steps[stepIndex];

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => {
      if (stepIndex < track.steps.length - 1) {
        setStepIndex(stepIndex + 1);
      } else {
        // finished this role: move on to the next one
        setTrackIndex((trackIndex + 1) % tracks.length);
        setStepIndex(0);
      }
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [stepIndex, trackIndex, paused, track.steps.length]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div role="tablist" aria-label="Choose who you are" className="mx-auto flex w-fit gap-1 rounded-full border border-line bg-card p-1 shadow-sm">
        {tracks.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={i === trackIndex}
            onClick={() => {
              setTrackIndex(i);
              setStepIndex(0);
            }}
            className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
              i === trackIndex ? "bg-ink text-white shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
      <p className="mt-5 text-center font-display text-xl text-ink-soft">{track.tagline}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-stretch">
        {/* Steps */}
        <ol className="space-y-3">
          {track.steps.map((s, i) => {
            const active = i === stepIndex;
            const done = i < stepIndex;
            return (
              <li key={`${track.id}-${i}`}>
                <button
                  onClick={() => setStepIndex(i)}
                  aria-current={active ? "step" : undefined}
                  className={`relative block w-full cursor-pointer overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                    active ? "border-accent/40 bg-card shadow-lg shadow-accent/10" : "border-line bg-card/60 hover:bg-card"
                  }`}
                >
                  <span className="flex items-start gap-4">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold transition-colors duration-300 ${
                        active ? "bg-accent text-white" : done ? "bg-success text-white" : "bg-paper-deep text-ink-soft"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span>
                      <span className="block font-display text-xl">{s.title}</span>
                      <span className={`grid transition-all duration-300 ${active ? "mt-1.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <span className="overflow-hidden text-sm leading-relaxed text-ink-soft">{s.text}</span>
                      </span>
                    </span>
                  </span>
                  {active && !paused ? (
                    <span key={`${track.id}-${i}-timer`} className="step-timer absolute inset-x-0 bottom-0 h-1 bg-accent" style={{ ["--step-ms" as string]: `${STEP_MS}ms` }} />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Animated screen for the current step */}
        <div className="relative flex min-h-[22rem] items-center justify-center overflow-hidden rounded-3xl bg-paper-deep p-6 sm:p-10">
          <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-sky/40 blur-2xl" />
          <div aria-hidden className="absolute -bottom-20 -left-10 size-56 rounded-full bg-sun/30 blur-2xl" />
          <div key={`${track.id}-${stepIndex}`} className="relative w-full max-w-sm">
            <div className="pop rounded-2xl border border-line bg-card p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{step.screen.label}</p>
                <span className="flex gap-1">
                  <span className="size-2 rounded-full bg-line" />
                  <span className="size-2 rounded-full bg-line" />
                  <span className="size-2 rounded-full bg-line" />
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {step.screen.rows.map((row, i) => (
                  <li key={row} className="pop rounded-xl bg-paper px-4 py-3 text-sm" style={{ ["--d" as string]: `${0.25 + i * 0.22}s` }}>
                    {row}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pop absolute -bottom-5 right-4 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-xl" style={{ ["--d" as string]: "1.1s" }}>
              {step.screen.result}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href={track.cta.href}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-7 text-base font-medium text-white shadow-sm transition-all hover:-translate-y-px active:scale-[0.97]"
        >
          {track.cta.label} →
        </Link>
        <p className="mt-3 text-xs text-ink-soft">Figures in the guide are examples.</p>
      </div>
    </div>
  );
}
