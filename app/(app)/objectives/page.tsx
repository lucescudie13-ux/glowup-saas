import { getCurrentUser } from "@/lib/supabase/server";
import { objectivesService } from "@/server/objectives/objectives.service";
import { PageHead } from "@/components/ui/page-head";
import { ObjectivesManager } from "@/components/features/objectives-manager";

export default async function ObjectivesPage() {
  const user = await getCurrentUser();
  const items = await objectivesService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Objectifs" sub="Tes objectifs du mois et de l’année." />
      <ObjectivesManager initialItems={items} />
    </div>
  );
}
