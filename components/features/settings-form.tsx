"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { Profile } from "@/types";

const AVATARS = ["🧍‍♂️", "🧍‍♀️", "🦊", "🐺", "🦁", "🐯", "🚀", "⚡", "🔥", "🧠", "💪", "🌟"];

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [prefNotif, setPrefNotif] = useState(profile.pref_notif);
  const [prefDaily, setPrefDaily] = useState(profile.pref_daily);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await api.patch("/api/user", {
        display_name: displayName,
        avatar,
        pref_notif: prefNotif,
        pref_daily: prefDaily,
      });
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function exportData() {
    const data = await api.get<unknown>("/api/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glowup-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const res = await api.post<{ summary: Record<string, number> }>("/api/import", payload);
      const total = Object.values(res.summary).reduce((s, n) => s + n, 0);
      setImportMsg(`Import réussi : ${total} élément(s) restauré(s).`);
      router.refresh();
    } catch (err) {
      setImportMsg(err instanceof Error ? `Échec : ${err.message}` : "Échec de l'import.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <form className="card" onSubmit={save} style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h2 className="card-title">👤 Profil</h2>
        </div>

        <label className="auth-field">
          <span>Nom du personnage</span>
          <input className="auth-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>

        <span className="auth-field" style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>Avatar</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {AVATARS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAvatar(a)}
                className={avatar === a ? "main-btn" : "secondary-btn"}
                style={{ fontSize: 20, padding: "6px 10px" }}
              >
                {a}
              </button>
            ))}
          </div>
        </span>

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <input type="checkbox" checked={prefDaily} onChange={(e) => setPrefDaily(e.target.checked)} />
          <span>Récapitulatif quotidien</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <input type="checkbox" checked={prefNotif} onChange={(e) => setPrefNotif(e.target.checked)} />
          <span>Notifications</span>
        </label>

        {saved && <p style={{ color: "var(--success)", fontSize: 14 }}>Enregistré ✓</p>}

        <button className="main-btn" type="submit" disabled={busy} style={{ marginTop: 14 }}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">⚙️ Données & session</h2>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="secondary-btn" onClick={exportData}>⬇️ Exporter mes données (JSON)</button>
          <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>⬆️ Importer un export</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={importData}
            style={{ display: "none" }}
          />
          <form action="/auth/signout" method="post">
            <button className="secondary-btn" type="submit">🚪 Se déconnecter</button>
          </form>
        </div>
        {importMsg && <p className="card-sub" style={{ marginTop: 10 }}>{importMsg}</p>}
      </div>
    </>
  );
}
