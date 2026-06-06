// server/tasks/tasks.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const tasksRepository = createCrudRepository("tasks", { ascending: true });
