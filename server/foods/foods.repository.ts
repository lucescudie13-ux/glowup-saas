// server/foods/foods.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const foodsRepository = createCrudRepository("foods", { ascending: false });
