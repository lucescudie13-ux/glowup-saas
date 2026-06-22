import { getCurrentUser } from "@/lib/supabase/server";
import { workoutsService } from "@/server/workouts/workouts.service";
import { measurementsService } from "@/server/measurements/measurements.service";
import { PageHead } from "@/components/ui/page-head";
import { TrainingManager } from "@/components/features/training-manager";
import { MeasurementsManager } from "@/components/features/measurements-manager";
import type { Measurement, Workout } from "@/types";

export default async function TrainingPage() {
  const user = await getCurrentUser();
  const [workouts, measurements] = await Promise.all([
    workoutsService.list(user!.id) as Promise<Workout[]>,
    measurementsService.list(user!.id) as Promise<Measurement[]>,
  ]);

  // Derived PRs: best (max weight) per exercise from strength workouts.
  const prs = new Map<string, { weight: number; reps: number; date: string }>();
  for (const w of workouts) {
    if (w.type !== "strength") continue;
    const d = (w.data as Record<string, unknown>) ?? {};
    const exercise = String(d.exercise ?? "").trim();
    const weight = Number(d.weight ?? 0);
    if (!exercise || weight <= 0) continue;
    const cur = prs.get(exercise);
    if (!cur || weight > cur.weight) {
      prs.set(exercise, { weight, reps: Number(d.reps ?? 0), date: w.workout_date });
    }
  }
  const prList = [...prs.entries()].map(([exercise, v]) => ({ exercise, ...v })).sort((a, b) => b.weight - a.weight);

  return (
    <div className="page section active">
      <PageHead title="Entraînement" sub="Muscu, course et boxe — une seule timeline." />
      <TrainingManager initialWorkouts={workouts} />

      {prList.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head"><h2 className="card-title">🏆 Records (PR)</h2></div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {prList.map((p) => (
              <li key={p.exercise} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ flex: 1 }}>{p.exercise}</span>
                <strong>{p.weight} kg</strong>
                <span className="card-sub">× {p.reps}</span>
              </li>
            ))}
          </ul>
          <p className="card-sub" style={{ marginTop: 8 }}>Calculés automatiquement depuis tes séances de muscu (charge max par exercice).</p>
        </div>
      )}

      <MeasurementsManager initialItems={measurements} />
    </div>
  );
}
