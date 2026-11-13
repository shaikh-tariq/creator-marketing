import type { Metadata } from "next";
import Link from "next/link";
import { LogInForm } from "@/components/auth-forms";
import { Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

const errors: Record<string, string> = {
  confirm: "That verification link did not work or has expired. Try logging in, or sign up again.",
  suspended: "This account is suspended. Contact support if you think this is a mistake.",
};

const points = [
  { title: "Sellers", text: "Products, posts to approve and every sale." },
  { title: "Influencers", text: "Your posts, links, codes and earnings." },
  { title: "Buyers", text: "Everything you bought, ready to download." },
];

export default async function LogInPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;

  return (
    <div className="auth-shell grid min-h-[calc(100vh-4rem)] lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r border-line bg-card px-6 py-10 lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">One login, your own space</p>
        <ul className="mt-5 space-y-5">
          {points.map((p) => (
            <li key={p.title}>
              <p className="font-display text-lg font-semibold">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xs leading-relaxed text-ink-soft">After logging in you go straight to your own page.</p>
      </aside>

      <div className="px-5 py-10 sm:px-12 lg:py-16">
        <div className="page-enter mx-auto max-w-md lg:mx-0">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Welcome back.</h1>
          <p className="mt-3 text-ink-soft">
            New here? <Link href="/signup" className="text-ink underline">Create an account</Link>
          </p>
          {error && errors[error] ? (
            <div className="mt-6">
              <Notice tone="alert">{errors[error]}</Notice>
            </div>
          ) : null}
          <div className="mt-8">
            <LogInForm next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
