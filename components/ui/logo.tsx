import type { CSSProperties } from "react";

/** The Glow Up emblem — a steel phoenix rising, in a glowing badge. */
export function LogoMark({ size = 40, idSuffix = "" }: { size?: number; idSuffix?: string }) {
  const gid = `glowGrad${idSuffix}`;
  const sid = `steelGrad${idSuffix}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00f5ff" />
          <stop offset="1" stopColor="#008cff" />
        </linearGradient>
        {/* Steel sheen: bright edge → deep blue, top-lit */}
        <linearGradient id={sid} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#bff8ff" />
          <stop offset="0.45" stopColor="#00f5ff" />
          <stop offset="1" stopColor="#0072d6" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="54" height="54" rx="16" fill="#0a111c" stroke={`url(#${gid})`} strokeWidth="3" />
      {/* Steel phoenix — side profile head, fierce eye, back-swept crest */}
      <g fill={`url(#${sid})`}>
        {/* crest feathers sweeping back */}
        <path d="M30 21 C 26 13, 18.5 10, 11 12 C 17.5 14, 23 18, 28 23 Z" />
        <path d="M27 23 C 21.5 16.5, 13 16.5, 7 20.5 C 14 21, 19.5 24, 25 28 Z" />
        {/* head */}
        <path d="M42 30 C 42 22.5, 36 18.5, 29 20 C 21 21.5, 17 29, 19.5 36 C 21.5 42.5, 29 45.5, 36 42.5 C 40.5 40.5, 42 36, 42 31.5 Z" />
        {/* beak — sharp, pointing forward */}
        <path d="M41 28.5 L 55 31.5 L 47.5 35.5 L 41 34.5 Z" />
      </g>
      {/* angry eye — dark slit slanting down toward the beak */}
      <path d="M30.5 27 L 39.5 29.8 L 38.3 31.9 L 30 30.6 Z" fill="#0a111c" />
      {/* eye glint */}
      <circle cx="35.5" cy="29.4" r="1.15" fill="#d8fbff" />
    </svg>
  );
}

/** Full logo: emblem + "GLOW UP RPG" wordmark. */
export function Logo({ size = 40, withWordmark = true, style }: { size?: number; withWordmark?: boolean; style?: CSSProperties }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12, ...style }}>
      <LogoMark size={size} />
      {withWordmark && (
        <span style={{ display: "grid", lineHeight: 1.02 }}>
          <span
            style={{
              fontWeight: 800,
              letterSpacing: 1.5,
              fontSize: size * 0.4,
              background: "linear-gradient(120deg, #00f5ff, #008cff)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            GLOW UP
          </span>
          <span style={{ fontWeight: 700, letterSpacing: 6, fontSize: size * 0.26, color: "var(--muted, #87a5ad)" }}>RPG</span>
        </span>
      )}
    </span>
  );
}
