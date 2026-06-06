import { getCurrentUser } from "@/lib/supabase/server";
import { financeEntriesService } from "@/server/finance_entries/finance_entries.service";
import { financialGoalsService } from "@/server/financial_goals/financial_goals.service";
import { PageHead } from "@/components/ui/page-head";
import { FinanceManager } from "@/components/features/finance-manager";

export default async function FinancePage() {
  const user = await getCurrentUser();
  const [entries, goals] = await Promise.all([
    financeEntriesService.list(user!.id),
    financialGoalsService.list(user!.id),
  ]);
  return (
    <div className="page section active">
      <PageHead title="Finance" sub="Tes revenus, dépenses et objectifs d’épargne." />
      <FinanceManager initialEntries={entries} initialGoals={goals} />
    </div>
  );
}
