import { Request, Response, Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// Place holder entries so far
router.get("/api/v1/weekly-reports/:reportId", requireAuth, (req: Request, res: Response) => {
  const reportId = Number(req.params.reportId);

  res.json({
    data: {
      id: reportId,
      weekStartDate: "2026-05-04",
      weekEndDate: "2026-05-10",
      summary: "Placeholder weekly report summary.",
      commonDistractions: [],
      commonNegativeComponents: [],
      commonPositiveComponents: [],
      accomplishments: 0,
      failures: 0,
      recommendations: "Placeholder recommendation.",
      averageRating: 0,
      entryIds: []
    }
  });
});

router.post("/api/v1/weekly-reports", requireAuth, (req: Request, res: Response) => {
  res.status(201).json({
    data: {
      id: 1,
      weekStartDate: req.body.weekStartDate,
      weekEndDate: req.body.weekEndDate,
      summary: "Generated placeholder weekly report.",
      commonDistractions: [],
      commonNegativeComponents: [],
      commonPositiveComponents: [],
      accomplishments: 0,
      failures: 0,
      recommendations: "Placeholder recommendation.",
      averageRating: 0,
      entryIds: []
    }
  });
});

export default router;
