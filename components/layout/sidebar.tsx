"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <aside className={`sidebar${open ? " open" : ""}`} id="sidebar">
        <div className="brand">
          <div className="brand-logo">⚡</div>
          <div>
            <div className="brand-title">Glow Up RPG</div>
            <div className="brand-sub">Personal SaaS</div>
          </div>
        </div>

        <div className="nav-section-label">Navigation</div>
        {NAV_ITEMS.map((item) => {
          const href = `/${item.section}`;
          const active = pathname === href;
          return (
            <Link
              key={item.section}
              href={href}
              onClick={onClose}
              className={`nav-item${active ? " active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <div className="nav-section-label">Compte</div>
        <Link
          href="/settings"
          onClick={onClose}
          className={`nav-item${pathname === "/settings" ? " active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          <span className="nav-icon">⚙️</span>Paramètres
        </Link>

        <div className="sidebar-foot">
          <div>SaaS · Next.js + Supabase</div>
          <div style={{ marginTop: 4, color: "var(--muted-2)" }}>Données synchronisées</div>
        </div>
      </aside>

      {open && <div className="mobile-overlay show" onClick={onClose} />}
    </>
  );
}
