// server/quests/quests.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const questsRepository = createCrudRepository("quests", { orderBy: "position", ascending: true });
