"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { signUp } from "@/app/(auth)/actions";
import { Spinner } from "./client-bits";

// The sign-up flow: one question per screen, a checklist on the left that fills in as you go.
// What is asked depends on the kind of account (sellers add a brand, influencers add their channels).

type Role = "seller" | "influencer" | "buyer";
type StepId = "role" | "name" | "brand" | "platforms" | "handles" | "audience" | "account" | "done";

const roleCards: { id: Role; title: string; text: string }[] = [
  { id: "seller", title: "Sell my products", text: "I make templates, presets or creator tools." },
  { id: "influencer", title: "Promote and earn", text: "I post about products and earn commission." },
  { id: "buyer", title: "Buy products", text: "I am here to find and download good work." },
];

const platformList = [
  { id: "instagram", name: "Instagram", base: "https://www.instagram.com/" },
  { id: "linkedin", name: "LinkedIn", base: "https://www.linkedin.com/in/" },
  { id: "pinterest", name: "Pinterest", base: "https://www.pinterest.com/" },
  { id: "x", name: "X", base: "https://x.com/" },
  { id: "facebook", name: "Facebook", base: "https://www.facebook.com/" },
];

const niches = ["Design", "Creator growth", "Small business", "Productivity", "Tech", "Education", "Lifestyle", "Fashion", "Travel", "Finance"];
const ranges = ["Under 1k", "1k to 5k", "5k to 20k", "20k to 50k", "50k to 200k", "Over 200k"];

// Turns "@name" or "name" into a full profile link; leaves full links alone.
function toUrl(platformId: string, value: string) {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  const base = platformList.find((p) => p.id === platformId)?.base ?? "https://";
  return base + v.replace(/^@/, "");
}

const input = "mt-2 block h-14 w-full rounded-2xl border border-line bg-card px-5 text-lg outline-none transition-colors focus:border-accent";
const chip = (on: boolean) =>
  `cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-[0.96] ${
    on ? "border-accent bg-accent text-white shadow-sm" : "border-line bg-card text-ink hover:border-ink/40"
  }`;

export function SignupWizard({ defaultRole }: { defaultRole?: string }) {
  const [role, setRole] = useState<Role | "">(roleCards.some((r) => r.id === defaultRole) ? (defaultRole as Role) : "");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [niche, setNiche] = useState<string[]>([]);
  const [range, setRange] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [index, setIndex] = useState(defaultRole && roleCards.some((r) => r.id === defaultRole) ? 1 : 0);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();

  const first = name.trim().split(" ")[0];

  const steps = useMemo(() => {
    const list: { id: StepId; group: string; label: string }[] = [
      { id: "role", group: "About you", label: "Account type" },
      { id: "name", group: "About you", label: "Name" },
    ];
    if (role === "seller") list.push({ id: "brand", group: "Your shop", label: "Brand name" });
    if (role === "influencer") {
      list.push({ id: "platforms", group: "Your channels", label: "Platforms" });
      list.push({ id: "handles", group: "Your channels", label: "Handles" });
      list.push({ id: "audience", group: "Your channels", label: "Audience" });
    }
    list.push({ id: "account", group: "Finish", label: "Email and password" });
    list.push({ id: "done", group: "Finish", label: "Verify your email" });
    return list;
  }, [role]);

  const step = steps[Math.min(index, steps.length - 1)];
  const current: StepId = finished ? "done" : step.id;

  const valid: Record<StepId, boolean> = {
    role: role !== "",
    name: name.trim().length >= 2,
    brand: brand.trim().length >= 2,
    platforms: platforms.length > 0,
    handles: platforms.some((p) => (handles[p] ?? "").trim().length > 1),
    audience: range !== "",
    account: /^\S+@\S+\.\S+$/.test(email) && password.length >= 8 && consent,
    done: true,
  };

  function next() {
    setError("");
    if (!valid[current]) return;
    if (current === "account") return submit();
    setIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    setError("");
    setIndex((i) => Math.max(i - 1, 0));
  }

  function submit() {
    const fd = new FormData();
    fd.set("full_name", name.trim());
    fd.set("email", email.trim());
    fd.set("password", password);
    fd.set("role", role);
    fd.set("consent", "on");
    fd.set("brand_name", brand.trim());
    fd.set("niche", niche.join(", "));
    fd.set("follower_range", range);
    fd.set(
      "channels",
      JSON.stringify(platforms.map((p) => ({ platform: p, url: toUrl(p, handles[p] ?? "") })).filter((c) => c.url)),
    );
    startTransition(async () => {
      const result = await signUp({}, fd);
      if (result.error) setError(result.error);
      else setFinished(true);
    });
  }

  // Enter moves forward, like pressing Continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const groups = [...new Set(steps.map((s) => s.group))];
  const currentIndex = finished ? steps.length - 1 : index;

  return (
    <div className="auth-shell grid min-h-[calc(100vh-4rem)] lg:grid-cols-[17rem_1fr]">
      {/* Checklist */}
      <aside className="hidden border-r border-line bg-card px-6 py-10 lg:block">
        {groups.map((g) => (
          <div key={g} className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">{g}</p>
            <ul className="mt-3 space-y-1">
              {steps.filter((s) => s.group === g).map((s) => {
                const i = steps.indexOf(s);
                const done = i < currentIndex || (finished && s.id !== "done");
                const active = i === currentIndex;
                return (
                  <li key={s.id} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors ${active ? "bg-paper-deep font-medium text-ink" : done ? "text-ink" : "text-ink-soft/70"}`}>
                    <span className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] transition-colors ${done ? "bg-success text-white" : active ? "border-[5px] border-ink" : "border border-line"}`}>
                      {done ? "✓" : ""}
                    </span>
                    {s.label}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="mt-10 text-xs leading-relaxed text-ink-soft">Takes about two minutes. Free to join.</p>
      </aside>

      {/* Question */}
      <div className="px-5 py-10 sm:px-12 lg:py-16">
        {/* progress bar for small screens */}
        <div className="mb-8 h-1 overflow-hidden rounded-full bg-paper-deep lg:hidden">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }} />
        </div>

        <div key={current} className="page-enter mx-auto max-w-xl lg:mx-0">
          {current === "role" ? (
            <>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">What brings you here?</h1>
              <p className="mt-3 text-ink-soft">Pick one. It decides what your account looks like.</p>
              <div className="mt-8 space-y-3">
                {roleCards.map((r) => (
                  <button key={r.id} type="button" onClick={() => { setRole(r.id); setError(""); }} className={`block w-full cursor-pointer rounded-2xl border p-5 text-left transition-all active:scale-[0.99] ${role === r.id ? "border-accent bg-paper-deep shadow-sm" : "border-line bg-card hover:border-ink/40"}`}>
                    <span className="font-display text-xl font-semibold">{r.title}</span>
                    <span className="mt-1 block text-sm text-ink-soft">{r.text}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {current === "name" ? (
            <>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">First, what should we call you?</h1>
              <p className="mt-3 text-ink-soft">It is how we greet you on your dashboard.</p>
              <label className="mt-8 block text-sm font-medium">
                Your name
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} className={input} />
              </label>
            </>
          ) : null}

          {current === "brand" ? (
            <>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">What is your brand called{first ? `, ${first}` : ""}?</h1>
              <p className="mt-3 text-ink-soft">Shown on every product you list. You can change it later.</p>
              <label className="mt-8 block text-sm font-medium">
                Brand or shop name
                <input autoFocus value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={60} className={input} />
              </label>
            </>
          ) : null}

          {current === "platforms" ? (
            <>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Where do you post{first ? `, ${first}` : ""}?</h1>
              <p className="mt-3 text-ink-soft">Pick every platform you would promote on.</p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {platformList.map((p) => {
                  const on = platforms.includes(p.id);
                  return (
                    <button key={p.id} type="button" aria-pressed={on} onClick={() => setPlatforms(on ? platforms.filter((x) => x !== p.id) : [...platforms, p.id])} className={chip(on)}>
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {current === "handles" ? (
            <>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">What are your handles?</h1>
              <p className="mt-3 text-ink-soft">Sellers see these when you ask to promote their product. Add at least one.</p>
              <div className="mt-8 space-y-4">
                {platformList.filter((p) => platforms.includes(p.id)).map((p, i) => (
                  <label key={p.id} className="block text-sm font-medium">
                    {p.name}
                    <input autoFocus={i === 0} value={handles[p.id] ?? ""} onChange={(e) => setHandles({ ...handles, [p.id]: e.target.value })} placeholder="@yourhandle or profile link" maxLength={200} className={input} />
                  </label>
                ))}
              </div>
            </>
          ) : null}

          {current === "audience" ? (
            <>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Tell us about your audience.</h1>
              <p className="mt-3 text-ink-soft">Roughly how many people follow you on your biggest channel?</p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {ranges.map((r) => (
                  <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} className={chip(range === r)}>{r}</button>
                ))}
              </div>
              <p className="mt-8 font-display text-xl font-semibold">And what do you post about?</p>
              <p className="mt-1 text-sm text-ink-soft">Up to three. Optional.</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {niches.map((n) => {
                  const on = niche.includes(n);
                  return (
                    <button key={n} type="button" aria-pressed={on} onClick={() => setNiche(on ? niche.filter((x) => x !== n) : niche.length < 3 ? [...niche, n] : niche)} className={chip(on)}>{n}</button>
                  );
                })}
              </div>
            </>
          ) : null}

          {current === "account" ? (
            <>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Last step{first ? `, ${first}` : ""}. Secure your account.</h1>
              <p className="mt-3 text-ink-soft">We send one email to confirm it is you.</p>
              <div className="mt-8 space-y-5">
                <label className="block text-sm font-medium">
                  Email
                  <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={input} />
                </label>
                <label className="block text-sm font-medium">
                  Password
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} className={input} />
                  <span className="mt-1.5 block text-xs font-normal text-ink-soft">At least 8 characters.</span>
                </label>
                <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4 accent-[#0f172a]" />
                  <span>
                    I agree to the <Link href="/legal/terms" target="_blank" className="underline">Terms</Link> and{" "}
                    <Link href="/legal/privacy" target="_blank" className="underline">Privacy policy</Link>, and to my details being used to run my account.
                  </span>
                </label>
              </div>
            </>
          ) : null}

          {current === "done" ? (
            <>
              <span className="flex size-14 items-center justify-center rounded-2xl bg-success text-2xl text-white">✓</span>
              <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">Check your inbox{first ? `, ${first}` : ""}.</h1>
              <p className="mt-3 text-ink-soft">We sent a link to {email}. Open it to verify your email and you will land on your dashboard.</p>
              <ul className="mt-8 space-y-3 text-sm">
                {["Account created", role === "seller" ? "Brand saved" : role === "influencer" ? "Channels saved" : "Library ready", "Waiting for you to verify your email"].map((line, i) => (
                  <li key={line} className="pop flex items-center gap-3" style={{ ["--d" as string]: `${0.3 + i * 0.35}s` }}>
                    <span className={`flex size-5 items-center justify-center rounded-full text-[11px] text-white ${i < 2 ? "bg-success" : "bg-accent"}`}>{i < 2 ? "✓" : "…"}</span>
                    {line}
                  </li>
                ))}
              </ul>
              {role === "seller" ? <p className="mt-6 rounded-2xl bg-paper-deep px-4 py-3 text-sm text-accent-deep">New seller accounts are reviewed by an admin before listings go live. You can create drafts straight away.</p> : null}
              <Link href="/login" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-ink px-7 text-base font-medium text-white transition-all hover:-translate-y-px active:scale-[0.97]">Go to log in</Link>
            </>
          ) : null}

          {error ? <p className="mt-6 rounded-xl border border-alert/30 bg-alert/8 px-4 py-3 text-sm text-alert">{error}</p> : null}

          {current !== "done" ? (
            <div className="mt-10 flex items-center justify-between gap-4">
              {index > 0 ? (
                <button type="button" onClick={back} className="cursor-pointer rounded-full px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink">← Back</button>
              ) : (
                <Link href="/login" className="text-sm text-ink-soft underline">I already have an account</Link>
              )}
              <span className="flex items-center gap-4">
                <span className="hidden text-xs text-ink-soft sm:inline">or press Enter ↵</span>
                <button
                  type="button"
                  onClick={next}
                  disabled={!valid[current] || pending}
                  className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-ink px-7 text-base font-medium text-white shadow-sm transition-all hover:-translate-y-px active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-ink/25 disabled:shadow-none"
                >
                  {pending ? <Spinner /> : null}
                  {current === "account" ? "Create my account" : "Continue"}
                </button>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
