import { describe, expect, it } from "vitest";
import {
  applyDailySoftCap,
  applyXp,
  antiFarmFactor,
  calculateFocusXP,
  calculateQuestXP,
  coinsForXp,
  cumulativeXpToLevel,
  qualityRatio,
  streakBonus,
  xpForLevel,
  MAX_LEVEL,
  DAILY_XP_SOFT_CAP,
} from "../src/engine/xp-engine.js";

describe("xp-engine (ported verbatim from Website)", () => {
  it("level curve: xpForLevel matches round(100 * L^1.5)", () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(4)).toBe(800);
    expect(xpForLevel(10)).toBe(Math.round(100 * Math.pow(10, 1.5)));
    expect(xpForLevel(MAX_LEVEL)).toBe(Infinity);
  });

  it("cumulative XP to level 100 is ~4M", () => {
    const total = cumulativeXpToLevel(100);
    expect(total).toBeGreaterThan(3_500_000);
    expect(total).toBeLessThan(4_500_000);
  });

  it("applyXp cascades multi-level-ups", () => {
    const res = applyXp({ level: 1, currentXp: 0, xpForNext: 100, totalXp: 0 }, 500);
    // 100 (L1→2) + 283 (L2→3) = 383 consumed; 117 remains at level 3
    expect(res.level).toBe(3);
    expect(res.currentXp).toBe(117);
    expect(res.totalXp).toBe(500);
  });

  it("applyXp pins at MAX_LEVEL", () => {
    const res = applyXp({ level: 99, currentXp: 0, xpForNext: xpForLevel(99), totalXp: 0 }, 10_000_000);
    expect(res.level).toBe(MAX_LEVEL);
    expect(res.currentXp).toBe(0);
  });

  it("quest XP: quality, anti-farm, streak, title all multiply", () => {
    expect(qualityRatio("COMPLETED")).toBe(1);
    expect(qualityRatio("PARTIAL")).toBe(0.5);
    expect(qualityRatio("FAILED")).toBe(0);
    expect(antiFarmFactor(0)).toBe(1);
    expect(antiFarmFactor(2)).toBeCloseTo(0.49);
    expect(antiFarmFactor(20)).toBe(0.15);
    expect(streakBonus(5)).toBeCloseTo(0.2);
    expect(streakBonus(100)).toBe(0.4);

    const xp = calculateQuestXP({
      baseXp: 100,
      difficulty: "B",
      result: "COMPLETED",
      streakDays: 5,
      repeatIndexToday: 0,
      titleBonusPct: 0.02,
    });
    expect(xp).toBe(Math.round(100 * 2.6 * 1 * 1 * 1.22));
  });

  it("failed quests earn zero", () => {
    expect(calculateQuestXP({ baseXp: 500, difficulty: "SS", result: "FAILED" })).toBe(0);
  });

  it("focus XP: under 10 minutes earns nothing; over-claiming is clipped", () => {
    expect(calculateFocusXP({ actualMinutes: 9, plannedMinutes: 60, result: "COMPLETE" })).toBe(0);
    const honest = calculateFocusXP({ actualMinutes: 60, plannedMinutes: 60, result: "COMPLETE" });
    const overclaim = calculateFocusXP({ actualMinutes: 300, plannedMinutes: 60, result: "COMPLETE" });
    expect(overclaim).toBeLessThanOrEqual(Math.round(60 * 1.2 * 2.2 * 1.25 * 1) + 1);
    expect(honest).toBeGreaterThan(0);
  });

  it("daily soft cap compresses overflow to 25%", () => {
    expect(applyDailySoftCap(0, 1000)).toBe(1000);
    expect(applyDailySoftCap(DAILY_XP_SOFT_CAP, 1000)).toBe(250);
    expect(applyDailySoftCap(DAILY_XP_SOFT_CAP - 100, 1000)).toBe(100 + Math.round(900 * 0.25));
  });

  it("coins scale at xp/20", () => {
    expect(coinsForXp(200)).toBe(10);
    expect(coinsForXp(0)).toBe(0);
  });
});
