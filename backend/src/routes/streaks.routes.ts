import { Router } from "express";
import { db } from "../db/supabase.js";

export const streaksRoutes = Router();

streaksRoutes.get("/", async (req, res, next) => {
  try {
    const { data, error } = await db
      .from("streaks")
      .select("*")
      .eq("user_id", req.userId)
      .order("key", { ascending: true });
    if (error) throw new Error(error.message);
    res.json({ ok: true, streaks: data });
  } catch (e) {
    next(e);
  }
});

streaksRoutes.get("/shields", async (req, res, next) => {
  try {
    const { data, error } = await db
      .from("streak_shields")
      .select("*")
      .eq("user_id", req.userId)
      .order("earned_at", { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ ok: true, shields: data });
  } catch (e) {
    next(e);
  }
});
