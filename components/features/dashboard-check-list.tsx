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
 * quests), drag to reorder, and edit/delete them inline — without leaving the
 * overview. All actions are optimistic and refresh so bars/KPIs stay in sync.
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
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

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditMinutes(item.minutes != null ? String(item.minutes) : "");
  }

  async function saveEdit(item: Item) {
    const name = editName.trim() || item.name;
    const patch: Record<string, unknown> = { name };
    if (withMinutes) patch.minutes = Number(editMinutes || 0);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i))); // optimistic
    setEditingId(null);
    try {
      await api.patch(`/api/${resource}/${item.id}`, patch);
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  async function remove(item: Item) {
    const snapshot = itemsRef.current;
    setItems((prev) => prev.filter((i) => i.id !== item.id)); // optimistic
    try {
      await api.del(`/api/${resource}/${item.id}`);
      router.refresh();
    } catch {
      setItems(snapshot);
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
            <DashRow
              key={item.id}
              item={item}
              withMinutes={withMinutes}
              editing={editingId === item.id}
              editName={editName}
              editMinutes={editMinutes}
              setEditName={setEditName}
              setEditMinutes={setEditMinutes}
              onToggle={toggle}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingId(null)}
              onRemove={remove}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

interface RowProps {
  item: Item;
  withMinutes: boolean;
  editing: boolean;
  editName: string;
  editMinutes: string;
  setEditName: (v: string) => void;
  setEditMinutes: (v: string) => void;
  onToggle: (i: Item) => void;
  onStartEdit: (i: Item) => void;
  onSaveEdit: (i: Item) => void;
  onCancelEdit: () => void;
  onRemove: (i: Item) => void;
}

function DashRow({
  item,
  withMinutes,
  editing,
  editName,
  editMinutes,
  setEditName,
  setEditMinutes,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 5 : undefined };

  if (editing) {
    return (
      <li ref={setNodeRef} style={style} className="task-item">
        <div className="task-body" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="auth-input"
            style={{ flex: "3 1 160px" }}
            value={editName}
            autoFocus
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit(item);
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          {withMinutes && (
            <input
              className="auth-input"
              style={{ flex: "0 1 80px" }}
              type="number"
              min={0}
              placeholder="min"
              value={editMinutes}
              onChange={(e) => setEditMinutes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit(item);
                if (e.key === "Escape") onCancelEdit();
              }}
            />
          )}
        </div>
        <button type="button" className="task-del" onClick={() => onSaveEdit(item)} aria-label="Enregistrer" title="Enregistrer">✓</button>
        <button type="button" className="task-del" onClick={onCancelEdit} aria-label="Annuler" title="Annuler">✕</button>
      </li>
    );
  }

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
      <button type="button" className="task-del" onClick={() => onStartEdit(item)} aria-label="Modifier" title="Modifier">✏️</button>
      <button type="button" className="task-del" onClick={() => onRemove(item)} aria-label="Supprimer" title="Supprimer">✕</button>
    </li>
  );
}
