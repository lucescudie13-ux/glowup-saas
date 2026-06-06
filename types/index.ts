// types/index.ts
import type { Tables } from "./database.types";

export type Profile = Tables<"profiles">;
export type Stat = Tables<"stats">;
export type Action = Tables<"actions">;
export type Quest = Tables<"quests">;
export type Routine = Tables<"routines">;
export type Task = Tables<"tasks">;
export type Objective = Tables<"objectives">;
export type Project = Tables<"projects">;
export type FinanceEntry = Tables<"finance_entries">;
export type FinancialGoal = Tables<"financial_goals">;
export type NutritionGoals = Tables<"nutrition_goals">;
export type Food = Tables<"foods">;
export type Workout = Tables<"workouts">;
export type Danger = Tables<"dangers">;
export type Memento = Tables<"mementos">;

export type ObjectivePeriod = "monthly" | "yearly";
export type FinanceType = "income" | "expense";
export type WorkoutType = "strength" | "run" | "boxing";

/** deltas map: { statKey: number } */
export type Deltas = Record<string, number>;

/** Workout `data` shapes (stored as jsonb). */
export interface StrengthData {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  rest: number;
}
export interface RunData {
  distance: number;
  seconds: number;
  note: string;
}
export interface BoxingData {
  minutes: number;
  type: string;
  intensity: number;
  note: string;
}

/** Standard JSON API envelope returned by every route. */
export type ApiOk<T> = { data: T };
export type ApiErr = { error: string; details?: unknown };
