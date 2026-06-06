"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import type { Profile } from "@/types";

interface ShellProps {
  profile: Profile;
  level: number;
  score: number;
  children: React.ReactNode;
}

export function AppShell({ profile, level, score, children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen((v) => !v)}>
            ☰
          </button>
          <div className="search">
            <input placeholder="Rechercher…" aria-label="Rechercher" />
          </div>
          <div className="top-actions">
            <div className="pill warn" title="Série de jours actifs">
              🔥 {profile.streak_count} j
            </div>
            <div className="pill">⭐ Lv {level}</div>
            <a href="/settings" className="user-chip" style={{ textDecoration: "none" }}>
              <div className="av">{profile.avatar}</div>
              <div>
                <div className="name">{profile.display_name}</div>
                <div className="lvl">Score {score}</div>
              </div>
            </a>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
