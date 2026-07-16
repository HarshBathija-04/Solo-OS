"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/api-client";

const questResult = z.enum(["COMPLETED", "PARTIAL", "FAILED"]);

export async function completeQuestAction(input: { questId: string; result: string }) {
  const schema = z.object({ questId: z.string().min(1), result: questResult });
  const { questId, result } = schema.parse(input);
  const { award } = await apiFetch(`/v1/quests/${questId}/complete`, {
    method: "POST",
    body: JSON.stringify({ result }),
  });
  revalidatePath("/");
  revalidatePath("/quests");
  return award;
}

export async function logMainQuestProgressAction(input: { stageId: string; amount: number }) {
  const schema = z.object({
    stageId: z.string().min(1),
    amount: z.number().int().min(1).max(50),
  });
  const { stageId, amount } = schema.parse(input);
  const res = await apiFetch(`/v1/main-quests/stages/${stageId}/progress`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
  revalidatePath("/main-quests");
  revalidatePath("/");
  const { ok: _ok, ...rest } = res;
  return rest;
}

export async function generateTodayQuestsAction() {
  const res = await apiFetch("/v1/quests/generate", { method: "POST", body: "{}" });
  revalidatePath("/");
  revalidatePath("/quests");
  const { ok: _ok, ...rest } = res;
  return rest;
}

const focusCategory = z.enum([
  "GATE", "DSA", "AIML", "FULLSTACK", "DATASCIENCE", "SYSTEMDESIGN", "PROJECT",
]);

export async function startFocusAction(input: {
  category: string;
  plannedMinutes: number;
  questId?: string;
}) {
  const schema = z.object({
    category: focusCategory,
    plannedMinutes: z.number().int().min(5).max(240),
    questId: z.string().optional(),
  });
  const { category, plannedMinutes, questId } = schema.parse(input);
  const { sessionId } = await apiFetch("/v1/focus/start", {
    method: "POST",
    body: JSON.stringify({ category, plannedMinutes, questId }),
  });
  return { sessionId };
}

export async function completeFocusAction(input: {
  sessionId: string;
  actualMinutes: number;
  result: string;
}) {
  const schema = z.object({
    sessionId: z.string().min(1),
    actualMinutes: z.number().int().min(0).max(480),
    result: z.enum(["COMPLETE", "PARTIAL", "ABANDONED"]),
  });
  const { sessionId, actualMinutes, result } = schema.parse(input);
  const { award } = await apiFetch(`/v1/focus/${sessionId}/complete`, {
    method: "POST",
    body: JSON.stringify({ actualMinutes, result }),
  });
  revalidatePath("/");
  revalidatePath("/focus");
  return award;
}

export async function logHabitAction(input: {
  habitKey: string;
  result: string;
  note?: string;
}) {
  const schema = z.object({
    habitKey: z.string().min(1),
    result: z.enum(["DONE", "MISSED", "CLEAN", "RELAPSE"]),
    note: z.string().max(500).optional(),
  });
  const parsed = schema.parse(input);
  await apiFetch("/v1/habits/log", { method: "POST", body: JSON.stringify(parsed) });
  revalidatePath("/");
  revalidatePath("/shadow");
  revalidatePath("/streaks");
  return { ok: true };
}

export async function logUrgeAction(input: {
  habitKey: string;
  resisted: boolean;
  trigger?: string;
  mood?: string;
  location?: string;
  reason?: string;
}) {
  const schema = z.object({
    habitKey: z.string().min(1),
    resisted: z.boolean(),
    trigger: z.string().max(200).optional(),
    mood: z.string().max(100).optional(),
    location: z.string().max(100).optional(),
    reason: z.string().max(300).optional(),
  });
  const parsed = schema.parse(input);
  await apiFetch("/v1/urges", { method: "POST", body: JSON.stringify(parsed) });
  revalidatePath("/recovery");
  revalidatePath("/shadow");
  return { ok: true };
}

export async function completeRecoveryAction(input: { id: string }) {
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await apiFetch(`/v1/recovery/${id}/complete`, { method: "POST", body: "{}" });
  revalidatePath("/recovery");
  revalidatePath("/");
  return { ok: true };
}

export async function purchaseRewardAction(input: { rewardId: string }) {
  const { rewardId } = z.object({ rewardId: z.string().min(1) }).parse(input);
  const res = await apiFetch(`/v1/rewards/${rewardId}/purchase`, {
    method: "POST",
    body: "{}",
  });
  revalidatePath("/rewards");
  revalidatePath("/");
  return { ok: true, balance: res.balance as number };
}

export async function createRewardAction(input: {
  title: string;
  description: string;
  cost: number;
  icon?: string;
}) {
  const schema = z.object({
    title: z.string().min(1).max(80),
    description: z.string().max(200),
    cost: z.number().int().min(1).max(100000),
    icon: z.string().max(40).optional(),
  });
  const parsed = schema.parse(input);
  await apiFetch("/v1/rewards", { method: "POST", body: JSON.stringify(parsed) });
  revalidatePath("/rewards");
  return { ok: true };
}

export async function equipTitleAction(input: { titleId: string }) {
  const { titleId } = z.object({ titleId: z.string().min(1) }).parse(input);
  await apiFetch(`/v1/titles/${titleId}/equip`, { method: "POST", body: "{}" });
  revalidatePath("/titles");
  revalidatePath("/");
  return { ok: true };
}

export async function updateSettingsAction(input: {
  wakeTarget?: string;
  sleepTarget?: string;
  minSleepHours?: number;
  difficultyBias?: number;
  reduceMotion?: boolean;
  aiProvider?: string;
  aiModel?: string;
}) {
  const schema = z.object({
    wakeTarget: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    sleepTarget: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    minSleepHours: z.number().min(3).max(12).optional(),
    difficultyBias: z.number().min(0.5).max(2).optional(),
    reduceMotion: z.boolean().optional(),
    aiProvider: z.enum(["none", "anthropic", "openai", "gemini"]).optional(),
    aiModel: z.string().max(60).optional(),
  });
  const data = schema.parse(input);
  await apiFetch("/v1/settings", { method: "PATCH", body: JSON.stringify(data) });
  revalidatePath("/settings");
  return { ok: true };
}

/** Manual metric logging (steps, sleep, reels minutes, run) with sane caps. */
export async function logMetricAction(input: { kind: string; value: number }) {
  const schema = z.object({
    kind: z.enum(["steps", "sleep_hours", "reels_minutes", "run_km", "gaming_minutes"]),
    value: z.number().min(0).max(100000),
  });
  const { kind, value } = schema.parse(input);
  await apiFetch("/v1/analytics/metrics", {
    method: "POST",
    body: JSON.stringify({ kind, value }),
  });
  revalidatePath("/analytics");
  revalidatePath("/");
  return { ok: true };
}

export async function resetProfileAction() {
  await apiFetch("/v1/account/reset", { method: "POST", body: "{}" });
  revalidatePath("/");
  return { ok: true };
}
