"use client";

import { LiveCountdown } from "@/components/features/live-countdown";

interface DeadlineItem {
  id: string;
  name: string;
  expires_at: string;
}

/**
 * Highlighted deadline list for the dashboard memento block — each échéance
 * shown with a live jours/heures/minutes/secondes countdown so it can't be
 * missed (visually distinct from the memento "citations").
 */
export function DashboardDeadlines({ items }: { items: DeadlineItem[] }) {
  return (
    <div className="deadline-list">
      {items.map((m) => (
        <div className="deadline-row" key={m.id}>
          <span className="deadline-name">⏳ {m.name}</span>
          <LiveCountdown expires={m.expires_at} />
        </div>
      ))}
    </div>
  );
}
