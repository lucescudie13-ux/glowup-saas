"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { todayISO } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import type { Food, NutritionGoals } from "@/types";

const MEALS = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"];

interface Props {
  initialGoals: NutritionGoals | null;
  initialFoods: Food[];
}

export function NutritionManager({ initialGoals, initialFoods }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState<NutritionGoals | null>(initialGoals);
  const [foods, setFoods] = useState<Food[]>(initialFoods);

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

  async function addFood(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const created = await api.post<Food>("/api/foods", {
      name, meal,
      calories: Number(calories || 0),
      protein: Number(protein || 0),
      carbs: Number(carbs || 0),
      fat: Number(fat || 0),
      food_date: todayISO(),
    });
    setFoods((prev) => [...prev, created]);
    setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    router.refresh();
  }

  async function removeFood(id: string) {
    await api.del(`/api/foods/${id}`);
    setFoods((prev) => prev.filter((f) => f.id !== id));
    router.refresh();
  }

  async function saveGoals(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const payload = {
      calories: Number(fd.get("calories")),
      protein: Number(fd.get("protein")),
      carbs: Number(fd.get("carbs")),
      fat: Number(fd.get("fat")),
    };
    const updated = await api.put<NutritionGoals>("/api/nutrition-goals", payload);
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

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h2 className="card-title">📈 Aujourd’hui</h2></div>
        <div style={{ display: "grid", gap: 14 }}>
          {macro("Calories", totals.calories, goals?.calories ?? 0, " kcal")}
          {macro("Protéines", totals.protein, goals?.protein ?? 0, " g")}
          {macro("Glucides", totals.carbs, goals?.carbs ?? 0, " g")}
          {macro("Lipides", totals.fat, goals?.fat ?? 0, " g")}
        </div>
      </div>

      <form className="card" onSubmit={saveGoals} style={{ marginBottom: 16 }}>
        <div className="card-head"><h2 className="card-title">🎯 Objectifs journaliers</h2></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
          <label className="auth-field"><span>Calories</span><input name="calories" className="auth-input" type="number" defaultValue={goals?.calories ?? 2285} /></label>
          <label className="auth-field"><span>Protéines (g)</span><input name="protein" className="auth-input" type="number" defaultValue={goals?.protein ?? 154} /></label>
          <label className="auth-field"><span>Glucides (g)</span><input name="carbs" className="auth-input" type="number" defaultValue={goals?.carbs ?? 246} /></label>
          <label className="auth-field"><span>Lipides (g)</span><input name="fat" className="auth-input" type="number" defaultValue={goals?.fat ?? 76} /></label>
        </div>
        <button className="main-btn" type="submit">Enregistrer les objectifs</button>
      </form>

      <div className="card">
        <div className="card-head"><h2 className="card-title">🍽️ Journal du jour</h2></div>
        <form onSubmit={addFood} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <input className="auth-input" style={{ flex: "2 1 160px" }} placeholder="Aliment" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="auth-input" style={{ flex: "1 1 130px" }} value={meal} onChange={(e) => setMeal(e.target.value)}>
            {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input className="auth-input" style={{ flex: "1 1 80px" }} type="number" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 70px" }} type="number" placeholder="P" value={protein} onChange={(e) => setProtein(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 70px" }} type="number" placeholder="G" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 70px" }} type="number" placeholder="L" value={fat} onChange={(e) => setFat(e.target.value)} />
          <button className="main-btn" type="submit">Ajouter</button>
        </form>

        {foods.length === 0 ? (
          <EmptyState icon="🍽️">Aucun aliment enregistré aujourd’hui.</EmptyState>
        ) : (
          MEALS.filter((m) => foods.some((f) => f.meal === m)).map((m) => (
            <div key={m} style={{ marginBottom: 12 }}>
              <div className="nav-section-label" style={{ marginTop: 8 }}>{m}</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {foods.filter((f) => f.meal === m).map((f) => (
                  <li key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ flex: 1 }}>{f.name}</span>
                    <span className="card-sub">{Math.round(Number(f.calories))} kcal</span>
                    <button className="secondary-btn" onClick={() => removeFood(f.id)}>✕</button>
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
