import { getCurrentUser } from "@/lib/supabase/server";
import { financeEntriesService } from "@/server/finance_entries/finance_entries.service";
import { PageHead } from "@/components/ui/page-head";
import { FinanceManager } from "@/components/features/finance-manager";
import { BudgetForecast } from "@/components/features/budget-forecast";

export default async function BudgetPage() {
  const user = await getCurrentUser();
  const entries = await financeEntriesService.list(user!.id);

  const planned = entries.filter((e) => e.planned);
  // Net recurring monthly outflow (expenses − income) — drives the forecast.
  const recurring = entries.filter((e) => e.recurring && !e.planned);
  const recurringMonthly =
    recurring.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0) -
    recurring.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="page section active">
      <PageHead title="Budget" sub="Tes revenus et dépenses récurrents, et ton résultat mensuel." />
      <FinanceManager initialEntries={entries} />
      <BudgetForecast initialPlanned={planned} recurringMonthly={recurringMonthly} />
    </div>
  );
}
