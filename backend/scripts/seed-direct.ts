/**
 * Seeds GLOBAL game content (titles, achievements, bosses, quest templates)
 * over a direct Postgres connection — no service-role key needed.
 * Idempotent: upserts on each row's unique `key`.
 *
 * Usage:
 *   DIRECT_URL=postgresql://... npx tsx scripts/seed-direct.ts
 *
 * (scripts/seed.ts does the same via supabase-js if you have the
 *  SUPABASE_SERVICE_ROLE_KEY set instead.)
 */
import pg from "pg";
import { TITLES } from "../src/engine/content/titles.js";
import { ACHIEVEMENTS } from "../src/engine/content/achievements.js";
import { BOSSES } from "../src/engine/content/bosses.js";
import { QUEST_TEMPLATES } from "../src/engine/content/quest-templates.js";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Set DIRECT_URL to the direct Postgres connection string.");
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // ── Titles (before achievements, which reference title keys) ──
    for (const t of TITLES) {
      await client.query(
        `insert into titles (key, name, description, rarity, xp_bonus_pct)
         values ($1, $2, $3, $4, $5)
         on conflict (key) do update set
           name = excluded.name, description = excluded.description,
           rarity = excluded.rarity, xp_bonus_pct = excluded.xp_bonus_pct`,
        [t.key, t.name, t.description, t.rarity, t.xpBonusPct],
      );
    }
    console.log(`✓ ${TITLES.length} titles`);

    // ── Achievements ──
    for (const a of ACHIEVEMENTS) {
      await client.query(
        `insert into achievements
           (key, title, description, rarity, category, target_value, metric,
            xp_reward, coin_reward, title_key, hidden)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (key) do update set
           title = excluded.title, description = excluded.description,
           rarity = excluded.rarity, category = excluded.category,
           target_value = excluded.target_value, metric = excluded.metric,
           xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward,
           title_key = excluded.title_key, hidden = excluded.hidden`,
        [
          a.key, a.title, a.description, a.rarity, a.category, a.targetValue,
          a.metric, a.xpReward, a.coinReward, a.titleKey ?? null, a.hidden ?? false,
        ],
      );
    }
    console.log(`✓ ${ACHIEVEMENTS.length} achievements`);

    // ── Bosses ──
    for (const b of BOSSES) {
      await client.query(
        `insert into bosses
           (key, name, tagline, description, max_hp, phases, reward_xp,
            reward_coins, reward_title, rarity)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         on conflict (key) do update set
           name = excluded.name, tagline = excluded.tagline,
           description = excluded.description, max_hp = excluded.max_hp,
           phases = excluded.phases, reward_xp = excluded.reward_xp,
           reward_coins = excluded.reward_coins, reward_title = excluded.reward_title,
           rarity = excluded.rarity`,
        [
          b.key, b.name, b.tagline, b.description, b.maxHp,
          JSON.stringify(b.phases), b.rewardXp, b.rewardCoins,
          b.rewardTitle ?? null, b.rarity,
        ],
      );
    }
    console.log(`✓ ${BOSSES.length} bosses`);

    // ── Quest templates ──
    for (const t of QUEST_TEMPLATES) {
      await client.query(
        `insert into quest_templates
           (key, title, description, type, difficulty, category, est_minutes,
            base_xp, attribute_xp, coin_reward, streak_key, failure_note)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         on conflict (key) do update set
           title = excluded.title, description = excluded.description,
           type = excluded.type, difficulty = excluded.difficulty,
           category = excluded.category, est_minutes = excluded.est_minutes,
           base_xp = excluded.base_xp, attribute_xp = excluded.attribute_xp,
           coin_reward = excluded.coin_reward, streak_key = excluded.streak_key,
           failure_note = excluded.failure_note`,
        [
          t.key, t.title, t.description, t.type, t.difficulty, t.category,
          t.estMinutes, t.baseXp, JSON.stringify(t.attributeXp),
          t.coinReward ?? 0, t.streakKey ?? null, t.failureNote ?? "",
        ],
      );
    }
    console.log(`✓ ${QUEST_TEMPLATES.length} quest templates`);

    console.log("✅ global content seeded");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
