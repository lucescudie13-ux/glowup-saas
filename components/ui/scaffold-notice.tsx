/**
 * Marks a screen whose data wiring is intentionally left as a TODO.
 * The layout/section is real; only the Supabase data binding remains,
 * following the exact same pattern as the wired screens (see Quests/Stats).
 */
export function ScaffoldNotice({ children }: { children: React.ReactNode }) {
  return <div className="scaffold-note">🚧 {children}</div>;
}
