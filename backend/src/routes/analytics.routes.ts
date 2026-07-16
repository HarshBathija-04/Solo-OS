import { Router } from "express";
import { z } from "zod";
import { getDailyMetrics, getHeatmap, getPerformance } from "../services/views.service.js";
import { logActivity } from "../services/xp.service.js";

export const analyticsRoutes = Router();

analyticsRoutes.get("/performance", async (req, res, next) => {
  try {
    res.json({ ok: true, performance: await getPerformance(req.userId) });
  } catch (e) {
    next(e);
  }
});

analyticsRoutes.get("/heatmap", async (req, res, next) => {
  try {
    const days = Math.min(365, Number(req.query.days ?? 120));
    res.json({ ok: true, heatmap: await getHeatmap(req.userId, days) });
  } catch (e) {
    next(e);
  }
});

analyticsRoutes.get("/metrics", async (req, res, next) => {
  try {
    const days = Math.min(180, Number(req.query.days ?? 30));
    res.json({ ok: true, metrics: await getDailyMetrics(req.userId, days) });
  } catch (e) {
    next(e);
  }
});

// Manual metric logging (steps, sleep, reels minutes...) — ported from logMetricAction.
analyticsRoutes.post("/metrics", async (req, res, next) => {
  try {
    const { kind, value } = z
      .object({
        kind: z.enum(["steps", "sleep_hours", "reels_minutes", "run_km", "gaming_minutes"]),
        value: z.number().min(0).max(100000),
      })
      .parse(req.body);
    await logActivity(req.userId, kind, value);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
