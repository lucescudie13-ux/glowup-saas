// server/objectives/objectives.service.ts
import { objectivesRepository as repo } from "./objectives.repository";
import type { CreateObjectiveInput, UpdateObjectiveInput } from "./objectives.validation";
import type { Objective, ObjectivePeriod } from "@/types";

export const objectivesService = {
  list: (userId: string, period?: ObjectivePeriod): Promise<Objective[]> =>
    repo.list(userId, period ? { period } : {}),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateObjectiveInput) =>
    repo.create(userId, {
      period: input.period,
      name: input.name,
      actions: input.actions,
      details: { actions: input.actions, details: "" },
    }),
  update: (userId: string, id: string, patch: UpdateObjectiveInput) =>
    repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
