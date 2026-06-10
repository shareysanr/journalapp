import { Request, Response, Router } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/requireAuth";
import {
  dateStringToUtcStart,
  getCurrentWeekRange,
  getDaysUntilNextReport
} from "../utils/reportSchedule";

const router = Router();

router.get("/api/v1/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth!.sub;
  const { weekStartDate, weekEndDate } = getCurrentWeekRange();

  const weekDateFilter = {
    gte: dateStringToUtcStart(weekStartDate),
    lte: dateStringToUtcStart(weekEndDate)
  };

  const [entriesThisWeek, goalsCompletedThisWeek, latestEntry] = await Promise.all([
    prisma.entry.count({
      where: {
        userId,
        date: weekDateFilter
      }
    }),
    prisma.entry.aggregate({
      where: {
        userId,
        date: weekDateFilter
      },
      _sum: { goalsCompleted: true }
    }),
    prisma.entry.findFirst({
      where: { userId },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      select: { rating: true }
    })
  ]);

  res.json({
    data: {
      entriesThisWeek,
      goalsCompletedThisWeek: goalsCompletedThisWeek._sum.goalsCompleted ?? 0,
      latestRating: latestEntry?.rating ?? null,
      daysUntilNextReport: getDaysUntilNextReport()
    }
  });
});

export default router;
