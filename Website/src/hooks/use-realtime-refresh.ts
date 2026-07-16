"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABLES = [
  "player_profiles",
  "quests",
  "quest_completions",
  "streaks",
  "notifications",
  "timetable_block_logs",
  "focus_sessions",
  "habit_logs",
  "attributes",
];

/**
 * Subscribes to Supabase realtime changes for the current user and refreshes
 * the current route (debounced) when anything relevant changes.
 */
export function useRealtimeRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 500);
    };

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase.channel(`user-changes-${user.id}`);
      for (const table of TABLES) {
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter: `user_id=eq.${user.id}` },
          refresh,
        );
      }
      channel.subscribe();
    })();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);
}
