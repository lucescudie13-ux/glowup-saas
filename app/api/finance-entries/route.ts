import type { NextRequest } from "next/server";
import { ok, created, requireUser, parseBody } from "@/server/shared/api";
import { financeEntriesService } from "@/server/finance_entries/finance_entries.service";
import { createFinanceEntrySchema, financeTypeSchema } from "@/server/finance_entries/finance_entries.validation";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const typeParam = request.nextUrl.searchParams.get("type");
  const type = typeParam ? financeTypeSchema.safeParse(typeParam) : null;
  return ok(await financeEntriesService.list(user.id, type?.success ? type.data : undefined));
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, createFinanceEntrySchema);
  if (parsed.response) return parsed.response;
  return created(await financeEntriesService.create(user.id, parsed.data));
}
