import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui/page-head";
import { ProgressBar } from "@/components/ui/progress-bar";
import { characterLevel, money, percentage, todayISO } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const uid = user!.id;

  // Parallel reads — all owner-scoped + protected by RLS.
  const [stats, quests, routines, tasks, monthly, yearly, projects, finance, foods, goals, dangers] =
    await Promise.all([
      supabase.from("stats").select("*").eq("user_id", uid),
      supabase.from("quests").select("*").eq("user_id", uid),
      supabase.from("routines").select("*").eq("user_id", uid),
      supabase.from("tasks").select("*").eq("user_id", uid),
      supabase.from("objectives").select("*").eq("user_id", uid).eq("period", "monthly"),
      supabase.from("objectives").select("*").eq("user_id", uid).eq("period", "yearly"),
      supabase.from("projects").select("*").eq("user_id", uid),
      supabase.from("finance_entries").select("*").eq("user_id", uid),
      supabase.from("foods").select("*").eq("user_id", uid).eq("food_date", todayISO()),
      supabase.from("nutrition_goals").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("dangers").select("*").eq("user_id", uid),
    ]);

  const statRows = stats.data ?? [];
  const { avg, level, levelProgress } = characterLevel(statRows);

  const questsDone = (quests.data ?? []).filter((q) => q.done).length;
  const routineDoneMin = (routines.data ?? []).filter((r) => r.done).reduce((s, r) => s + (r.minutes || 1), 0);
  const routineTotalMin = (routines.data ?? []).reduce((s, r) => s + (r.minutes || 1), 0);
  const objActive = (monthly.data?.length ?? 0) + (yearly.data?.length ?? 0) + (projects.data?.length ?? 0);

  const thisMonth = todayISO().slice(0, 7);
  const month = (finance.data ?? []).filter((e) => e.entry_date.slice(0, 7) === thisMonth);
  const income = month.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const spent = month.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);

  const calToday = (foods.data ?? []).reduce((s, f) => s + Number(f.calories), 0);
  const calGoal = goals.data?.calories ?? 0;

  const kpis = [
    { label: "Niveau", value: level, trend: `Score ${avg}/100` },
    { label: "Quêtes complétées", value: `${questsDone}/${quests.data?.length ?? 0}`, trend: quests.data?.length ? `${percentage(questsDone, quests.data.length)}%` : "—" },
    { label: "Minutes (routine)", value: routineDoneMin, trend: `sur ${routineTotalMin} min prévues` },
    { label: "Objectifs / projets", value: objActive, trend: "actifs" },
    { label: "Finance (net du mois)", value: money(income - spent), trend: `Gagné ${money(income)} · dépensé ${money(spent)}` },
    { label: "Calories du jour", value: Math.round(calToday), trend: calGoal ? `objectif ${calGoal} kcal` : "objectif non défini" },
    { label: "Dangers listés", value: dangers.data?.length ?? 0, trend: "à surveiller" },
    { label: "Tâches du jour", value: tasks.data?.length ?? 0, trend: `${(tasks.data ?? []).filter((t) => t.done).length} faites` },
  ];

  return (
    <div className="page section active">
      <PageHead title="Tableau de bord" sub="Vue d’ensemble de ta progression personnelle." />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h2 className="card-title">⭐ Niveau {level}</h2>
          <span className="card-sub">Score global {avg}/100</span>
        </div>
        <ProgressBar value={levelProgress} />
        <p className="card-sub" style={{ marginTop: 8 }}>
          Progression vers le niveau {level + 1}
        </p>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="kpi-card" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-trend">{k.trend}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
