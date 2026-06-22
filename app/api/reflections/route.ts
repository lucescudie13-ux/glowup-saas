import { collectionRoutes } from "@/server/shared/route-factory";
import { reflectionsService } from "@/server/reflections/reflections.service";
import { createReflectionSchema, updateReflectionSchema } from "@/server/reflections/reflections.validation";

const handlers = collectionRoutes(reflectionsService, { create: createReflectionSchema, update: updateReflectionSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
