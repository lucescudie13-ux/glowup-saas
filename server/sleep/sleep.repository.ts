// server/sleep/sleep.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

// Most recent nights first.
export const sleepRepository = createCrudRepository("sleep_entries", {
  orderBy: "sleep_date",
  ascending: false,
});
