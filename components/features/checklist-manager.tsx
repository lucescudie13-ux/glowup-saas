"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
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

const CONTAINER_PREFIX = "container::";

interface Item {
  id: string;
  name: string;
  done?: boolean;
  category?: string;
  minutes?: number;
  position?: number;
  frequency?: string;
  scope?: string;
}

interface TabGroups {
  field: string; // e.g. "frequency" (routines) or "scope" (tasks)
  tabs: { value: string; label: string }[];
  layout?: "tabs" | "sections"; // tabs = switch between; sections = all visible + drag between
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
  resource: string;
  initialItems: Item[];
  withMinutes?: boolean;
  withCategory?: boolean;
  togglable?: boolean;
  reorderable?: boolean;
  groups?: TabGroups;
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

function SortableRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 5 : undefined };
  return (
    <li ref={setNodeRef} style={style} className={`task-item${props.item.done ? " is-done" : ""}${isDragging ? " is-dragging" : ""}`}>
      <button type="button" className="task-grip" aria-label="Glisser pour réordonner" title="Glisser pour réordonner" {...attributes} {...listeners}>
        ⠿
      </button>
      <RowInner {...props} />
    </li>
  );
}

// A droppable section so items can be dropped into an empty group too.
function Section({ value, label, items, rowProps, emptyIcon }: {
  value: string;
  label: string;
  items: Item[];
  rowProps: Omit<RowProps, "item">;
  emptyIcon: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${CONTAINER_PREFIX}${value}` });
  return (
    <div style={{ marginTop: 8 }}>
      <div className="nav-section-label" style={{ marginTop: 4 }}>{label}</div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className={`checklist section-drop${isOver ? " is-over" : ""}`}>
          {items.length === 0 ? (
            <li className="section-empty">{emptyIcon} Dépose une tâche ici</li>
          ) : (
            items.map((item) => <SortableRow key={item.id} item={item} {...rowProps} />)
          )}
        </ul>
      </SortableContext>
    </div>
  );
}

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
  const [addGroup, setAddGroup] = useState(groups?.tabs[0]?.value ?? "");

  const sections = groups?.layout === "sections";

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const dragSnapshot = useRef<Map<string, { g: string; p: number }>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groupOf = (it: Item) => (groups ? String((it as unknown as Record<string, unknown>)[groups.field] ?? "") : "");
  const groupTarget = sections ? addGroup : activeTab;

  // Single-list display (plain or tabs): sort by position, filter by active tab.
  const displayItems = useMemo(() => {
    let base = items;
    if (reorderable) base = [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    if (groups && !sections) base = base.filter((it) => groupOf(it) === activeTab);
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, reorderable, groups, sections, activeTab]);

  // Per-group lists for the sections layout (array order preserved).
  function itemsOfGroup(value: string) {
    return items.filter((it) => groupOf(it) === value);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name };
      if (withMinutes) payload.minutes = Number(minutes || 1);
      if (withCategory && category) payload.category = category;
      if (groups) payload[groups.field] = groupTarget;
      if (reorderable) payload.position = sections ? itemsOfGroup(groupTarget).length : displayItems.length;
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

  // ----- Single-list reorder (plain / tabs) -----
  async function onDragEndSingle(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const current = displayItems;
    const from = current.findIndex((i) => i.id === active.id);
    const to = current.findIndex((i) => i.id === over.id);
    if (from === -1 || to === -1) return;
    const newOrder = arrayMove(current, from, to);
    const posById = new Map(newOrder.map((it, idx) => [it.id, idx]));
    setItems((prev) => prev.map((it) => (posById.has(it.id) ? { ...it, position: posById.get(it.id)! } : it)));
    const changed = newOrder.map((it, idx) => ({ it, idx })).filter(({ it, idx }) => (it.position ?? 0) !== idx);
    try {
      await Promise.all(changed.map(({ it, idx }) => api.patch(`/api/${resource}/${it.id}`, { position: idx })));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du réordonnancement.");
    }
  }

  // ----- Multi-section reorder + cross-section move -----
  function containerOf(id: string): string | undefined {
    if (id.startsWith(CONTAINER_PREFIX)) return id.slice(CONTAINER_PREFIX.length);
    const it = itemsRef.current.find((i) => i.id === id);
    return it ? groupOf(it) : undefined;
  }

  function onDragStart(event: DragStartEvent) {
    if (!groups) return;
    dragSnapshot.current = new Map(itemsRef.current.map((it) => [it.id, { g: groupOf(it), p: it.position ?? 0 }]));
    void event;
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !groups) return;
    const activeC = containerOf(String(active.id));
    const overC = containerOf(String(over.id));
    if (!activeC || !overC || activeC === overC) return;
    setItems((prev) => {
      const activeItem = prev.find((i) => i.id === active.id);
      if (!activeItem) return prev;
      const without = prev.filter((i) => i.id !== active.id);
      const moved = { ...activeItem, [groups.field]: overC } as Item;
      const overIndex = without.findIndex((i) => i.id === over.id);
      if (overIndex === -1) return [...without, moved]; // dropped on the (empty) container
      return [...without.slice(0, overIndex), moved, ...without.slice(overIndex)];
    });
  }

  async function onDragEndSections(event: DragEndEvent) {
    const { active, over } = event;
    if (!groups) return;
    if (over) {
      const activeC = containerOf(String(active.id));
      const overC = containerOf(String(over.id));
      if (activeC && overC && activeC === overC && active.id !== over.id) {
        setItems((prev) => {
          const oldIndex = prev.findIndex((i) => i.id === active.id);
          const newIndex = prev.findIndex((i) => i.id === over.id);
          return oldIndex === -1 || newIndex === -1 ? prev : arrayMove(prev, oldIndex, newIndex);
        });
      }
    }
    // Persist: reassign positions per group (array order) and patch what changed.
    const counters: Record<string, number> = {};
    const finalItems = itemsRef.current.map((it) => {
      const g = groupOf(it);
      const p = counters[g] ?? 0;
      counters[g] = p + 1;
      return { ...it, position: p };
    });
    setItems(finalItems);
    const snap = dragSnapshot.current;
    const changed = finalItems.filter((it) => {
      const before = snap.get(it.id);
      return !before || before.g !== groupOf(it) || before.p !== it.position;
    });
    if (!changed.length) return;
    try {
      await Promise.all(
        changed.map((it) => api.patch(`/api/${resource}/${it.id}`, { [groups.field]: groupOf(it), position: it.position })),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du réordonnancement.");
    }
  }

  const rowProps = { withMinutes, withCategory, togglable, onToggle: toggle, onRemove: remove };

  return (
    <div className="card">
      {groups && !sections && (
        <div className="section-tabs">
          {groups.tabs.map((t) => (
            <button key={t.value} type="button" className={`tab${activeTab === t.value ? " active" : ""}`} onClick={() => setActiveTab(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={add} className="checklist-add">
        <input className="auth-input" style={{ flex: "3 1 200px" }} placeholder="Nom…" value={name} onChange={(e) => setName(e.target.value)} />
        {withMinutes && (
          <input className="auth-input" style={{ flex: "0 1 100px" }} type="number" min={1} placeholder="min" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        )}
        {withCategory && (
          <input className="auth-input" style={{ flex: "1 1 140px" }} placeholder="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} />
        )}
        {sections && groups && (
          <select className="auth-input" style={{ flex: "0 1 140px" }} value={addGroup} onChange={(e) => setAddGroup(e.target.value)}>
            {groups.tabs.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        )}
        <button className="checklist-submit" type="submit" disabled={busy}>{addLabel}</button>
      </form>

      {error && <p className="auth-error">{error}</p>}
      {reorderable && items.length > 1 && (
        <p className="card-sub" style={{ margin: "0 0 10px" }}>
          ↕ Glisse une ligne par la poignée{sections ? " (y compris d’une section à l’autre)" : ""} pour réorganiser.
        </p>
      )}

      {sections && groups ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEndSections}>
          {groups.tabs.map((t) => (
            <Section key={t.value} value={t.value} label={t.label} items={itemsOfGroup(t.value)} rowProps={rowProps} emptyIcon={emptyIcon} />
          ))}
        </DndContext>
      ) : displayItems.length === 0 ? (
        <EmptyState icon={emptyIcon}>{emptyText}</EmptyState>
      ) : reorderable ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEndSingle}>
          <SortableContext items={displayItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="checklist">
              {displayItems.map((item) => <SortableRow key={item.id} item={item} {...rowProps} />)}
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
      )}
    </div>
  );
}
