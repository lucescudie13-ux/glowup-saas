// server/reflections/reflections.service.ts
import { reflectionsRepository as repo } from "./reflections.repository";
import type { CreateReflectionInput, UpdateReflectionInput } from "./reflections.validation";

export const reflectionsService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateReflectionInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateReflectionInput) =>
    repo.update(userId, id, { ...patch, updated_at: new Date().toISOString() }),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
