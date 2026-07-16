import { Router } from "express";
import { z } from "zod";
import { db } from "../db/supabase.js";
import { getProfileView, getAttributes } from "../services/views.service.js";

export const profileRoutes = Router();

profileRoutes.get("/profile", async (req, res, next) => {
  try {
    res.json({ ok: true, profile: await getProfileView(req.userId) });
  } catch (e) {
    next(e);
  }
});

profileRoutes.get("/attributes", async (req, res, next) => {
  try {
    res.json({ ok: true, attributes: await getAttributes(req.userId) });
  } catch (e) {
    next(e);
  }
});

profileRoutes.get("/attributes/history", async (req, res, next) => {
  try {
    const limit = Math.min(500, Number(req.query.limit ?? 100));
    const { data, error } = await db
      .from("attribute_history")
      .select("*")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    res.json({ ok: true, history: data });
  } catch (e) {
    next(e);
  }
});

profileRoutes.get("/settings", async (req, res, next) => {
  try {
    const { data, error } = await db
      .from("user_settings")
      .select("*")
      .eq("user_id", req.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    res.json({ ok: true, settings: data });
  } catch (e) {
    next(e);
  }
});

const settingsPatch = z.object({
  wakeTarget: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  sleepTarget: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  minSleepHours: z.number().min(0).max(14).optional(),
  difficultyBias: z.number().min(0.5).max(2).optional(),
  reduceMotion: z.boolean().optional(),
  aiProvider: z.string().optional(),
  aiModel: z.string().optional(),
  theme: z.string().optional(),
  timezone: z.string().optional(),
});

profileRoutes.patch("/settings", async (req, res, next) => {
  try {
    const input = settingsPatch.parse(req.body);
    const patch: Record<string, unknown> = {};
    if (input.wakeTarget !== undefined) patch.wake_target = input.wakeTarget;
    if (input.sleepTarget !== undefined) patch.sleep_target = input.sleepTarget;
    if (input.minSleepHours !== undefined) patch.min_sleep_hours = input.minSleepHours;
    if (input.difficultyBias !== undefined) patch.difficulty_bias = input.difficultyBias;
    if (input.reduceMotion !== undefined) patch.reduce_motion = input.reduceMotion;
    if (input.aiProvider !== undefined) patch.ai_provider = input.aiProvider;
    if (input.aiModel !== undefined) patch.ai_model = input.aiModel;
    if (input.theme !== undefined) patch.theme = input.theme;
    if (input.timezone !== undefined) patch.timezone = input.timezone;
    const { error } = await db.from("user_settings").update(patch).eq("user_id", req.userId);
    if (error) throw new Error(error.message);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
