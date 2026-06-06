// server/dangers/dangers.service.ts
import { dangersRepository as repo } from "./dangers.repository";
import type { CreateDangerInput, UpdateDangerInput } from "./dangers.validation";

export const dangersService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateDangerInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateDangerInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
