// lib/reorder.ts — persist a new list order by PATCHing each item's position.
import { api } from "@/lib/api-client";

/** Best-effort: writes `position = index` for each item via the resource's PATCH route. */
export function persistPositions<T extends { id: string }>(resource: string, ordered: T[]): Promise<unknown> {
  return Promise.all(
    ordered.map((item, index) => api.patch(`/api/${resource}/${item.id}`, { position: index }).catch(() => {}))
  );
}
