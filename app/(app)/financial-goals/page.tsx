import { getCurrentUser } from "@/lib/supabase/server";
import { financialGoalsService } from "@/server/financial_goals/financial_goals.service";
import { PageHead } from "@/components/ui/page-head";
import { FinancialGoalsManager } from "@/components/features/financial-goals-manager";

export default async function FinancialGoalsPage() {
  const user = await getCurrentUser();
  const goals = await financialGoalsService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Objectifs financiers" sub="Tes objectifs d’épargne et ta progression." />
      <FinancialGoalsManager initialGoals={goals} />
    </div>
  );
}
