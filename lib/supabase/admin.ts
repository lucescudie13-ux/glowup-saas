import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Admin client using the SERVICE ROLE key. Bypasses RLS — use sparingly and
 * NEVER import this from a Client Component. The `server-only` import above
 * makes the bundler fail loudly if that ever happens.
 *
 * Typical use: privileged maintenance, webhooks, or trusted server jobs.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
