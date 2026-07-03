"use client";

import { useEffect, useState } from "react";

/** Break a remaining-milliseconds value into d/h/m/s parts. */
function split(target: number) {
  let ms = Math.max(0, target - Date.now());
  const d = Math.floor(ms / 86_400_000); ms -= d * 86_400_000;
  const h = Math.floor(ms / 3_600_000); ms -= h * 3_600_000;
  const m = Math.floor(ms / 60_000); ms -= m * 60_000;
  const s = Math.floor(ms / 1000);
  return { d, h, m, s, expired: target - Date.now() <= 0 };
}

/** Urgency colour keyed on days remaining. */
function urgencyColor(days: number, expired: boolean): string {
  if (expired) return "var(--danger)";
  if (days <= 1) return "var(--danger)";
  if (days <= 7) return "var(--warn)";
  return "var(--cyan-soft)";
}

/**
 * Live, ticking countdown to a deadline date, shown as jours / heures / minutes
 * / secondes. Highlighted so it stands out from plain text. The target is the
 * end (23:59:59) of the deadline day.
 */
export function LiveCountdown({ expires }: { expires: string }) {
  const target = new Date(`${expires.slice(0, 10)}T23:59:59`).getTime();
  const [mounted, setMounted] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { d, h, m, s, expired } = split(target);
  const color = urgencyColor(d, expired);

  // Before mount, render a stable day-level fallback to avoid hydration drift.
  if (!mounted) {
    return <span className="countdown" style={{ color }} suppressHydrationWarning>⏳ {d} j</span>;
  }

  if (expired) {
    return <span className="countdown countdown-expired">⏰ Expiré</span>;
  }

  const segs: { v: number; label: string }[] = [
    { v: d, label: "j" },
    { v: h, label: "h" },
    { v: m, label: "min" },
    { v: s, label: "s" },
  ];

  return (
    <span className="countdown" style={{ color }} suppressHydrationWarning>
      {segs.map((seg, i) => (
        <span className="countdown-seg" key={seg.label}>
          <span className="countdown-num">{i === 0 ? seg.v : String(seg.v).padStart(2, "0")}</span>
          <span className="countdown-unit">{seg.label}</span>
        </span>
      ))}
    </span>
  );
}
