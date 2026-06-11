"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

interface Item {
  id: string;
  name: string;
  done?: boolean;
  minutes?: number;
  category?: string;
}

/**
 * Read-light checklist for the dashboard: lets the user tick items
 * (tasks / routines / quests) without leaving the overview. Toggles are
 * optimistic and refresh the page so the progress bars/KPIs stay in sync.
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
        <li key={item.id} className={`task-item${item.done ? " is-done" : ""}`}>
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
            <span className="task-name">{item.name}</span>
            {((withMinutes && item.minutes) || item.category) && (
              <div className="task-meta">
                {withMinutes && item.minutes ? <span className="task-mins">⏱️ {item.minutes} min</span> : null}
                {item.category ? <span className="cat-tag">{item.category}</span> : null}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
