import { itemRoutes } from "@/server/shared/route-factory";
import { reflectionsService } from "@/server/reflections/reflections.service";
import { createReflectionSchema, updateReflectionSchema } from "@/server/reflections/reflections.validation";

const handlers = itemRoutes(reflectionsService, { create: createReflectionSchema, update: updateReflectionSchema });
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
