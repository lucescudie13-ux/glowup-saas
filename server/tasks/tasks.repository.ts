// server/tasks/tasks.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const tasksRepository = createCrudRepository("tasks", { orderBy: "position", ascending: true });
