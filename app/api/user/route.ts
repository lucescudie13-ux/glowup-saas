import type { NextRequest } from "next/server";
import { ok, fail, requireUser, parseBody } from "@/server/shared/api";
import { userService } from "@/server/users/user.service";
import { updateProfileSchema } from "@/server/users/user.validation";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;
  const profile = await userService.getProfile(user.id);
  return profile ? ok(profile) : fail("Profil introuvable.", 404);
}

export async function PATCH(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, updateProfileSchema);
  if (parsed.response) return parsed.response;
  const profile = await userService.updateProfile(user.id, parsed.data);
  return profile ? ok(profile) : fail("Profil introuvable.", 404);
}
