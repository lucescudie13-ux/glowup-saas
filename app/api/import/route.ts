// app/api/import/route.ts
import type { NextRequest } from "next/server";
import { ok, fail, requireUser } from "@/server/shared/api";
import { importUserData } from "@/server/shared/import.service";

/**
 * Restores data from an export produced by GET /api/export.
 * Non-destructive: list rows are appended with fresh ids, singletons
 * (profile, nutrition goals) and stats are upserted. Ownership is always
 * re-stamped server-side, and only allowlisted columns are written, so the
 * file can never set user_id or inject arbitrary fields.
 */
export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail("JSON invalide.", 400);
  }
  if (typeof payload !== "object" || payload === null) {
    return fail("Format d'import invalide.", 422);
  }

  try {
    const summary = await importUserData(user.id, payload as Record<string, unknown>);
    return ok({ imported: true, summary });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Échec de l'import.", 500);
  }
}
