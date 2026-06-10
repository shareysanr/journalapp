import { Request, Response, Router } from "express";
import {
  generateWeeklyReport,
  getWeeklyReportById,
  isValidDateString,
  listWeeklyReports
} from "../services/weeklyReportService";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/api/v1/weekly-reports", requireAuth, async (req: Request, res: Response) => {
  const reports = await listWeeklyReports(req.auth!.sub);
  res.json({ data: reports });
});

router.get("/api/v1/weekly-reports/:reportId", requireAuth, async (req: Request, res: Response) => {
  const reportId = Number(req.params.reportId);
  const report = await getWeeklyReportById(req.auth!.sub, reportId);

  if (!report) {
    return res.status(404).json({
      error: { message: "Report not found" }
    });
  }

  res.json({ data: report });
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
