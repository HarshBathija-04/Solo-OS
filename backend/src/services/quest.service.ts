/**
 * Quest lifecycle: completion (XP/coins/streak/boss side effects), main-quest
 * stage progress, and idempotent daily-quest generation.
 */
import { db } from "../db/supabase.js";
import { AppError } from "../middleware/error.js";
import type { AttrMap, QuestStatus } from "../db/tables.js";
import { gameDay, dayKey } from "../engine/date.js";
import { calculateQuestXP, calculateAttributeXP, qualityRatio } from "../engine/xp-engine.js";
import { generateDailyQuests } from "../engine/quest-engine.js";
import {
  grantXp,
  notify,
  bumpMetric,
  logActivity,
  touchActiveDay,
  equippedTitleBonus,
  type XpAwardResult,
} from "./xp.service.js";
import { advanceStreak } from "./streak.service.js";
import { maybeDamageActiveBosses } from "./boss.service.js";

/** Embedded to-one relations may come back as an object or a 1-element array. */
function one<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

// ─────────────────── Quest completion ───────────────────

export async function completeQuest(userId: string, questId: string, result: QuestStatus) {
  const { data: quest, error } = await db
    .from("quests")
    .select("*, completion:quest_completions(*), template:quest_templates(*)")
    .eq("id", questId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!quest) throw new AppError("Quest not found", 404);
  const completion = one(quest.completion);
  if (completion) throw new AppError("Quest already resolved", 409);
  const template = one(quest.template);

  const ratio = qualityRatio(result);

  // Streak state (for bonus + updates)
  let streakDays = 0;
  if (quest.streak_key && result !== "FAILED") {
    const { data: streak, error: sErr } = await db
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .eq("key", quest.streak_key)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    streakDays = streak?.current ?? 0;
  }

  // Anti-farm: how many equivalent template completions already today.
  let repeatIndexToday = 0;
  if (quest.template_id) {
    const { count, error: cErr } = await db
      .from("quests")
      .select("id, quest_completions!inner(id)", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("template_id", quest.template_id)
      .eq("assigned_date", quest.assigned_date);
    if (cErr) throw new Error(cErr.message);
    repeatIndexToday = count ?? 0;
  }

  const titleBonus = await equippedTitleBonus(userId);

  const rawXp = calculateQuestXP({
    baseXp: quest.base_xp,
    difficulty: quest.difficulty,
    result,
    streakDays,
    repeatIndexToday,
    titleBonusPct: titleBonus,
  });

  const attributeXp = result === "FAILED"
    ? {}
    : calculateAttributeXP(quest.attribute_xp as AttrMap, ratio * (1 + Math.min(0.4, streakDays * 0.04)));

  const award: XpAwardResult = rawXp > 0
    ? await grantXp({
        userId, rawXp, attributeXp,
        coinReason: "QUEST", source: `quest:${template?.key ?? quest.id}`,
        extraCoins: result === "COMPLETED" ? quest.coin_reward : Math.round(quest.coin_reward * ratio),
      })
    : { xpAwarded: 0, coinsAwarded: 0, leveledUp: false, newLevel: 0, newRank: "", attributeLevelUps: [] };

  // Insert the completion first — quest_completions.quest_id is UNIQUE, so a
  // concurrent double-completion fails here before the status update.
  const { error: ccErr } = await db.from("quest_completions").insert({
    user_id: userId, quest_id: quest.id, result,
    xp_awarded: award.xpAwarded, coins_awarded: award.coinsAwarded,
    attribute_xp: attributeXp, quality_ratio: ratio,
  });
  if (ccErr) throw new Error(ccErr.message);
  const { error: quErr } = await db.from("quests").update({ status: result }).eq("id", quest.id);
  if (quErr) throw new Error(quErr.message);

  // Streak updates
  if (quest.streak_key) {
    await advanceStreak(userId, quest.streak_key, result !== "FAILED");
  }

  // Metrics for achievements (derived from the quest's streak/category).
  if (result !== "FAILED") {
    await bumpMetric(userId, "quest_completed", 1);
    const key = template?.key ?? "";
    if (quest.streak_key === "dsa") {
      await bumpMetric(userId, "dsa_solved", 3);
      await logActivity(userId, "dsa_solved", 3);
    }
    if (key === "dsa-1-hard") {
      await bumpMetric(userId, "dsa_solved", 1);
      await logActivity(userId, "dsa_solved", 1);
    }
    if (quest.streak_key === "workout") {
      await bumpMetric(userId, "workout_count", 1);
      await logActivity(userId, "workout", 1);
    }
    if (quest.streak_key === "cardio") {
      await bumpMetric(userId, "run_km_total", 2);
      await logActivity(userId, "run_km", 2);
    }
    if (quest.category === "study" && quest.est_minutes >= 30) {
      await bumpMetric(userId, "study_minutes", quest.est_minutes);
      await logActivity(userId, "study_minutes", quest.est_minutes);
      if (key.startsWith("gate")) await bumpMetric(userId, "gate_minutes", quest.est_minutes);
    }
  }

  await notify(userId, "QUEST_COMPLETED", "QUEST COMPLETED", `${quest.title} (+${award.xpAwarded} XP).`);

  // Boss damage from certain quest categories.
  await maybeDamageActiveBosses(userId, quest.category, result);

  await touchActiveDay(userId);

  return award;
}

// ─────────────────── Main quest stages ───────────────────

export interface MainQuestProgressResult {
  progress: number;
  target: number;
  completed: boolean;
  award: XpAwardResult | null;
}

/**
 * Advance a Main Quest stage by `amount` progress units. Clearing a stage
 * (progress reaching targetUnits) grants a milestone XP + coin reward and
 * notifies the player. Idempotent-safe: already-completed stages are no-ops.
 */
export async function logMainQuestProgress(
  userId: string,
  stageId: string,
  amount: number,
): Promise<MainQuestProgressResult> {
  const { data: stage, error } = await db
    .from("main_quest_stages")
    .select("*, main_quest:main_quests!inner(*)")
    .eq("id", stageId)
    .eq("main_quest.user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!stage) throw new AppError("Stage not found", 404);
  const mainQuest = one(stage.main_quest);
  if (!mainQuest) throw new AppError("Stage not found", 404);

  const step = Math.max(1, Math.min(50, Math.round(amount)));
  if (stage.completed) {
    return { progress: stage.progress, target: stage.target_units, completed: true, award: null };
  }

  const newProgress = Math.min(stage.target_units, stage.progress + step);
  const justCompleted = newProgress >= stage.target_units;

  const { error: upErr } = await db
    .from("main_quest_stages")
    .update({
      progress: newProgress,
      completed: justCompleted,
      completed_at: justCompleted ? new Date().toISOString() : null,
    })
    .eq("id", stage.id);
  if (upErr) throw new Error(upErr.message);

  let award: XpAwardResult | null = null;
  if (justCompleted) {
    // Milestone reward scales with the stage's size.
    const rawXp = 200 + stage.target_units;
    award = await grantXp({
      userId,
      rawXp,
      attributeXp: {},
      coinReason: "QUEST",
      source: `mainquest:${mainQuest.key}:${stage.key}`,
      extraCoins: Math.round(stage.target_units / 5),
    });
    await notify(
      userId,
      "QUEST_COMPLETED",
      "STAGE CLEARED",
      `${mainQuest.title} — "${stage.title}" complete. +${award.xpAwarded} XP.`,
    );
  }

  return { progress: newProgress, target: stage.target_units, completed: justCompleted, award };
}

// ─────────────────── Daily quest generation ───────────────────

/**
 * Idempotently ensure today's quests exist. Uses recent completion history and
 * streak/distraction state to adapt the plan. Safe to call on dashboard load.
 */
export async function ensureTodayQuests(userId: string) {
  const today = gameDay();
  const { count: existing, error: exErr } = await db
    .from("quests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("assigned_date", today.toISOString());
  if (exErr) throw new Error(exErr.message);
  if ((existing ?? 0) > 0) return { created: 0 };

  // Build engine context from recent data.
  const recent = await recentCompletionRatios(userId, 7);
  const failingStreaks = await failingStreakKeys(userId);
  const distractionYesterday = await distractionMinutes(userId, -1);
  const { count: openRecovery, error: rErr } = await db
    .from("recovery_quests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", false);
  if (rErr) throw new Error(rErr.message);
  const inRecovery = (openRecovery ?? 0) > 0;
  const { data: settings, error: setErr } = await db
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (setErr) throw new Error(setErr.message);
  const weakest = await weakestAttributeKey(userId);

  const planned = generateDailyQuests({
    dayKey: dayKey(),
    userId,
    recentCompletion: recent,
    failingStreaks,
    distractionMinutesYesterday: distractionYesterday,
    inRecovery,
    difficultyBias: settings?.difficulty_bias ?? 1,
    weakestAttribute: weakest,
  });

  const { data: templates, error: tErr } = await db.from("quest_templates").select("*");
  if (tErr) throw new Error(tErr.message);
  const tmap = new Map((templates ?? []).map((t) => [t.key as string, t]));

  const rows = planned.map((q) => {
    const tmpl = tmap.get(q.key);
    return {
      user_id: userId,
      template_id: tmpl?.id ?? null,
      title: q.title,
      description: q.description,
      type: q.type,
      difficulty: q.difficulty,
      category: q.category,
      est_minutes: q.estMinutes,
      base_xp: q.baseXp,
      attribute_xp: q.attributeXp,
      coin_reward: q.coinReward ?? 0,
      streak_key: q.streakKey ?? null,
      failure_note: q.failureNote ?? "",
      assigned_date: today.toISOString(),
    };
  });
  const { error: insErr } = await db.from("quests").insert(rows);
  if (insErr) throw new Error(insErr.message);

  await notify(userId, "QUEST_GENERATED", "DAILY QUESTS GENERATED",
    `${planned.length} quests await. Complete them to advance.`);
  return { created: planned.length };
}

async function recentCompletionRatios(userId: string, days: number): Promise<number[]> {
  const start = gameDay();
  start.setUTCDate(start.getUTCDate() - days);
  const { data: quests, error } = await db
    .from("quests")
    .select("assigned_date, completion:quest_completions(result)")
    .eq("user_id", userId)
    .eq("type", "DAILY")
    .gte("assigned_date", start.toISOString());
  if (error) throw new Error(error.message);
  const byDay = new Map<string, { total: number; done: number }>();
  for (const q of quests ?? []) {
    const k = (q.assigned_date as string).slice(0, 10);
    const rec = byDay.get(k) ?? { total: 0, done: 0 };
    rec.total += 1;
    const completion = one(q.completion);
    if (completion && completion.result !== "FAILED") rec.done += 1;
    byDay.set(k, rec);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([, r]) => (r.total ? r.done / r.total : 0));
}

async function failingStreakKeys(userId: string): Promise<string[]> {
  const { data: streaks, error } = await db.from("streaks").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const today = gameDay();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const priority = ["wake", "workout", "dsa", "gate"];
  return (streaks ?? [])
    .filter((s) => priority.includes(s.key))
    .filter((s) => {
      if (!s.last_date) return true; // never done → worth prompting
      const last = gameDay(new Date(s.last_date));
      return last.getTime() < yesterday.getTime();
    })
    .map((s) => s.key as string);
}

async function distractionMinutes(userId: string, dayOffset: number): Promise<number> {
  const day = gameDay();
  day.setUTCDate(day.getUTCDate() + dayOffset);
  const next = new Date(day);
  next.setUTCDate(next.getUTCDate() + 1);
  const { data, error } = await db
    .from("activity_logs")
    .select("value")
    .eq("user_id", userId)
    .eq("kind", "reels_minutes")
    .gte("date", day.toISOString())
    .lt("date", next.toISOString());
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, row) => sum + (row.value ?? 0), 0);
}

async function weakestAttributeKey(userId: string): Promise<string | undefined> {
  const { data: attrs, error } = await db.from("attributes").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!attrs || attrs.length === 0) return undefined;
  return attrs.reduce((min, a) => (a.total_xp < min.total_xp ? a : min), attrs[0]!).key;
}
