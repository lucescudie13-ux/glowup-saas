// server/progress-photos/progress-photos.service.ts
import { progressPhotosRepository as repo } from "./progress-photos.repository";
import type { CreateProgressPhotoInput, UpdateProgressPhotoInput } from "./progress-photos.validation";

export const progressPhotosService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateProgressPhotoInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateProgressPhotoInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
