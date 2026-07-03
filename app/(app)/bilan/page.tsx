import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui/page-head";
import { MonthlyReport } from "@/components/features/monthly-report";
import { todayISO, monthLabel, prevMonthKey } from "@/lib/utils";
import type { MonthlyReport as MonthlyReportRow, Objective } from "@/types";

export default async function BilanPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const uid = user!.id;

  // We review the month that just ended (prompted from the 1st of the new month).
  const reviewMonth = prevMonthKey(todayISO().slice(0, 7));

  const [monthly, yearly, reports] = await Promise.all([
    supabase.from("objectives").select("*").eq("user_id", uid).eq("period", "monthly"),
    supabase.from("objectives").select("*").eq("user_id", uid).eq("period", "yearly"),
    supabase.from("monthly_reports").select("*").eq("user_id", uid).order("month", { ascending: false }),
  ]);

  const monthlyRows = (monthly.data ?? []) as Objective[];
  const yearlyRows = (yearly.data ?? []) as Objective[];
  const reportRows = (reports.data ?? []) as MonthlyReportRow[];

  const currentReport = reportRows.find((r) => r.month === reviewMonth) ?? null;
  const history = reportRows
    .filter((r) => r.month !== reviewMonth)
    .map((r) => ({ month: r.month, label: monthLabel(r.month), review_notes: r.review_notes, next_goals: r.next_goals }));

  return (
    <div className="page section active">
      <PageHead title="Bilan mensuel" sub="Ton throwback de fin de mois : ce que tu as accompli, et ce que tu vises ensuite." />
      <MonthlyReport
        month={reviewMonth}
        monthLabel={monthLabel(reviewMonth)}
        report={currentReport ? { month: currentReport.month, review_notes: currentReport.review_notes, next_goals: currentReport.next_goals } : null}
        monthlyObjectives={monthlyRows}
        yearlyObjectives={yearlyRows}
        history={history}
        collapsible={false}
      />
    </div>
  );
}
