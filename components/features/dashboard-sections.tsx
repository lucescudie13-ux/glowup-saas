"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@/lib/api-client";

export interface DashSection {
  key: string;
  /** Short label shown on the drag handle while reordering. */
  label: string;
  node: React.ReactNode;
}

/**
 * Apply the saved key order. Any section not in the saved order (e.g. a newly
 * shipped block) is inserted at its natural position from the default layout —
 * right after its preceding default sibling, or at the very top if it's first —
 * rather than dumped at the bottom.
 */
function applyOrder(sections: DashSection[], saved: string[]): string[] {
  const present = new Set(sections.map((s) => s.key));
  const result = saved.filter((k) => present.has(k));
  if (result.length === 0) return sections.map((s) => s.key);
  const placed = new Set(result);
  sections.forEach((s, idx) => {
    if (placed.has(s.key)) return;
    let insertAt = 0; // default: front (used when nothing precedes it)
    for (let j = idx - 1; j >= 0; j--) {
      const prev = sections[j];
      const pos = prev ? result.indexOf(prev.key) : -1;
      if (pos !== -1) { insertAt = pos + 1; break; }
    }
    result.splice(insertAt, 0, s.key);
    placed.add(s.key);
  });
  return result;
}

function SortableSection({ id, label, editing, children }: {
  id: string;
  label: string;
  editing: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !editing });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className={`dash-section${editing ? " is-editing" : ""}${isDragging ? " is-dragging" : ""}`}>
      {editing && (
        <button type="button" className="dash-drag" {...attributes} {...listeners} aria-label={`Déplacer : ${label}`} title="Glisser pour déplacer">
          <span aria-hidden>⠿</span> {label}
        </button>
      )}
      {/* Inner interactions are disabled while reordering so drags never trigger a click. */}
      <div style={editing ? { pointerEvents: "none", userSelect: "none" } : undefined}>{children}</div>
    </div>
  );
}

/**
 * Renders the dashboard blocks in the user's saved order and lets them be
 * rearranged by drag-and-drop (mouse + touch + keyboard). A "Réorganiser"
 * toggle reveals a drag handle on each block; the new order is persisted to the
 * user profile so it syncs across devices.
 */
export function DashboardSections({ sections, savedOrder }: { sections: DashSection[]; savedOrder: string[] }) {
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState<string[]>(() => applyOrder(sections, savedOrder));

  // Resolve the current order into renderable sections (skips vanished keys,
  // appends any section not yet in the order — e.g. a block that just appeared).
  const ordered = useMemo(() => {
    const map = new Map(sections.map((s) => [s.key, s]));
    const list = order.map((k) => map.get(k)).filter((s): s is DashSection => Boolean(s));
    const seen = new Set(list.map((s) => s.key));
    for (const s of sections) if (!seen.has(s.key)) list.push(s);
    return list;
  }, [sections, order]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const keys = ordered.map((s) => s.key);
    const from = keys.indexOf(String(active.id));
    const to = keys.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = arrayMove(keys, from, to);
    setOrder(next);
    try {
      await api.patch("/api/user", { dashboard_order: next });
    } catch {
      /* best-effort: the local order already updated; next load reconciles */
    }
  }

  return (
    <>
      <div className="dash-reorder-bar">
        <button
          type="button"
          className={`secondary-btn dash-reorder-toggle${editing ? " active" : ""}`}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "✓ Terminé" : "↕ Réorganiser les blocs"}
        </button>
        {editing && (
          <span className="card-sub dash-reorder-hint">
            Glisse un bloc par sa poignée « Déplacer » pour changer l’ordre. Les actions sont mises en pause le temps du réglage.
          </span>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ordered.map((s) => s.key)} strategy={verticalListSortingStrategy}>
          <div className="dash-sections">
            {ordered.map((s) => (
              <SortableSection key={s.key} id={s.key} label={s.label} editing={editing}>
                {s.node}
              </SortableSection>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
