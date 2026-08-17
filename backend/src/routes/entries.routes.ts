import { Request, Response, Router } from "express";
import type { Entry as PrismaEntry } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { parseEntryPayload } from "../utils/entryValidation";
import { getUpcomingReportEntryRange } from "../utils/reportSchedule";

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
  mood: number | null;
  motivation: number | null;
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
    mood: row.mood,
    motivation: row.motivation,
    notes: row.notes ?? ""
  };
}

router.post("/api/v1/entries", requireAuth, async (req: Request, res: Response) => {
  const parsed = parseEntryPayload(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      error: { message: parsed.message }
    });
  }

  const date = new Date().toISOString().split("T")[0];

  const entry = await prisma.entry.create({
    data: {
      userId: req.auth!.userId,
      date: new Date(date),
      ...parsed.data
    }
  });

  res.status(201).json({ data: toEntry(entry) });
});

router.get("/api/v1/entries", requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { startDate, endDate } = getUpcomingReportEntryRange();

  const rows = await prisma.entry.findMany({
    where: { userId },
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
    where: { id: entryId, userId: req.auth!.userId }
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
  const parsed = parseEntryPayload(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      error: { message: parsed.message }
    });
  }

  const existing = await prisma.entry.findFirst({
    where: { id: entryId, userId: req.auth!.userId }
  });

  if (!existing) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  const entry = await prisma.entry.update({
    where: { id: entryId },
    data: parsed.data
  });

  res.json({ data: toEntry(entry) });
});

router.delete("/api/v1/entries/:entryId", requireAuth, async (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const result = await prisma.entry.deleteMany({
    where: { id: entryId, userId: req.auth!.userId }
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
