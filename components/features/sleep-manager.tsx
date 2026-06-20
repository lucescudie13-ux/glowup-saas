"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { formatDayLabel, todayISO } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { SleepEntry } from "@/types";

const KIND_LABEL: Record<string, string> = { nuit: "🌙 Nuit", recup: "☀️ Récup'" };

export function SleepManager({ initialEntries }: { initialEntries: SleepEntry[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState<SleepEntry[]>(initialEntries);
  const [date, setDate] = useState(todayISO());
  const [hours, setHours] = useState("");
  const [kind, setKind] = useState<"nuit" | "recup">("nuit");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ----- Stats: last night + 7-day nightly average -----
  const nights = entries.filter((e) => e.kind === "nuit");
  const lastNight = nights[0];
  const last7 = nights.slice(0, 7);
  const avg7 = last7.length
    ? Math.round((last7.reduce((s, e) => s + Number(e.hours), 0) / last7.length) * 10) / 10
    : 0;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const h = Number(hours);
    if (!h || h <= 0) {
      setError("Indique un nombre d’heures.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<SleepEntry>("/api/sleep", {
        sleep_date: date,
        hours: h,
        kind,
        note,
      });
      setEntries((prev) => [created, ...prev].sort((a, b) => (a.sleep_date < b.sleep_date ? 1 : -1)));
      setHours("");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: SleepEntry) {
    const snapshot = entries;
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await api.del(`/api/sleep/${entry.id}`);
      router.refresh();
    } catch {
      setEntries(snapshot);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2 className="card-title">😴 Sommeil</h2>
          <p className="card-sub">Note chaque jour combien de temps tu as dormi.</p>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="kpi-label">Dernière nuit</div>
          <div className="kpi-value">{lastNight ? `${Number(lastNight.hours)} h` : "—"}</div>
          <div className="kpi-trend">{lastNight ? formatDayLabel(lastNight.sleep_date) : "Aucune donnée"}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Moyenne (7 nuits)</div>
          <div className="kpi-value">{avg7 ? `${avg7} h` : "—"}</div>
          <div className="kpi-trend">{last7.length} nuit(s) enregistrée(s)</div>
        </div>
      </div>

      {/* Ajout */}
      <form onSubmit={add} style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="auth-input" style={{ flex: "1 1 150px" }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input
            className="auth-input"
            style={{ flex: "0 1 120px" }}
            type="number"
            step="0.5"
            min="0"
            max="24"
            placeholder="heures"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <select className="auth-input" style={{ flex: "0 1 150px" }} value={kind} onChange={(e) => setKind(e.target.value as "nuit" | "recup")}>
            <option value="nuit">🌙 Nuit</option>
            <option value="recup">☀️ Récupération</option>
          </select>
        </div>
        <input className="auth-input" placeholder="Note (optionnel) — qualité, réveils…" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p className="auth-error" style={{ margin: 0 }}>{error}</p>}
        <button className="checklist-submit" type="submit" disabled={busy} style={{ justifySelf: "start" }}>
          {busy ? "Ajout…" : "Ajouter"}
        </button>
      </form>

      {entries.length === 0 ? (
        <EmptyState icon="😴">Aucune nuit enregistrée. Note ta première.</EmptyState>
      ) : (
        <ul className="checklist">
          {entries.map((e) => (
            <li key={e.id} className="task-item">
              <div className="task-body">
                <span className="task-name">{Number(e.hours)} h · {formatDayLabel(e.sleep_date)}</span>
                <div className="task-meta">
                  <span className="cat-tag">{KIND_LABEL[e.kind] ?? e.kind}</span>
                  {e.note ? <span className="task-mins">{e.note}</span> : null}
                </div>
              </div>
              <button type="button" className="task-del" onClick={() => remove(e)} aria-label="Supprimer" title="Supprimer">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
