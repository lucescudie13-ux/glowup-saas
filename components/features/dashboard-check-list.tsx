"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { isItemOverdue } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  description?: string;
  done?: boolean;
  minutes?: number;
  category?: string;
  position?: number;
  scope?: string;
  frequency?: string;
  created_at?: string;
  completed_at?: string | null;
  deadline?: string | null;
}

/**
 * Read-light checklist for the dashboard: tick items (tasks / routines /
 * quests) to mark them done — without leaving the overview. Toggling is
 * optimistic and refreshes so bars/KPIs stay in sync. Editing, deleting and
 * reordering live on each section's own page (the card's "Modifier" link).
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
  // Overdue is time-based; compute only after mount so SSR/CSR markup matches.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

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

  return (
    <ul className="checklist">
      {items.map((item) => (
        <li key={item.id} className={`task-item${item.done ? " is-done" : ""}${now && isItemOverdue(resource, item, now) ? " is-overdue" : ""}`}>
          <button
            type="button"
            className={`task-check${item.done ? " checked" : ""}`}
            onClick={() => toggle(item)}
            role="checkbox"
            aria-checked={!!item.done}
            aria-label={item.done ? "Marquer comme non fait" : "Marquer comme fait"}
          >
            ✓
          </button>
          <div className="task-body">
            <div className="task-title-row">
              <span className="task-name">{item.name}</span>
              {item.category ? <span className="cat-tag">{item.category}</span> : null}
            </div>
            {item.description ? <span className="task-desc">{item.description}</span> : null}
            {withMinutes && item.minutes ? (
              <div className="task-meta">
                <span className="task-mins">⏱️ {item.minutes} min</span>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
