import { Router } from "express";
import { z } from "zod";
import {
  getTimetable,
  getDayStates,
  setBlockState,
  addBlock,
  editBlock,
  deleteBlock,
  replaceTimetable,
  logStudy,
  getStudyLogs,
} from "../services/timetable.service.js";

export const timetableRoutes = Router();

const dayType = z.enum(["ALL", "OFFICE", "WFH", "WEEKEND"]);

const blockInput = z.object({
  startHour: z.number().int().min(0).max(23),
  startMin: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(23),
  endMin: z.number().int().min(0).max(59),
  activity: z.string().min(1).max(120),
  category: z.enum([
    "STUDY",
    "EXERCISE",
    "MORNING_ROUTINE",
    "BATH",
    "BREAKFAST",
    "LUNCH",
    "DINNER",
    "GAMING",
    "BREAK",
    "SLEEP",
    "WORK",
    "COMMUTE",
    "NETWORKING",
  ]),
  xpReward: z.number().int().min(0).max(500).optional(),
  dayType: dayType.optional(),
});

timetableRoutes.get("/", async (req, res, next) => {
  try {
    const day = dayType.optional().parse(req.query.dayType);
    const [blocks, dayStates] = await Promise.all([
      getTimetable(req.userId, day),
      getDayStates(req.userId),
    ]);
    res.json({ ok: true, blocks, states: dayStates.states, excuses: dayStates.excuses });
  } catch (e) {
    next(e);
  }
});

timetableRoutes.put("/", async (req, res, next) => {
  try {
    const parsed = z
      .object({ blocks: z.array(blockInput).max(50), dayType: dayType.optional() })
      .parse(req.body);
    const saved = await replaceTimetable(req.userId, parsed.blocks, parsed.dayType);
    res.json({ ok: true, blocks: saved });
  } catch (e) {
    next(e);
  }
});

timetableRoutes.post("/blocks", async (req, res, next) => {
  try {
    const input = blockInput.parse(req.body);
    const block = await addBlock(req.userId, input);
    res.json({ ok: true, block });
  } catch (e) {
    next(e);
  }
});

timetableRoutes.patch("/blocks/:id", async (req, res, next) => {
  try {
    const updates = blockInput.partial().parse(req.body);
    const block = await editBlock(req.userId, req.params.id, updates);
    res.json({ ok: true, block });
  } catch (e) {
    next(e);
  }
});

timetableRoutes.delete("/blocks/:id", async (req, res, next) => {
  try {
    await deleteBlock(req.userId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

const blockState = z.enum([
  "UPCOMING",
  "ACTIVE",
  "COMPLETED",
  "MISSED",
  "SKIPPED",
  "PAUSED",
  "LATE",
  "FINISHED_EARLY",
  "EXCUSED",
]);

timetableRoutes.post("/blocks/:id/state", async (req, res, next) => {
  try {
    const { state, reason } = z
      .object({ state: blockState, reason: z.string().max(300).optional() })
      .parse(req.body);
    const result = await setBlockState(req.userId, req.params.id, state, reason);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

timetableRoutes.post("/study", async (req, res, next) => {
  try {
    const input = z
      .object({
        blockId: z.string().min(1),
        subject: z.string().min(1).max(120),
        durationMinutes: z.number().int().min(1).max(600),
        deepWorkScore: z.number().int().min(1).max(10).optional(),
        distractions: z.number().int().min(0).max(100).optional(),
        notes: z.string().max(2000).optional(),
        missionLinked: z.string().max(200).optional(),
      })
      .parse(req.body);
    const result = await logStudy(req.userId, input);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

timetableRoutes.get("/study", async (req, res, next) => {
  try {
    const limit = Math.min(200, Number(req.query.limit ?? 50));
    res.json({ ok: true, logs: await getStudyLogs(req.userId, limit) });
  } catch (e) {
    next(e);
  }
});
