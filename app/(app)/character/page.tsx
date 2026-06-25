import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { statsService } from "@/server/stats/stats.service";
import { userService } from "@/server/users/user.service";
import { PageHead } from "@/components/ui/page-head";
import { ActionRecorder } from "@/components/features/action-recorder";
import { CustomStatsManager } from "@/components/features/custom-stats-manager";
import { CharacterStats } from "@/components/features/character-stats";
import { LevelHero } from "@/components/features/level-hero";
import { CosmeticsManager } from "@/components/features/cosmetics-manager";
import { levelFromXp, money, percentage, categoryAverage, todayISO } from "@/lib/utils";
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
  const [quests, routines, tasks, monthly, yearly, projects, finance, foods, goals, dangers] = await Promise.all([
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

  // Character score = mean of the 3 category averages (excludes standalone Énergie).
  const catAvgs = STAT_CATEGORIES.map((c) => categoryAverage(stats, c.key));
  const avg = catAvgs.length ? Math.round(catAvgs.reduce((a, b) => a + b, 0) / catAvgs.length) : 0;
  const { level } = levelFromXp(profile?.xp ?? 0);

  // Category gauges shown in the hero fiche (couleurs : physique/mental/perso/énergie).
  const heroCategories = [
    { label: "Physique", value: categoryAverage(stats, "physique"), color: "#e5484d" },
    { label: "Mental", value: categoryAverage(stats, "mental"), color: "#3e63dd" },
    { label: "Personnel", value: categoryAverage(stats, "personnel"), color: "#8e4ec6" },
    { label: "Énergie", value: categoryAverage(stats, "energie"), color: "#f5a623" },
  ];

  const questsDone = (quests.data ?? []).filter((q) => q.done).length;
  const routineDone = (routines.data ?? []).filter((r) => r.done).length;
  const routineTotal = (routines.data ?? []).length;
  const objActive = (monthly.data?.length ?? 0) + (yearly.data?.length ?? 0) + (projects.data?.length ?? 0);

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
    { label: "Niveau", value: level, trend: `Score ${avg}/100` },
    { label: "Quêtes complétées", value: `${questsDone}/${quests.data?.length ?? 0}`, trend: quests.data?.length ? `${percentage(questsDone, quests.data.length)}%` : "—" },
    { label: "Quêtes quotidiennes", value: `${routineDone}/${routineTotal}`, trend: routineTotal ? `${percentage(routineDone, routineTotal)}% faites` : "—" },
    { label: "Objectifs / projets", value: objActive, trend: "actifs" },
    { label: "Budget (net du mois)", value: money(income - spent), trend: `Gagné ${money(income)} · dépensé ${money(spent)}` },
    { label: "Calories du jour", value: Math.round(calToday), trend: calGoal ? `objectif ${calGoal} kcal` : "objectif non défini" },
    { label: "Dangers listés", value: dangers.data?.length ?? 0, trend: "à surveiller" },
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

      {/* ===== Caractéristiques (par catégorie) ===== */}
      <CharacterStats stats={stats} />

      <ActionRecorder stats={stats} />
      <CustomStatsManager stats={stats} />
    </div>
  );
}
