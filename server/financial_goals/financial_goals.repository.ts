// server/financial_goals/financial_goals.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const financial_goalsRepository = createCrudRepository("financial_goals", { ascending: false });
