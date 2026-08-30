export function getEligibleEntryAchievementKeys(entryCount: number): string[] {
  const keys: string[] = [];

  if (entryCount >= 1) {
    keys.push("first_entry_created");
  }
  if (entryCount >= 3) {
    keys.push("three_entries_created");
  }
  if (entryCount >= 7) {
    keys.push("seven_entries_created");
  }

  return keys;
}

export function getEligibleGoalAchievementKeys(
  totalCompletions: number,
  uniqueCompletionDaysThisWeek: number
): string[] {
  const keys: string[] = [];

  if (totalCompletions >= 1) {
    keys.push("first_goal_completed");
  }
  if (totalCompletions >= 3) {
    keys.push("three_goal_completions");
  }
  if (totalCompletions >= 7) {
    keys.push("seven_goal_completions");
  }
  if (uniqueCompletionDaysThisWeek >= 3) {
    keys.push("three_goal_days_this_week");
  }

  return keys;
}

export function getEligibleReportAchievementKeys(reportCount: number): string[] {
  if (reportCount >= 1) {
    return ["first_weekly_report"];
  }

  return [];
}

export function countUniqueDates(dates: string[]): number {
  return new Set(dates).size;
}
