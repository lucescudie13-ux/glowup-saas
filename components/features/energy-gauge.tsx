"use client";

import { useEffect, useState } from "react";
import { dayEnergyPercent } from "@/lib/utils";

// Energy is the "orange" gauge (its own identity); it lightens a touch when low.
const ENERGY_COLOR = "#f5a623";

/**
 * Live "énergie" gauge — a battery that drains as the day goes on, refreshed
 * every minute. Visually distinct from the fixed stat bars (battery shape + ⚡).
 */
export function EnergyGauge({ compact = false }: { compact?: boolean }) {
  const [pct, setPct] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setPct(dayEnergyPercent());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  const value = pct ?? 100;

  return (
    <div className={`energy-gauge${compact ? " is-compact" : ""}`} title="Énergie — elle baisse au fil de la journée">
      <div className="energy-gauge-head">
        <span className="energy-gauge-label">⚡ Énergie</span>
        <span className="energy-gauge-pct" style={{ color: ENERGY_COLOR }} suppressHydrationWarning>{value}%</span>
      </div>
      <div className="energy-battery" aria-hidden>
        <div className="energy-battery-fill" style={{ width: `${value}%`, background: ENERGY_COLOR }} suppressHydrationWarning />
      </div>
    </div>
  );
}
