// server/finance_entries/finance_entries.service.ts
import { finance_entriesRepository as repo } from "./finance_entries.repository";
import type { CreateFinanceEntryInput, UpdateFinanceEntryInput } from "./finance_entries.validation";
import type { FinanceEntry, FinanceType } from "@/types";

export const financeEntriesService = {
  list: (userId: string, type?: FinanceType): Promise<FinanceEntry[]> =>
    repo.list(userId, type ? { type } : {}),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateFinanceEntryInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateFinanceEntryInput) =>
    repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
