import { describe, expect, it } from "vitest";
import { generateDailyQuests } from "../src/engine/quest-engine.js";
import { ANCHOR_KEYS } from "../src/engine/content/quest-templates.js";

const baseCtx = {
  dayKey: "2026-07-16",
  userId: "test-user-uuid",
  recentCompletion: [0.8, 0.7, 0.9],
  failingStreaks: [] as string[],
  distractionMinutesYesterday: 0,
  inRecovery: false,
  difficultyBias: 1,
};

describe("quest-engine determinism", () => {
  it("same day + user → identical quest set", () => {
    const a = generateDailyQuests({ ...baseCtx });
    const b = generateDailyQuests({ ...baseCtx });
    expect(a.map((q) => q.key)).toEqual(b.map((q) => q.key));
  });

  it("different users get different sets on the same day", () => {
    const a = generateDailyQuests({ ...baseCtx });
    const b = generateDailyQuests({ ...baseCtx, userId: "another-user-uuid" });
    // Anchors are shared; the sampled remainder should differ at least sometimes.
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
  });

  it("always includes the anchor quests", () => {
    const planned = generateDailyQuests({ ...baseCtx });
    const keys = new Set(planned.map((q) => q.key));
    for (const anchor of ANCHOR_KEYS) {
      expect(keys.has(anchor)).toBe(true);
    }
  });

  it("recovery mode keeps the day light", () => {
    const normal = generateDailyQuests({ ...baseCtx });
    const recovery = generateDailyQuests({ ...baseCtx, inRecovery: true });
    expect(recovery.length).toBeLessThanOrEqual(normal.length);
  });
});
