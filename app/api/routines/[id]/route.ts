import { itemRoutes } from "@/server/shared/route-factory";
import { routinesService } from "@/server/routines/routines.service";
import { createRoutineSchema, updateRoutineSchema } from "@/server/routines/routines.validation";

const handlers = itemRoutes(routinesService, { create: createRoutineSchema, update: updateRoutineSchema });
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
