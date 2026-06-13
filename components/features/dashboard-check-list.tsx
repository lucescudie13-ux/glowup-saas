"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

interface Item {
  id: string;
  name: string;
  done?: boolean;
  minutes?: number;
  category?: string;
  position?: number;
}

/**
 * Read-light checklist for the dashboard: tick items (tasks / routines /
 * quests) and drag to reorder them — without leaving the overview. Both are
 * optimistic and refresh the page so progress bars/KPIs stay in sync.
 */
export function DashboardCheckList({
  resource,
  items: initial,
  withMinutes = false,
}: {
  resource: "tasks" | "routines" | "quests";
  items: Item[];
  withMinutes?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function toggle(item: Item) {
    const next = !item.done;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: next } : i)));
    try {
      await api.patch(`/api/${resource}/${item.id}`, { done: next });
      router.refresh();
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !next } : i)));
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const current = itemsRef.current;
    const from = current.findIndex((i) => i.id === active.id);
    const to = current.findIndex((i) => i.id === over.id);
    if (from === -1 || to === -1) return;
    const newOrder = arrayMove(current, from, to);
    setItems(newOrder.map((it, idx) => ({ ...it, position: idx })));
    const changed = newOrder
      .map((it, idx) => ({ it, idx }))
      .filter(({ it, idx }) => (it.position ?? 0) !== idx);
    try {
      await Promise.all(changed.map(({ it, idx }) => api.patch(`/api/${resource}/${it.id}`, { position: idx })));
      router.refresh();
    } catch {
      /* leave optimistic order; next refresh reconciles */
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="checklist">
          {items.map((item) => (
            <DashRow key={item.id} item={item} withMinutes={withMinutes} onToggle={toggle} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function DashRow({ item, withMinutes, onToggle }: { item: Item; withMinutes: boolean; onToggle: (i: Item) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 5 : undefined };
  return (
    <li ref={setNodeRef} style={style} className={`task-item${item.done ? " is-done" : ""}${isDragging ? " is-dragging" : ""}`}>
      <button type="button" className="task-grip" aria-label="Glisser pour réordonner" title="Glisser pour réordonner" {...attributes} {...listeners}>
        ⠿
      </button>
      <button
        type="button"
        className={`task-check${item.done ? " checked" : ""}`}
        onClick={() => onToggle(item)}
        role="checkbox"
        aria-checked={!!item.done}
        aria-label={item.done ? "Marquer comme non fait" : "Marquer comme fait"}
      >
        ✓
      </button>
      <div className="task-body">
        <span className="task-name">{item.name}</span>
        {((withMinutes && item.minutes) || item.category) && (
          <div className="task-meta">
            {withMinutes && item.minutes ? <span className="task-mins">⏱️ {item.minutes} min</span> : null}
            {item.category ? <span className="cat-tag">{item.category}</span> : null}
          </div>
        )}
      </div>
    </li>
  );
}
