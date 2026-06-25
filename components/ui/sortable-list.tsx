"use client";

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

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "flex-start", gap: 8 }}>
      <button
        type="button"
        className="task-grip"
        aria-label="Glisser pour réordonner"
        title="Glisser pour réordonner"
        style={{ touchAction: "none", marginTop: 6, flexShrink: 0 }}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

/**
 * Generic drag-to-reorder list (mouse + touch + keyboard). Renders each item
 * via the `children` render-prop, wrapped in a draggable row with a grip handle.
 * Calls `onReorder` with the fully reordered array on drop.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  gap = 12,
  children,
}: {
  items: T[];
  onReorder: (ordered: T[]) => void;
  gap?: number;
  children: (item: T) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "grid", gap }}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>{children(item)}</SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
