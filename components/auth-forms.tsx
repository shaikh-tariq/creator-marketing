"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { logIn, signUp, type FormState } from "@/app/(auth)/actions";
import { buttonClass, Notice } from "./ui";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-line bg-card px-4 text-base outline-none focus:border-ink";
const labelClass = "block text-sm font-medium";

const roles = [
  { id: "seller", title: "Seller", text: "I make digital products and want to sell them." },
  { id: "influencer", title: "Influencer", text: "I want to promote products and earn commission." },
  { id: "buyer", title: "Buyer", text: "I want to buy and download products." },
] as const;

function Messages({ state }: { state: FormState }) {
  if (state.error) return <Notice>{state.error}</Notice>;
  if (state.success)
    return (
      <div className="rounded-xl border border-moss/30 bg-moss/10 px-4 py-3 text-sm text-moss">{state.success}</div>
    );
  return null;
}

export function SignUpForm({ defaultRole }: { defaultRole: string }) {
  const [state, action, pending] = useActionState(signUp, {});
  const [role, setRole] = useState(roles.some((r) => r.id === defaultRole) ? defaultRole : "buyer");

  return (
    <form action={action} className="space-y-6">
      <fieldset>
        <legend className={labelClass}>I am joining as</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {roles.map((r) => (
            <label
              key={r.id}
              className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                role === r.id ? "border-ink bg-card" : "border-line hover:border-ink/40"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.id}
                checked={role === r.id}
                onChange={() => setRole(r.id)}
                className="sr-only"
              />
              <span className="font-display text-xl">{r.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{r.text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="full_name" className={labelClass}>Full name</label>
        <input id="full_name" name="full_name" autoComplete="name" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
        <p className="mt-2 text-xs text-ink-soft">At least 8 characters.</p>
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-[#211d18]" />
        <span>
          I agree to the <Link href="/legal/terms" className="underline">Terms</Link> and{" "}
          <Link href="/legal/privacy" className="underline">Privacy policy</Link>, and to my details being used
          to run my account.
        </span>
      </label>

      <Messages state={state} />

      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full disabled:opacity-60")}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function LogInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(logIn, {});

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <Messages state={state} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full disabled:opacity-60")}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
