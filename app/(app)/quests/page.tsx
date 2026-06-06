import { getCurrentUser } from "@/lib/supabase/server";
import { questsService } from "@/server/quests/quests.service";
import { PageHead } from "@/components/ui/page-head";
import { ChecklistManager } from "@/components/features/checklist-manager";

export default async function QuestsPage() {
  const user = await getCurrentUser();
  const items = await questsService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Quêtes spéciales" sub="Tes défis ponctuels à accomplir." />
      <ChecklistManager
        resource="quests"
        initialItems={items}
        withCategory
        emptyIcon="⚔️"
        emptyText="Aucune quête. Lance ton premier défi."
        addLabel="Ajouter la quête"
      />
    </div>
  );
}
