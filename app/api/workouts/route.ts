import type { NextRequest } from "next/server";
import { ok, created, requireUser, parseBody } from "@/server/shared/api";
import { workoutsService } from "@/server/workouts/workouts.service";
import { createWorkoutSchema, workoutTypeSchema } from "@/server/workouts/workouts.validation";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const typeParam = request.nextUrl.searchParams.get("type");
  const type = typeParam ? workoutTypeSchema.safeParse(typeParam) : null;
  return ok(await workoutsService.list(user.id, type?.success ? type.data : undefined));
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, createWorkoutSchema);
  if (parsed.response) return parsed.response;
  return created(await workoutsService.create(user.id, parsed.data));
}
