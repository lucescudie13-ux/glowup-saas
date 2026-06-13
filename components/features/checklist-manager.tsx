"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  frequency?: string;
}

interface TabGroups {
  field: "frequency";
  tabs: { value: string; label: string }[];
}

interface RowProps {
  item: Item;
  withMinutes: boolean;
  withCategory: boolean;
  togglable: boolean;
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
  groups?: TabGroups; // splits the list into tabs by a field (e.g. routine frequency)
  emptyIcon?: string;
  emptyText?: string;
  addLabel?: string;
}

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
 * (mouse, touch, keyboard) and the order is saved via `position`. When
 * `groups` is set, the list is split into tabs by a field (e.g. frequency).
 */
export function ChecklistManager({
  resource,
  initialItems,
  withMinutes = false,
  withCategory = false,
  togglable = true,
  reorderable = false,
  groups,
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
  const [activeTab, setActiveTab] = useState(groups?.tabs[0]?.value ?? "");

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groupOf = (it: Item) => (groups ? String((it as unknown as Record<string, unknown>)[groups.field] ?? "") : "");

  // What we actually render: sorted by position when reorderable, filtered by tab when grouped.
  const displayItems = useMemo(() => {
    let base = items;
    if (reorderable) base = [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    if (groups) base = base.filter((it) => groupOf(it) === activeTab);
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, reorderable, groups, activeTab]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name };
      if (withMinutes) payload.minutes = Number(minutes || 1);
      if (withCategory && category) payload.category = category;
      if (groups) payload[groups.field] = activeTab;
      if (reorderable) payload.position = displayItems.length; // new items go last (within tab)
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
    const current = displayItems;
    const from = current.findIndex((i) => i.id === active.id);
    const to = current.findIndex((i) => i.id === over.id);
    if (from === -1 || to === -1) return;
    const newOrder = arrayMove(current, from, to);
    const posById = new Map(newOrder.map((it, idx) => [it.id, idx]));
    setItems((prev) => prev.map((it) => (posById.has(it.id) ? { ...it, position: posById.get(it.id)! } : it)));
    // Persist only rows whose index changed.
    const changed = newOrder
      .map((it, idx) => ({ it, idx }))
      .filter(({ it, idx }) => (it.position ?? 0) !== idx);
    try {
      await Promise.all(changed.map(({ it, idx }) => api.patch(`/api/${resource}/${it.id}`, { position: idx })));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du réordonnancement.");
    }
  }

  const rowProps = { withMinutes, withCategory, togglable, onToggle: toggle, onRemove: remove };

  const list =
    displayItems.length === 0 ? (
      <EmptyState icon={emptyIcon}>{emptyText}</EmptyState>
    ) : reorderable ? (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={displayItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="checklist">
            {displayItems.map((item) => (
              <SortableRow key={item.id} item={item} {...rowProps} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    ) : (
      <ul className="checklist">
        {displayItems.map((item) => (
          <li key={item.id} className={`task-item${item.done ? " is-done" : ""}`}>
            <RowInner item={item} {...rowProps} />
          </li>
        ))}
      </ul>
    );

  return (
    <div className="card">
      {groups && (
        <div className="section-tabs">
          {groups.tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`tab${activeTab === t.value ? " active" : ""}`}
              onClick={() => setActiveTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

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
      {reorderable && displayItems.length > 1 && (
        <p className="card-sub" style={{ margin: "0 0 10px" }}>↕ Glisse une ligne par la poignée pour changer l’ordre.</p>
      )}

      {list}
    </div>
  );
}
