// A small tinted tile with a simple pictogram for each platform.
// These are generic symbols (a camera, a play button, a briefcase...), not the platforms' own logos.
// To use official brand icons, download them from each platform's brand page (they come with usage
// rules) and swap them in here.

const tiles: Record<string, { bg: string; fg: string; glyph: React.ReactNode }> = {
  instagram: {
    bg: "#ffe4ee",
    fg: "#d6336c",
    glyph: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.6" />
        <circle cx="16.6" cy="7.4" r="0.6" fill="currentColor" />
      </>
    ),
  },
  youtube: {
    bg: "#ffe3e0",
    fg: "#d92d20",
    glyph: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="4" />
        <path d="M10.5 9.6v4.8l4-2.4z" fill="currentColor" />
      </>
    ),
  },
  linkedin: {
    bg: "#e1ecff",
    fg: "#1d5fc4",
    glyph: (
      <>
        <rect x="4" y="8" width="16" height="11" rx="2.5" />
        <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8M4 13h16" />
      </>
    ),
  },
  pinterest: {
    bg: "#ffe5e5",
    fg: "#c8232c",
    glyph: (
      <>
        <path d="M12 21v-6" />
        <path d="M8 4h8l-1.2 5 2.7 3.5H6.5L9.2 9z" />
      </>
    ),
  },
  x: {
    bg: "#eceef2",
    fg: "#0f172a",
    glyph: <path d="M6 6l12 12M18 6L6 18" />,
  },
  facebook: {
    bg: "#e3edff",
    fg: "#2456c9",
    glyph: (
      <>
        <circle cx="9" cy="9" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <circle cx="17" cy="10" r="2.2" />
        <path d="M16 14.5a4.5 4.5 0 0 1 4.8 4.5" />
      </>
    ),
  },
};

export function PlatformIcon({ id, size = 40 }: { id: string; size?: number }) {
  const t = tiles[id] ?? tiles.x;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: t.bg, color: t.fg }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {t.glyph}
      </svg>
    </span>
  );
}
