// server/quests/quests.service.ts
import { questsRepository as repo } from "./quests.repository";
import type { CreateQuestInput, UpdateQuestInput } from "./quests.validation";

export const questsService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateQuestInput) => repo.create(userId, input),

  update: (userId: string, id: string, patch: UpdateQuestInput) => {
    // Stamp the completion moment (server-owned) so the task stats can count
    // quests "faites cette semaine / ce mois / cette année". Clear it when the
    // quest is un-checked.
    const data: Record<string, unknown> = { ...patch };
    if (patch.done === true) data.completed_at = new Date().toISOString();
    else if (patch.done === false) data.completed_at = null;
    return repo.update(userId, id, data);
  },

  remove: (userId: string, id: string) => repo.remove(userId, id),
};
