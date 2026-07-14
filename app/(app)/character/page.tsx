import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { statsService } from "@/server/stats/stats.service";
import { userService } from "@/server/users/user.service";
import { PageHead } from "@/components/ui/page-head";
import { ActionRecorder } from "@/components/features/action-recorder";
import { CustomStatsManager } from "@/components/features/custom-stats-manager";
import { CharacterStats } from "@/components/features/character-stats";
import { LevelHero } from "@/components/features/level-hero";
import { CosmeticsManager } from "@/components/features/cosmetics-manager";
import { TaskStatsCard, type StatGroup } from "@/components/features/task-stats-card";
import { levelFromXp, money, percentage, categoryAverage, todayISO, addDaysISO } from "@/lib/utils";
import { STAT_CATEGORIES } from "@/lib/constants";
import { workTime, formatMinutes } from "@/server/stats/worktime";

export default async function CharacterPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const uid = user!.id;

  const [stats, profile] = await Promise.all([
    statsService.list(uid),
    userService.getProfile(uid),
  ]);

  // Aggregate data for the KPI overview (merged in from the old Statistiques page).
  const [quests, routines, tasks, finance, foods, goals] = await Promise.all([
    supabase.from("quests").select("*").eq("user_id", uid),
    supabase.from("routines").select("*").eq("user_id", uid),
    supabase.from("tasks").select("*").eq("user_id", uid),
    supabase.from("finance_entries").select("*").eq("user_id", uid),
    supabase.from("foods").select("*").eq("user_id", uid).eq("food_date", todayISO()),
    supabase.from("nutrition_goals").select("*").eq("user_id", uid).maybeSingle(),
  ]);

  // Character score = mean of the 3 category averages (excludes standalone Énergie).
  const catAvgs = STAT_CATEGORIES.map((c) => categoryAverage(stats, c.key));
  const avg = catAvgs.length ? Math.round(catAvgs.reduce((a, b) => a + b, 0) / catAvgs.length) : 0;
  const { level } = levelFromXp(profile?.xp ?? 0);

  // Fixed category gauges shown in the hero (énergie is a live gauge, not here).
  const heroCategories = [
    { label: "Physique", value: categoryAverage(stats, "physique"), color: "#e5484d" },
    { label: "Mental", value: categoryAverage(stats, "mental"), color: "#3e63dd" },
    { label: "Personnel", value: categoryAverage(stats, "personnel"), color: "#8e4ec6" },
    { label: "Social", value: categoryAverage(stats, "social"), color: "#30a46c" },
  ];

  const questsDone = (quests.data ?? []).filter((q) => q.done).length;
  const routineDone = (routines.data ?? []).filter((r) => r.done).length;
  const routineTotal = (routines.data ?? []).length;

  // ----- Task & quest statistics (done / to-do per period, server-computed so
  // there's no client date math → hydration-safe). Done = by completion date,
  // to-do = by creation date. Week = current ISO week; month/year = calendar. -----
  const today = todayISO();
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  const weekStartISO = addDaysISO(today, -((dow + 6) % 7));
  const monthStartISO = `${today.slice(0, 7)}-01`;
  const yearStartISO = `${today.slice(0, 4)}-01-01`;
  const countByPeriod = <T,>(rows: T[], dateOf: (t: T) => string | null | undefined) => {
    const since = (start: string) => rows.filter((t) => { const d = dateOf(t); return !!d && d.slice(0, 10) >= start; }).length;
    return { week: since(weekStartISO), month: since(monthStartISO), year: since(yearStartISO), total: rows.length };
  };
  const allTasks = tasks.data ?? [];
  const allQuests = quests.data ?? [];
  // Tasks + quests merged into one pool, each row tagged « tâche » / « quête ».
  const asTask = (t: (typeof allTasks)[number]) => ({ id: t.id, name: t.name, kind: "tâche" as const, completed_at: t.completed_at, created_at: t.created_at, deadline: t.deadline, category: t.category });
  const asQuest = (q: (typeof allQuests)[number]) => ({ id: q.id, name: q.name, kind: "quête" as const, completed_at: q.completed_at, created_at: q.created_at, category: q.category });
  const doneItems = [...allTasks.filter((t) => t.done).map(asTask), ...allQuests.filter((q) => q.done).map(asQuest)];
  const todoItems = [...allTasks.filter((t) => !t.done).map(asTask), ...allQuests.filter((q) => !q.done).map(asQuest)];
  const statGroups: StatGroup[] = [
    { key: "done", label: "✅ Faites", tone: "done", dateKind: "done", counts: countByPeriod(doneItems, (i) => i.completed_at), items: doneItems },
    { key: "todo", label: "🕗 À faire", tone: "todo", dateKind: "todo", counts: countByPeriod(todoItems, (i) => i.created_at), items: todoItems },
  ];

  const thisMonth = todayISO().slice(0, 7);
  const month = (finance.data ?? []).filter((e) => e.entry_date.slice(0, 7) === thisMonth && !e.recurring);
  const rec = (finance.data ?? []).filter((e) => e.recurring);
  const recurringSpent = rec.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
  const recurringIncome = rec.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const income = month.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0) + recurringIncome;
  const spent = month.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0) + recurringSpent;

  const calToday = (foods.data ?? []).reduce((s, f) => s + Number(f.calories), 0);
  const calGoal = goals.data?.calories ?? 0;

  const work = await workTime(supabase, uid);

  const kpis = [
    { label: "Quêtes complétées", value: `${questsDone}/${quests.data?.length ?? 0}`, trend: quests.data?.length ? `${percentage(questsDone, quests.data.length)}%` : "—" },
    { label: "Quêtes quotidiennes", value: `${routineDone}/${routineTotal}`, trend: routineTotal ? `${percentage(routineDone, routineTotal)}% faites` : "—" },
    { label: "Budget (net du mois)", value: money(income - spent), trend: `Gagné ${money(income)} · dépensé ${money(spent)}` },
    { label: "Calories du jour", value: Math.round(calToday), trend: calGoal ? `objectif ${calGoal} kcal` : "objectif non défini" },
    { label: "Tâches du jour", value: tasks.data?.length ?? 0, trend: `${(tasks.data ?? []).filter((t) => t.done).length} faites` },
    { label: "Temps de travail", value: formatMinutes(work.total), trend: `${formatMinutes(work.today)} aujourd'hui · ${formatMinutes(work.week)} / 7 j` },
  ];

  return (
    <div className="page section active">
      <PageHead title="Personnage" sub="Ta fiche, tes statistiques et tes indicateurs clés." />

      {/* ===== Fiche personnage (niveau + XP) ===== */}
      {profile && (
        <div style={{ marginBottom: 16 }}>
          <LevelHero profile={profile} score={avg} categories={heroCategories} />
        </div>
      )}

      {/* ===== Récompenses / cosmétiques ===== */}
      {profile && <CosmeticsManager profile={profile} level={level} />}

      {/* ===== Indicateurs clés ===== */}
      <div className="grid grid-stats" style={{ marginBottom: 16 }}>
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-trend">{k.trend}</div>
          </div>
        ))}
      </div>

      {/* ===== Statistiques des tâches & quêtes ===== */}
      <div style={{ marginBottom: 16 }}>
        <TaskStatsCard groups={statGroups} />
      </div>

      {/* ===== Caractéristiques (par catégorie) ===== */}
      <CharacterStats stats={stats} />

      <ActionRecorder stats={stats} />
      <CustomStatsManager stats={stats} />
    </div>
  );
}
