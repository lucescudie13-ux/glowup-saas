import { itemRoutes } from "@/server/shared/route-factory";
import { sleepService } from "@/server/sleep/sleep.service";
import { createSleepSchema, updateSleepSchema } from "@/server/sleep/sleep.validation";

const handlers = itemRoutes(sleepService, { create: createSleepSchema, update: updateSleepSchema });
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
