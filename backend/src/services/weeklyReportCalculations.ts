export const TOP_COMMON_LIMIT = 5;

export type EntryStatsInput = {
  id: number;
  goalsCompleted: number;
  numGoals: number;
  rating: number;
  distractions: string[];
  negativeComponents: string[];
  positiveComponents: string[];
};

export type WeeklyEntryMetrics = {
  accomplishments: number;
  failures: number;
  averageRating: number;
  commonDistractions: string[];
  commonNegativeComponents: string[];
  commonPositiveComponents: string[];
  entryIds: number[];
  entryCount: number;
};

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export function formatDateString(date: Date | string): string {
  if (date instanceof Date) {
    return date.toISOString().split("T")[0];
  }
  return String(date).split("T")[0];
}

export function toDateOnly(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

export function topCommon(values: string[], limit: number): string[] {
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

export function computeAverageRating(ratings: number[]): number {
  if (ratings.length === 0) {
    return 0;
  }
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function computeWeeklyEntryMetrics(entries: EntryStatsInput[]): WeeklyEntryMetrics {
  const accomplishments = entries.reduce((sum, entry) => sum + entry.goalsCompleted, 0);
  const totalGoals = entries.reduce((sum, entry) => sum + entry.numGoals, 0);
  const failures = Math.max(0, totalGoals - accomplishments);
  const averageRating = computeAverageRating(entries.map((entry) => entry.rating));
  const commonDistractions = topCommon(
    entries.flatMap((entry) => entry.distractions),
    TOP_COMMON_LIMIT
  );
  const commonNegativeComponents = topCommon(
    entries.flatMap((entry) => entry.negativeComponents),
    TOP_COMMON_LIMIT
  );
  const commonPositiveComponents = topCommon(
    entries.flatMap((entry) => entry.positiveComponents),
    TOP_COMMON_LIMIT
  );
  const entryIds = entries.map((entry) => entry.id);

  return {
    accomplishments,
    failures,
    averageRating,
    commonDistractions,
    commonNegativeComponents,
    commonPositiveComponents,
    entryIds,
    entryCount: entries.length
  };
}
