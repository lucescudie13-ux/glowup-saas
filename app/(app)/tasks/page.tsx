import { getCurrentUser } from "@/lib/supabase/server";
import { tasksService } from "@/server/tasks/tasks.service";
import { PageHead } from "@/components/ui/page-head";
import { ChecklistManager } from "@/components/features/checklist-manager";

export default async function TasksPage() {
  const user = await getCurrentUser();
  const items = await tasksService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Tâches du jour" sub="Ce que tu veux accomplir aujourd’hui." />
      <ChecklistManager
        resource="tasks"
        initialItems={items}
        withMinutes
        reorderable
        emptyIcon="⏱️"
        emptyText="Aucune tâche. Ajoute la première."
        addLabel="Ajouter"
      />
    </div>
  );
}
