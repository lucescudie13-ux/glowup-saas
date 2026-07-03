import { getCurrentUser } from "@/lib/supabase/server";
import { financeEntriesService } from "@/server/finance_entries/finance_entries.service";
import { financialGoalsService } from "@/server/financial_goals/financial_goals.service";
import { PageHead } from "@/components/ui/page-head";
import { FinanceManager } from "@/components/features/finance-manager";
import { FinancialGoalsManager } from "@/components/features/financial-goals-manager";
import { BudgetForecast } from "@/components/features/budget-forecast";
import { monthlySavingNeeded } from "@/lib/utils";
import type { FinancialGoal } from "@/types";

export default async function FinancesPage() {
  const user = await getCurrentUser();
  const [entries, goalsRaw] = await Promise.all([
    financeEntriesService.list(user!.id),
    financialGoalsService.list(user!.id),
  ]);
  const goals = goalsRaw as FinancialGoal[];

  // Only real GOALS (things you want to buy — not mandatory) with a deadline
  // feed the "after savings" monthly result. Obligations are excluded.
  const goalsMonthlyNeed = goals
    .filter((g) => (g.kind ?? "goal") === "goal")
    .reduce((s, g) => s + monthlySavingNeeded(Math.max(0, Number(g.target) - Number(g.saved)), g.deadline), 0);

  const planned = entries.filter((e) => e.planned);
  // Net recurring monthly outflow (expenses − income) — drives the forecast.
  const recurring = entries.filter((e) => e.recurring && !e.planned);
  const recurringMonthly =
    recurring.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0) -
    recurring.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="page section active">
      <PageHead title="Finances" sub="Ton budget mensuel, tes obligations à payer et tes objectifs d’épargne." />
      <FinanceManager initialEntries={entries} goalsMonthlyNeed={goalsMonthlyNeed} />
      <FinancialGoalsManager initialGoals={goals} />
      <BudgetForecast initialPlanned={planned} recurringMonthly={recurringMonthly} />
    </div>
  );
}
