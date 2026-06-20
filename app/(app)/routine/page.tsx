import { getCurrentUser } from "@/lib/supabase/server";
import { routinesService } from "@/server/routines/routines.service";
import { userService } from "@/server/users/user.service";
import { PageHead } from "@/components/ui/page-head";
import { ChecklistManager } from "@/components/features/checklist-manager";
import { RoutineReminder } from "@/components/features/routine-reminder";

export default async function RoutinePage() {
  const user = await getCurrentUser();
  const [items, profile] = await Promise.all([
    routinesService.list(user!.id),
    userService.getProfile(user!.id),
  ]);

  const daily = items.filter((r) => (r.frequency ?? "daily") === "daily");
  const dailyRemaining = daily.filter((r) => !r.done).length;
  const dailyDone = daily.length > 0 && dailyRemaining === 0;
  const streak = profile?.routine_streak_count ?? 0;

  return (
    <div className="page section active">
      <PageHead title="Routine" sub="Tes habitudes récurrentes : quotidiennes, hebdomadaires et mensuelles." />

      {/* ===== Série de routine ===== */}
      <div className="card routine-streak-card" style={{ marginBottom: 16 }}>
        <div className="streak-flame">{streak > 0 ? "🔥" : "🫥"}</div>
        <div style={{ flex: 1 }}>
          <div className="streak-count">
            {streak} jour{streak > 1 ? "s" : ""} de série
          </div>
          <p className="card-sub" style={{ margin: "2px 0 0" }}>
            {dailyDone
              ? "Routine du jour bouclée — série assurée pour aujourd’hui. 💪"
              : daily.length === 0
                ? "Ajoute des habitudes quotidiennes pour démarrer ta série."
                : `Termine tes ${dailyRemaining} habitude${dailyRemaining > 1 ? "s" : ""} quotidienne${dailyRemaining > 1 ? "s" : ""} restante${dailyRemaining > 1 ? "s" : ""} pour la garder en vie.`}
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
        withMinutes
        withCategory
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
