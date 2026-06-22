// server/tasks/tasks.service.ts
import { tasksRepository as repo } from "./tasks.repository";
import { todayISO } from "@/lib/utils";
import type { Task } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.validation";

/**
 * Normalises the `done` / `status` / `completed_at` trio so the three modes
 * (classic checkbox, Kanban status) stay coherent:
 * - completing a task (done=true OR status='done') stamps `completed_at` and
 *   forces status='done'.
 * - un-completing clears `completed_at` and resets status to 'todo'.
 * `completed_at` is server-owned (never sent by the client).
 */
function withCompletion(patch: UpdateTaskInput): Record<string, unknown> {
  const next: Record<string, unknown> = { ...patch };
  const completing = patch.done === true || patch.status === "done";
  const uncompleting = patch.done === false || (patch.status !== undefined && patch.status !== "done");

  if (completing) {
    next.done = true;
    next.status = "done";
    next.completed_at = new Date().toISOString();
  } else if (uncompleting) {
    next.done = false;
    if (next.status === undefined) next.status = "todo";
    next.completed_at = null;
  }
  return next;
}

export const tasksService = {
  list: (userId: string) => repo.list(userId),

  /**
   * Tasks shown in the UI: hides tasks completed on a previous day so the
   * board clears itself the day after. The rows stay in the DB (needed for
   * the work-time stat, the weekly recap and history).
   */
  async listVisible(userId: string): Promise<Task[]> {
    const all = (await repo.list(userId)) as Task[];
    const today = todayISO();
    return all.filter(
      (t) => !(t.done && t.completed_at && t.completed_at.slice(0, 10) < today)
    );
  },

  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateTaskInput) => {
    // Adding straight into the Kanban "Fait" column → mark it completed now.
    const values: Record<string, unknown> = { ...input };
    if (input.status === "done") {
      values.done = true;
      values.completed_at = new Date().toISOString();
    }
    return repo.create(userId, values);
  },
  update: (userId: string, id: string, patch: UpdateTaskInput) =>
    repo.update(userId, id, withCompletion(patch)),
  remove: (userId: string, id: string) => repo.remove(userId, id),
};
