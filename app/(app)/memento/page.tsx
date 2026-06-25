import { getCurrentUser } from "@/lib/supabase/server";
import { mementosService } from "@/server/mementos/mementos.service";
import { PageHead } from "@/components/ui/page-head";
import { ChecklistManager } from "@/components/features/checklist-manager";
import { MementoCountdown } from "@/components/features/memento-countdown";
import type { Memento } from "@/types";

export default async function MementoPage() {
  const user = await getCurrentUser();
  const items = (await mementosService.list(user!.id)) as Memento[];

  // Items with a deadline → countdown section; the rest → principles list.
  const deadlines = items.filter((m) => m.expires_at);
  const principles = items.filter((m) => !m.expires_at);

  return (
    <div className="page section active">
      <PageHead title="Memento" sub="Tes échéances, tes rappels et principes à garder en tête." />

      <MementoCountdown initialItems={deadlines} />

      <div className="card-head" style={{ marginBottom: 8 }}>
        <div>
          <h2 className="card-title">📝 Principes</h2>
          <p className="card-sub">Ce que tu veux garder en tête.</p>
        </div>
      </div>
      <ChecklistManager
        resource="mementos"
        initialItems={principles}
        togglable={false}
        reorderable
        emptyIcon="📝"
        emptyText="Aucun memento. Note un principe important."
        addLabel="Ajouter"
      />
    </div>
  );
}
