// server/projects/projects.service.ts
import { projectsRepository as repo } from "./projects.repository";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.validation";

export const projectsService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateProjectInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateProjectInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
