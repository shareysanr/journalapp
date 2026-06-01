import { prisma } from "../config/prisma";
import {
  fallbackWeeklyNarrative,
  generateWeeklyNarrative,
  type WeeklyNarrativeInput
} from "../config/openai";

const TOP_COMMON_LIMIT = 5;

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

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function topCommon(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name]) => name);
}

function computeAverageRating(ratings: number[]): number {
  if (ratings.length === 0) {
    return 0;
  }
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export async function generateWeeklyReport(
  userId: string,
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
      distractions: true,
      negativeComponents: true,
      positiveComponents: true
    },
    orderBy: { date: "asc" }
  });

  const accomplishments = entries.reduce((sum, entry) => sum + entry.goalsCompleted, 0);
  const totalGoals = entries.reduce((sum, entry) => sum + entry.numGoals, 0);
  const failures = Math.max(0, totalGoals - accomplishments);
  const averageRating = computeAverageRating(entries.map((entry) => entry.rating));
  const commonDistractions = topCommon(entries.flatMap((entry) => entry.distractions), TOP_COMMON_LIMIT);
  const commonNegativeComponents = topCommon(
    entries.flatMap((entry) => entry.negativeComponents),
    TOP_COMMON_LIMIT
  );
  const commonPositiveComponents = topCommon(
    entries.flatMap((entry) => entry.positiveComponents),
    TOP_COMMON_LIMIT
  );
  const entryIds = entries.map((entry) => entry.id);

  const narrativeInput: WeeklyNarrativeInput = {
    weekStartDate,
    weekEndDate,
    accomplishments,
    failures,
    averageRating,
    commonDistractions,
    commonNegativeComponents,
    commonPositiveComponents,
    entryCount: entries.length
  };

  const narrative =
    (await generateWeeklyNarrative(narrativeInput)) ?? fallbackWeeklyNarrative(narrativeInput);

  return {
    weekStartDate,
    weekEndDate,
    summary: narrative.summary,
    commonDistractions,
    commonNegativeComponents,
    commonPositiveComponents,
    accomplishments,
    failures,
    recommendations: narrative.recommendations,
    averageRating,
    entryIds
  };
}
