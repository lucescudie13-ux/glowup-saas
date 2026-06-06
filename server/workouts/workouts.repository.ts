// server/workouts/workouts.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const workoutsRepository = createCrudRepository("workouts", { ascending: false });
