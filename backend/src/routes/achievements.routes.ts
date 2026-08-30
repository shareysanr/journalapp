import { Request, Response, Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { listUserAchievements } from "../services/achievementService";

const router = Router();

router.get("/api/v1/achievements", requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const achievements = await listUserAchievements(userId);

  res.json({
    data: {
      achievements
    }
  });
});

export default router;
