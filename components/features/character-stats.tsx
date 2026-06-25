"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { ProgressBar } from "@/components/ui/progress-bar";
import { STAT_CATEGORIES } from "@/lib/constants";
import type { Stat } from "@/types";

function StatRow({
  s,
  editing,
  onChange,
}: {
  s: Stat;
  editing: boolean;
  onChange: (id: string, value: number) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span>{s.name}{s.is_custom ? " ✨" : ""}</span>
        <span className="card-sub">{s.value}/100</span>
      </div>
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="range"
            min={0}
            max={100}
            value={s.value}
            onChange={(e) => onChange(s.id, Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min={0}
            max={100}
            className="auth-input"
            style={{ width: 70, padding: "4px 6px" }}
            value={s.value}
            onChange={(e) => onChange(s.id, Number(e.target.value))}
          />
        </div>
      ) : (
        <ProgressBar value={s.value} />
      )}
    </div>
  );
}

/**
 * Grouped character sheet: standalone Énergie gauge + one card per category.
 * "Ajuster mes niveaux" turns each stat into a slider so the user can set his
 * baseline (0–100) directly; ongoing change still happens via actions.
 */
export function CharacterStats({ stats: initial }: { stats: Stat[] }) {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>(initial);
  const [editing, setEditing] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function categoryAvg(category: string): number {
    const inCat = stats.filter((s) => s.category === category);
    if (!inCat.length) return 0;
    return Math.round(inCat.reduce((sum, x) => sum + x.value, 0) / inCat.length);
  }

  function setValue(id: string, raw: number) {
    const value = Math.max(0, Math.min(100, Math.round(raw || 0)));
    setStats((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      api.patch(`/api/stats/${id}`, { value }).then(() => router.refresh()).catch(() => {});
    }, 450);
  }

  const energie = stats.filter((s) => s.category === "energie");

  return (
    <div style={{ display: "grid", gap: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="secondary-btn" onClick={() => setEditing((e) => !e)}>
          {editing ? "✓ Terminer l’ajustement" : "✏️ Ajuster mes niveaux"}
        </button>
      </div>

      {/* ⚡ Énergie — standalone gauge */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-title">⚡ Énergie</h2>
          <span className="objective-percent">{categoryAvg("energie")}/100</span>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {energie.map((s) => <StatRow key={s.id} s={s} editing={editing} onChange={setValue} />)}
        </div>
      </div>

      {/* 3 main categories */}
      {STAT_CATEGORIES.map((cat) => {
        const subs = stats.filter((s) => s.category === cat.key);
        const avg = categoryAvg(cat.key);
        return (
          <div className="card" key={cat.key}>
            <div className="card-head">
              <h2 className="card-title">{cat.icon} {cat.label}</h2>
              <span className="objective-percent">{avg}/100</span>
            </div>
            <div style={{ marginBottom: 14 }}><ProgressBar value={avg} /></div>
            <div style={{ display: "grid", gap: 12 }}>
              {subs.length === 0
                ? <p className="card-sub">Aucune sous-statistique ici.</p>
                : subs.map((s) => <StatRow key={s.id} s={s} editing={editing} onChange={setValue} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
