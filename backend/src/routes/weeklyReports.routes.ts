import { Request, Response, Router } from "express";
import {
  generateWeeklyReport,
  isValidDateString
} from "../services/weeklyReportService";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/api/v1/weekly-reports/:reportId", requireAuth, (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      message: "Weekly reports are not stored yet. Generate a report with POST /api/v1/weekly-reports."
    }
  });
});

router.post("/api/v1/weekly-reports", requireAuth, async (req: Request, res: Response) => {
  const { weekStartDate, weekEndDate } = req.body;

  if (!isValidDateString(weekStartDate) || !isValidDateString(weekEndDate)) {
    return res.status(400).json({
      error: { message: "weekStartDate and weekEndDate must be valid YYYY-MM-DD dates" }
    });
  }

  if (weekStartDate > weekEndDate) {
    return res.status(400).json({
      error: { message: "weekStartDate must be on or before weekEndDate" }
    });
  }

  const report = await generateWeeklyReport(req.auth!.sub, weekStartDate, weekEndDate);

  res.status(201).json({ data: report });
});

export default router;
