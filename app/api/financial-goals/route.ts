import { collectionRoutes } from "@/server/shared/route-factory";
import { financialGoalsService } from "@/server/financial_goals/financial_goals.service";
import { createFinancialGoalSchema, updateFinancialGoalSchema } from "@/server/financial_goals/financial_goals.validation";

const handlers = collectionRoutes(financialGoalsService, { create: createFinancialGoalSchema, update: updateFinancialGoalSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
