import { getCurrentUser } from "@/lib/supabase/server";
import { routinesService } from "@/server/routines/routines.service";
import { userService } from "@/server/users/user.service";
import { statsService } from "@/server/stats/stats.service";
import { PageHead } from "@/components/ui/page-head";
import { ChecklistManager } from "@/components/features/checklist-manager";
import { RoutineReminder } from "@/components/features/routine-reminder";
import { STAT_CATEGORIES, ENERGY_CATEGORY } from "@/lib/constants";

export default async function RoutinePage() {
  const user = await getCurrentUser();
  const [items, profile, stats] = await Promise.all([
    routinesService.list(user!.id),
    userService.getProfile(user!.id),
    statsService.list(user!.id),
  ]);

  // Category dropdown for daily quests = the statistics, grouped by main category.
  const categoryOptions = [...STAT_CATEGORIES, ENERGY_CATEGORY]
    .map((c) => ({ group: `${c.icon} ${c.label}`, options: stats.filter((s) => s.category === c.key).map((s) => s.name) }))
    .filter((g) => g.options.length > 0);

  const daily = items.filter((r) => (r.frequency ?? "daily") === "daily");
  const dailyRemaining = daily.filter((r) => !r.done).length;
  const dailyDone = daily.length > 0 && dailyRemaining === 0;
  const streak = profile?.routine_streak_count ?? 0;

  return (
    <div className="page section active">
      <PageHead title="Quêtes quotidiennes" sub="Tes quêtes récurrentes : quotidiennes, hebdomadaires et mensuelles." />

      {/* ===== Série de routine ===== */}
      <div className="card routine-streak-card" style={{ marginBottom: 16 }}>
        <div className="streak-flame">{streak > 0 ? "🔥" : "🫥"}</div>
        <div style={{ flex: 1 }}>
          <div className="streak-count">
            {streak} jour{streak > 1 ? "s" : ""} de série
          </div>
          <p className="card-sub" style={{ margin: "2px 0 0" }}>
            {dailyDone
              ? "Quêtes du jour bouclées — série assurée pour aujourd’hui. 💪"
              : daily.length === 0
                ? "Ajoute des quêtes quotidiennes pour démarrer ta série."
                : `Termine tes ${dailyRemaining} quête${dailyRemaining > 1 ? "s" : ""} quotidienne${dailyRemaining > 1 ? "s" : ""} restante${dailyRemaining > 1 ? "s" : ""} pour la garder en vie.`}
          </p>
        </div>
      </div>

      <RoutineReminder
        enabled={profile?.pref_notif ?? false}
        deadline={profile?.routine_deadline ?? "21:00"}
        dailyDone={dailyDone}
        remaining={dailyRemaining}
      />

      <ChecklistManager
        resource="routines"
        initialItems={items}
        withCategory
        categoryOptions={categoryOptions}
        reorderable
        groups={{
          field: "frequency",
          tabs: [
            { value: "daily", label: "🗓️ Quotidienne" },
            { value: "weekly", label: "📅 Hebdomadaire" },
            { value: "monthly", label: "🌙 Mensuelle" },
          ],
        }}
        emptyIcon="🔁"
        emptyText="Aucune routine ici. Ajoute une habitude."
        addLabel="Ajouter"
      />
    </div>
  );
}
