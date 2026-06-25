// server/push/push.service.ts
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";
import type { PushSubscriptionRow } from "@/types";
import type { PushSubscriptionInput } from "./push.validation";

export const pushService = {
  /** Upsert a browser push subscription for the user (keyed by endpoint). */
  async save(userId: string, subscription: PushSubscriptionInput): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        subscription: subscription as unknown as Json,
      },
      { onConflict: "endpoint" }
    );
    if (error) throw error;
  },

  async remove(userId: string, endpoint: string): Promise<void> {
    const supabase = await createClient();
    await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint);
  },

  async listForUser(userId: string): Promise<PushSubscriptionRow[]> {
    const supabase = await createClient();
    const { data } = await supabase.from("push_subscriptions").select("*").eq("user_id", userId);
    return (data ?? []) as PushSubscriptionRow[];
  },
};
