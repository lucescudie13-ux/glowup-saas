import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { userService } from "@/server/users/user.service";
import { PageHead } from "@/components/ui/page-head";
import { workTime, workoutMinutes, formatMinutes } from "@/server/stats/worktime";
import { actionXp, money, todayISO, addDaysISO, formatDayLabel } from "@/lib/utils";

export default async function RecapPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const uid = user!.id;

  const today = todayISO();
  const weekStart = addDaysISO(today, -6); // 7-day window incl. today

  const [profile, work, tasksRes, workoutsRes, actionsRes, sleepRes, foodsRes, goalsRes, financeRes, measuresRes, reflRes] =
    await Promise.all([
      userService.getProfile(uid),
      workTime(supabase, uid),
      supabase.from("tasks").select("minutes, completed_at, done").eq("user_id", uid).eq("done", true).gte("completed_at", `${weekStart}T00:00:00`),
      supabase.from("workouts").select("type, data, workout_date").eq("user_id", uid).gte("workout_date", weekStart),
      supabase.from("actions").select("deltas, action_date").eq("user_id", uid).gte("action_date", weekStart),
      supabase.from("sleep_entries").select("hours, sleep_date").eq("user_id", uid).gte("sleep_date", weekStart),
      supabase.from("foods").select("calories, food_date").eq("user_id", uid).gte("food_date", weekStart),
      supabase.from("nutrition_goals").select("calories").eq("user_id", uid).maybeSingle(),
      supabase.from("finance_entries").select("type, amount, entry_date, recurring").eq("user_id", uid),
      supabase.from("measurements").select("*").eq("user_id", uid).order("measure_date", { ascending: false }).limit(2),
      supabase.from("reflections").select("title, topic, created_at").eq("user_id", uid).gte("created_at", `${weekStart}T00:00:00`),
    ]);

  // Tasks completed this week
  const tasksDone = tasksRes.data ?? [];
  const tasksCount = tasksDone.length;
  const tasksMin = tasksDone.reduce((s, t) => s + Number(t.minutes ?? 0), 0);

  // Workouts this week
  const workouts = workoutsRes.data ?? [];
  const workoutsCount = workouts.length;
  const workoutsByType = workouts.reduce<Record<string, number>>((acc, w) => {
    acc[w.type] = (acc[w.type] ?? 0) + 1;
    return acc;
  }, {});
  const workoutMin = workouts.reduce((s, w) => s + workoutMinutes(w.type, w.data), 0);
  const typeLabel: Record<string, string> = { strength: "muscu", run: "course", boxing: "boxe" };
  const workoutBreakdown = Object.entries(workoutsByType).map(([t, n]) => `${n} ${typeLabel[t] ?? t}`).join(" · ") || "aucune";

  // XP gained this week
  const xpWeek = (actionsRes.data ?? []).reduce((s, a) => s + actionXp((a.deltas ?? {}) as Record<string, number>), 0);

  // Sleep average
  const sleep = sleepRes.data ?? [];
  const sleepAvg = sleep.length ? sleep.reduce((s, e) => s + Number(e.hours ?? 0), 0) / new Set(sleep.map((e) => e.sleep_date)).size : 0;

  // Nutrition: avg daily calories over days logged vs goal
  const foods = foodsRes.data ?? [];
  const calByDay = foods.reduce<Record<string, number>>((acc, f) => {
    acc[f.food_date] = (acc[f.food_date] ?? 0) + Number(f.calories ?? 0);
    return acc;
  }, {});
  const calDays = Object.keys(calByDay).length;
  const calAvg = calDays ? Math.round(Object.values(calByDay).reduce((s, v) => s + v, 0) / calDays) : 0;
  const calGoal = goalsRes.data?.calories ?? 0;

  // Finance: net for the current month
  const month = today.slice(0, 7);
  const fin = financeRes.data ?? [];
  const monthEntries = fin.filter((e) => e.entry_date.slice(0, 7) === month && !e.recurring);
  const rec = fin.filter((e) => e.recurring);
  const recurringSpent = rec.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
  const recurringIncome = rec.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const income = monthEntries.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0) + recurringIncome;
  const spent = monthEntries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0) + recurringSpent;
  const net = income - spent;

  // Body measurement delta (latest vs previous)
  const measures = measuresRes.data ?? [];
  const latest = measures[0];
  const prev = measures[1];
  const weightDelta = latest && prev && latest.weight != null && prev.weight != null ? Number(latest.weight) - Number(prev.weight) : null;

  const reflections = reflRes.data ?? [];

  const kpis = [
    { label: "Temps de travail (7 j)", value: formatMinutes(work.week), trend: `${formatMinutes(work.today)} aujourd'hui` },
    { label: "Tâches faites", value: tasksCount, trend: `${formatMinutes(tasksMin)} cumulées` },
    { label: "Séances", value: workoutsCount, trend: workoutBreakdown },
    { label: "XP gagnée", value: `+${xpWeek}`, trend: "cette semaine" },
    { label: "Sommeil moyen", value: sleepAvg ? `${sleepAvg.toFixed(1)} h` : "—", trend: `${new Set(sleep.map((e) => e.sleep_date)).size} nuit(s) notée(s)` },
    { label: "Calories moy./jour", value: calAvg || "—", trend: calGoal ? `objectif ${calGoal}` : "objectif non défini" },
    { label: "Budget (net du mois)", value: money(net), trend: `gagné ${money(income)} · dépensé ${money(spent)}` },
    { label: "Poids", value: latest?.weight != null ? `${latest.weight} kg` : "—", trend: weightDelta != null ? `${weightDelta >= 0 ? "+" : ""}${weightDelta.toFixed(1)} kg vs dernier` : "pas de comparatif" },
    { label: "Série active", value: `${profile?.streak_count ?? 0} j`, trend: `routine ${profile?.routine_streak_count ?? 0} j` },
  ];

  // Heuristic "how it's going" summary
  const notes: string[] = [];
  if (work.week >= 600) notes.push(`💪 Grosse semaine : ${formatMinutes(work.week)} de travail cumulé.`);
  else if (work.week > 0) notes.push(`⏱️ ${formatMinutes(work.week)} de travail cette semaine.`);
  else notes.push("⏱️ Aucune tâche/séance enregistrée cette semaine pour l'instant.");
  if (workoutsCount >= 3) notes.push(`🔥 ${workoutsCount} séances d'entraînement — bon rythme.`);
  else if (workoutsCount > 0) notes.push(`🏋️ ${workoutsCount} séance(s) — vise 3+/semaine.`);
  else notes.push("🏋️ Aucune séance cette semaine.");
  if (sleepAvg && sleepAvg < 7) notes.push(`😴 Sommeil moyen ${sleepAvg.toFixed(1)} h — en dessous de 7 h.`);
  else if (sleepAvg) notes.push(`😴 Sommeil moyen ${sleepAvg.toFixed(1)} h — correct.`);
  if (calGoal && calAvg) notes.push(calAvg > calGoal ? `🍽️ ${calAvg} kcal/j, au-dessus de l'objectif (${calGoal}).` : `🍽️ ${calAvg} kcal/j, dans l'objectif.`);
  if (weightDelta != null) notes.push(weightDelta <= 0 ? `⚖️ Poids stable/en baisse (${weightDelta.toFixed(1)} kg).` : `⚖️ Poids +${weightDelta.toFixed(1)} kg depuis le dernier relevé.`);
  notes.push(`✨ +${xpWeek} XP gagnés cette semaine.`);

  return (
    <div className="page section active">
      <PageHead title="Récap hebdo" sub={`Ton glow up du ${formatDayLabel(weekStart)} à aujourd'hui.`} />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h2 className="card-title">📈 Comment ça avance</h2></div>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          {notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: 16 }}>
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-trend">{k.trend}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head"><h2 className="card-title">🪞 Réflexions de la semaine</h2></div>
        {reflections.length === 0 ? (
          <p className="card-sub">Aucune réflexion notée cette semaine.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {reflections.map((r, i) => (
              <li key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                {r.title || "(sans titre)"} · <span className="card-sub">{r.topic}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
