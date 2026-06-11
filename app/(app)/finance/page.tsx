import { getCurrentUser } from "@/lib/supabase/server";
import { financeEntriesService } from "@/server/finance_entries/finance_entries.service";
import { PageHead } from "@/components/ui/page-head";
import { FinanceManager } from "@/components/features/finance-manager";

export default async function BudgetPage() {
  const user = await getCurrentUser();
  const entries = await financeEntriesService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Budget" sub="Tes revenus, tes dépenses ponctuelles et récurrentes, et ton résultat du mois." />
      <FinanceManager initialEntries={entries} />
    </div>
  );
}
