"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { todayISO } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { Workout, WorkoutType } from "@/types";

export function TrainingManager({ initialWorkouts }: { initialWorkouts: Workout[] }) {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [tab, setTab] = useState<WorkoutType>("strength");

  // strength
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");
  // run
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  // boxing
  const [boxMinutes, setBoxMinutes] = useState("");
  const [boxType, setBoxType] = useState("Sac");
  const [intensity, setIntensity] = useState(3);

  const [error, setError] = useState<string | null>(null);

  async function submit(type: WorkoutType, data: Record<string, unknown>) {
    setError(null);
    try {
      const created = await api.post<Workout>("/api/workouts", { type, workout_date: todayISO(), data });
      setWorkouts((prev) => [created, ...prev]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    }
  }

  async function remove(id: string) {
    await api.del(`/api/workouts/${id}`);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    router.refresh();
  }

  function describe(w: Workout): string {
    const d = (w.data as Record<string, unknown>) ?? {};
    if (w.type === "strength") return `${d.exercise} · ${d.weight}kg × ${d.reps} (${d.sets} séries)`;
    if (w.type === "run") return `${d.distance} km en ${Math.round(Number(d.seconds) / 60)} min`;
    return `Boxe ${d.type} · ${d.minutes} min · intensité ${d.intensity}`;
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <button className={tab === "strength" ? "main-btn" : "secondary-btn"} onClick={() => setTab("strength")}>🏋️ Muscu</button>
          <button className={tab === "run" ? "main-btn" : "secondary-btn"} onClick={() => setTab("run")}>🏃 Course</button>
          <button className={tab === "boxing" ? "main-btn" : "secondary-btn"} onClick={() => setTab("boxing")}>🥊 Boxe</button>
        </div>

        {tab === "strength" && (
          <form onSubmit={(e) => { e.preventDefault(); submit("strength", { exercise, weight: Number(weight || 0), reps: Number(reps || 1), sets: Number(sets || 1), rest: 0 }); setExercise(""); setWeight(""); setReps(""); setSets(""); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="auth-input" style={{ flex: "2 1 150px" }} placeholder="Exercice" value={exercise} onChange={(e) => setExercise(e.target.value)} />
            <input className="auth-input" style={{ flex: "1 1 80px" }} type="number" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <input className="auth-input" style={{ flex: "1 1 70px" }} type="number" placeholder="reps" value={reps} onChange={(e) => setReps(e.target.value)} />
            <input className="auth-input" style={{ flex: "1 1 70px" }} type="number" placeholder="séries" value={sets} onChange={(e) => setSets(e.target.value)} />
            <button className="main-btn" type="submit">Ajouter</button>
          </form>
        )}

        {tab === "run" && (
          <form onSubmit={(e) => { e.preventDefault(); submit("run", { distance: Number(distance || 0), seconds: Number(minutes || 0) * 60, note: "" }); setDistance(""); setMinutes(""); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="auth-input" style={{ flex: "1 1 100px" }} type="number" step="0.01" placeholder="Distance (km)" value={distance} onChange={(e) => setDistance(e.target.value)} />
            <input className="auth-input" style={{ flex: "1 1 100px" }} type="number" placeholder="Durée (min)" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            <button className="main-btn" type="submit">Ajouter</button>
          </form>
        )}

        {tab === "boxing" && (
          <form onSubmit={(e) => { e.preventDefault(); submit("boxing", { minutes: Number(boxMinutes || 0), type: boxType, intensity, note: "" }); setBoxMinutes(""); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="auth-input" style={{ flex: "1 1 100px" }} type="number" placeholder="Durée (min)" value={boxMinutes} onChange={(e) => setBoxMinutes(e.target.value)} />
            <select className="auth-input" style={{ flex: "1 1 110px" }} value={boxType} onChange={(e) => setBoxType(e.target.value)}>
              <option>Sac</option><option>Sparring</option><option>Shadow</option><option>Technique</option>
            </select>
            <select className="auth-input" style={{ flex: "0 1 130px" }} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Intensité {n}</option>)}
            </select>
            <button className="main-btn" type="submit">Ajouter</button>
          </form>
        )}

        {error && <p className="auth-error">{error}</p>}
      </div>

      <div className="card">
        <div className="card-head"><h2 className="card-title">📋 Séances récentes</h2></div>
        {workouts.length === 0 ? (
          <EmptyState icon="🏋️">Aucune séance enregistrée.</EmptyState>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {workouts.slice(0, 30).map((w) => (
              <li key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ flex: 1 }}>{describe(w)}</span>
                <span className="card-sub">{w.workout_date}</span>
                <button className="secondary-btn" onClick={() => remove(w.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
