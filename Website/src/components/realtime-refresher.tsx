"use client";

import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

/** Mounted once in the app layout — keeps server components fresh via realtime. */
export function RealtimeRefresher() {
  useRealtimeRefresh();
  return null;
}
