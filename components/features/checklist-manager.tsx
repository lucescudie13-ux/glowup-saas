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
import { EmptyState } from "@/components/ui/empty-state";

interface Item {
  id: string;
  name: string;
  done?: boolean;
  category?: string;
  minutes?: number;
  position?: number;
}

interface RowProps {
  item: Item;
  withMinutes: boolean;
  withCategory: boolean;
  togglable: boolean;
  reorderable: boolean;
  onToggle: (item: Item) => void;
  onRemove: (item: Item) => void;
}

interface ChecklistManagerProps {
  resource: string; // e.g. "quests"
  initialItems: Item[];
  withMinutes?: boolean;
  withCategory?: boolean;
  togglable?: boolean;
  reorderable?: boolean; // enables drag-and-drop ordering (persisted via `position`)
  emptyIcon?: string;
  emptyText?: string;
  addLabel?: string;
}

// Inner row content shared by the static and sortable variants.
function RowInner({ item, withMinutes, withCategory, togglable, onToggle, onRemove }: RowProps) {
  return (
    <>
      {togglable && (
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
      )}
      <div className="task-body">
        <span className="task-name">{item.name}</span>
        {((withMinutes && item.minutes) || (withCategory && item.category)) && (
          <div className="task-meta">
            {withMinutes && item.minutes ? <span className="task-mins">⏱️ {item.minutes} min</span> : null}
            {withCategory && item.category ? <span className="cat-tag">{item.category}</span> : null}
          </div>
        )}
      </div>
      <button type="button" className="task-del" onClick={() => onRemove(item)} aria-label="Supprimer" title="Supprimer">
        ✕
      </button>
    </>
  );
}

// Draggable row: only the grip handle starts a drag, so the rest stays clickable.
function SortableRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
  };
  return (
    <li ref={setNodeRef} style={style} className={`task-item${props.item.done ? " is-done" : ""}${isDragging ? " is-dragging" : ""}`}>
      <button
        type="button"
        className="task-grip"
        aria-label="Glisser pour réordonner"
        title="Glisser pour réordonner"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <RowInner {...props} />
    </li>
  );
}

/**
 * Generic CRUD list bound to /api/<resource>. Powers quests, routine, tasks,
 * mementos, etc. Mutations are optimistic; we router.refresh() afterwards so
 * the dashboard/KPIs stay in sync. When `reorderable`, rows can be dragged
 * (mouse, touch, keyboard) and the new order is saved through `position`.
 */
export function ChecklistManager({
  resource,
  initialItems,
  withMinutes = false,
  withCategory = false,
  togglable = true,
  reorderable = false,
  emptyIcon = "📭",
  emptyText = "Rien pour l’instant. Ajoute ton premier élément.",
  addLabel = "Ajouter",
}: ChecklistManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const sensors = useSensors(
    // Small movement before a mouse drag starts, so clicks still register.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Press-and-hold on touch (Notion-style), without hijacking scrolling.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name };
      if (withMinutes) payload.minutes = Number(minutes || 1);
      if (withCategory && category) payload.category = category;
      if (reorderable) payload.position = items.length; // new items go last
      const created = await api.post<Item>(`/api/${resource}`, payload);
      setItems((prev) => [...prev, created]);
      setName("");
      setMinutes("");
      setCategory("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: Item) {
    const next = !item.done;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: next } : i)));
    setError(null);
    try {
      await api.patch<Item>(`/api/${resource}/${item.id}`, { done: next });
      router.refresh();
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !next } : i)));
      setError(err instanceof Error ? err.message : "Erreur.");
    }
  }

  async function remove(item: Item) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setError(null);
    try {
      await api.del(`/api/${resource}/${item.id}`);
      router.refresh();
    } catch (err) {
      setItems(snapshot);
      setError(err instanceof Error ? err.message : "Erreur.");
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const before = itemsRef.current;
    const from = before.findIndex((i) => i.id === active.id);
    const to = before.findIndex((i) => i.id === over.id);
    if (from === -1 || to === -1) return;
    const reordered = arrayMove(before, from, to);
    setItems(reordered.map((it, idx) => ({ ...it, position: idx })));
    // Persist only the rows whose index changed.
    const changed = reordered
      .map((it, idx) => ({ it, idx }))
      .filter(({ it, idx }) => before[idx]?.id !== it.id);
    try {
      await Promise.all(changed.map(({ it, idx }) => api.patch(`/api/${resource}/${it.id}`, { position: idx })));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du réordonnancement.");
    }
  }

  const rowProps = { withMinutes, withCategory, togglable, reorderable, onToggle: toggle, onRemove: remove };

  return (
    <div className="card">
      <form onSubmit={add} className="checklist-add">
        <input
          className="auth-input"
          style={{ flex: "3 1 220px" }}
          placeholder="Nom…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {withMinutes && (
          <input
            className="auth-input"
            style={{ flex: "0 1 110px" }}
            type="number"
            min={1}
            placeholder="min"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        )}
        {withCategory && (
          <input
            className="auth-input"
            style={{ flex: "1 1 150px" }}
            placeholder="Catégorie"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        )}
        <button className="checklist-submit" type="submit" disabled={busy}>
          {addLabel}
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}
      {reorderable && items.length > 1 && (
        <p className="card-sub" style={{ margin: "0 0 10px" }}>↕ Glisse une ligne par la poignée pour changer l’ordre.</p>
      )}

      {items.length === 0 ? (
        <EmptyState icon={emptyIcon}>{emptyText}</EmptyState>
      ) : reorderable ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="checklist">
              {items.map((item) => (
                <SortableRow key={item.id} item={item} {...rowProps} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="checklist">
          {items.map((item) => (
            <li key={item.id} className={`task-item${item.done ? " is-done" : ""}`}>
              <RowInner item={item} {...rowProps} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
