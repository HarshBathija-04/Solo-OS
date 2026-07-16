import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

/**
 * Service-role client — bypasses RLS. This is the ONLY writer to the game
 * database; clients (web + Flutter) have SELECT-only policies for Realtime.
 */
export const db = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
