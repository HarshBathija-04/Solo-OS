/**
 * Server-side fetch wrapper for the Express API.
 * Attaches the Supabase access token and unwraps the `{ ok, ... }` envelope.
 */
import { requireAccessToken } from "@/lib/current-user";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000";

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = await requireAccessToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // fall through — handled below
  }

  if (!res.ok || !json || json.ok === false) {
    throw new Error(json?.error ?? `API request failed (${res.status} ${path})`);
  }

  return json as T;
}
