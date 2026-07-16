import { Router } from "express";
import { config } from "../config.js";
import { runDailyQuestGeneration } from "../cron/daily-quests.js";

export const internalRoutes = Router();

// Manual cron trigger (backup for the in-process node-cron schedule).
internalRoutes.post("/cron/daily-quests", async (req, res, next) => {
  try {
    const secret = req.headers["x-internal-secret"];
    if (!config.INTERNAL_CRON_SECRET || secret !== config.INTERNAL_CRON_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    const result = await runDailyQuestGeneration();
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});
