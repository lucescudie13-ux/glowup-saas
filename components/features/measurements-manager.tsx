"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import { todayISO, formatDayLabel } from "@/lib/utils";
import type { Measurement } from "@/types";

type MetricKey = "weight" | "body_fat" | "arm" | "leg" | "waist" | "shoulder" | "chest";

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: "weight", label: "Poids", unit: "kg" },
  { key: "body_fat", label: "Masse grasse", unit: "%" },
  { key: "chest", label: "Poitrine", unit: "cm" },
  { key: "shoulder", label: "Épaules", unit: "cm" },
  { key: "arm", label: "Bras", unit: "cm" },
  { key: "waist", label: "Taille", unit: "cm" },
  { key: "leg", label: "Cuisse", unit: "cm" },
];

const emptyForm = (): Record<MetricKey, string> => ({
  weight: "", body_fat: "", chest: "", shoulder: "", arm: "", waist: "", leg: "",
});

export function MeasurementsManager({ initialItems }: { initialItems: Measurement[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Measurement[]>(initialItems);
  const [date, setDate] = useState(todayISO());
  const [form, setForm] = useState<Record<MetricKey, string>>(emptyForm());
  const [note, setNote] = useState("");
  const [chartMetric, setChartMetric] = useState<MetricKey>("weight");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.measure_date.localeCompare(b.measure_date)),
    [items]
  );

  // Chart points for the selected metric (entries that have a value).
  const points = useMemo(
    () => sorted.filter((m) => m[chartMetric] != null).map((m) => ({ date: m.measure_date, value: Number(m[chartMetric]) })),
    [sorted, chartMetric]
  );
  const vals = points.map((p) => p.value);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;
  const metricInfo = METRICS.find((m) => m.key === chartMetric)!;
  const first = points[0]?.value;
  const last = points[points.length - 1]?.value;
  const delta = first != null && last != null ? last - first : null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = { measure_date: date, note };
    let any = false;
    for (const m of METRICS) {
      const raw = form[m.key].trim();
      if (raw !== "") { payload[m.key] = Number(raw.replace(",", ".")); any = true; }
    }
    if (!any) { setError("Renseigne au moins une mesure."); return; }
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<Measurement>("/api/measurements", payload);
      setItems((prev) => [...prev.filter((p) => p.id !== created.id), created]);
      setForm(emptyForm());
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.del(`/api/measurements/${id}`);
      router.refresh();
    } catch {
      setItems(snapshot);
    }
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head"><h2 className="card-title">📏 Mesures & progression</h2></div>

      {/* Entry form */}
      <form onSubmit={add} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <input className="auth-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 200 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {METRICS.map((m) => (
            <input
              key={m.key}
              className="auth-input"
              inputMode="decimal"
              placeholder={`${m.label} (${m.unit})`}
              value={form[m.key]}
              onChange={(e) => setForm((f) => ({ ...f, [m.key]: e.target.value }))}
            />
          ))}
        </div>
        <input className="auth-input" placeholder="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div><button className="main-btn" type="submit" disabled={busy}>Enregistrer le relevé</button></div>
        {error && <p className="auth-error">{error}</p>}
      </form>

      {/* Metric selector + chart */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {METRICS.map((m) => (
          <button key={m.key} className={`secondary-btn${chartMetric === m.key ? " active" : ""}`} onClick={() => setChartMetric(m.key)}>{m.label}</button>
        ))}
      </div>

      {points.length === 0 ? (
        <EmptyState icon="📈">Pas encore de données pour {metricInfo.label.toLowerCase()}.</EmptyState>
      ) : (
        <>
          <div className="card-sub" style={{ marginBottom: 6 }}>
            {metricInfo.label} : {last} {metricInfo.unit}
            {delta != null && delta !== 0 && <> · {delta > 0 ? "+" : ""}{delta.toFixed(1)} {metricInfo.unit} depuis le début</>}
          </div>
          <div className="cal-chart">
            <div className="cal-bars-wrap">
              <div className="cal-bars">
                {points.map((p) => {
                  const h = max === min ? 60 : 15 + ((p.value - min) / (max - min)) * 80;
                  return (
                    <div className="cal-col" key={p.date}>
                      <div className="cal-bar" style={{ height: `${h}%` }} title={`${formatDayLabel(p.date)} · ${p.value} ${metricInfo.unit}`} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="cal-labels">
              {points.map((p) => (
                <span className="cal-x" key={p.date}>{new Date(`${p.date}T00:00:00`).getDate()}/{new Date(`${p.date}T00:00:00`).getMonth() + 1}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* History */}
      {sorted.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="card-sub" style={{ marginBottom: 6 }}>Historique</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {[...sorted].reverse().map((m) => (
              <li key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ minWidth: 90 }} className="card-sub">{formatDayLabel(m.measure_date)}</span>
                <span style={{ flex: 1, fontSize: 14 }}>
                  {METRICS.filter((mt) => m[mt.key] != null).map((mt) => `${mt.label} ${m[mt.key]}${mt.unit}`).join(" · ") || "—"}
                </span>
                <button className="secondary-btn" onClick={() => remove(m.id)}>✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
