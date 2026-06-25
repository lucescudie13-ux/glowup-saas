// server/finance_entries/finance_entries.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const finance_entriesRepository = createCrudRepository("finance_entries", { orderBy: "position", ascending: true });
