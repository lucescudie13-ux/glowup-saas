import { itemRoutes } from "@/server/shared/route-factory";
import { financeEntriesService } from "@/server/finance_entries/finance_entries.service";
import { createFinanceEntrySchema, updateFinanceEntrySchema } from "@/server/finance_entries/finance_entries.validation";

const handlers = itemRoutes(financeEntriesService, { create: createFinanceEntrySchema, update: updateFinanceEntrySchema });
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
