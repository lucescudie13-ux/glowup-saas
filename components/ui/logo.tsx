import type { CSSProperties } from "react";

/**
 * The Glow Up emblem — a bold, low-poly phoenix head in profile that FILLS the
 * whole badge (Duolingo-style): blue faceted head, small feather crest, sharp
 * beak, and a single fierce black eye with a bright glint (the focal point),
 * inside a dark rounded badge with a glowing blue border. Original design.
 */
export function LogoMark({ size = 40, idSuffix = "" }: { size?: number; idSuffix?: string }) {
  const bg = `phxBlue${idSuffix}`;
  const brd = `phxBrd${idSuffix}`;
  const clip = `phxClip${idSuffix}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5cf4ff" />
          <stop offset="1" stopColor="#0a5cf0" />
        </linearGradient>
        <linearGradient id={brd} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00f5ff" />
          <stop offset="1" stopColor="#0866ec" />
        </linearGradient>
        <clipPath id={clip}><rect x="4" y="4" width="92" height="92" rx="22" /></clipPath>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="22" fill="#0a111c" stroke={`url(#${brd})`} strokeWidth="2.5" />
      <g clipPath={`url(#${clip})`}>
        <g transform="translate(5 6) scale(0.9)">
          {/* Feather crest + bold faceted head with a sharp beak (facing right). */}
          <g fill={`url(#${bg})`}>
            <path d="M42 10 L32 0 L42 12 Z" />
            <path d="M54 8 L49 0 L58 11 Z" />
            <path d="M64 12 L60 1 L68 13 Z" />
            <path d="M8 62 L11 30 L28 12 L50 8 L72 15 L82 30 L97 40 L76 48 L66 51 L61 74 L46 94 L26 88 L11 74 Z" />
          </g>
          {/* Low-poly facets for depth. */}
          <path d="M50 8 L72 15 L42 25 Z" fill="#ffffff" opacity="0.10" />
          <path d="M46 94 L61 74 L50 78 L28 85 Z" fill="#000000" opacity="0.16" />
          {/* Fierce eye + bright glint (the focal point). */}
          <path d="M44 30 L68 35 L59 44 L44 40 Z" fill="#0a111c" />
          <path d="M48 32 L60 34.5 L54 37.5 Z" fill="#bff8ff" />
        </g>
      </g>
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
