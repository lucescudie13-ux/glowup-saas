// server/shared/crud.ts
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type PublicTables = Database["public"]["Tables"];
type OwnedTable = {
  [K in keyof PublicTables]: PublicTables[K]["Row"] extends { user_id: string }
    ? K
    : never;
}[keyof PublicTables];

interface CrudOptions {
  /** Default ordering column (default: created_at) and direction. */
  orderBy?: string;
  ascending?: boolean;
}

/**
 * Supabase's typed query builder cannot infer results when the table name is a
 * generic variable, so for these dynamic-table helpers we operate through a
 * schema-agnostic view of the client and cast results back to the correct Row
 * types. Call sites stay safe because `table` is constrained to OwnedTable and
 * each method's return type is the table's real Row type.
 */
function relaxed(client: SupabaseClient<Database>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

export function createCrudRepository<T extends OwnedTable>(
  table: T,
  options: CrudOptions = {}
) {
  const orderBy = options.orderBy ?? "created_at";
  const ascending = options.ascending ?? false;
  type Row = PublicTables[T]["Row"];

  return {
    async list(userId: string, filters: Record<string, string> = {}): Promise<Row[]> {
      const db = relaxed(await createClient());
      let query = db.from(table).select("*").eq("user_id", userId);
      for (const [k, v] of Object.entries(filters)) query = query.eq(k, v);
      query = query.order(orderBy, { ascending });
      // Stable tiebreaker so equal sort keys keep a deterministic order.
      if (orderBy !== "created_at") query = query.order("created_at", { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },

    async getById(userId: string, id: string): Promise<Row | null> {
      const db = relaxed(await createClient());
      const { data, error } = await db
        .from(table)
        .select("*")
        .eq("user_id", userId)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Row | null;
    },

    async create(userId: string, values: Record<string, unknown>): Promise<Row> {
      const db = relaxed(await createClient());
      const { data, error } = await db
        .from(table)
        // user_id is forced server-side — never taken from the client payload.
        .insert({ ...values, user_id: userId })
        .select("*")
        .single();
      if (error) throw error;
      return data as Row;
    },

    async update(userId: string, id: string, patch: Record<string, unknown>): Promise<Row | null> {
      const db = relaxed(await createClient());
      const { data, error } = await db
        .from(table)
        .update(patch)
        .eq("user_id", userId)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Row | null;
    },

    async remove(userId: string, id: string): Promise<boolean> {
      const db = relaxed(await createClient());
      const { error } = await db.from(table).delete().eq("user_id", userId).eq("id", id);
      if (error) throw error;
      return true;
    },
  };
}

export type CrudRepository<T extends OwnedTable> = ReturnType<typeof createCrudRepository<T>>;
