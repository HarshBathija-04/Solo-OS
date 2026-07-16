import { Router } from "express";
import { z } from "zod";
import { db } from "../db/supabase.js";
import { gameDay } from "../engine/date.js";
import { completeFocusSession, startFocusSession } from "../services/focus.service.js";

export const focusRoutes = Router();

const focusCategory = z.enum([
  "GATE",
  "DSA",
  "AIML",
  "FULLSTACK",
  "DATASCIENCE",
  "SYSTEMDESIGN",
  "PROJECT",
]);

focusRoutes.post("/start", async (req, res, next) => {
  try {
    const input = z
      .object({
        category: focusCategory,
        plannedMinutes: z.number().int().min(5).max(240),
        questId: z.string().optional(),
      })
      .parse(req.body);
    const session = await startFocusSession({
      userId: req.userId,
      category: input.category,
      plannedMinutes: input.plannedMinutes,
      questId: input.questId,
    });
    res.json({ ok: true, sessionId: session.id });
  } catch (e) {
    next(e);
  }
});

focusRoutes.post("/:id/complete", async (req, res, next) => {
  try {
    const input = z
      .object({
        actualMinutes: z.number().int().min(0).max(600),
        result: z.enum(["COMPLETE", "PARTIAL", "ABANDONED"]),
      })
      .parse(req.body);
    const award = await completeFocusSession({
      userId: req.userId,
      sessionId: req.params.id,
      actualMinutes: input.actualMinutes,
      result: input.result,
    });
    res.json({ ok: true, award });
  } catch (e) {
    next(e);
  }
});

focusRoutes.get("/today", async (req, res, next) => {
  try {
    const { data, error } = await db
      .from("focus_sessions")
      .select("*")
      .eq("user_id", req.userId)
      .gte("started_at", gameDay().toISOString())
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ ok: true, sessions: data });
  } catch (e) {
    next(e);
  }
});
