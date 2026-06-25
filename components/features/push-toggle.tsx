"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

/** Convert a base64url VAPID key to the Uint8Array the Push API expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Permission refusée par le navigateur.");
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setMsg("Clé VAPID manquante (config serveur).");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      await api.post("/api/push/subscribe", sub.toJSON());
      setSubscribed(true);
      setMsg("Notifications activées ✅");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post("/api/push/unsubscribe", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Notifications désactivées.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.post<{ sent: number }>("/api/push/test", {});
      setMsg(r.sent > 0 ? "Test envoyé — regarde ta notification 🔔" : "Aucun appareil abonné.");
    } catch {
      setMsg("Échec du test.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return <p className="card-sub" style={{ marginTop: 8 }}>🔕 Notifications push non supportées par ce navigateur.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
      {!subscribed ? (
        <button type="button" className="secondary-btn" onClick={enable} disabled={busy} style={{ justifySelf: "start" }}>
          🔔 Activer les notifications push (cet appareil)
        </button>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="card-sub" style={{ alignSelf: "center" }}>🔔 Push activées sur cet appareil.</span>
          <button type="button" className="secondary-btn" onClick={test} disabled={busy}>Tester</button>
          <button type="button" className="ghost-btn" onClick={disable} disabled={busy}>Désactiver</button>
        </div>
      )}
      {msg && <p className="card-sub">{msg}</p>}
    </div>
  );
}
