"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Avatar, isImageAvatar } from "@/components/ui/avatar";
import type { Profile } from "@/types";

const AVATARS = ["🧍‍♂️", "🧍‍♀️", "🦊", "🐺", "🦁", "🐯", "🚀", "⚡", "🔥", "🧠", "💪", "🌟"];

/** Reads an image file and returns a small, square, center-cropped JPEG data URL. */
function fileToAvatarDataUrl(file: File, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas non supporté."));
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };
    img.src = url;
  });
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [prefNotif, setPrefNotif] = useState(profile.pref_notif);
  const [prefDaily, setPrefDaily] = useState(profile.pref_daily);
  const [routineDeadline, setRoutineDeadline] = useState(profile.routine_deadline ?? "21:00");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function pickAvatarImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarMsg(null);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Choisis un fichier image.");
      setAvatar(await fileToAvatarDataUrl(file));
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "Image illisible.");
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

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
        routine_deadline: routineDeadline,
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

        <div className="auth-field" style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Avatar</span>
          <div className="avatar-edit">
            <Avatar avatar={avatar} size={104} className="avatar-preview-lg" />
            <div className="avatar-edit-actions">
              <button type="button" className="secondary-btn" onClick={() => avatarInputRef.current?.click()}>
                🖼️ Importer une photo
              </button>
              {isImageAvatar(avatar) && (
                <button type="button" className="ghost-btn" onClick={() => setAvatar("🧍‍♂️")}>
                  Revenir à un emoji
                </button>
              )}
              <span className="card-sub">PNG ou JPG — recadrée en carré automatiquement.</span>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={pickAvatarImage}
              style={{ display: "none" }}
            />
          </div>
          {avatarMsg && <p className="auth-error" style={{ margin: "8px 0 0" }}>{avatarMsg}</p>}

          {!isImageAvatar(avatar) && (
            <div className="emoji-grid">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`emoji-tile${avatar === a ? " active" : ""}`}
                  aria-label={`Choisir l’emoji ${a}`}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <input type="checkbox" checked={prefDaily} onChange={(e) => setPrefDaily(e.target.checked)} />
          <span>Récapitulatif quotidien</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <input type="checkbox" checked={prefNotif} onChange={(e) => setPrefNotif(e.target.checked)} />
          <span>Notifications (rappel de routine)</span>
        </label>
        {prefNotif && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <input
              type="time"
              className="auth-input"
              style={{ width: 130 }}
              value={routineDeadline}
              onChange={(e) => setRoutineDeadline(e.target.value)}
            />
            <span className="card-sub">Heure limite du rappel si la routine du jour n’est pas terminée</span>
          </label>
        )}

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
