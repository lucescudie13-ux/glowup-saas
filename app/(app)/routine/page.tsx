import { getCurrentUser } from "@/lib/supabase/server";
import { routinesService } from "@/server/routines/routines.service";
import { PageHead } from "@/components/ui/page-head";
import { ChecklistManager } from "@/components/features/checklist-manager";

export default async function RoutinePage() {
  const user = await getCurrentUser();
  const items = await routinesService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Routine" sub="Tes habitudes récurrentes : quotidiennes, hebdomadaires et mensuelles." />
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
