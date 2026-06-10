// Every Sunday at 11:59 PM (server local time).
// Cron format: minute hour day-of-month month day-of-week
export const WEEKLY_REPORT_SCHEDULE = "59 23 * * 0";

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateStringToUtcStart(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

// Monday through Sunday of the week ending when the job runs on Sunday night.
export function getPreviousWeekRange(now: Date = new Date()): {
  weekStartDate: string;
  weekEndDate: string;
} {
  const dayOfWeek = now.getDay(); // 0 = Sunday

  const weekEnd = new Date(now);
  if (dayOfWeek !== 0) {
    weekEnd.setDate(now.getDate() - dayOfWeek);
  }

  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekEnd.getDate() - 6);

  return {
    weekStartDate: formatLocalDate(weekStart),
    weekEndDate: formatLocalDate(weekEnd)
  };
}

// Monday through Sunday of the current calendar week.
export function getCurrentWeekRange(now: Date = new Date()): {
  weekStartDate: string;
  weekEndDate: string;
} {
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysSinceMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    weekStartDate: formatLocalDate(weekStart),
    weekEndDate: formatLocalDate(weekEnd)
  };
}

// Monday through today — entries that will feed the upcoming scheduled report.
export function getUpcomingReportEntryRange(now: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const { weekStartDate } = getCurrentWeekRange(now);

  return {
    startDate: weekStartDate,
    endDate: formatLocalDate(now)
  };
}

export function getDaysUntilNextReport(now: Date = new Date()): number {
  const dayOfWeek = now.getDay();
  let daysToAdd = (7 - dayOfWeek) % 7;

  if (daysToAdd === 0) {
    const runTime = new Date(now);
    runTime.setHours(23, 59, 59, 999);
    return now >= runTime ? 7 : 0;
  }

  return daysToAdd;
}
