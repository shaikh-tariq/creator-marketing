import { signOut } from "@/app/(auth)/actions";
import type { Profile } from "@/lib/auth";
import { DashNav } from "./client-bits";
import { Badge, Container, Notice } from "./ui";

// The frame around every dashboard page: greeting, menu on the left, page on the right.
export function DashLayout({
  roleLabel,
  profile,
  nav,
  children,
}: {
  roleLabel: string;
  profile: Profile;
  nav: { href: string; label: string; count?: number }[];
  children: React.ReactNode;
}) {
  const first = profile.full_name?.split(" ")[0];
  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <Badge tone="clay">{roleLabel}</Badge>
          <h1 className="mt-3 text-4xl sm:text-5xl">{first ? `Hello, ${first}` : `${roleLabel} dashboard`}</h1>
        </div>
        <form action={signOut}>
          <button className="min-h-10 cursor-pointer rounded-full border border-line px-5 text-sm hover:border-ink">Log out</button>
        </form>
      </div>

      {profile.status === "pending" ? (
        <div className="mt-6">
          <Notice>
            Your account is waiting for admin approval. You can create drafts and submit them now; they go live once
            your account and the listing are approved.
          </Notice>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_1fr]">
        <DashNav items={nav} />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
