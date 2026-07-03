// server/monthly_reports/monthly_reports.service.ts
import { monthlyReportsRepository as repo } from "./monthly_reports.repository";
import type { UpsertMonthlyReportInput } from "./monthly_reports.validation";

export const monthlyReportsService = {
  list: (userId: string) => repo.list(userId),
  getByMonth: (userId: string, month: string) => repo.getByMonth(userId, month),

  upsert(userId: string, input: UpsertMonthlyReportInput) {
    const { month, ...patch } = input;
    return repo.upsert(userId, month, patch);
  },
};
