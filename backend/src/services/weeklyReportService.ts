import { prisma } from "../config/prisma";
import type { WeeklyReport as WeeklyReportRow } from "../generated/prisma/client";
import {
  fallbackWeeklyNarrative,
  generateWeeklyNarrative,
  type WeeklyNarrativeInput
} from "../config/openai";
import { computeWeeklyEntryMetrics, formatDateString, toDateOnly } from "./weeklyReportCalculations";
import { getRecurringGoalSummariesForWeek } from "./goalService";

export { isValidDateString } from "./weeklyReportCalculations";

export type WeeklyReport = {
  weekStartDate: string;
  weekEndDate: string;
  summary: string;
  commonDistractions: string[];
  commonNegativeComponents: string[];
  commonPositiveComponents: string[];
  accomplishments: number;
  failures: number;
  recommendations: string;
  averageRating: number;
  entryIds: number[];
};

export type StoredWeeklyReport = WeeklyReport & {
  id: number;
};

function dbRowToWeeklyReport(row: WeeklyReportRow): StoredWeeklyReport {
  return {
    id: row.id,
    weekStartDate: formatDateString(row.weekStartDate),
    weekEndDate: formatDateString(row.weekEndDate),
    summary: row.summary,
    recommendations: row.recommendations,
    accomplishments: row.accomplishments,
    failures: row.failures,
    averageRating: row.averageRating,
    commonDistractions: row.commonDistractions,
    commonNegativeComponents: row.commonNegativeComponents,
    commonPositiveComponents: row.commonPositiveComponents,
    entryIds: row.entryIds
  };
}

export async function generateWeeklyReport(
  userId: number,
  weekStartDate: string,
  weekEndDate: string
): Promise<WeeklyReport> {
  const entries = await prisma.entry.findMany({
    where: {
      userId,
      date: {
        gte: new Date(`${weekStartDate}T00:00:00.000Z`),
        lte: new Date(`${weekEndDate}T00:00:00.000Z`)
      }
    },
    select: {
      id: true,
      goalsCompleted: true,
      numGoals: true,
      rating: true,
      mood: true,
      motivation: true,
      distractions: true,
      negativeComponents: true,
      positiveComponents: true
    },
    orderBy: { date: "asc" }
  });

  const metrics = computeWeeklyEntryMetrics(entries);
  const recurringGoals = await getRecurringGoalSummariesForWeek(userId, weekStartDate, weekEndDate);

  const narrativeInput: WeeklyNarrativeInput = {
    weekStartDate,
    weekEndDate,
    accomplishments: metrics.accomplishments,
    failures: metrics.failures,
    averageRating: metrics.averageRating,
    averageMood: metrics.averageMood,
    averageMotivation: metrics.averageMotivation,
    highestMood: metrics.highestMood,
    lowestMood: metrics.lowestMood,
    highestMotivation: metrics.highestMotivation,
    lowestMotivation: metrics.lowestMotivation,
    commonDistractions: metrics.commonDistractions,
    commonNegativeComponents: metrics.commonNegativeComponents,
    commonPositiveComponents: metrics.commonPositiveComponents,
    entryCount: metrics.entryCount,
    recurringGoals
  };

  const narrative =
    (await generateWeeklyNarrative(narrativeInput)) ?? fallbackWeeklyNarrative(narrativeInput);

  return {
    weekStartDate,
    weekEndDate,
    summary: narrative.summary,
    commonDistractions: metrics.commonDistractions,
    commonNegativeComponents: metrics.commonNegativeComponents,
    commonPositiveComponents: metrics.commonPositiveComponents,
    accomplishments: metrics.accomplishments,
    failures: metrics.failures,
    recommendations: narrative.recommendations,
    averageRating: metrics.averageRating,
    entryIds: metrics.entryIds
  };
}

export async function saveWeeklyReport(
  userId: number,
  report: WeeklyReport
): Promise<StoredWeeklyReport> {
  const weekStartDate = toDateOnly(report.weekStartDate);
  const weekEndDate = toDateOnly(report.weekEndDate);

  const row = await prisma.weeklyReport.upsert({
    where: {
      userId_weekStartDate_weekEndDate: {
        userId,
        weekStartDate,
        weekEndDate
      }
    },
    create: {
      userId,
      weekStartDate,
      weekEndDate,
      summary: report.summary,
      recommendations: report.recommendations,
      accomplishments: report.accomplishments,
      failures: report.failures,
      averageRating: report.averageRating,
      commonDistractions: report.commonDistractions,
      commonNegativeComponents: report.commonNegativeComponents,
      commonPositiveComponents: report.commonPositiveComponents,
      entryIds: report.entryIds
    },
    update: {
      summary: report.summary,
      recommendations: report.recommendations,
      accomplishments: report.accomplishments,
      failures: report.failures,
      averageRating: report.averageRating,
      commonDistractions: report.commonDistractions,
      commonNegativeComponents: report.commonNegativeComponents,
      commonPositiveComponents: report.commonPositiveComponents,
      entryIds: report.entryIds
    }
  });

  return dbRowToWeeklyReport(row);
}

export async function listWeeklyReports(userId: number): Promise<StoredWeeklyReport[]> {
  const rows = await prisma.weeklyReport.findMany({
    where: { userId },
    orderBy: [{ weekEndDate: "desc" }, { createdAt: "desc" }]
  });

  return rows.map(dbRowToWeeklyReport);
}

export async function getWeeklyReportById(
  userId: number,
  reportId: number
): Promise<StoredWeeklyReport | null> {
  const row = await prisma.weeklyReport.findFirst({
    where: { id: reportId, userId }
  });

  if (!row) {
    return null;
  }

  return dbRowToWeeklyReport(row);
}
