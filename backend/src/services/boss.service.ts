/**
 * Boss battle mechanics: quest/focus categories chip away at active bosses;
 * defeating a boss grants its rewards.
 */
import { db } from "../db/supabase.js";
import { AppError } from "../middleware/error.js";
import type { QuestStatus } from "../db/tables.js";
import { grantXp, notify, bumpMetric } from "./xp.service.js";

// ─────────────────── Boss battles ───────────────────

const BOSS_DAMAGE: Record<string, number> = {
  focus: 10, study: 12, fitness: 15, discipline: 8, recovery: 6,
};

export async function maybeDamageActiveBosses(userId: string, category: string, result: QuestStatus) {
  if (result === "FAILED") return;
  const base = BOSS_DAMAGE[category];
  if (!base) return;

  const { data: battles, error } = await db
    .from("boss_battles")
    .select("*, boss:bosses(*)")
    .eq("user_id", userId)
    .eq("status", "ACTIVE");
  if (error) throw new Error(error.message);

  for (const battle of battles ?? []) {
    const boss = Array.isArray(battle.boss) ? battle.boss[0] : battle.boss;
    if (!boss) continue;

    // Deterministic "critical": every 5th log lands a 2x hit.
    const { count, error: cErr } = await db
      .from("boss_battle_logs")
      .select("id", { count: "exact", head: true })
      .eq("battle_id", battle.id);
    if (cErr) throw new Error(cErr.message);
    const priorLogs = count ?? 0;
    const critical = (priorLogs + 1) % 5 === 0;
    const damage = critical ? base * 2 : base;
    const hpAfter = Math.max(0, battle.current_hp - damage);

    const { error: lErr } = await db.from("boss_battle_logs").insert({
      battle_id: battle.id, action: category, damage, critical, hp_after: hpAfter,
    });
    if (lErr) throw new Error(lErr.message);

    const defeated = hpAfter <= 0;
    // Advance phase based on remaining HP thresholds.
    const phases = (boss.phases as Array<{ threshold: number }>) ?? [];
    const frac = hpAfter / battle.max_hp;
    let phase = 0;
    phases.forEach((p, i) => { if (frac <= p.threshold) phase = i; });

    const { error: bErr } = await db
      .from("boss_battles")
      .update({
        current_hp: hpAfter,
        phase,
        status: defeated ? "DEFEATED" : "ACTIVE",
        ended_at: defeated ? new Date().toISOString() : null,
      })
      .eq("id", battle.id);
    if (bErr) throw new Error(bErr.message);

    if (defeated) {
      await grantXp({
        userId, rawXp: boss.reward_xp, attributeXp: {},
        coinReason: "BOSS", source: `boss:${boss.key}`, extraCoins: boss.reward_coins,
      });
      if (boss.reward_title) {
        const { data: title, error: tErr } = await db
          .from("titles")
          .select("*")
          .eq("key", boss.reward_title)
          .maybeSingle();
        if (tErr) throw new Error(tErr.message);
        if (title) {
          const { data: has, error: hErr } = await db
            .from("user_titles")
            .select("*")
            .eq("user_id", userId)
            .eq("title_id", title.id)
            .maybeSingle();
          if (hErr) throw new Error(hErr.message);
          if (!has) {
            const { error: iErr } = await db.from("user_titles").insert({ user_id: userId, title_id: title.id });
            if (iErr) throw new Error(iErr.message);
          }
        }
      }
      await bumpMetric(userId, "boss_defeated", 1);
      await notify(userId, "BOSS_DEFEATED", "BOSS DEFEATED", `${boss.name} has fallen. +${boss.reward_xp} XP.`);
    }
  }
}

/** Begin (or restart) a battle against a boss. */
export async function startBossBattle(userId: string, bossId: string) {
  const { data: boss, error } = await db
    .from("bosses")
    .select("*")
    .eq("id", bossId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!boss) throw new AppError("Boss not found", 404);

  const { data: battle, error: uErr } = await db
    .from("boss_battles")
    .upsert(
      { user_id: userId, boss_id: boss.id, status: "ACTIVE", current_hp: boss.max_hp, max_hp: boss.max_hp },
      { onConflict: "user_id,boss_id" },
    )
    .select("*")
    .single();
  if (uErr) throw new Error(uErr.message);

  await notify(userId, "BOSS_ENCOUNTER", "BOSS ENCOUNTER", `${boss.name} — ${boss.tagline}`);
  return battle;
}
