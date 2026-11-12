import Link from "next/link";

// Shared building blocks. Reuse these instead of restyling on each page.

type Variant = "primary" | "outline" | "accent" | "light";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/85",
  accent: "bg-clay text-paper hover:bg-clay-deep",
  outline: "border border-ink/70 text-ink hover:bg-ink hover:text-paper",
  light: "bg-paper text-ink hover:bg-card",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium tracking-wide transition-colors ${variants[variant]} ${extra}`;
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
  return (
    <p className={`text-xs font-medium uppercase tracking-[0.18em] text-clay ${className}`}>{children}</p>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "moss" | "clay" }) {
  const tones = {
    neutral: "border-line bg-card text-ink-soft",
    moss: "border-moss/30 bg-moss/10 text-moss",
    clay: "border-clay/30 bg-clay/10 text-clay-deep",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// Numbered section header: "01 — Title", with a hairline rule.
export function SectionHeading({
  number,
  eyebrow,
  title,
  intro,
}: {
  number: string;
  eyebrow: string;
  title: string;
  intro?: string;
}) {
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

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm leading-relaxed text-clay-deep">
      {children}
    </div>
  );
}
