import { getCurrentUser } from "@/lib/supabase/server";
import { actionsService } from "@/server/actions/actions.service";
import { PageHead } from "@/components/ui/page-head";
import { HistoryList } from "@/components/features/history-list";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  const items = await actionsService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Historique" sub="Toutes les actions enregistrées et leurs effets." />
      <HistoryList initialItems={items} />
    </div>
  );
}
