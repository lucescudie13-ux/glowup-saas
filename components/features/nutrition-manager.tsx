"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { addDaysISO, formatDayLabel } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import type { Food, NutritionGoals } from "@/types";

const MEALS = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"];

interface DayCalories {
  date: string;
  calories: number;
}

interface Props {
  initialGoals: NutritionGoals | null;
  initialFoods: Food[];
  today: string;
  caloriesByDay: DayCalories[];
}

export function NutritionManager({ initialGoals, initialFoods, today, caloriesByDay }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState<NutritionGoals | null>(initialGoals);
  const [foods, setFoods] = useState<Food[]>(initialFoods);
  const [date, setDate] = useState(today);
  const [loadingDay, setLoadingDay] = useState(false);

  const [name, setName] = useState("");
  const [meal, setMeal] = useState(MEALS[0]);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const totals = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + Number(f.calories),
      protein: acc.protein + Number(f.protein),
      carbs: acc.carbs + Number(f.carbs),
      fat: acc.fat + Number(f.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  async function goToDay(nextDate: string) {
    setDate(nextDate);
    setLoadingDay(true);
    try {
      const dayFoods = await api.get<Food[]>(`/api/foods?date=${nextDate}`);
      setFoods(dayFoods);
    } finally {
      setLoadingDay(false);
    }
  }

  async function addFood(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const created = await api.post<Food>("/api/foods", {
      name, meal,
      calories: Number(calories || 0),
      protein: Number(protein || 0),
      carbs: Number(carbs || 0),
      fat: Number(fat || 0),
      food_date: date,
    });
    setFoods((prev) => [...prev, created]);
    setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    router.refresh();
  }

  async function removeFood(id: string) {
    const snapshot = foods;
    setFoods((prev) => prev.filter((f) => f.id !== id)); // optimistic
    try {
      await api.del(`/api/foods/${id}`);
      router.refresh();
    } catch {
      setFoods(snapshot);
    }
  }

  async function saveGoals(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const updated = await api.put<NutritionGoals>("/api/nutrition-goals", {
      calories: Number(fd.get("calories")),
      protein: Number(fd.get("protein")),
      carbs: Number(fd.get("carbs")),
      fat: Number(fd.get("fat")),
    });
    setGoals(updated);
    router.refresh();
  }

  const macro = (label: string, value: number, goal: number, unit: string) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span>{label}</span>
        <span className="card-sub">{Math.round(value)}{unit} / {goal}{unit}</span>
      </div>
      <ProgressBar value={goal ? (value / goal) * 100 : 0} />
    </div>
  );

  const calorieGoal = goals?.calories ?? 0;
  const maxVal = Math.max(calorieGoal, ...caloriesByDay.map((d) => d.calories), 1);
  const goalPct = calorieGoal ? (calorieGoal / maxVal) * 100 : 0;
  const dayTitle = date === today ? "Aujourd’hui" : formatDayLabel(date);

  return (
    <>
      {/* ===== Sélecteur de jour ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="day-nav">
          <button type="button" className="secondary-btn day-arrow" onClick={() => goToDay(addDaysISO(date, -1))} aria-label="Jour précédent">‹</button>
          <div className="day-nav-center">
            <input
              type="date"
              className="auth-input"
              value={date}
              max={today}
              onChange={(e) => e.target.value && goToDay(e.target.value)}
              style={{ textAlign: "center" }}
            />
            <span className="day-nav-label">{dayTitle}</span>
          </div>
          <button
            type="button"
            className="secondary-btn day-arrow"
            onClick={() => goToDay(addDaysISO(date, 1))}
            aria-label="Jour suivant"
            disabled={date >= today}
          >›</button>
        </div>
        {date !== today && (
          <p className="card-sub" style={{ textAlign: "center", marginTop: 8 }}>
            <button type="button" className="link-btn" onClick={() => goToDay(today)}>↩ Revenir à aujourd’hui</button>
          </p>
        )}
      </div>

      {/* ===== Synthèse du jour ===== */}
      <div className="card" style={{ marginBottom: 16, opacity: loadingDay ? 0.6 : 1 }}>
        <div className="card-head"><h2 className="card-title">📈 {dayTitle}</h2></div>
        <div style={{ display: "grid", gap: 14 }}>
          {macro("Calories", totals.calories, goals?.calories ?? 0, " kcal")}
          {macro("Protéines", totals.protein, goals?.protein ?? 0, " g")}
          {macro("Glucides", totals.carbs, goals?.carbs ?? 0, " g")}
          {macro("Lipides", totals.fat, goals?.fat ?? 0, " g")}
        </div>
      </div>

      {/* ===== Graphique calories ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <h2 className="card-title">📊 Calories — 14 derniers jours</h2>
            <p className="card-sub">{calorieGoal ? `Objectif : ${calorieGoal} kcal/jour` : "Définis un objectif de calories ci-dessous."}</p>
          </div>
        </div>
        <div className="cal-chart">
          <div className="cal-bars-wrap">
            {calorieGoal ? <div className="cal-goal-line" style={{ bottom: `${goalPct}%` }} /> : null}
            <div className="cal-bars">
              {caloriesByDay.map((d) => {
                const h = (d.calories / maxVal) * 100;
                const over = calorieGoal > 0 && d.calories > calorieGoal;
                return (
                  <div className="cal-col" key={d.date}>
                    <div className={`cal-bar${over ? " over" : ""}${d.date === today ? " is-today" : ""}`} style={{ height: `${h}%` }} title={`${formatDayLabel(d.date)} · ${d.calories} kcal`} />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="cal-labels">
            {caloriesByDay.map((d) => (
              <span className="cal-x" key={d.date}>{new Date(`${d.date}T00:00:00`).getDate()}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Objectifs journaliers ===== */}
      <form className="card" onSubmit={saveGoals} style={{ marginBottom: 16 }}>
        <div className="card-head"><h2 className="card-title">🎯 Objectifs journaliers</h2></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
          <label className="auth-field"><span>Calories</span><input name="calories" className="auth-input" type="number" defaultValue={goals?.calories ?? 2285} /></label>
          <label className="auth-field"><span>Protéines (g)</span><input name="protein" className="auth-input" type="number" defaultValue={goals?.protein ?? 154} /></label>
          <label className="auth-field"><span>Glucides (g)</span><input name="carbs" className="auth-input" type="number" defaultValue={goals?.carbs ?? 246} /></label>
          <label className="auth-field"><span>Lipides (g)</span><input name="fat" className="auth-input" type="number" defaultValue={goals?.fat ?? 76} /></label>
        </div>
        <button className="checklist-submit" type="submit" style={{ marginTop: 12 }}>Enregistrer les objectifs</button>
      </form>

      {/* ===== Journal du jour ===== */}
      <div className="card">
        <div className="card-head"><h2 className="card-title">🍽️ Journal — {dayTitle}</h2></div>
        <form onSubmit={addFood} className="checklist-add">
          <input className="auth-input" style={{ flex: "2 1 160px" }} placeholder="Aliment" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="auth-input" style={{ flex: "1 1 130px" }} value={meal} onChange={(e) => setMeal(e.target.value)}>
            {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input className="auth-input" style={{ flex: "1 1 80px" }} type="number" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 70px" }} type="number" placeholder="P" value={protein} onChange={(e) => setProtein(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 70px" }} type="number" placeholder="G" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 70px" }} type="number" placeholder="L" value={fat} onChange={(e) => setFat(e.target.value)} />
          <button className="checklist-submit" type="submit">Ajouter</button>
        </form>

        {foods.length === 0 ? (
          <EmptyState icon="🍽️">Aucun aliment enregistré pour {date === today ? "aujourd’hui" : "ce jour"}.</EmptyState>
        ) : (
          MEALS.filter((m) => foods.some((f) => f.meal === m)).map((m) => (
            <div key={m} style={{ marginBottom: 12 }}>
              <div className="nav-section-label" style={{ marginTop: 8 }}>{m}</div>
              <ul className="checklist">
                {foods.filter((f) => f.meal === m).map((f) => (
                  <li key={f.id} className="task-item">
                    <div className="task-body">
                      <span className="task-name">{f.name}</span>
                      <div className="task-meta">
                        <span className="task-mins">{Math.round(Number(f.calories))} kcal</span>
                        <span className="cat-tag">P {f.protein || 0} · G {f.carbs || 0} · L {f.fat || 0}</span>
                      </div>
                    </div>
                    <button type="button" className="task-del" onClick={() => removeFood(f.id)} aria-label="Supprimer" title="Supprimer">✕</button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </>
  );
}
