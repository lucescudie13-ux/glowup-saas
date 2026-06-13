"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { money, todayISO } from "@/lib/utils";
import type { FinanceEntry, FinanceType } from "@/types";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

interface Props {
  initialPlanned: FinanceEntry[];
  recurringMonthly: number;
}

export function BudgetForecast({ initialPlanned, recurringMonthly }: Props) {
  const router = useRouter();
  const [planned, setPlanned] = useState<FinanceEntry[]>(initialPlanned);

  const today = todayISO();
  const now = new Date(`${today}T00:00:00`);
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [type, setType] = useState<FinanceType>("expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const monthKey = `${cursor.y}-${pad(cursor.m + 1)}`;
  const monthPlanned = useMemo(() => planned.filter((e) => e.entry_date.slice(0, 7) === monthKey), [planned, monthKey]);

  const incomeP = monthPlanned.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const expenseP = monthPlanned.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
  const forecastNet = incomeP - expenseP - recurringMonthly;

  // Build the month grid (Monday-first).
  const firstWeekday = (new Date(cursor.y, cursor.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shiftMonth(delta: number) {
    setSelectedDay(null);
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function dayEntries(iso: string) {
    return monthPlanned.filter((e) => e.entry_date === iso);
  }

  async function addPlanned(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDay || !name.trim() || !amount) return;
    const created = await api.post<FinanceEntry>("/api/finance-entries", {
      type,
      name,
      amount: Number(amount),
      entry_date: selectedDay,
      planned: true,
    });
    setPlanned((prev) => [created, ...prev]);
    setName("");
    setAmount("");
    router.refresh();
  }

  async function removePlanned(id: string) {
    const snapshot = planned;
    setPlanned((prev) => prev.filter((e) => e.id !== id));
    try {
      await api.del(`/api/finance-entries/${id}`);
      router.refresh();
    } catch {
      setPlanned(snapshot);
    }
  }

  const selectedEntries = selectedDay ? dayEntries(selectedDay) : [];

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head">
        <div>
          <h2 className="card-title">📅 Prévisions</h2>
          <p className="card-sub">Planifie tes revenus et dépenses à venir, jour par jour, pour anticiper ton budget.</p>
        </div>
      </div>

      {/* Forecast summary for the displayed month */}
      <div className="grid grid-stats" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="kpi-label">Revenus prévus</div>
          <div className="kpi-value money-positive">{money(incomeP)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Dépenses prévues</div>
          <div className="kpi-value money-negative">{money(expenseP)}</div>
          <div className="kpi-trend">+ {money(recurringMonthly)} récurrentes</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Résultat prévisionnel</div>
          <div className={`kpi-value ${forecastNet >= 0 ? "money-positive" : "money-negative"}`}>{money(forecastNet)}</div>
          <div className="kpi-trend">{forecastNet >= 0 ? "Surplus prévu 🎉" : "Déficit prévu"}</div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="cal-month-head">
        <button type="button" className="secondary-btn day-arrow" onClick={() => shiftMonth(-1)} aria-label="Mois précédent">‹</button>
        <strong style={{ fontSize: 16 }}>{MONTHS[cursor.m]} {cursor.y}</strong>
        <button type="button" className="secondary-btn day-arrow" onClick={() => shiftMonth(1)} aria-label="Mois suivant">›</button>
      </div>

      {/* Calendar grid */}
      <div className="cal-weekdays">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="cal-day empty" />;
          const iso = isoOf(cursor.y, cursor.m, d);
          const ents = dayEntries(iso);
          const dayNet = ents.reduce((s, e) => s + (e.type === "income" ? Number(e.amount) : -Number(e.amount)), 0);
          return (
            <button
              type="button"
              key={iso}
              className={`cal-day${iso === today ? " today" : ""}${iso === selectedDay ? " selected" : ""}`}
              onClick={() => setSelectedDay(iso)}
            >
              <span className="cal-day-num">{d}</span>
              {ents.slice(0, 2).map((e) => (
                <span key={e.id} className={`cal-chip ${e.type}`} title={`${e.name} · ${money(Number(e.amount))}`}>
                  {e.type === "income" ? "+" : "−"}{Math.round(Number(e.amount))}
                </span>
              ))}
              {ents.length > 2 && <span className="cal-more">+{ents.length - 2}</span>}
              {ents.length > 0 && (
                <span className={`cal-day-net ${dayNet >= 0 ? "money-positive" : "money-negative"}`}>{dayNet >= 0 ? "+" : ""}{Math.round(dayNet)}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day editor */}
      {selectedDay && (
        <div className="cal-editor">
          <div className="card-head" style={{ marginBottom: 10 }}>
            <h3 className="card-title" style={{ fontSize: 16 }}>
              {new Date(`${selectedDay}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </h3>
            <button type="button" className="task-del" onClick={() => setSelectedDay(null)} aria-label="Fermer">✕</button>
          </div>

          <form onSubmit={addPlanned} className="checklist-add">
            <select className="auth-input" style={{ flex: "0 1 120px" }} value={type} onChange={(e) => setType(e.target.value as FinanceType)}>
              <option value="expense">Dépense</option>
              <option value="income">Revenu</option>
            </select>
            <input className="auth-input" style={{ flex: "2 1 150px" }} placeholder="Libellé" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="auth-input" style={{ flex: "1 1 100px" }} type="number" step="0.01" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="checklist-submit" type="submit">Planifier</button>
          </form>

          {selectedEntries.length > 0 && (
            <ul className="checklist" style={{ marginTop: 4 }}>
              {selectedEntries.map((e) => (
                <li key={e.id} className="task-item">
                  <div className="task-body">
                    <span className="task-name">{e.name}</span>
                  </div>
                  <strong className={e.type === "income" ? "money-positive" : "money-negative"}>
                    {e.type === "income" ? "+" : "−"}{money(Number(e.amount))}
                  </strong>
                  <button type="button" className="task-del" onClick={() => removePlanned(e.id)} aria-label="Supprimer" title="Supprimer">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!selectedDay && (
        <p className="card-sub" style={{ marginTop: 10, textAlign: "center" }}>Clique sur un jour pour y planifier un revenu ou une dépense.</p>
      )}
    </div>
  );
}
