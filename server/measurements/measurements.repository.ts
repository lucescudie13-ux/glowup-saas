// server/measurements/measurements.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const measurementsRepository = createCrudRepository("measurements", {
  orderBy: "measure_date",
  ascending: true,
});
