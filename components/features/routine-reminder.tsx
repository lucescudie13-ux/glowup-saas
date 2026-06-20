"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { todayISO } from "@/lib/utils";

interface Props {
  enabled: boolean; // user pref_notif
  deadline: string; // "HH:MM"
  dailyDone: boolean; // daily routine fully complete at page load
  remaining: number; // number of daily routines left to do
}

type Perm = "default" | "granted" | "denied" | "unsupported";

/** Minutes-since-midnight for an "HH:MM" string. */
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Reminds the user to finish their daily routine before a deadline.
 * Uses the browser Notification API + a service worker, so it works while the
 * app/tab is open (foreground or PWA). Background push when the app is fully
 * closed would require server-side web-push — a later phase.
 */
export function RoutineReminder({ enabled, deadline, dailyDone, remaining }: Props) {
  const [perm, setPerm] = useState<Perm>("unsupported");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission as Perm);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const notify = useCallback(async () => {
    if (Notification.permission !== "granted") return;
    // One reminder per day max.
    const key = `routine-reminder-${todayISO()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");

    const title = "🔁 Routine non terminée";
    const body =
      remaining > 0
        ? `Il te reste ${remaining} habitude${remaining > 1 ? "s" : ""} à valider aujourd’hui. Garde ta série ! 🔥`
        : "Pense à valider ta routine du jour pour garder ta série ! 🔥";
    const opts: NotificationOptions = { body, icon: "/icon.png", tag: "routine-reminder" };
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) await reg.showNotification(title, opts);
      else new Notification(title, opts);
    } catch {
      try {
        new Notification(title, opts);
      } catch {
        /* ignore */
      }
    }
  }, [remaining]);

  // Schedule the reminder at the deadline (or fire now if already past it).
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled || perm !== "granted" || dailyDone) return;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const deadlineMin = hhmmToMinutes(deadline);

    if (nowMin >= deadlineMin) {
      void notify();
      return;
    }
    const msUntil = (deadlineMin - nowMin) * 60_000 - now.getSeconds() * 1000;
    timerRef.current = setTimeout(() => void notify(), Math.max(0, msUntil));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, perm, dailyDone, deadline, notify]);

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const res = await Notification.requestPermission();
    setPerm(res as Perm);
  }

  if (!enabled) {
    return (
      <p className="card-sub" style={{ margin: "0 0 12px" }}>
        🔕 Rappels de routine désactivés — active-les dans les{" "}
        <a href="/settings" style={{ color: "var(--cyan-soft)" }}>Paramètres</a>.
      </p>
    );
  }

  if (perm === "unsupported") return null;

  if (perm === "denied") {
    return (
      <p className="card-sub" style={{ margin: "0 0 12px" }}>
        🔕 Notifications bloquées par le navigateur. Autorise-les dans les réglages du site pour
        recevoir le rappel de {deadline}.
      </p>
    );
  }

  if (perm === "default") {
    return (
      <div className="reminder-banner" style={{ marginBottom: 12 }}>
        <span>🔔 Reçois un rappel à <strong>{deadline}</strong> si ta routine n’est pas terminée.</span>
        <button type="button" className="small-btn" onClick={requestPermission}>
          Activer les rappels
        </button>
      </div>
    );
  }

  // granted
  return (
    <p className="card-sub" style={{ margin: "0 0 12px" }}>
      {dailyDone
        ? "✅ Routine du jour terminée — rien à te rappeler aujourd’hui."
        : `🔔 Rappel activé : tu seras prévenu à ${deadline} si ta routine n’est pas finie.`}
    </p>
  );
}
