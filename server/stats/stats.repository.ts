// server/stats/stats.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const statsRepository = createCrudRepository("stats", { ascending: true });
