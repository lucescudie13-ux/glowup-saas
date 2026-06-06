import { itemRoutes } from "@/server/shared/route-factory";
import { objectivesService } from "@/server/objectives/objectives.service";
import { createObjectiveSchema, updateObjectiveSchema } from "@/server/objectives/objectives.validation";

const handlers = itemRoutes(objectivesService, { create: createObjectiveSchema, update: updateObjectiveSchema });
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
