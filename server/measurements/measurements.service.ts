// server/measurements/measurements.service.ts
import { measurementsRepository as repo } from "./measurements.repository";
import type { CreateMeasurementInput, UpdateMeasurementInput } from "./measurements.validation";

export const measurementsService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateMeasurementInput) => repo.create(userId, input),
  update: (userId: string, id: string, patch: UpdateMeasurementInput) => repo.update(userId, id, patch),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
