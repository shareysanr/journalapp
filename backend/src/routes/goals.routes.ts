import { Request, Response, Router } from "express";
import type { RecurringGoal } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { requireAuth } from "../middleware/requireAuth";
import { listActiveGoalsForUser } from "../services/goalService";
import {
  parseCompletionDate,
  parseCreateGoalPayload,
  parseGoalId,
  parseUpdateGoalPayload
} from "../utils/goalValidation";
import { dateStringToUtcStart, formatLocalDate } from "../utils/reportSchedule";
import { evaluateGoalAchievements } from "../services/achievementService";

const router = Router();

type GoalResponse = {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function toGoalResponse(goal: RecurringGoal): GoalResponse {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    isActive: goal.isActive,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString()
  };
}

function resolveGoalIdParam(
  value: string | string[]
): { ok: true; goalId: number } | { ok: false; message: string } {
  if (typeof value !== "string") {
    return { ok: false, message: "Invalid goal id" };
  }

  const goalId = parseGoalId(value);
  if (goalId === null) {
    return { ok: false, message: "goalId must be a positive integer" };
  }

  return { ok: true, goalId };
}

router.get("/api/v1/goals", requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const data = await listActiveGoalsForUser(userId);

  logger.info({ event: "goals_listed", userId, goalCount: data.goals.length });
  res.json({ data });
});

router.post("/api/v1/goals", requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const parsed = parseCreateGoalPayload(req.body);

  if (!parsed.ok) {
    return res.status(400).json({ error: { message: parsed.message } });
  }

  const goal = await prisma.recurringGoal.create({
    data: {
      userId,
      title: parsed.data.title,
      description: parsed.data.description
    }
  });

  logger.info({ event: "goal_created", userId, goalId: goal.id });
  res.status(201).json({ data: toGoalResponse(goal) });
});

router.patch("/api/v1/goals/:goalId", requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const resolvedGoalId = resolveGoalIdParam(req.params.goalId);

  if (!resolvedGoalId.ok) {
    return res.status(400).json({ error: { message: resolvedGoalId.message } });
  }

  const goalId = resolvedGoalId.goalId;

  const parsed = parseUpdateGoalPayload(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: { message: parsed.message } });
  }

  const existing = await prisma.recurringGoal.findFirst({
    where: { id: goalId, userId }
  });

  if (!existing) {
    return res.status(404).json({ error: { message: "Goal not found" } });
  }

  const goal = await prisma.recurringGoal.update({
    where: { id: goalId },
    data: parsed.data
  });

  logger.info({ event: "goal_updated", userId, goalId });
  res.json({ data: toGoalResponse(goal) });
});

router.post("/api/v1/goals/:goalId/complete", requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const resolvedGoalId = resolveGoalIdParam(req.params.goalId);

  if (!resolvedGoalId.ok) {
    return res.status(400).json({ error: { message: resolvedGoalId.message } });
  }

  const goalId = resolvedGoalId.goalId;

  const goal = await prisma.recurringGoal.findFirst({
    where: { id: goalId, userId, isActive: true }
  });

  if (!goal) {
    return res.status(404).json({ error: { message: "Goal not found" } });
  }

  const today = formatLocalDate(new Date());
  const completionDate = dateStringToUtcStart(today);

  const existing = await prisma.goalCompletion.findUnique({
    where: {
      goalId_date: {
        goalId,
        date: completionDate
      }
    }
  });

  if (existing) {
    if (existing.userId !== userId) {
      return res.status(404).json({ error: { message: "Goal not found" } });
    }

    logger.info({ event: "goal_completion_exists", userId, goalId, date: today });
    return res.json({
      data: {
        goalId,
        date: today,
        alreadyCompleted: true
      }
    });
  }

  await prisma.goalCompletion.create({
    data: {
      goalId,
      userId,
      date: completionDate
    }
  });

  const newlyUnlockedAchievements = await evaluateGoalAchievements(userId);

  logger.info({ event: "goal_completed", userId, goalId, date: today });
  res.status(201).json({
    data: {
      goalId,
      date: today,
      alreadyCompleted: false
    },
    newlyUnlockedAchievements
  });
});

router.delete("/api/v1/goals/:goalId/complete", requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const resolvedGoalId = resolveGoalIdParam(req.params.goalId);

  if (!resolvedGoalId.ok) {
    return res.status(400).json({ error: { message: resolvedGoalId.message } });
  }

  const goalId = resolvedGoalId.goalId;

  const parsedDate = parseCompletionDate(req.query.date);
  if (!parsedDate.ok) {
    return res.status(400).json({ error: { message: parsedDate.message } });
  }

  const goal = await prisma.recurringGoal.findFirst({
    where: { id: goalId, userId }
  });

  if (!goal) {
    return res.status(404).json({ error: { message: "Goal not found" } });
  }

  const result = await prisma.goalCompletion.deleteMany({
    where: {
      goalId,
      userId,
      date: dateStringToUtcStart(parsedDate.data)
    }
  });

  if (result.count === 0) {
    return res.status(404).json({ error: { message: "Completion not found" } });
  }

  logger.info({ event: "goal_completion_removed", userId, goalId, date: parsedDate.data });
  res.json({
    data: {
      goalId,
      date: parsedDate.data,
      result: "success"
    }
  });
});

export default router;
