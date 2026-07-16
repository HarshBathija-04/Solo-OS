import { Router } from "express";
import { getDashboard } from "../services/views.service.js";

export const dashboardRoutes = Router();

// Composite view for the home screen of both clients — one round-trip.
dashboardRoutes.get("/", async (req, res, next) => {
  try {
    const data = await getDashboard(req.userId);
    res.json({ ok: true, ...data });
  } catch (e) {
    next(e);
  }
});
