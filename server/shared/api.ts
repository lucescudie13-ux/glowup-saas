// server/shared/api.ts
import { NextResponse } from "next/server";
import { ZodError, type ZodType, type ZodTypeDef } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ data }, { status: init ?? 200 });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * Resolves the authenticated user from the session (never from client input).
 * Returns either { user } or a 401 response to short-circuit the handler.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: fail("Non authentifié.", 401) };
  }
  return { user, response: null };
}

/** Parses + validates a request body with Zod, returning data or a 400. */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T, ZodTypeDef, unknown>
): Promise<{ data: T; response: null } | { data: null; response: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { data: null, response: fail("Corps de requête invalide (JSON attendu).", 400) };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      data: null,
      response: fail("Validation échouée.", 422, flattenZod(result.error)),
    };
  }
  return { data: result.data, response: null };
}

function flattenZod(error: ZodError) {
  return error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}
