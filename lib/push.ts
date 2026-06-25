import "server-only";
import webpush, { type PushSubscription } from "web-push";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@glowup.app";
  if (!pub || !priv) throw new Error("VAPID keys manquantes (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).");
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

/**
 * Sends one push. Returns `gone: true` when the subscription is expired/invalid
 * (404/410) so the caller can prune it.
 */
export async function sendPush(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ ok: boolean; gone: boolean }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true, gone: false };
  } catch (err) {
    const code = (err as { statusCode?: number })?.statusCode;
    return { ok: false, gone: code === 404 || code === 410 };
  }
}
