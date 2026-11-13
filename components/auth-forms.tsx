"use client";

import { useActionState } from "react";
import { logIn, setPassword, type FormState } from "@/app/(auth)/actions";
import { buttonClass, Notice } from "./ui";

const inputClass =
  "mt-2 block h-14 w-full rounded-2xl border border-line bg-card px-5 text-lg outline-none transition-colors focus:border-accent";
const labelClass = "block text-sm font-medium";

function Messages({ state }: { state: FormState }) {
  if (state.error) return <Notice tone="alert">{state.error}</Notice>;
  if (state.success)
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{state.success}</div>
    );
  return null;
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
      <button type="submit" disabled={pending} className={buttonClass("primary", "h-12 w-full text-base")}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

// Choose a password (typed twice). Used on the last sign-up step and on the page reached from the email link.
export function PasswordForm() {
  const [state, action, pending] = useActionState(setPassword, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="new-password" className={labelClass}>Password</label>
        <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required autoFocus className={inputClass} />
        <p className="mt-1.5 text-xs text-ink-soft">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className={labelClass}>Type it again</label>
        <input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
      </div>
      <Messages state={state} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "h-12 w-full text-base")}>
        {pending ? "Saving…" : "Save password and continue"}
      </button>
    </form>
  );
}
