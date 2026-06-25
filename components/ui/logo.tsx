import type { CSSProperties } from "react";

/** The Glow Up emblem (level-up arrow in a glowing badge). */
export function LogoMark({ size = 40, idSuffix = "" }: { size?: number; idSuffix?: string }) {
  const gid = `glowGrad${idSuffix}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00f5ff" />
          <stop offset="1" stopColor="#008cff" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="54" height="54" rx="16" fill="#0a111c" stroke={`url(#${gid})`} strokeWidth="3" />
      {/* Phoenix rising — transformation / glow up */}
      <g fill={`url(#${gid})`}>
        {/* wings sweeping up & out */}
        <path d="M31 30 C 22 17, 13 16, 8 23 C 15 22, 23 25, 30 34 Z" />
        <path d="M33 30 C 42 17, 51 16, 56 23 C 49 22, 41 25, 34 34 Z" />
        {/* body / flame rising to the head */}
        <path d="M32 16 C 35 22, 35 30, 32 49 C 29 30, 29 22, 32 16 Z" />
        {/* tail flames */}
        <path d="M27 41 C 28 47, 31 49, 31 44 Z" />
        <path d="M37 41 C 36 47, 33 49, 33 44 Z" />
      </g>
      <circle cx="32" cy="14.5" r="2.6" fill="#7ef9ff" />
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
