"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/types";

interface ShellProps {
  profile: Profile;
  children: React.ReactNode;
}

export function AppShell({ profile, children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} profile={profile} />

      <main className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen((v) => !v)}>
            ☰
          </button>
          <div className="search">
            <input placeholder="Rechercher…" aria-label="Rechercher" />
          </div>
          <div className="top-actions">
            <ThemeToggle />
            <div className="pill warn" title="Série de jours actifs">
              🔥 {profile.streak_count} j
            </div>
            <a href="/settings" className="user-chip" style={{ textDecoration: "none" }}>
              <Avatar avatar={profile.avatar} size={34} className="av" />
              <div>
                <div className="name">{profile.display_name}</div>
              </div>
            </a>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
