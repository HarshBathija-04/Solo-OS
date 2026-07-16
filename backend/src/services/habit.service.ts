/**
 * Habits, urges, and recovery quests. BUILD habits: DONE advances the streak,
 * MISSED breaks it. SHADOW habits: CLEAN advances the clean streak, RELAPSE
 * breaks it and spawns a recovery quest (never any level loss).
 */
import { db } from "../db/supabase.js";
import { AppError } from "../middleware/error.js";
import { gameDay } from "../engine/date.js";
import { notify, bumpMetric, logActivity } from "./xp.service.js";
import { advanceStreak } from "./streak.service.js";

// ─────────────────── Habits ───────────────────

/**
 * Log a habit for today. BUILD habits: DONE advances the streak, MISSED breaks it.
 * SHADOW habits: CLEAN advances the clean streak, RELAPSE breaks it and spawns a
 * recovery quest (never any level loss).
 */
export async function logHabit(params: {
  userId: string;
  habitKey: string;
  result: "DONE" | "MISSED" | "CLEAN" | "RELAPSE";
  note?: string;
}) {
  const { userId, habitKey, result, note = "" } = params;
  const { data: habit, error } = await db
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("key", habitKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!habit) throw new AppError("Habit not found", 404);

  const date = gameDay();
  const { error: upErr } = await db.from("habit_logs").upsert(
    { user_id: userId, habit_id: habit.id, date: date.toISOString(), result, note },
    { onConflict: "habit_id,date" },
  );
  if (upErr) throw new Error(upErr.message);

  if (habit.streak_key) {
    const success = result === "DONE" || result === "CLEAN";
    await advanceStreak(userId, habit.streak_key, success);
  }

  if (result === "CLEAN") {
    await logActivity(userId, "clean_day", 1, { habit: habitKey });
  }

  if (result === "RELAPSE") {
    await createRecoveryQuest(userId, `relapse:${habitKey}`);
    await notify(userId, "RECOVERY_ACTIVATED", "RECOVERY QUEST ACTIVATED",
      "No progress erased. A short recovery sequence is ready to help you regain control.");
  }

  return { ok: true };
}

// ─────────────────── Urges & recovery ───────────────────

export async function logUrge(params: {
  userId: string;
  habitKey: string;
  resisted: boolean;
  trigger?: string;
  mood?: string;
  location?: string;
  reason?: string;
}) {
  const { userId, habitKey, resisted, trigger = "", mood = "", location = "", reason = "" } = params;
  const { error } = await db.from("urge_logs").insert({
    user_id: userId, habit_key: habitKey, resisted, trigger, mood, location, reason,
  });
  if (error) throw new Error(error.message);
  if (resisted) {
    await bumpMetric(userId, "urges_resisted", 1);
    // Small discipline/focus reward for resisting — logged as activity, not raw XP farming.
    await notify(userId, "SYSTEM", "URGE RESISTED", "You chose control. That choice compounds.");
  } else {
    await createRecoveryQuest(userId, `urge:${habitKey}`);
  }
  return { ok: true };
}

export const RECOVERY_STEPS = [
  "Leave the current environment for 5 minutes.",
  "Drink a full glass of water.",
  "Walk for 10 minutes.",
  "Write down the trigger you noticed.",
  "Block or remove the triggering source.",
  "Complete a 15-minute productive task.",
];

export async function createRecoveryQuest(userId: string, reason: string) {
  const { data: open, error } = await db
    .from("recovery_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", false)
    .limit(1);
  if (error) throw new Error(error.message);
  if (open && open.length > 0) return open[0]; // one active recovery quest at a time
  const { data, error: iErr } = await db
    .from("recovery_quests")
    .insert({ user_id: userId, reason, steps: RECOVERY_STEPS })
    .select("*")
    .single();
  if (iErr) throw new Error(iErr.message);
  return data;
}

export async function completeRecoveryQuest(userId: string, id: string) {
  const { data: rq, error } = await db
    .from("recovery_quests")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .eq("completed", false)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!rq) throw new AppError("Recovery quest not found", 404);
  const { error: upErr } = await db
    .from("recovery_quests")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", id);
  if (upErr) throw new Error(upErr.message);
  await bumpMetric(userId, "recovery_completed", 1);
  await notify(userId, "SYSTEM", "CONTROL RECLAIMED", "Recovery complete. You turned a slip into a rep of discipline.");
  return { ok: true };
}
