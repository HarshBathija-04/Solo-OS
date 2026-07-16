"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/api-client";

const timetableState = z.enum([
  "UPCOMING",
  "ACTIVE",
  "COMPLETED",
  "MISSED",
  "SKIPPED",
  "PAUSED",
  "LATE",
  "FINISHED_EARLY",
  "EXCUSED",
]);

const category = z.enum([
  "STUDY",
  "EXERCISE",
  "MORNING_ROUTINE",
  "BATH",
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "GAMING",
  "BREAK",
  "SLEEP",
  "WORK",
  "COMMUTE",
  "NETWORKING",
]);

const dayType = z.enum(["ALL", "OFFICE", "WFH", "WEEKEND"]);

const blockInput = z.object({
  order: z.number().int().min(0).max(100).optional(),
  startHour: z.number().int().min(0).max(23),
  startMin: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(23),
  endMin: z.number().int().min(0).max(59),
  activity: z.string().min(1).max(80),
  category,
  xpReward: z.number().int().min(0).max(500),
  dayType: dayType.optional(),
});

export async function setBlockStateAction(input: {
  blockId: string;
  state: string;
  reason?: string;
}) {
  const { blockId, state, reason } = z
    .object({
      blockId: z.string().min(1),
      state: timetableState,
      reason: z.string().max(300).optional(),
    })
    .parse(input);
  const res = await apiFetch(`/v1/timetable/blocks/${blockId}/state`, {
    method: "POST",
    body: JSON.stringify(state === "EXCUSED" && reason ? { state, reason } : { state }),
  });
  revalidatePath("/timetable");
  revalidatePath("/");
  const { ok: _ok, ...rest } = res;
  return rest as { xpAwarded: number };
}

export async function addBlockAction(input: z.infer<typeof blockInput>) {
  const { order: _order, ...data } = blockInput.parse(input);
  const { block } = await apiFetch("/v1/timetable/blocks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/timetable");
  return block;
}

export async function editBlockAction(input: { blockId: string; updates: Partial<z.infer<typeof blockInput>> }) {
  const { blockId, updates } = z
    .object({ blockId: z.string().min(1), updates: blockInput.partial() })
    .parse(input);
  const { order: _order, ...data } = updates;
  const { block } = await apiFetch(`/v1/timetable/blocks/${blockId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  revalidatePath("/timetable");
  return block;
}

export async function deleteBlockAction(input: { blockId: string }) {
  const { blockId } = z.object({ blockId: z.string().min(1) }).parse(input);
  await apiFetch(`/v1/timetable/blocks/${blockId}`, { method: "DELETE" });
  revalidatePath("/timetable");
  return { ok: true };
}

export async function logStudyAction(input: {
  blockId: string;
  subject: string;
  durationMinutes: number;
  deepWorkScore: number;
  distractions: number;
  notes?: string;
  missionLinked?: string;
}) {
  const data = z
    .object({
      blockId: z.string().min(1),
      subject: z.string().min(1).max(40),
      durationMinutes: z.number().int().min(0).max(600),
      deepWorkScore: z.number().int().min(1).max(10),
      distractions: z.number().int().min(0).max(200),
      notes: z.string().max(1000).optional(),
      missionLinked: z.string().max(120).optional(),
    })
    .parse(input);
  // The API requires at least 1 minute; a 0-minute log earns nothing anyway.
  if (data.durationMinutes < 1) return { xpAwarded: 0 };
  const res = await apiFetch("/v1/timetable/study", {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/timetable");
  revalidatePath("/");
  const { ok: _ok, ...rest } = res;
  return rest as { xpAwarded: number };
}
