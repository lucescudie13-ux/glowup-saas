"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@/lib/api-client";
import { ChecklistManager } from "@/components/features/checklist-manager";
import type { Task, TasksMode, TaskStatus } from "@/types";

const MODES: { value: TasksMode; label: string; icon: string }[] = [
  { value: "classic", label: "Classique", icon: "✅" },
  { value: "eisenhower", label: "Eisenhower", icon: "🧭" },
  { value: "kanban", label: "Kanban", icon: "🗂️" },
];

/** A single draggable task card (dragged by its grip handle). */
function TaskCard({ task, onToggle, onRemove }: { task: Task; onToggle: (t: Task) => void; onRemove: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--card, #fff)", border: "1px solid var(--line)", borderRadius: 8, marginBottom: 8 }}>
      <span {...attributes} {...listeners} style={{ cursor: "grab", color: "var(--muted, #999)", touchAction: "none" }} title="Glisser">⠿</span>
      <input type="checkbox" checked={!!task.done} onChange={() => onToggle(task)} />
      <span style={{ flex: 1, textDecoration: task.done ? "line-through" : undefined, opacity: task.done ? 0.6 : 1 }}>
        {task.name}
        {task.minutes ? <span className="card-sub"> · ⏱️ {task.minutes} min</span> : null}
      </span>
      <button className="secondary-btn" title="Supprimer" onClick={() => onRemove(task)}>✕</button>
    </div>
  );
}

/** A droppable column/quadrant. */
function DropZone({ id, title, hint, accent, children, onAdd }: {
  id: string;
  title: string;
  hint?: string;
  accent?: string;
  children: React.ReactNode;
  onAdd: (name: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [name, setName] = useState("");
  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? "var(--hover, rgba(0,0,0,0.04))" : "transparent",
        border: `1px solid var(--line)`,
        borderTop: `3px solid ${accent ?? "var(--line)"}`,
        borderRadius: 10,
        padding: 12,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        {hint && <div className="card-sub">{hint}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onAdd(name.trim()); setName(""); } }}
        style={{ marginTop: 8 }}
      >
        <input className="auth-input" style={{ width: "100%" }} placeholder="+ Ajouter" value={name} onChange={(e) => setName(e.target.value)} />
      </form>
    </div>
  );
}

export function TasksView({ initialItems, initialMode }: { initialItems: Task[]; initialMode: TasksMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<TasksMode>(initialMode);
  const [tasks, setTasks] = useState<Task[]>(initialItems);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
  );

  async function changeMode(next: TasksMode) {
    if (next === mode) return;
    setMode(next);
    try {
      await api.patch("/api/user", { tasks_mode: next });
    } catch {
      /* non-blocking: the view already switched */
    }
  }

  async function patchTask(id: string, data: Partial<Task>) {
    const snapshot = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    try {
      const updated = await api.patch<Task>(`/api/tasks/${id}`, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      router.refresh();
    } catch {
      setTasks(snapshot);
    }
  }

  async function addTask(data: Partial<Task> & { name: string }) {
    try {
      const created = await api.post<Task>("/api/tasks", { scope: "today", ...data });
      setTasks((prev) => [...prev, created]);
      router.refresh();
    } catch {
      /* ignore */
    }
  }

  async function removeTask(t: Task) {
    const snapshot = tasks;
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    try {
      await api.del(`/api/tasks/${t.id}`);
      router.refresh();
    } catch {
      setTasks(snapshot);
    }
  }

  function toggle(t: Task) {
    patchTask(t.id, { done: !t.done });
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {MODES.map((m) => (
          <button key={m.value} className={`secondary-btn${mode === m.value ? " active" : ""}`} onClick={() => changeMode(m.value)}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {mode === "classic" && (
        <ClassicBoard initialItems={tasks} />
      )}

      {mode === "eisenhower" && (
        <DndContext sensors={sensors} onDragEnd={(e) => onEisenhowerDragEnd(e, tasks, patchTask)}>
          <EisenhowerBoard tasks={tasks} onToggle={toggle} onRemove={removeTask} onAdd={addTask} />
        </DndContext>
      )}

      {mode === "kanban" && (
        <DndContext sensors={sensors} onDragEnd={(e) => onKanbanDragEnd(e, tasks, patchTask)}>
          <KanbanBoard tasks={tasks} onToggle={toggle} onRemove={removeTask} onAdd={addTask} />
        </DndContext>
      )}
    </div>
  );
}

/** Classic = the existing checklist, unchanged behaviour. */
function ClassicBoard({ initialItems }: { initialItems: Task[] }) {
  return (
    <ChecklistManager
      resource="tasks"
      initialItems={initialItems}
      withMinutes
      reorderable
      groups={{
        field: "scope",
        layout: "sections",
        tabs: [
          { value: "today", label: "🗓️ Du jour" },
          { value: "other", label: "📋 Autres" },
        ],
      }}
      emptyIcon="⏱️"
      emptyText="Aucune tâche ici. Ajoute la première."
      addLabel="Ajouter"
    />
  );
}

// ===== Eisenhower =====

const EISENHOWER = [
  { id: "u1i1", title: "À faire", hint: "Urgent + Important", accent: "#e5484d", urgent: true, important: true },
  { id: "u0i1", title: "À planifier", hint: "Important, pas urgent", accent: "#3e63dd", urgent: false, important: true },
  { id: "u1i0", title: "À déléguer", hint: "Urgent, pas important", accent: "#f5a623", urgent: true, important: false },
  { id: "u0i0", title: "À éliminer", hint: "Ni urgent ni important", accent: "#8b8d98", urgent: false, important: false },
] as const;

function quadrantId(t: Task): string {
  return `u${t.urgent ? 1 : 0}i${t.important ? 1 : 0}`;
}

function onEisenhowerDragEnd(e: DragEndEvent, tasks: Task[], patch: (id: string, d: Partial<Task>) => void) {
  const overId = e.over?.id?.toString();
  const cell = EISENHOWER.find((c) => c.id === overId);
  const task = tasks.find((t) => t.id === e.active.id);
  if (!cell || !task) return;
  if (task.urgent === cell.urgent && task.important === cell.important) return;
  patch(task.id, { urgent: cell.urgent, important: cell.important });
}

function EisenhowerBoard({ tasks, onToggle, onRemove, onAdd }: {
  tasks: Task[];
  onToggle: (t: Task) => void;
  onRemove: (t: Task) => void;
  onAdd: (data: Partial<Task> & { name: string }) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {EISENHOWER.map((cell) => {
        const items = tasks.filter((t) => quadrantId(t) === cell.id && !(t.done && t.completed_at && t.completed_at.slice(0, 10) < new Date().toISOString().slice(0, 10)));
        return (
          <DropZone key={cell.id} id={cell.id} title={cell.title} hint={cell.hint} accent={cell.accent}
            onAdd={(name) => onAdd({ name, urgent: cell.urgent, important: cell.important })}
          >
            {items.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggle} onRemove={onRemove} />)}
          </DropZone>
        );
      })}
    </div>
  );
}

// ===== Kanban =====

const KANBAN: { id: TaskStatus; title: string; accent: string }[] = [
  { id: "todo", title: "À faire", accent: "#8b8d98" },
  { id: "doing", title: "En cours", accent: "#3e63dd" },
  { id: "done", title: "Fait", accent: "#30a46c" },
];

function onKanbanDragEnd(e: DragEndEvent, tasks: Task[], patch: (id: string, d: Partial<Task>) => void) {
  const overId = e.over?.id?.toString() as TaskStatus | undefined;
  if (!overId || !KANBAN.some((c) => c.id === overId)) return;
  const task = tasks.find((t) => t.id === e.active.id);
  if (!task || task.status === overId) return;
  patch(task.id, { status: overId });
}

function KanbanBoard({ tasks, onToggle, onRemove, onAdd }: {
  tasks: Task[];
  onToggle: (t: Task) => void;
  onRemove: (t: Task) => void;
  onAdd: (data: Partial<Task> & { name: string }) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {KANBAN.map((col) => {
        const items = tasks.filter((t) => (t.status ?? "todo") === col.id && !(col.id === "done" && t.completed_at && t.completed_at.slice(0, 10) < today));
        return (
          <DropZone key={col.id} id={col.id} title={col.title} accent={col.accent}
            onAdd={(name) => onAdd({ name, status: col.id })}
          >
            {items.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggle} onRemove={onRemove} />)}
          </DropZone>
        );
      })}
    </div>
  );
}
