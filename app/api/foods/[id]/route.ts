import { itemRoutes } from "@/server/shared/route-factory";
import { foodsService } from "@/server/foods/foods.service";
import { createFoodSchema, updateFoodSchema } from "@/server/foods/foods.validation";

const handlers = itemRoutes(foodsService, { create: createFoodSchema, update: updateFoodSchema });
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
