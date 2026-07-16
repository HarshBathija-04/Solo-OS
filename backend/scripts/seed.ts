/**
 * Global-content seeder for ARISE//OS (Supabase).
 * Upserts titles, achievements, bosses, and quest templates keyed by `key`.
 * Per-user state is seeded by POST /account/bootstrap, not here.
 *
 * Run: npm run seed
 *
 * Required env vars (loaded from process.env — export them or use a .env loader):
 *   SUPABASE_URL                — project URL
 *   SUPABASE_SERVICE_ROLE_KEY   — service-role key (writes bypass RLS)
 */
import { db } from "../src/db/supabase.js";
import { TITLES } from "../src/engine/content/titles.js";
import { ACHIEVEMENTS } from "../src/engine/content/achievements.js";
import { BOSSES } from "../src/engine/content/bosses.js";
import { QUEST_TEMPLATES } from "../src/engine/content/quest-templates.js";

async function main() {
  console.log("→ Seeding global content...");

  // ── Titles (needed before achievements reference them by key) ──
  {
    const { error } = await db.from("titles").upsert(
      TITLES.map((t) => ({
        key: t.key,
        name: t.name,
        description: t.description,
        rarity: t.rarity,
        xp_bonus_pct: t.xpBonusPct,
      })),
      { onConflict: "key" },
    );
    if (error) throw new Error(`titles: ${error.message}`);
    console.log(`  ✓ ${TITLES.length} titles`);
  }

  // ── Achievements ──
  {
    const { error } = await db.from("achievements").upsert(
      ACHIEVEMENTS.map((a) => ({
        key: a.key,
        title: a.title,
        description: a.description,
        rarity: a.rarity,
        category: a.category,
        target_value: a.targetValue,
        metric: a.metric,
        xp_reward: a.xpReward,
        coin_reward: a.coinReward,
        title_key: a.titleKey ?? null,
        hidden: a.hidden ?? false,
      })),
      { onConflict: "key" },
    );
    if (error) throw new Error(`achievements: ${error.message}`);
    console.log(`  ✓ ${ACHIEVEMENTS.length} achievements`);
  }

  // ── Bosses ──
  {
    const { error } = await db.from("bosses").upsert(
      BOSSES.map((b) => ({
        key: b.key,
        name: b.name,
        tagline: b.tagline,
        description: b.description,
        max_hp: b.maxHp,
        phases: b.phases,
        reward_xp: b.rewardXp,
        reward_coins: b.rewardCoins,
        reward_title: b.rewardTitle ?? null,
        rarity: b.rarity,
      })),
      { onConflict: "key" },
    );
    if (error) throw new Error(`bosses: ${error.message}`);
    console.log(`  ✓ ${BOSSES.length} bosses`);
  }

  // ── Quest templates ──
  {
    const { error } = await db.from("quest_templates").upsert(
      QUEST_TEMPLATES.map((t) => ({
        key: t.key,
        title: t.title,
        description: t.description,
        type: t.type,
        difficulty: t.difficulty,
        category: t.category,
        est_minutes: t.estMinutes,
        base_xp: t.baseXp,
        attribute_xp: t.attributeXp,
        coin_reward: t.coinReward ?? 0,
        streak_key: t.streakKey ?? null,
        failure_note: t.failureNote ?? "",
      })),
      { onConflict: "key" },
    );
    if (error) throw new Error(`quest_templates: ${error.message}`);
    console.log(`  ✓ ${QUEST_TEMPLATES.length} quest templates`);
  }

  console.log("\n✅ Global seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
