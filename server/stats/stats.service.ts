// server/stats/stats.service.ts
import { createClient } from "@/lib/supabase/server";
import { statsRepository as repo } from "./stats.repository";
import type { CreateStatInput, UpdateStatInput } from "./stats.validation";
import type { Stat } from "@/types";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || `stat_${Date.now().toString(36)}`
  );
}

export const statsService = {
  list: (userId: string): Promise<Stat[]> => repo.list(userId),

  async createCustom(userId: string, input: CreateStatInput): Promise<Stat> {
    // Ensure a unique key for this user.
    const existing = await repo.list(userId);
    const base = slugify(input.name);
    let key = base;
    let i = 1;
    const taken = new Set(existing.map((s) => s.key));
    while (taken.has(key)) key = `${base}_${i++}`;

    return repo.create(userId, {
      key,
      name: input.name,
      value: input.value ?? 50,
      is_custom: true,
      category: input.category ?? "personnel",
    });
  },

  update: (userId: string, id: string, patch: UpdateStatInput) =>
    repo.update(userId, id, patch),

  /** Only custom stats may be deleted (defaults are protected). */
  async removeCustom(userId: string, id: string): Promise<boolean> {
    const stat = await repo.getById(userId, id);
    if (!stat) return false;
    if (!stat.is_custom) {
      throw new Error("Les statistiques par défaut ne peuvent pas être supprimées.");
    }
    return repo.remove(userId, id);
  },

  /**
   * Applies a deltas map to the user's stats, clamping each to [0, 100].
   * Used by the actions service. Done in a single read + per-row update.
   */
  async applyDeltas(userId: string, deltas: Record<string, number>): Promise<Stat[]> {
    const supabase = await createClient();
    const current = await repo.list(userId);
    const updates = current
      .filter((s) => deltas[s.key] !== undefined && deltas[s.key] !== 0)
      .map((s) => ({
        id: s.id,
        value: Math.max(0, Math.min(100, s.value + (deltas[s.key] ?? 0))),
      }));

    for (const u of updates) {
      const { error } = await supabase
        .from("stats")
        .update({ value: u.value })
        .eq("user_id", userId)
        .eq("id", u.id);
      if (error) throw error;
    }
    return repo.list(userId);
  },
};
