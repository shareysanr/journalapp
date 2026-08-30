import { formatLocalDate } from "../utils/reportSchedule";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type WeekDayDisplay = {
  date: string;
  label: string;
  completed: boolean;
};

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getWeekDayDates(weekStartDate: string, weekEndDate: string): string[] {
  const dates: string[] = [];
  const current = parseLocalDate(weekStartDate);
  const end = parseLocalDate(weekEndDate);

  while (current <= end) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function buildWeekDisplayData(
  weekStartDate: string,
  weekEndDate: string,
  completedDates: Iterable<string>
): WeekDayDisplay[] {
  const completed = new Set(completedDates);

  return getWeekDayDates(weekStartDate, weekEndDate).map((date) => {
    const [year, month, day] = date.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    return {
      date,
      label: DAY_LABELS[dayOfWeek],
      completed: completed.has(date)
    };
  });
}

export function countWeeklyCompletions(
  completedDates: string[],
  weekStartDate: string,
  weekEndDate: string
): number {
  const weekDays = new Set(getWeekDayDates(weekStartDate, weekEndDate));
  return completedDates.filter((date) => weekDays.has(date)).length;
}

export function isAlreadyCompleted(completedDates: Set<string>, date: string): boolean {
  return completedDates.has(date);
}
