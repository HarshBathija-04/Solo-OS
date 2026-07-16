import { Router } from "express";
import { z } from "zod";
import { db } from "../db/supabase.js";
import { createReward, purchaseReward } from "../services/reward.service.js";

export const rewardsRoutes = Router();

rewardsRoutes.get("/", async (req, res, next) => {
  try {
    const [{ data: rewards, error: e1 }, { data: purchases, error: e2 }] = await Promise.all([
      db
        .from("rewards")
        .select("*")
        .eq("user_id", req.userId)
        .eq("active", true)
        .order("cost", { ascending: true }),
      db
        .from("reward_purchases")
        .select("*, reward:rewards(title, icon)")
        .eq("user_id", req.userId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    res.json({ ok: true, rewards, purchases });
  } catch (e) {
    next(e);
  }
});

rewardsRoutes.post("/", async (req, res, next) => {
  try {
    const input = z
      .object({
        title: z.string().min(1).max(120),
        description: z.string().max(500).default(""),
        cost: z.number().int().min(1).max(100000),
        icon: z.string().max(50).optional(),
      })
      .parse(req.body);
    const reward = await createReward({ userId: req.userId, ...input });
    res.json({ ok: true, reward });
  } catch (e) {
    next(e);
  }
});

rewardsRoutes.post("/:id/purchase", async (req, res, next) => {
  try {
    const result = await purchaseReward(req.userId, req.params.id);
    res.json({ ...result, ok: true });
  } catch (e) {
    next(e);
  }
});
