import { Request, Response, Router } from "express";
import type { Entry as PrismaEntry } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/requireAuth";
import {
  dateStringToUtcStart,
  getUpcomingReportEntryRange
} from "../utils/reportSchedule";

const router = Router();

type Entry = {
  id: number;
  date: string;
  goalsPlanned: string;
  numGoals: number;
  goalsCompleted: number;
  distractions: string[];
  negativeComponents: string[];
  positiveComponents: string[];
  difficulty: number;
  rating: number;
  notes: string;
};

function toEntry(row: PrismaEntry): Entry {
  const date =
    row.date instanceof Date
      ? row.date.toISOString().split("T")[0]
      : String(row.date).split("T")[0];

  return {
    id: row.id,
    date,
    goalsPlanned: row.goalsPlanned,
    numGoals: row.numGoals,
    goalsCompleted: row.goalsCompleted,
    distractions: row.distractions,
    negativeComponents: row.negativeComponents,
    positiveComponents: row.positiveComponents,
    difficulty: row.difficulty,
    rating: row.rating,
    notes: row.notes ?? ""
  };
}

router.post("/api/v1/entries", requireAuth, async (req: Request, res: Response) => {
  const {
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  } = req.body;

  const date = new Date().toISOString().split("T")[0];

  const entry = await prisma.entry.create({
    data: {
      userId: req.auth!.sub,
      date: new Date(date),
      goalsPlanned,
      numGoals,
      goalsCompleted,
      distractions: distractions ?? [],
      negativeComponents: negativeComponents ?? [],
      positiveComponents: positiveComponents ?? [],
      difficulty,
      rating,
      notes: notes ?? null
    }
  });

  res.status(201).json({ data: toEntry(entry) });
});

router.get("/api/v1/entries", requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth!.sub;
  const { startDate, endDate } = getUpcomingReportEntryRange();

  const rows = await prisma.entry.findMany({
    where: {
      userId,
      date: {
        gte: dateStringToUtcStart(startDate),
        lte: dateStringToUtcStart(endDate)
      }
    },
    orderBy: [{ date: "desc" }, { id: "desc" }]
  });

  res.json({
    data: {
      entries: rows.map(toEntry),
      startDate,
      endDate
    }
  });
});

router.get("/api/v1/entries/:entryId", requireAuth, async (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const entry = await prisma.entry.findFirst({
    where: { id: entryId, userId: req.auth!.sub }
  });

  if (!entry) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  res.json({ data: toEntry(entry) });
});

router.put("/api/v1/entries/:entryId", requireAuth, async (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const {
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  } = req.body;

  const existing = await prisma.entry.findFirst({
    where: { id: entryId, userId: req.auth!.sub }
  });

  if (!existing) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  const entry = await prisma.entry.update({
    where: { id: entryId },
    data: {
      goalsPlanned,
      numGoals,
      goalsCompleted,
      distractions: distractions ?? [],
      negativeComponents: negativeComponents ?? [],
      positiveComponents: positiveComponents ?? [],
      difficulty,
      rating,
      notes: notes ?? null
    }
  });

  res.json({ data: toEntry(entry) });
});

router.delete("/api/v1/entries/:entryId", requireAuth, async (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const result = await prisma.entry.deleteMany({
    where: { id: entryId, userId: req.auth!.sub }
  });

  if (result.count === 0) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  res.json({
    data: { result: "success" }
  });
});

export default router;
