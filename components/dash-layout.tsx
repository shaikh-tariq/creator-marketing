import Link from "next/link";
import type { Profile } from "@/lib/auth";
import { LinkPending } from "./client-bits";
import { Container, Notice } from "./ui";

type Action = { href: string; label: string; primary?: boolean };

// The frame around every dashboard page: a welcome band on top, the page underneath.
// Navigation and log out live in the site header.
export function DashLayout({
  roleLabel,
  profile,
  subtitle,
  actions = [],
  alert,
  children,
}: {
  roleLabel: string;
  profile: Profile;
  subtitle: string;
  actions?: Action[]; // the two or three things this person most often does
  alert?: { href: string; label: string } | null; // shown when something is waiting for them
  children: React.ReactNode;
}) {
  const first = profile.full_name?.split(" ")[0];
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Container className="max-w-7xl py-6 sm:py-8">
      <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-9">
        <div aria-hidden className="absolute -right-10 -top-24 size-72 rounded-full bg-accent/50 blur-3xl" />
        <div aria-hidden className="absolute -bottom-28 right-1/3 size-64 rounded-full bg-sky/25 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">{roleLabel} dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">
              {greeting}{first ? `, ${first}` : ""}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {alert ? (
              <Link href={alert.href} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sun px-5 text-sm font-semibold text-ink shadow-sm transition-all hover:-translate-y-px active:scale-[0.97]">
                <span className="size-2 animate-pulse rounded-full bg-ink" />
                {alert.label}
                <LinkPending />
              </Link>
            ) : null}
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`inline-flex min-h-11 items-center gap-1 rounded-full px-5 text-sm font-medium transition-all hover:-translate-y-px active:scale-[0.97] ${
                  a.primary ? "bg-white text-ink shadow-sm" : "border border-white/25 text-white hover:bg-white/10"
                }`}
              >
                {a.label}
                <LinkPending />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {profile.status === "pending" ? (
        <div className="mt-6">
          <Notice>
            Your account is waiting for admin approval. You can create drafts and submit them now; they go live once
            your account and the listing are approved.
          </Notice>
        </div>
      ) : null}

      <div className="mt-8 min-w-0">{children}</div>
    </Container>
  );
}
