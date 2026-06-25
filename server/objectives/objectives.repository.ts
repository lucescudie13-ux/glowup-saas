// server/objectives/objectives.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const objectivesRepository = createCrudRepository("objectives", { orderBy: "position", ascending: true });
