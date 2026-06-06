import { collectionRoutes } from "@/server/shared/route-factory";
import { routinesService } from "@/server/routines/routines.service";
import { createRoutineSchema, updateRoutineSchema } from "@/server/routines/routines.validation";

const handlers = collectionRoutes(routinesService, { create: createRoutineSchema, update: updateRoutineSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
