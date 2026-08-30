import type { AchievementDefinition } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import {
  getEligibleEntryAchievementKeys,
  getEligibleGoalAchievementKeys,
  getEligibleReportAchievementKeys
} from "./achievementCalculations";
import { DEFAULT_ACHIEVEMENT_DEFINITIONS } from "./achievementDefinitions";
import { formatDateString } from "./weeklyReportCalculations";
import { dateStringToUtcStart, getCurrentWeekRange } from "../utils/reportSchedule";

export type UnlockedAchievement = {
  key: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlockedAt: string;
};

export type UserAchievement = {
  key: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

function toUnlockedAchievement(
  definition: AchievementDefinition,
  unlockedAt: Date
): UnlockedAchievement {
  return {
    key: definition.key,
    title: definition.title,
    description: definition.description,
    category: definition.category,
    icon: definition.icon,
    unlockedAt: unlockedAt.toISOString()
  };
}

export async function ensureDefaultAchievementDefinitions(): Promise<void> {
  for (const definition of DEFAULT_ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievementDefinition.upsert({
      where: { key: definition.key },
      create: definition,
      update: {
        title: definition.title,
        description: definition.description,
        category: definition.category,
        icon: definition.icon,
        sortOrder: definition.sortOrder
      }
    });
  }
}

async function unlockAchievementsByKeys(
  userId: number,
  keys: string[]
): Promise<UnlockedAchievement[]> {
  if (keys.length === 0) {
    return [];
  }

  await ensureDefaultAchievementDefinitions();

  const definitions = await prisma.achievementDefinition.findMany({
    where: { key: { in: keys } }
  });
  const definitionByKey = new Map(definitions.map((definition) => [definition.key, definition]));

  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const key of keys) {
    const definition = definitionByKey.get(key);
    if (!definition) {
      continue;
    }

    const existing = await prisma.achievementUnlock.findUnique({
      where: {
        userId_achievementDefinitionId: {
          userId,
          achievementDefinitionId: definition.id
        }
      }
    });

    if (existing) {
      continue;
    }

    try {
      const unlock = await prisma.achievementUnlock.create({
        data: {
          userId,
          achievementDefinitionId: definition.id
        }
      });

      const unlocked = toUnlockedAchievement(definition, unlock.unlockedAt);
      newlyUnlocked.push(unlocked);
      logger.info({
        event: "achievement_unlocked",
        userId,
        achievementKey: definition.key
      });
    } catch (err) {
      logger.warn({
        event: "achievement_unlock_skipped",
        userId,
        achievementKey: definition.key,
        err
      });
    }
  }

  return newlyUnlocked;
}

export async function evaluateEntryAchievements(userId: number): Promise<UnlockedAchievement[]> {
  const entryCount = await prisma.entry.count({ where: { userId } });
  const keys = getEligibleEntryAchievementKeys(entryCount);
  return unlockAchievementsByKeys(userId, keys);
}

export async function evaluateGoalAchievements(userId: number): Promise<UnlockedAchievement[]> {
  const { weekStartDate, weekEndDate } = getCurrentWeekRange();
  const weekDateFilter = {
    gte: dateStringToUtcStart(weekStartDate),
    lte: dateStringToUtcStart(weekEndDate)
  };

  const [totalCompletions, weekCompletions] = await Promise.all([
    prisma.goalCompletion.count({ where: { userId } }),
    prisma.goalCompletion.findMany({
      where: {
        userId,
        date: weekDateFilter
      },
      select: { date: true }
    })
  ]);

  const uniqueCompletionDaysThisWeek = new Set(
    weekCompletions.map((completion) => formatDateString(completion.date))
  ).size;

  const keys = getEligibleGoalAchievementKeys(totalCompletions, uniqueCompletionDaysThisWeek);
  return unlockAchievementsByKeys(userId, keys);
}

export async function evaluateReportAchievements(userId: number): Promise<UnlockedAchievement[]> {
  const reportCount = await prisma.weeklyReport.count({ where: { userId } });
  const keys = getEligibleReportAchievementKeys(reportCount);
  return unlockAchievementsByKeys(userId, keys);
}

export async function listUserAchievements(userId: number): Promise<UserAchievement[]> {
  await ensureDefaultAchievementDefinitions();

  const [definitions, unlocks] = await Promise.all([
    prisma.achievementDefinition.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { id: "asc" }]
    }),
    prisma.achievementUnlock.findMany({
      where: { userId },
      select: {
        unlockedAt: true,
        achievementDefinition: {
          select: { key: true }
        }
      }
    })
  ]);

  const unlockByKey = new Map(
    unlocks.map((unlock) => [unlock.achievementDefinition.key, unlock.unlockedAt])
  );

  return definitions.map((definition) => {
    const unlockedAt = unlockByKey.get(definition.key);

    return {
      key: definition.key,
      title: definition.title,
      description: definition.description,
      category: definition.category,
      icon: definition.icon,
      unlocked: unlockedAt !== undefined,
      unlockedAt: unlockedAt ? unlockedAt.toISOString() : null
    };
  });
}
