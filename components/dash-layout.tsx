import Link from "next/link";
import type { Profile } from "@/lib/auth";
import { LinkPending } from "./client-bits";
import { Badge, Container, Notice } from "./ui";

// The frame around every dashboard page: greeting on top, page underneath.
// Navigation lives in the site header, which is different for each kind of account.
export function DashLayout({
  roleLabel,
  profile,
  alert,
  children,
}: {
  roleLabel: string;
  profile: Profile;
  alert?: { href: string; label: string } | null; // shown when something is waiting for this person
  children: React.ReactNode;
}) {
  const first = profile.full_name?.split(" ")[0];
  return (
    <Container className="max-w-7xl py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <Badge tone="accent">{roleLabel}</Badge>
          <h1 className="mt-3 text-4xl sm:text-5xl">{first ? `Hello, ${first}` : `${roleLabel} dashboard`}</h1>
        </div>
        {alert ? (
          <Link href={alert.href} className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-deep active:scale-[0.97]">
            {alert.label} →<LinkPending />
          </Link>
        ) : null}
      </div>

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
