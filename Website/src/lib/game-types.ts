/**
 * Game domain types — string-literal unions that used to come from
 * `@prisma/client`. The database moved behind the Express API, so these are
 * plain TS types now. Keep them in sync with the backend enums.
 */

export type QuestType = "MAIN" | "DAILY" | "SIDE" | "EMERGENCY" | "RECOVERY" | "BOSS" | "HIDDEN";

export type Difficulty = "E" | "D" | "C" | "B" | "A" | "S" | "SS";

export type QuestStatus = "ACTIVE" | "COMPLETED" | "PARTIAL" | "FAILED" | "EXPIRED";

export type AttributeKey = "STR" | "INT" | "FOC" | "DIS" | "END" | "CON" | "SKL" | "VIT";

export type SkillStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "MASTERED";

export type HabitKind = "BUILD" | "SHADOW";

export type HabitLogResult = "DONE" | "MISSED" | "CLEAN" | "RELAPSE";

export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

export type BossStatus = "LOCKED" | "ACTIVE" | "DEFEATED";

export type FocusCategory =
  | "GATE"
  | "DSA"
  | "AIML"
  | "FULLSTACK"
  | "DATASCIENCE"
  | "SYSTEMDESIGN"
  | "PROJECT";

export type FocusResult = "COMPLETE" | "PARTIAL" | "ABANDONED";

export type TimetableCategory =
  | "STUDY"
  | "EXERCISE"
  | "MORNING_ROUTINE"
  | "BATH"
  | "BREAKFAST"
  | "LUNCH"
  | "DINNER"
  | "GAMING"
  | "BREAK"
  | "SLEEP"
  | "WORK"
  | "COMMUTE"
  | "NETWORKING";

export type TimetableState =
  | "UPCOMING"
  | "ACTIVE"
  | "COMPLETED"
  | "MISSED"
  | "SKIPPED"
  | "PAUSED"
  | "LATE"
  | "FINISHED_EARLY"
  | "EXCUSED";

/** Schedule variant a block belongs to. ALL blocks appear in every variant. */
export type TimetableDayType = "ALL" | "OFFICE" | "WFH" | "WEEKEND";

// ─────────────────── View-model row shapes (formerly Prisma model types) ───────────────────

export interface Attribute {
  id: string;
  key: AttributeKey;
  level: number;
  xp: number;
  totalXp: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: Difficulty;
  category: string;
  estMinutes: number;
  baseXp: number;
  attributeXp: Partial<Record<AttributeKey, number>>;
  coinReward: number;
  streakKey: string | null;
  failureNote: string;
  status: QuestStatus;
}

export interface QuestCompletion {
  id: string;
  result: QuestStatus;
  xpAwarded: number;
  coinsAwarded: number;
  qualityRatio: number;
}

export interface Boss {
  id: string;
  key: string;
  name: string;
  tagline: string;
  description: string;
  maxHp: number;
  phases: unknown;
  rewardXp: number;
  rewardCoins: number;
  rarity: Rarity;
}

export interface BossBattle {
  id: string;
  status: BossStatus;
  currentHp: number;
  maxHp: number;
  phase: number;
}

export interface BossBattleLog {
  id: string;
  action: string;
  damage: number;
  critical: boolean;
  createdAt: Date;
}
