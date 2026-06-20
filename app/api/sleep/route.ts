import { collectionRoutes } from "@/server/shared/route-factory";
import { sleepService } from "@/server/sleep/sleep.service";
import { createSleepSchema, updateSleepSchema } from "@/server/sleep/sleep.validation";

const handlers = collectionRoutes(sleepService, { create: createSleepSchema, update: updateSleepSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
