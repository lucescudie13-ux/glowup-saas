"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/empty-state";
import { todayISO, formatDayLabel } from "@/lib/utils";
import type { ProgressPhoto, PhotoPose } from "@/types";

const BUCKET = "progress-photos";
const SIGNED_TTL = 60 * 60;

type PhotoWithUrl = ProgressPhoto & { url: string | null };

const POSES: { value: PhotoPose; label: string }[] = [
  { value: "front", label: "Face" },
  { value: "back", label: "Dos" },
  { value: "side", label: "Profil" },
];

function ext(name: string): string {
  const e = name.split(".").pop();
  return e && e.length <= 5 ? e.toLowerCase() : "jpg";
}

export function PhysiqueManager({
  userId,
  initialPhotos,
  idealPath,
  idealUrl,
}: {
  userId: string;
  initialPhotos: PhotoWithUrl[];
  idealPath: string | null;
  idealUrl: string | null;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [photos, setPhotos] = useState<PhotoWithUrl[]>(initialPhotos);
  const [ideal, setIdeal] = useState<{ path: string | null; url: string | null }>({ path: idealPath, url: idealUrl });

  const [date, setDate] = useState(todayISO());
  const [pose, setPose] = useState<PhotoPose>("front");
  const [contracted, setContracted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const idealRef = useRef<HTMLInputElement>(null);

  // Group photos by date (most recent first).
  const byDate = useMemo(() => {
    const map = new Map<string, PhotoWithUrl[]>();
    for (const p of [...photos].sort((a, b) => b.photo_date.localeCompare(a.photo_date))) {
      const arr = map.get(p.photo_date) ?? [];
      arr.push(p);
      map.set(p.photo_date, arr);
    }
    return [...map.entries()];
  }, [photos]);

  async function uploadPhoto(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Choisis une photo."); return; }
    setBusy(true);
    setError(null);
    try {
      const path = `${userId}/${date}/${pose}-${contracted ? "c" : "r"}-${Date.now()}.${ext(file.name)}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const created = await api.post<ProgressPhoto>("/api/progress-photos", {
        photo_date: date,
        pose,
        contracted,
        storage_path: path,
      });
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
      setPhotos((prev) => [{ ...created, url: signed?.signedUrl ?? null }, ...prev]);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(p: PhotoWithUrl) {
    const snapshot = photos;
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
    try {
      await api.del(`/api/progress-photos/${p.id}`);
      await supabase.storage.from(BUCKET).remove([p.storage_path]);
      router.refresh();
    } catch {
      setPhotos(snapshot);
    }
  }

  async function uploadIdeal(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const path = `${userId}/ideal-${Date.now()}.${ext(file.name)}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      await api.patch("/api/user", { ideal_photo_path: path });
      // Clean up the previous ideal file if any.
      if (ideal.path && ideal.path !== path) await supabase.storage.from(BUCKET).remove([ideal.path]);
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
      setIdeal({ path, url: signed?.signedUrl ?? null });
      if (idealRef.current) idealRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Ideal physique */}
      <div className="card">
        <div className="card-head"><h2 className="card-title">🎯 Physique idéal</h2></div>
        <p className="card-sub" style={{ marginBottom: 10 }}>
          Ton objectif visuel (image générée par IA à uploader toi-même pour l&apos;instant).
        </p>
        {ideal.url ? (
          <img src={ideal.url} alt="Physique idéal" style={{ maxWidth: 280, width: "100%", borderRadius: 10, display: "block", marginBottom: 10 }} />
        ) : (
          <EmptyState icon="🎯">Aucune image idéale. Uploade ta cible.</EmptyState>
        )}
        <input ref={idealRef} type="file" accept="image/*" onChange={uploadIdeal} disabled={busy} />
      </div>

      {/* Upload weekly photo */}
      <div className="card">
        <div className="card-head"><h2 className="card-title">📸 Ajouter une photo</h2></div>
        <form onSubmit={uploadPhoto} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input className="auth-input" type="date" style={{ maxWidth: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
          <select className="auth-input" style={{ maxWidth: 130 }} value={pose} onChange={(e) => setPose(e.target.value as PhotoPose)}>
            {POSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={contracted} onChange={(e) => setContracted(e.target.checked)} /> Contracté
          </label>
          <input ref={fileRef} type="file" accept="image/*" />
          <button className="main-btn" type="submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer"}</button>
        </form>
        {error && <p className="auth-error" style={{ marginTop: 8 }}>{error}</p>}
      </div>

      {/* Timeline */}
      {byDate.length === 0 ? (
        <EmptyState icon="📸">Aucune photo. Commence ton suivi hebdomadaire.</EmptyState>
      ) : (
        byDate.map(([d, group]) => (
          <div className="card" key={d}>
            <div className="card-head"><h3 className="card-title">{formatDayLabel(d)}</h3></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {group.map((p) => (
                <div key={p.id} style={{ position: "relative" }}>
                  {p.url ? (
                    <img src={p.url} alt={`${p.pose} ${p.contracted ? "contracté" : "relâché"}`} style={{ width: "100%", borderRadius: 8, aspectRatio: "3 / 4", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "3 / 4", borderRadius: 8, background: "var(--line)" }} />
                  )}
                  <div className="card-sub" style={{ marginTop: 4 }}>
                    {POSES.find((x) => x.value === p.pose)?.label} · {p.contracted ? "contracté" : "relâché"}
                  </div>
                  <button className="secondary-btn" style={{ position: "absolute", top: 6, right: 6 }} onClick={() => removePhoto(p)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
