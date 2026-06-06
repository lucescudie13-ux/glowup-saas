// server/foods/foods.service.ts
import { foodsRepository as repo } from "./foods.repository";
import type { CreateFoodInput, UpdateFoodInput } from "./foods.validation";
import type { Food } from "@/types";

export const foodsService = {
  list: (userId: string, date?: string): Promise<Food[]> =>
    repo.list(userId, date ? { food_date: date } : {}),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateFoodInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateFoodInput) =>
    repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
