// The crowd of creators at the bottom of the home page hero.
// Every character is drawn here in code (original artwork, no image files), so they stay sharp at any
// size and can move: each one bobs gently, blinks, and some wave. Edit the `people` list to change them.

type Person = {
  x: number; // where the head sits across the 1200-wide scene
  y: number; // how high the head sits
  s: number; // size
  skin: string;
  shade: string; // slightly darker skin tone for neck and nose
  hair: string;
  style: "short" | "curly" | "long" | "bun" | "cap" | "hijab";
  shirt: string;
  glasses?: string;
  beard?: boolean;
  arm?: "left" | "right";
  hold?: "phone" | "peace" | "point";
  d: number; // animation delay in seconds, so they do not move in unison
};

const people: Person[] = [
  // back row
  { x: 130, y: 232, s: 1.05, skin: "#e3ab7b", shade: "#c98f60", hair: "#f2b632", style: "cap", shirt: "#f08a4b", d: 0.3 },
  { x: 395, y: 196, s: 1.0, skin: "#a86c45", shade: "#8d5735", hair: "#2a1a12", style: "curly", shirt: "#6a58d6", d: 1.1 },
  { x: 640, y: 186, s: 1.0, skin: "#f0c39a", shade: "#d9a679", hair: "#2f62d8", style: "hijab", shirt: "#9cc2ff", d: 0.6 },
  { x: 885, y: 200, s: 1.02, skin: "#c98f60", shade: "#ad7648", hair: "#3a2416", style: "bun", shirt: "#17805a", glasses: "#0f172a", d: 1.6 },
  { x: 1090, y: 236, s: 1.05, skin: "#8f5a37", shade: "#774829", hair: "#1c120c", style: "short", shirt: "#ffd45a", beard: true, d: 0.9 },
  // front row
  { x: 255, y: 318, s: 1.45, skin: "#d59c6c", shade: "#bb8254", hair: "#2a1a12", style: "short", shirt: "#2f62d8", glasses: "#55607a", beard: true, arm: "left", hold: "phone", d: 0 },
  { x: 520, y: 336, s: 1.5, skin: "#f0c39a", shade: "#d9a679", hair: "#4a2a1a", style: "long", shirt: "#ffffff", glasses: "#e8457a", arm: "right", hold: "peace", d: 0.8 },
  { x: 775, y: 326, s: 1.45, skin: "#9a6240", shade: "#804e30", hair: "#1c120c", style: "curly", shirt: "#ffd45a", arm: "right", hold: "point", d: 0.4 },
  { x: 1010, y: 318, s: 1.38, skin: "#e3ab7b", shade: "#c98f60", hair: "#7a3b1d", style: "long", shirt: "#e8457a", arm: "right", hold: "phone", d: 1.3 },
];

const curls: [number, number][] = [
  [-56, -4], [-52, -24], [-44, -46], [-28, -60], [-8, -68], [14, -66], [34, -56], [48, -38], [56, -16], [56, 2],
  [-22, -44], [4, -48], [28, -40], [-38, -28], [42, -22],
];

function Arm({ p }: { p: Person }) {
  if (!p.arm) return null;
  const flip = p.arm === "left" ? "scale(-1 1)" : undefined;
  return (
    <g transform={flip}>
      <g className="wave" style={{ ["--d" as string]: `${p.d}s` }}>
        <path d="M72 132 Q122 84 118 -34" stroke={p.skin} strokeWidth="32" strokeLinecap="round" fill="none" />
        <path d="M72 132 Q104 104 112 56" stroke={p.shirt} strokeWidth="36" strokeLinecap="round" fill="none" />
        {p.hold === "phone" ? (
          <g>
            <rect x="92" y="-112" width="50" height="84" rx="10" fill="#0f172a" />
            <rect x="97" y="-106" width="40" height="66" rx="6" fill="#9cc2ff" />
            <circle cx="117" cy="-73" r="9" fill="#ffffff" opacity="0.85" />
          </g>
        ) : null}
        {p.hold === "peace" ? (
          <g stroke={p.skin} strokeWidth="12" strokeLinecap="round">
            <path d="M110 -52 L100 -96" />
            <path d="M126 -52 L138 -94" />
          </g>
        ) : null}
        {p.hold === "point" ? <path d="M118 -52 L118 -102" stroke={p.skin} strokeWidth="13" strokeLinecap="round" /> : null}
        <circle cx="118" cy="-38" r="23" fill={p.skin} />
      </g>
    </g>
  );
}

function Character({ p }: { p: Person }) {
  const hijab = p.style === "hijab";
  const rx = hijab ? 47 : 56;
  const ry = hijab ? 53 : 60;
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
      <g className="bob" style={{ ["--d" as string]: `${p.d}s`, ["--bob" as string]: `${3.6 + (p.d % 1)}s` }}>
        <Arm p={p} />
        {/* shoulders */}
        <path d="M-104 230 Q-104 102 -44 86 Q0 108 44 86 Q104 102 104 230 Z" fill={p.shirt} stroke="#0f172a" strokeOpacity="0.06" strokeWidth="2" />
        {p.style === "long" ? <path d="M-66 -10 Q-72 -84 0 -84 Q72 -84 66 -10 L78 116 Q42 100 30 60 L-30 60 Q-42 100 -78 116 Z" fill={p.hair} /> : null}
        <rect x="-17" y="38" width="34" height="56" rx="14" fill={p.shade} />
        {hijab ? <path d="M-76 -6 Q-80 -86 0 -86 Q80 -86 76 -6 Q80 72 100 124 Q0 150 -100 124 Q-80 72 -76 -6Z" fill={p.hair} /> : null}
        {!hijab ? (
          <>
            <circle cx="-56" cy="6" r="11" fill={p.skin} />
            <circle cx="56" cy="6" r="11" fill={p.skin} />
          </>
        ) : null}
        <ellipse cx="0" cy={hijab ? 2 : 0} rx={rx} ry={ry} fill={p.skin} />

        {/* hair */}
        {p.style === "short" || p.style === "bun" ? <path d="M-58 -6 Q-66 -74 0 -76 Q66 -74 58 -6 Q52 -34 20 -40 Q-20 -46 -58 -6Z" fill={p.hair} /> : null}
        {p.style === "bun" ? <circle cx="0" cy="-86" r="22" fill={p.hair} /> : null}
        {p.style === "long" ? <path d="M-58 2 Q-66 -72 0 -74 Q66 -72 58 2 Q40 -36 0 -40 Q-36 -38 -58 2Z" fill={p.hair} /> : null}
        {p.style === "curly" ? curls.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="18" fill={p.hair} />) : null}
        {p.style === "cap" ? (
          <>
            <path d="M-60 -14 Q-62 -80 0 -80 Q62 -80 60 -14 Z" fill={p.hair} />
            <path d="M-64 -18 Q4 -36 92 -12 Q40 0 -64 -10Z" fill="#d99a1c" />
          </>
        ) : null}

        {/* face */}
        <path d="M-34 -23 Q-21 -31 -9 -23" stroke="#2a1a12" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M9 -23 Q21 -31 34 -23" stroke="#2a1a12" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <g className="blink" style={{ ["--d" as string]: `${p.d * 1.7}s` }}>
          <ellipse cx="-21" cy="-2" rx="12" ry="14" fill="#ffffff" />
          <ellipse cx="21" cy="-2" rx="12" ry="14" fill="#ffffff" />
          <circle cx="-20" cy="0" r="7.5" fill="#3b2314" />
          <circle cx="22" cy="0" r="7.5" fill="#3b2314" />
          <circle cx="-22.5" cy="-3" r="2.6" fill="#ffffff" />
          <circle cx="19.5" cy="-3" r="2.6" fill="#ffffff" />
        </g>
        <circle cx="-37" cy="20" r="9" fill="#ff7a70" opacity="0.3" />
        <circle cx="37" cy="20" r="9" fill="#ff7a70" opacity="0.3" />
        <path d="M-5 12 Q1 19 7 12" stroke={p.shade} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {p.beard ? <path d="M-53 12 Q-52 64 0 66 Q52 64 53 12 Q42 50 0 52 Q-42 50 -53 12Z" fill={p.hair} opacity="0.92" /> : null}
        <path d="M-21 24 Q0 48 21 24 Z" fill="#7a1f2b" />
        <path d="M-17 25 Q0 31 17 25 L14 30 Q0 36 -14 30 Z" fill="#ffffff" />
        {p.glasses ? (
          <g stroke={p.glasses} strokeWidth="4.5" fill="#ffffff" fillOpacity="0.18">
            <rect x="-40" y="-19" width="34" height="32" rx="11" />
            <rect x="6" y="-19" width="34" height="32" rx="11" />
            <path d="M-6 -5 L6 -5" fill="none" />
          </g>
        ) : null}
      </g>
    </g>
  );
}

export function HeroCrowd() {
  return (
    <svg viewBox="0 0 1200 440" role="img" aria-label="A cheerful group of illustrated creators taking a selfie together" className="block h-auto w-full overflow-visible">
      {people.map((p, i) => (
        <Character key={i} p={p} />
      ))}
    </svg>
  );
}
