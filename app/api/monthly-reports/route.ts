import type { NextRequest } from "next/server";
import { ok, fail, requireUser, parseBody } from "@/server/shared/api";
import { monthlyReportsService } from "@/server/monthly_reports/monthly_reports.service";
import { upsertMonthlyReportSchema } from "@/server/monthly_reports/monthly_reports.validation";

/** GET — the user's monthly reports (history), most recent month first. */
export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;
  try {
    return ok(await monthlyReportsService.list(user.id));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erreur serveur.", 500);
  }
}

/** PUT — upsert the report for a given month ({ month, review_notes?, next_goals? }). */
export async function PUT(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, upsertMonthlyReportSchema);
  if (parsed.response) return parsed.response;
  try {
    return ok(await monthlyReportsService.upsert(user.id, parsed.data));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erreur serveur.", 500);
  }
}
