"use client";

import { useState } from "react";
import { fileToDataUrl } from "@/lib/image";

/**
 * Image picker with two shapes:
 *  - "tile"   : a square with a big "＋" (default).
 *  - "button" : a compact "🖼️ Ajouter une photo" button that becomes a small
 *               thumbnail once a photo is chosen — keeps tight forms tidy.
 * Value is a compact JPEG data URL (downscaled in the browser).
 */
export function ImagePicker({
  value,
  onChange,
  alt = "",
  size = 96,
  variant = "tile",
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  alt?: string;
  size?: number;
  variant?: "tile" | "button";
}) {
  const [err, setErr] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setErr(null);
    try {
      onChange(await fileToDataUrl(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Image illisible.");
    }
  }

  if (variant === "button") {
    return (
      <span className="img-picker-inline">
        {value ? (
          <>
            <label className="img-picker-thumb-wrap" title="Changer la photo">
              <img src={value} alt={alt} className="goal-image-thumb" />
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            <button type="button" className="ghost-btn" onClick={() => onChange("")}>Retirer</button>
          </>
        ) : (
          <label className="secondary-btn img-picker-add" style={{ minHeight: 36 }}>
            🖼️ Ajouter une photo
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        )}
        {err && <span className="auth-error" style={{ margin: 0 }}>{err}</span>}
      </span>
    );
  }

  return (
    <div className="img-picker">
      <label className="img-picker-tile" style={{ width: size, height: size }} title={value ? "Changer la photo" : "Ajouter une photo"}>
        {value ? <img src={value} alt={alt} className="img-picker-img" /> : <span className="img-picker-plus" aria-hidden>＋</span>}
        <span className="sr-only">{value ? "Changer la photo" : "Ajouter une photo"}</span>
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {value && (
        <button type="button" className="img-picker-remove" aria-label="Retirer la photo" onClick={() => onChange("")}>✕</button>
      )}
      {err && <p className="auth-error" style={{ margin: "4px 0 0" }}>{err}</p>}
    </div>
  );
}
