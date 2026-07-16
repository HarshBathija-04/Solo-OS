/**
 * Focus session lifecycle: start + complete (XP, metrics, boss damage).
 */
import { db } from "../db/supabase.js";
import { AppError } from "../middleware/error.js";
import type { AttrMap, FocusCategory } from "../db/tables.js";
import { calculateFocusXP } from "../engine/xp-engine.js";
import {
  grantXp,
  bumpMetric,
  logActivity,
  touchActiveDay,
  equippedTitleBonus,
  type XpAwardResult,
} from "./xp.service.js";
import { maybeDamageActiveBosses } from "./boss.service.js";

// ─────────────────── Focus start ───────────────────

export async function startFocusSession(params: {
  userId: string;
  category: FocusCategory;
  plannedMinutes: number;
  questId?: string;
}) {
  const { userId, category, plannedMinutes, questId } = params;
  const { data, error } = await db
    .from("focus_sessions")
    .insert({ user_id: userId, category, planned_min: plannedMinutes, quest_id: questId ?? null })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ─────────────────── Focus completion ───────────────────

export async function completeFocusSession(params: {
  userId: string;
  sessionId: string;
  actualMinutes: number;
  result: "COMPLETE" | "PARTIAL" | "ABANDONED";
}) {
  const { userId, sessionId, actualMinutes, result } = params;
  const { data: session, error } = await db
    .from("focus_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!session) throw new AppError("Session not found", 404);
  if (session.ended_at) throw new AppError("Session already ended", 409);

  const titleBonus = await equippedTitleBonus(userId);
  const rawXp = calculateFocusXP({
    actualMinutes,
    plannedMinutes: session.planned_min,
    result,
    titleBonusPct: titleBonus,
  });

  // Focus contributes to FOC/INT/DIS proportionally to minutes.
  const attributeXp: AttrMap = rawXp > 0
    ? { FOC: Math.round(actualMinutes * 0.4), INT: Math.round(actualMinutes * 0.25), DIS: Math.round(actualMinutes * 0.15) }
    : {};

  const award: XpAwardResult = rawXp > 0
    ? await grantXp({ userId, rawXp, attributeXp, coinReason: "FOCUS", source: `focus:${session.category}` })
    : { xpAwarded: 0, coinsAwarded: 0, leveledUp: false, newLevel: 0, newRank: "", attributeLevelUps: [] };

  const { error: upErr } = await db
    .from("focus_sessions")
    .update({ actual_min: actualMinutes, ended_at: new Date().toISOString(), result, xp_awarded: award.xpAwarded })
    .eq("id", sessionId);
  if (upErr) throw new Error(upErr.message);

  // Activity + metrics
  await logActivity(userId, "study_minutes", actualMinutes, { category: session.category });
  await logActivity(userId, "focus_minutes", actualMinutes);
  if (result === "COMPLETE" || result === "PARTIAL") {
    await bumpMetric(userId, "focus_sessions", 1);
    await bumpMetric(userId, "focus_minutes", actualMinutes);
    await bumpMetric(userId, "study_minutes", actualMinutes);
    if (session.category === "GATE") await bumpMetric(userId, "gate_minutes", actualMinutes);
  }
  await maybeDamageActiveBosses(userId, "focus", "COMPLETED");
  await touchActiveDay(userId);

  return award;
}
