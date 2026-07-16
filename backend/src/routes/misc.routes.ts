import { Router } from "express";
import { z } from "zod";
import { db } from "../db/supabase.js";
import { AppError } from "../middleware/error.js";

export const miscRoutes = Router();

// ─────────────────── Achievements ───────────────────

miscRoutes.get("/achievements", async (req, res, next) => {
  try {
    const { data, error } = await db
      .from("user_achievements")
      .select("*, achievement:achievements(*)")
      .eq("user_id", req.userId);
    if (error) throw new Error(error.message);
    res.json({ ok: true, achievements: data });
  } catch (e) {
    next(e);
  }
});

// ─────────────────── Titles ───────────────────

miscRoutes.get("/titles", async (req, res, next) => {
  try {
    const [{ data: owned, error: e1 }, { data: profile, error: e2 }] = await Promise.all([
      db
        .from("user_titles")
        .select("*, title:titles(*)")
        .eq("user_id", req.userId)
        .order("acquired_at", { ascending: true }),
      db.from("player_profiles").select("equipped_title_id").eq("user_id", req.userId).maybeSingle(),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    res.json({ ok: true, titles: owned, equippedTitleId: profile?.equipped_title_id ?? null });
  } catch (e) {
    next(e);
  }
});

miscRoutes.post("/titles/:id/equip", async (req, res, next) => {
  try {
    // Verify the player owns the title before equipping (ported from equipTitleAction).
    const { data: owned, error } = await db
      .from("user_titles")
      .select("id")
      .eq("user_id", req.userId)
      .eq("title_id", req.params.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!owned) throw new AppError("Title not owned", 403);
    const { error: e2 } = await db
      .from("player_profiles")
      .update({ equipped_title_id: req.params.id })
      .eq("user_id", req.userId);
    if (e2) throw new Error(e2.message);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ─────────────────── Skills ───────────────────

miscRoutes.get("/skills", async (req, res, next) => {
  try {
    const { data, error } = await db
      .from("skill_trees")
      .select("*, nodes:skill_nodes(*, progress:skill_progress(*))")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    res.json({ ok: true, trees: data });
  } catch (e) {
    next(e);
  }
});

// ─────────────────── Notifications ───────────────────

miscRoutes.get("/notifications", async (req, res, next) => {
  try {
    const limit = Math.min(100, Number(req.query.limit ?? 30));
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    res.json({ ok: true, notifications: data });
  } catch (e) {
    next(e);
  }
});

miscRoutes.post("/notifications/read", async (req, res, next) => {
  try {
    const { ids } = z.object({ ids: z.array(z.string()).max(100).optional() }).parse(req.body ?? {});
    let query = db.from("notifications").update({ read: true }).eq("user_id", req.userId);
    if (ids && ids.length > 0) query = query.in("id", ids);
    const { error } = await query;
    if (error) throw new Error(error.message);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ─────────────────── Activity feed ───────────────────

miscRoutes.get("/activity", async (req, res, next) => {
  try {
    const limit = Math.min(200, Number(req.query.limit ?? 50));
    const [{ data: logs, error: e1 }, { data: coins, error: e2 }] = await Promise.all([
      db
        .from("activity_logs")
        .select("*")
        .eq("user_id", req.userId)
        .order("created_at", { ascending: false })
        .limit(limit),
      db
        .from("coin_transactions")
        .select("*")
        .eq("user_id", req.userId)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    res.json({ ok: true, logs, coinTransactions: coins });
  } catch (e) {
    next(e);
  }
});
