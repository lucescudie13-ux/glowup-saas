"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { findCosmetic } from "@/lib/constants";
import type { Profile } from "@/types";

export interface CategoryGauge {
  label: string;
  value: number;
  color: string;
}

interface ShellProps {
  profile: Profile;
  categories?: CategoryGauge[];
  children: React.ReactNode;
}

export function AppShell({ profile, categories, children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply the equipped accent cosmetic (overrides --accent), if any.
  const accent = findCosmetic(profile.equipped_accent);
  useEffect(() => {
    const root = document.documentElement;
    if (accent?.type === "accent") root.style.setProperty("--cyan", accent.value);
    else root.style.removeProperty("--cyan");
    return () => {
      root.style.removeProperty("--cyan");
    };
  }, [accent?.value, accent?.type]);

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} profile={profile} categories={categories} />

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
