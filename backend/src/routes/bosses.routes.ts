import { Router } from "express";
import { db } from "../db/supabase.js";
import { startBossBattle } from "../services/boss.service.js";

export const bossesRoutes = Router();

bossesRoutes.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await db.from("bosses").select("*").order("max_hp", { ascending: true });
    if (error) throw new Error(error.message);
    res.json({ ok: true, bosses: data });
  } catch (e) {
    next(e);
  }
});

bossesRoutes.get("/battles", async (req, res, next) => {
  try {
    const { data, error } = await db
      .from("boss_battles")
      .select("*, boss:bosses(*), logs:boss_battle_logs(*)")
      .eq("user_id", req.userId)
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ ok: true, battles: data });
  } catch (e) {
    next(e);
  }
});

bossesRoutes.post("/:id/start", async (req, res, next) => {
  try {
    const battle = await startBossBattle(req.userId, req.params.id);
    res.json({ ok: true, battle });
  } catch (e) {
    next(e);
  }
});
