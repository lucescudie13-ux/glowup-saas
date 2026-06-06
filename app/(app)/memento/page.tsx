import { getCurrentUser } from "@/lib/supabase/server";
import { mementosService } from "@/server/mementos/mementos.service";
import { PageHead } from "@/components/ui/page-head";
import { ChecklistManager } from "@/components/features/checklist-manager";

export default async function MementoPage() {
  const user = await getCurrentUser();
  const items = await mementosService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Memento" sub="Tes rappels et principes à garder en tête." />
      <ChecklistManager
        resource="mementos"
        initialItems={items}
        togglable={false}
        emptyIcon="📝"
        emptyText="Aucun memento. Note un principe important."
        addLabel="Ajouter"
      />
    </div>
  );
}
