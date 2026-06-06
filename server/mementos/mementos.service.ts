// server/mementos/mementos.service.ts
import { mementosRepository as repo } from "./mementos.repository";
import type { CreateMementoInput, UpdateMementoInput } from "./mementos.validation";

export const mementosService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateMementoInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateMementoInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
