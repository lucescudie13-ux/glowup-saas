// server/routines/routines.service.ts
import { routinesRepository as repo } from "./routines.repository";
import type { CreateRoutineInput, UpdateRoutineInput } from "./routines.validation";

export const routinesService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateRoutineInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateRoutineInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
