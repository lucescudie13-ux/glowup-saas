"use client";

import { useState } from "react";

/**
 * A small "?" help badge. Shows its explanation on hover (desktop) and on
 * tap/click (mobile) — used instead of long inline descriptions so the UI stays
 * clean. Pass the explanation as `text`.
 */
export function InfoHint({ text, label = "En savoir plus" }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="info-hint">
      <button
        type="button"
        className="info-hint-btn"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      <span className={`info-hint-pop${open ? " is-open" : ""}`} role="tooltip">{text}</span>
    </span>
  );
}
