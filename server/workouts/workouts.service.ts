// server/workouts/workouts.service.ts
import { workoutsRepository as repo } from "./workouts.repository";
import type { CreateWorkoutInput } from "./workouts.validation";
import type { Workout, WorkoutType } from "@/types";

export const workoutsService = {
  list: (userId: string, type?: WorkoutType): Promise<Workout[]> =>
    repo.list(userId, type ? { type } : {}),
  create: (userId: string, input: CreateWorkoutInput) =>
    repo.create(userId, {
      type: input.type,
      workout_date: input.workout_date,
      data: input.data,
    }),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
