import { createClient } from "@/lib/supabase/server";

/** Returns the authenticated user's id, or null. */
export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Throws if not authenticated — for server actions. */
export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new Error("Not authenticated");
  return id;
}

/** Returns the Supabase access token for calling the Express API. */
export async function requireAccessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}
