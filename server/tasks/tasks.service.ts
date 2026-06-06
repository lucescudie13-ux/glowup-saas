// server/tasks/tasks.service.ts
import { tasksRepository as repo } from "./tasks.repository";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.validation";

export const tasksService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateTaskInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateTaskInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
