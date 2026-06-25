"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import { daysUntil, formatDayLabel, todayISO } from "@/lib/utils";
import type { Memento } from "@/types";

/** Status badge text + colour for a countdown item. */
function status(expires: string): { text: string; color: string } {
  const d = daysUntil(expires);
  if (d < 0) return { text: `Expiré (il y a ${-d} j)`, color: "var(--danger)" };
  if (d === 0) return { text: "Aujourd’hui !", color: "var(--danger)" };
  if (d === 1) return { text: "Demain", color: "var(--warn)" };
  if (d <= 7) return { text: `J-${d}`, color: "var(--warn)" };
  return { text: `J-${d}`, color: "var(--cyan-soft)" };
}

/** % of time REMAINING between when it was added and the deadline (empties as it nears). */
function remainingPct(created: string, expires: string): number {
  const start = new Date(created).getTime();
  const end = new Date(`${expires.slice(0, 10)}T23:59:59`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.max(0, Math.min(100, ((end - Date.now()) / (end - start)) * 100));
}

export function MementoCountdown({ initialItems }: { initialItems: Memento[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Memento[]>(initialItems);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function startEdit(m: Memento) {
    setEditingId(m.id);
    setEditName(m.name);
  }
  async function saveName(m: Memento) {
    const newName = editName.trim() || m.name;
    setItems((prev) => prev.map((i) => (i.id === m.id ? { ...i, name: newName } : i)));
    setEditingId(null);
    try {
      await api.patch(`/api/mementos/${m.id}`, { name: newName });
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.expires_at ?? "").localeCompare(b.expires_at ?? "")),
    [items]
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) {
      setError("Donne un nom et une date d’échéance.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<Memento>("/api/mementos", { name: name.trim(), expires_at: date });
      setItems((prev) => [...prev, created]);
      setName("");
      setDate("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function patchDate(item: Memento, expires_at: string) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, expires_at } : i)));
    try {
      await api.patch(`/api/mementos/${item.id}`, { expires_at });
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  async function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.del(`/api/mementos/${id}`);
      router.refresh();
    } catch {
      setItems(snapshot);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head">
        <div>
          <h2 className="card-title">⏳ Échéances</h2>
          <p className="card-sub">Agis avant qu’elles ne disparaissent (abonnements, deadlines…).</p>
        </div>
      </div>

      <form onSubmit={add} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <input className="auth-input" style={{ flex: "2 1 200px" }} placeholder="Quoi ? (ex. Résilier l’abonnement X)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="auth-input" style={{ flex: "1 1 150px" }} type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="main-btn" type="submit" disabled={busy}>Ajouter</button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      {sorted.length === 0 ? (
        <EmptyState icon="⏳">Aucune échéance. Ajoute ce qui a une date limite.</EmptyState>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {sorted.map((m) => {
            const st = m.expires_at ? status(m.expires_at) : null;
            const pct = m.expires_at ? remainingPct(m.created_at, m.expires_at) : 0;
            return (
              <li key={m.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {editingId === m.id ? (
                    <>
                      <input className="auth-input" style={{ flex: 1 }} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveName(m); if (e.key === "Escape") setEditingId(null); }} />
                      <button className="checklist-submit" onClick={() => saveName(m)}>OK</button>
                      <button className="secondary-btn" onClick={() => setEditingId(null)}>Annuler</button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1 }}>{m.name}</span>
                      {m.expires_at && <span className="card-sub" style={{ fontSize: 12 }}>{formatDayLabel(m.expires_at)}</span>}
                      {st && (
                        <span style={{ color: st.color, fontWeight: 600, fontSize: 12, minWidth: 70, textAlign: "right" }}>{st.text}</span>
                      )}
                      <input
                        className="auth-input"
                        type="date"
                        style={{ width: 150, padding: "4px 6px" }}
                        value={m.expires_at ?? ""}
                        onChange={(e) => e.target.value && patchDate(m, e.target.value)}
                        title="Modifier la date"
                      />
                      <button className="secondary-btn" onClick={() => startEdit(m)} aria-label="Modifier" title="Modifier">✏️</button>
                      <button className="secondary-btn" onClick={() => remove(m.id)} aria-label="Supprimer">✕</button>
                    </>
                  )}
                </div>
                {st && (
                  <div className="big-bar" style={{ marginTop: 8, height: 6 }}>
                    <div className="big-bar-fill" style={{ width: `${pct}%`, background: st.color }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
