// server/sleep/sleep.service.ts
import { sleepRepository as repo } from "./sleep.repository";
import type { CreateSleepInput, UpdateSleepInput } from "./sleep.validation";
import type { SleepEntry } from "@/types";

export const sleepService = {
  list: (userId: string): Promise<SleepEntry[]> => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateSleepInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateSleepInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
