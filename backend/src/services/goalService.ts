import { prisma } from "../config/prisma";
import {
  buildWeekDisplayData,
  countWeeklyCompletions,
  getWeekDayDates
} from "./goalCalculations";
import { formatDateString, toDateOnly } from "./weeklyReportCalculations";
import { dateStringToUtcStart, formatLocalDate, getCurrentWeekRange } from "../utils/reportSchedule";

export type GoalListItem = {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
  completedToday: boolean;
  weekDays: ReturnType<typeof buildWeekDisplayData>;
  completedDaysThisWeek: number;
  totalDaysThisWeek: number;
};

export type RecurringGoalWeekSummary = {
  title: string;
  completedDays: number;
  totalDays: number;
};

export async function listActiveGoalsForUser(userId: number, now: Date = new Date()) {
  const { weekStartDate, weekEndDate } = getCurrentWeekRange(now);
  const today = formatLocalDate(now);

  const goals = await prisma.recurringGoal.findMany({
    where: { userId, isActive: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      completions: {
        where: {
          date: {
            gte: dateStringToUtcStart(weekStartDate),
            lte: dateStringToUtcStart(weekEndDate)
          }
        },
        select: { date: true }
      }
    }
  });

  const goalItems: GoalListItem[] = goals.map((goal) => {
    const completedDates = goal.completions.map((completion) => formatDateString(completion.date));
    const weekDays = buildWeekDisplayData(weekStartDate, weekEndDate, completedDates);

    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      isActive: goal.isActive,
      completedToday: completedDates.includes(today),
      weekDays,
      completedDaysThisWeek: countWeeklyCompletions(completedDates, weekStartDate, weekEndDate),
      totalDaysThisWeek: weekDays.length
    };
  });

  return {
    today,
    weekStartDate,
    weekEndDate,
    goals: goalItems
  };
}

export async function getRecurringGoalSummariesForWeek(
  userId: number,
  weekStartDate: string,
  weekEndDate: string
): Promise<RecurringGoalWeekSummary[]> {
  const totalDays = getWeekDayDates(weekStartDate, weekEndDate).length;

  const goals = await prisma.recurringGoal.findMany({
    where: { userId, isActive: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      title: true,
      completions: {
        where: {
          date: {
            gte: toDateOnly(weekStartDate),
            lte: toDateOnly(weekEndDate)
          }
        },
        select: { date: true }
      }
    }
  });

  return goals.map((goal) => ({
    title: goal.title,
    completedDays: goal.completions.length,
    totalDays
  }));
}
