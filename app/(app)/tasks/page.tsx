import { getCurrentUser } from "@/lib/supabase/server";
import { tasksService } from "@/server/tasks/tasks.service";
import { PageHead } from "@/components/ui/page-head";
import { ChecklistManager } from "@/components/features/checklist-manager";

export default async function TasksPage() {
  const user = await getCurrentUser();
  const items = await tasksService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Tâches" sub="Tes tâches du jour et tes autres tâches à accomplir." />
      <ChecklistManager
        resource="tasks"
        initialItems={items}
        withMinutes
        reorderable
        groups={{
          field: "scope",
          layout: "sections",
          tabs: [
            { value: "today", label: "🗓️ Du jour" },
            { value: "other", label: "📋 Autres" },
          ],
        }}
        emptyIcon="⏱️"
        emptyText="Aucune tâche ici. Ajoute la première."
        addLabel="Ajouter"
      />
    </div>
  );
}
