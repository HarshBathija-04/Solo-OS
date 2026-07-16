import cron from "node-cron";
import { db } from "../db/supabase.js";
import { ensureTodayQuests } from "../services/quest.service.js";

/**
 * Generate the day's quests for every user at 00:00 IST (18:30 UTC) —
 * same schedule as the old Vercel cron. ensureTodayQuests is idempotent
 * and is ALSO called lazily by GET /v1/quests/today, so a missed tick
 * only delays generation until the next app open.
 */
export async function runDailyQuestGeneration(): Promise<{ users: number; created: number }> {
  const { data: users, error } = await db.from("users").select("id");
  if (error) throw new Error(error.message);
  let created = 0;
  for (const u of users ?? []) {
    try {
      const res = await ensureTodayQuests(u.id);
      created += res.created;
    } catch (e) {
      console.error(`daily-quests failed for user ${u.id}`, e);
    }
  }
  return { users: users?.length ?? 0, created };
}

export function registerDailyQuestCron() {
  cron.schedule("30 18 * * *", async () => {
    try {
      const res = await runDailyQuestGeneration();
      console.log(`daily-quests cron: ${res.created} quests across ${res.users} users`);
    } catch (e) {
      console.error("daily-quests cron failed", e);
    }
  });
}
