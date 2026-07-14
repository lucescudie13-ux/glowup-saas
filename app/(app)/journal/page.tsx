import { getCurrentUser } from "@/lib/supabase/server";
import { tasksService } from "@/server/tasks/tasks.service";
import { routinesService } from "@/server/routines/routines.service";
import { questsService } from "@/server/quests/quests.service";
import { userService } from "@/server/users/user.service";
import { statsService } from "@/server/stats/stats.service";
import { PageHead } from "@/components/ui/page-head";
import { TasksView } from "@/components/features/tasks-view";
import { ChecklistManager } from "@/components/features/checklist-manager";
import { RoutineReminder } from "@/components/features/routine-reminder";
import { DashboardHubSettings } from "@/components/features/dashboard-hub-settings";
import { STAT_CATEGORIES, ENERGY_CATEGORY, HUB_SECTION_KEYS } from "@/lib/constants";
import type { Task } from "@/types";

/**
 * « Journal de quêtes » — page-hub qui réunit tout ce qui est « à faire » :
 * les tâches (du jour / autres), les quêtes récurrentes (quotidiennes, hebdo,
 * mensuelles) et les quêtes spéciales. Un panneau en tête permet de choisir
 * quels points apparaissent sur le tableau de bord.
 */
export default async function JournalPage() {
  const user = await getCurrentUser();
  const uid = user!.id;
  const [tasks, routines, quests, profile, stats] = await Promise.all([
    tasksService.listVisible(uid) as Promise<Task[]>,
    routinesService.list(uid),
    questsService.list(uid),
    userService.getProfile(uid),
    statsService.list(uid),
  ]);

  // Category dropdown for recurring quests = the statistics, grouped by category.
  const categoryOptions = [...STAT_CATEGORIES, ENERGY_CATEGORY]
    .map((c) => ({ group: `${c.icon} ${c.label}`, options: stats.filter((s) => s.category === c.key).map((s) => s.name) }))
    .filter((g) => g.options.length > 0);

  const daily = routines.filter((r) => (r.frequency ?? "daily") === "daily");
  const dailyRemaining = daily.filter((r) => !r.done).length;
  const dailyDone = daily.length > 0 && dailyRemaining === 0;
  const visible = profile?.dashboard_hub_sections ?? HUB_SECTION_KEYS;

  return (
    <div className="page section active">
      <PageHead title="Journal de quêtes" sub="Toutes tes tâches et quêtes réunies : du jour, récurrentes et spéciales." />

      <DashboardHubSettings initial={visible} />

      {/* ===== Tâches (du jour + autres) ===== */}
      <section className="journal-section">
        <h2 className="journal-section-title">⏱️ Tâches</h2>
        <TasksView initialItems={tasks} initialMode={profile?.tasks_mode ?? "classic"} />
      </section>

      {/* ===== Quêtes récurrentes (quotidiennes / hebdo / mensuelles) ===== */}
      <section className="journal-section">
        <h2 className="journal-section-title">🔁 Quêtes récurrentes</h2>

        <RoutineReminder
          enabled={profile?.pref_notif ?? false}
          deadline={profile?.routine_deadline ?? "21:00"}
          dailyDone={dailyDone}
          remaining={dailyRemaining}
        />

        <ChecklistManager
          resource="routines"
          initialItems={routines}
          withCategory
          withDescription
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
      </section>

      {/* ===== Quêtes spéciales ===== */}
      <section className="journal-section">
        <h2 className="journal-section-title">⚔️ Quêtes spéciales</h2>
        <ChecklistManager
          resource="quests"
          initialItems={quests}
          withCategory
          reorderable
          emptyIcon="⚔️"
          emptyText="Aucune quête. Lance ton premier défi."
          addLabel="Ajouter la quête"
        />
      </section>
    </div>
  );
}
