// database.types.ts
// Hand-written to match supabase/migrations. Regenerate in a real project with:
//   npm run db:types  (requires the Supabase CLI + SUPABASE_PROJECT_ID).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Helper so every table carries the Row/Insert/Update/Relationships shape
// that @supabase/supabase-js expects for type inference.
type Tbl<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Timestamps = { created_at: string };

export interface Database {
  public: {
    Tables: {
      profiles: Tbl<
        {
          id: string;
          email: string | null;
          display_name: string;
          avatar: string;
          pref_notif: boolean;
          pref_daily: boolean;
          pref_weekly: boolean;
          streak_count: number;
          streak_last_active_day: string | null;
          xp: number;
          routine_streak_count: number;
          routine_streak_last_day: string | null;
          routine_deadline: string;
          tasks_mode: "classic" | "eisenhower" | "kanban";
          last_settled_day: string | null;
          ideal_photo_path: string | null;
          equipped_frame: string | null;
          equipped_badge: string | null;
          equipped_accent: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          email?: string | null;
          display_name?: string;
          avatar?: string;
          pref_notif?: boolean;
          pref_daily?: boolean;
          pref_weekly?: boolean;
          streak_count?: number;
          streak_last_active_day?: string | null;
          xp?: number;
          routine_streak_count?: number;
          routine_streak_last_day?: string | null;
          routine_deadline?: string;
          tasks_mode?: "classic" | "eisenhower" | "kanban";
          last_settled_day?: string | null;
          ideal_photo_path?: string | null;
          equipped_frame?: string | null;
          equipped_badge?: string | null;
          equipped_accent?: string | null;
        },
        Partial<{
          email: string | null;
          display_name: string;
          avatar: string;
          pref_notif: boolean;
          pref_daily: boolean;
          pref_weekly: boolean;
          streak_count: number;
          streak_last_active_day: string | null;
          xp: number;
          routine_streak_count: number;
          routine_streak_last_day: string | null;
          routine_deadline: string;
          tasks_mode: "classic" | "eisenhower" | "kanban";
          last_settled_day: string | null;
          ideal_photo_path: string | null;
          equipped_frame: string | null;
          equipped_badge: string | null;
          equipped_accent: string | null;
        }>
      >;
      stats: Tbl<
        { id: string; user_id: string; key: string; name: string; value: number; is_custom: boolean; category: "physique" | "mental" | "personnel" | "energie" } & Timestamps,
        { user_id: string; key: string; name: string; value?: number; is_custom?: boolean; category?: "physique" | "mental" | "personnel" | "energie" },
        Partial<{ key: string; name: string; value: number; is_custom: boolean; category: "physique" | "mental" | "personnel" | "energie" }>
      >;
      actions: Tbl<
        { id: string; user_id: string; name: string; deltas: Json; action_date: string } & Timestamps,
        { user_id: string; name: string; deltas?: Json; action_date?: string },
        Partial<{ name: string; deltas: Json; action_date: string }>
      >;
      quests: Tbl<
        { id: string; user_id: string; name: string; category: string; done: boolean; position: number } & Timestamps,
        { user_id: string; name: string; category?: string; done?: boolean; position?: number },
        Partial<{ name: string; category: string; done: boolean; position: number }>
      >;
      routines: Tbl<
        { id: string; user_id: string; name: string; minutes: number; category: string; done: boolean; position: number; frequency: "daily" | "weekly" | "monthly" } & Timestamps,
        { user_id: string; name: string; minutes?: number; category?: string; done?: boolean; position?: number; frequency?: "daily" | "weekly" | "monthly" },
        Partial<{ name: string; minutes: number; category: string; done: boolean; position: number; frequency: "daily" | "weekly" | "monthly" }>
      >;
      tasks: Tbl<
        { id: string; user_id: string; name: string; minutes: number; category: string; done: boolean; position: number; scope: "today" | "other"; completed_at: string | null; urgent: boolean; important: boolean; status: "todo" | "doing" | "done"; penalized: boolean } & Timestamps,
        { user_id: string; name: string; minutes?: number; category?: string; done?: boolean; position?: number; scope?: "today" | "other"; completed_at?: string | null; urgent?: boolean; important?: boolean; status?: "todo" | "doing" | "done"; penalized?: boolean },
        Partial<{ name: string; minutes: number; category: string; done: boolean; position: number; scope: "today" | "other"; completed_at: string | null; urgent: boolean; important: boolean; status: "todo" | "doing" | "done"; penalized: boolean }>
      >;
      objectives: Tbl<
        { id: string; user_id: string; period: "monthly" | "yearly"; name: string; actions: string; progress: number; details: Json; position: number } & Timestamps,
        { user_id: string; period: "monthly" | "yearly"; name: string; actions?: string; progress?: number; details?: Json; position?: number },
        Partial<{ name: string; actions: string; progress: number; details: Json; period: "monthly" | "yearly"; position: number }>
      >;
      projects: Tbl<
        { id: string; user_id: string; name: string; progress: number; description: string; position: number } & Timestamps,
        { user_id: string; name: string; progress?: number; description?: string; position?: number },
        Partial<{ name: string; progress: number; description: string; position: number }>
      >;
      finance_entries: Tbl<
        { id: string; user_id: string; type: "income" | "expense"; name: string; amount: number; category: string; entry_date: string; recurring: boolean; planned: boolean; position: number } & Timestamps,
        { user_id: string; type: "income" | "expense"; name: string; amount: number; category?: string; entry_date?: string; recurring?: boolean; planned?: boolean; position?: number },
        Partial<{ type: "income" | "expense"; name: string; amount: number; category: string; entry_date: string; recurring: boolean; planned: boolean; position: number }>
      >;
      financial_goals: Tbl<
        { id: string; user_id: string; name: string; target: number; saved: number; description: string; kind: "goal" | "obligation"; position: number } & Timestamps,
        { user_id: string; name: string; target: number; saved?: number; description?: string; kind?: "goal" | "obligation"; position?: number },
        Partial<{ name: string; target: number; saved: number; description: string; kind: "goal" | "obligation"; position: number }>
      >;
      nutrition_goals: Tbl<
        { user_id: string; calories: number; protein: number; carbs: number; fat: number; updated_at: string },
        { user_id: string; calories?: number; protein?: number; carbs?: number; fat?: number },
        Partial<{ calories: number; protein: number; carbs: number; fat: number }>
      >;
      foods: Tbl<
        { id: string; user_id: string; name: string; meal: string; calories: number; protein: number; carbs: number; fat: number; food_date: string } & Timestamps,
        { user_id: string; name: string; meal?: string; calories?: number; protein?: number; carbs?: number; fat?: number; food_date?: string },
        Partial<{ name: string; meal: string; calories: number; protein: number; carbs: number; fat: number; food_date: string }>
      >;
      workouts: Tbl<
        { id: string; user_id: string; type: "strength" | "run" | "boxing"; workout_date: string; data: Json } & Timestamps,
        { user_id: string; type: "strength" | "run" | "boxing"; workout_date?: string; data?: Json },
        Partial<{ type: "strength" | "run" | "boxing"; workout_date: string; data: Json }>
      >;
      dangers: Tbl<
        { id: string; user_id: string; name: string; category: string; impact: number; description: string; position: number } & Timestamps,
        { user_id: string; name: string; category?: string; impact?: number; description?: string; position?: number },
        Partial<{ name: string; category: string; impact: number; description: string; position: number }>
      >;
      mementos: Tbl<
        { id: string; user_id: string; name: string; done: boolean; expires_at: string | null; position: number } & Timestamps,
        { user_id: string; name: string; done?: boolean; expires_at?: string | null; position?: number },
        Partial<{ name: string; done: boolean; expires_at: string | null; position: number }>
      >;
      sleep_entries: Tbl<
        { id: string; user_id: string; sleep_date: string; hours: number; kind: "nuit" | "recup"; note: string } & Timestamps,
        { user_id: string; sleep_date?: string; hours?: number; kind?: "nuit" | "recup"; note?: string },
        Partial<{ sleep_date: string; hours: number; kind: "nuit" | "recup"; note: string }>
      >;
      reflections: Tbl<
        { id: string; user_id: string; title: string; body: string; topic: string; pinned: boolean; position: number; updated_at: string } & Timestamps,
        { user_id: string; title?: string; body?: string; topic?: string; pinned?: boolean; position?: number },
        Partial<{ title: string; body: string; topic: string; pinned: boolean; position: number }>
      >;
      measurements: Tbl<
        { id: string; user_id: string; measure_date: string; weight: number | null; body_fat: number | null; arm: number | null; leg: number | null; waist: number | null; shoulder: number | null; chest: number | null; note: string } & Timestamps,
        { user_id: string; measure_date?: string; weight?: number | null; body_fat?: number | null; arm?: number | null; leg?: number | null; waist?: number | null; shoulder?: number | null; chest?: number | null; note?: string },
        Partial<{ measure_date: string; weight: number | null; body_fat: number | null; arm: number | null; leg: number | null; waist: number | null; shoulder: number | null; chest: number | null; note: string }>
      >;
      progress_photos: Tbl<
        { id: string; user_id: string; photo_date: string; pose: "front" | "back" | "side"; contracted: boolean; storage_path: string } & Timestamps,
        { user_id: string; photo_date?: string; pose: "front" | "back" | "side"; contracted?: boolean; storage_path: string },
        Partial<{ photo_date: string; pose: "front" | "back" | "side"; contracted: boolean; storage_path: string }>
      >;
      push_subscriptions: Tbl<
        { id: string; user_id: string; endpoint: string; subscription: Json } & Timestamps,
        { user_id: string; endpoint: string; subscription: Json },
        Partial<{ endpoint: string; subscription: Json }>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
