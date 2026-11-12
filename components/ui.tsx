import Link from "next/link";

// Shared building blocks. Reuse these instead of restyling on each page.

type Variant = "primary" | "outline" | "accent" | "light" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/85",
  accent: "bg-clay text-paper hover:bg-clay-deep",
  outline: "border border-ink/70 text-ink hover:bg-ink hover:text-paper",
  light: "bg-paper text-ink hover:bg-card",
  danger: "border border-clay/60 text-clay-deep hover:bg-clay hover:text-paper",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${extra}`;
}

// Compact button for tables and lists.
export function smallButton(variant: Variant = "outline", extra = "") {
  return `inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full px-4 text-xs font-medium transition-colors disabled:opacity-60 ${variants[variant]} ${extra}`;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-medium uppercase tracking-[0.18em] text-clay ${className}`}>{children}</p>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "moss" | "clay" }) {
  const tones = {
    neutral: "border-line bg-card text-ink-soft",
    moss: "border-moss/30 bg-moss/10 text-moss",
    clay: "border-clay/30 bg-clay/10 text-clay-deep",
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

const statusLabels: Record<string, [string, "neutral" | "moss" | "clay"]> = {
  draft: ["Draft", "neutral"],
  pending_review: ["In review", "clay"],
  published: ["Live", "moss"],
  paused: ["Paused", "neutral"],
  rejected: ["Rejected", "clay"],
  archived: ["Archived", "neutral"],
  applied: ["Waiting for seller", "clay"],
  active: ["Active", "moss"],
  pending: ["Pending", "clay"],
  changes_requested: ["Changes requested", "clay"],
  approved: ["Approved", "moss"],
  paid: ["Paid", "moss"],
  refunded: ["Refunded", "clay"],
  failed: ["Failed", "clay"],
  suspended: ["Suspended", "clay"],
};

export function StatusBadge({ status }: { status: string }) {
  const [label, tone] = statusLabels[status] ?? [status, "neutral"];
  return <Badge tone={tone}>{label}</Badge>;
}

// Numbered section header: "01 — Title", with a hairline rule.
export function SectionHeading({ number, eyebrow, title, intro }: { number: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="border-t border-line pt-6">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-sm text-ink-soft">{number}</span>
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h2 className="mt-4 max-w-2xl text-3xl leading-tight sm:text-4xl">{title}</h2>
      {intro ? <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">{intro}</p> : null}
    </div>
  );
}

export function Notice({ children, tone = "clay" }: { children: React.ReactNode; tone?: "clay" | "moss" }) {
  const tones = { clay: "border-clay/30 bg-clay/10 text-clay-deep", moss: "border-moss/30 bg-moss/10 text-moss" };
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>{children}</div>;
}

// Success or error message passed back from a button press (?ok=... or ?error=... in the address).
export function Flash({ params }: { params: { ok?: string; error?: string } }) {
  if (params.error) return <div className="mb-6"><Notice>{params.error}</Notice></div>;
  if (params.ok) return <div className="mb-6"><Notice tone="moss">{params.ok}</Notice></div>;
  return null;
}

// ---------- Forms ----------
export const inputClass =
  "mt-2 block h-11 w-full rounded-xl border border-line bg-card px-3.5 text-sm font-normal outline-none focus:border-ink";
export const textareaClass =
  "mt-2 block w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm font-normal leading-relaxed outline-none focus:border-ink";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {hint ? <span className="mt-1.5 block text-xs font-normal leading-relaxed text-ink-soft">{hint}</span> : null}
    </label>
  );
}

// ---------- Dashboard pieces ----------
export function PageTitle({ title, intro, action }: { title: string; intro?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl">{title}</h2>
        {intro ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">{intro}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-card p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function StatCards({ stats }: { stats: { label: string; value: string; hint?: string }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-line bg-card p-6">
          <dt className="text-sm text-ink-soft">{s.label}</dt>
          <dd className="mt-3 font-display text-4xl tabular-nums">{s.value}</dd>
          {s.hint ? <p className="mt-2 text-xs text-ink-soft">{s.hint}</p> : null}
        </div>
      ))}
    </dl>
  );
}

export function Empty({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-paper-deep p-8 sm:p-10">
      <h3 className="text-2xl">{title}</h3>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">{text}</p>
      {children ? <div className="mt-6 flex flex-wrap gap-3">{children}</div> : null}
    </div>
  );
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-0 align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3.5">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
