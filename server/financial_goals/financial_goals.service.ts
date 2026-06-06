// server/financial_goals/financial_goals.service.ts
import { financial_goalsRepository as repo } from "./financial_goals.repository";
import type { CreateFinancialGoalInput, UpdateFinancialGoalInput } from "./financial_goals.validation";

export const financialGoalsService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateFinancialGoalInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateFinancialGoalInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
