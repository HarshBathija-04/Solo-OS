/**
 * One-time cuid→uuid data migration: old Prisma tables → new Supabase schema.
 *
 * ── How it works ──────────────────────────────────────────────────────────
 * The old Prisma tables are expected to still live in the SAME Supabase
 * project's `public` schema under Prisma's original PascalCase names
 * ("User", "Quest", ...). PostgREST exposes them, so `db.from("User")`
 * reads them directly — no pg driver needed.
 *
 *   1. Global tables (Title, Achievement, Boss, QuestTemplate) are copied
 *      FIRST with their ORIGINAL ids, so every FK reference stays valid.
 *      (seed.ts upserts by `key` later without breaking these ids.)
 *   2. Each old "User" row becomes a Supabase Auth user via
 *      `auth.admin.createUser({ password_hash })` (bcrypt import — passwords
 *      keep working). The auth trigger creates the public.users row.
 *      This builds the cuid→uuid user-id map.
 *   3. Every per-user table is copied old→new: camelCase → snake_case,
 *      `userId` (cuid) → `user_id` (uuid). All other PK/FK ids are text in
 *      the new schema and are preserved verbatim.
 *
 * Each table is wrapped in try/catch — the script keeps going on partial
 * failure and prints a summary at the end. Re-running is safe-ish (inserts
 * use upsert on id), but this is intended as a one-time migration.
 *
 * Required env vars:
 *   SUPABASE_URL                — project URL
 *   SUPABASE_SERVICE_ROLE_KEY   — service-role key
 *
 * Run: npm run migrate-data
 */
import { db } from "../src/db/supabase.js";

// ─────────────────── helpers ───────────────────

const camelToSnake = (key: string): string => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** camelCase keys → snake_case keys (shallow — column names only). */
function snakeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[camelToSnake(k)] = v;
  return out;
}

/** Read ALL rows of an old Prisma table, paginated (PostgREST caps pages). */
async function readAll(table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await db.from(table).select("*").range(from, from + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < page) break;
  }
  return rows;
}

/** Insert in chunks, upserting on the preserved primary key. */
async function writeAll(table: string, rows: Record<string, unknown>[]): Promise<void> {
  const chunk = 500;
  for (let i = 0; i < rows.length; i += chunk) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + chunk), { onConflict: "id" });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

interface Summary {
  table: string;
  copied: number;
  status: "ok" | "failed" | "skipped";
  note?: string;
}
const summary: Summary[] = [];

// ─────────────────── main ───────────────────

async function main() {
  const userIdMap = new Map<string, string>(); // old cuid → new auth uuid
  // old global id → new global id (per table), matched by unique `key`.
  const globalIdMaps: Record<string, Map<string, string>> = {
    titles: new Map(),
    achievements: new Map(),
    bosses: new Map(),
    quest_templates: new Map(),
  };

  // ── 1. Globals first. If the new table was already seeded (seed.ts /
  // seed-direct.ts), rows exist under NEW ids — match by `key` and build an
  // id map instead of inserting. Old rows whose key is missing are inserted
  // with their original id.
  const globalTables: Array<[string, string]> = [
    ["Title", "titles"],
    ["Achievement", "achievements"],
    ["Boss", "bosses"],
    ["QuestTemplate", "quest_templates"],
  ];
  for (const [oldTable, newTable] of globalTables) {
    try {
      const rows = await readAll(oldTable);
      const { data: existing, error } = await db.from(newTable).select("id, key");
      if (error) throw new Error(`${newTable}: ${error.message}`);
      const byKey = new Map((existing ?? []).map((r) => [r.key as string, r.id as string]));

      const toInsert: Record<string, unknown>[] = [];
      for (const row of rows) {
        const oldId = row.id as string;
        const key = row.key as string;
        const newId = byKey.get(key);
        if (newId) {
          globalIdMaps[newTable]!.set(oldId, newId);
        } else {
          toInsert.push(snakeRow(row));
          globalIdMaps[newTable]!.set(oldId, oldId); // inserted with original id
        }
      }
      if (toInsert.length) await writeAll(newTable, toInsert);
      summary.push({
        table: newTable,
        copied: toInsert.length,
        status: "ok",
        note: `${rows.length - toInsert.length} matched by key`,
      });
      console.log(`✓ ${oldTable} → ${newTable}: ${toInsert.length} inserted, ${rows.length - toInsert.length} matched by key`);
    } catch (e) {
      summary.push({ table: newTable, copied: 0, status: "failed", note: String(e) });
      console.error(`✗ ${oldTable} → ${newTable}:`, e);
    }
  }

  // ── 2. Users → Supabase Auth (bcrypt hash import) ──
  try {
    const users = await readAll("User");
    for (const u of users) {
      const email = u.email as string;
      const oldId = u.id as string;
      const name = u.name as string;
      try {
        const { data, error } = await db.auth.admin.createUser({
          email,
          email_confirm: true,
          password_hash: u.passwordHash as string,
          user_metadata: { name },
        });
        if (error) {
          // Already migrated? Find the existing auth user by email.
          const { data: list, error: listError } = await db.auth.admin.listUsers({ perPage: 1000 });
          if (listError) throw new Error(listError.message);
          const existing = list.users.find((au) => au.email === email);
          if (!existing) throw new Error(error.message);
          userIdMap.set(oldId, existing.id);
        } else {
          userIdMap.set(oldId, data.user.id);
        }
        // Trigger creates public.users; make sure the name matches the old row.
        const newId = userIdMap.get(oldId)!;
        await db.from("users").upsert({ id: newId, email, name }, { onConflict: "id" });
        console.log(`✓ user ${email}: ${oldId} → ${newId}`);
      } catch (e) {
        console.error(`✗ user ${email}:`, e);
      }
    }
    summary.push({ table: "users(auth)", copied: userIdMap.size, status: "ok" });
  } catch (e) {
    summary.push({ table: "users(auth)", copied: 0, status: "failed", note: String(e) });
    console.error("✗ User table:", e);
  }

  // ── 3. Per-user tables (order respects FK dependencies) ──
  // [oldName, newName]. `userId` is rewritten through the map; every other
  // column is a straight camelCase→snake_case rename with the value preserved.
  const userTables: Array<[string, string]> = [
    ["UserSettings", "user_settings"],
    ["PlayerProfile", "player_profiles"],
    ["LevelProgress", "level_progress"],
    ["Attribute", "attributes"],
    ["AttributeHistory", "attribute_history"],
    ["MainQuest", "main_quests"],
    ["MainQuestStage", "main_quest_stages"],
    ["BossBattle", "boss_battles"],
    ["Quest", "quests"],
    ["QuestCompletion", "quest_completions"],
    ["BossBattleLog", "boss_battle_logs"],
    ["SkillTree", "skill_trees"],
    ["SkillNode", "skill_nodes"],
    ["SkillProgress", "skill_progress"],
    ["Habit", "habits"],
    ["HabitLog", "habit_logs"],
    ["UrgeLog", "urge_logs"],
    ["RecoveryQuest", "recovery_quests"],
    ["FocusSession", "focus_sessions"],
    ["UserAchievement", "user_achievements"],
    ["UserTitle", "user_titles"],
    ["Streak", "streaks"],
    ["StreakShield", "streak_shields"],
    ["Reward", "rewards"],
    ["RewardPurchase", "reward_purchases"],
    ["CoinTransaction", "coin_transactions"],
    ["Report", "reports"],
    ["ActivityLog", "activity_logs"],
    ["Notification", "notifications"],
    ["TimetableBlock", "timetable_blocks"],
    ["TimetableBlockLog", "timetable_block_logs"],
    ["StudyLog", "study_logs"],
  ];

  for (const [oldTable, newTable] of userTables) {
    try {
      const rows = await readAll(oldTable);
      const mapped: Record<string, unknown>[] = [];
      let dropped = 0;
      for (const row of rows) {
        const out = snakeRow(row);
        if ("user_id" in out) {
          const newUserId = userIdMap.get(out.user_id as string);
          if (!newUserId) {
            dropped++;
            continue; // owning user wasn't migrated — skip the row
          }
          out.user_id = newUserId;
        }
        // Remap FK columns that point at global tables (ids may have changed
        // if the new tables were seeded before this migration ran).
        const remap = (col: string, map: Map<string, string>, required: boolean): boolean => {
          const v = out[col] as string | null | undefined;
          if (v == null) return true;
          const mappedId = map.get(v);
          if (mappedId) {
            out[col] = mappedId;
            return true;
          }
          if (required) return false; // unmappable required FK — drop the row
          out[col] = null;
          return true;
        };
        let keep = true;
        if (newTable === "player_profiles") keep = remap("equipped_title_id", globalIdMaps.titles!, false);
        if (newTable === "boss_battles") keep = remap("boss_id", globalIdMaps.bosses!, true);
        if (newTable === "quests") keep = remap("template_id", globalIdMaps.quest_templates!, false);
        if (newTable === "user_achievements") keep = remap("achievement_id", globalIdMaps.achievements!, true);
        if (newTable === "user_titles") keep = remap("title_id", globalIdMaps.titles!, true);
        if (!keep) {
          dropped++;
          continue;
        }
        mapped.push(out);
      }
      await writeAll(newTable, mapped);
      summary.push({
        table: newTable,
        copied: mapped.length,
        status: "ok",
        note: dropped ? `${dropped} rows dropped (unmapped user)` : undefined,
      });
      console.log(`✓ ${oldTable} → ${newTable}: ${mapped.length}${dropped ? ` (${dropped} dropped)` : ""}`);
    } catch (e) {
      summary.push({ table: newTable, copied: 0, status: "failed", note: String(e) });
      console.error(`✗ ${oldTable} → ${newTable}:`, e);
    }
  }

  // ── Summary ──
  console.log("\n──────── MIGRATION SUMMARY ────────");
  for (const s of summary) {
    const mark = s.status === "ok" ? "✓" : s.status === "skipped" ? "→" : "✗";
    console.log(`${mark} ${s.table.padEnd(24)} ${String(s.copied).padStart(6)}  ${s.note ?? ""}`);
  }
  const failed = summary.filter((s) => s.status === "failed");
  console.log(failed.length ? `\n⚠ ${failed.length} table(s) failed.` : "\n✅ Migration complete.");
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
