// server/quests/quests.service.ts
import { questsRepository as repo } from "./quests.repository";
import type { CreateQuestInput, UpdateQuestInput } from "./quests.validation";

export const questsService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateQuestInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateQuestInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
