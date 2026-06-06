export function EmptyState({ icon = "📭", children }: { icon?: string; children: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      {children}
    </div>
  );
}
