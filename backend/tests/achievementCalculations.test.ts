import { describe, expect, it } from "vitest";
import {
  countUniqueDates,
  getEligibleEntryAchievementKeys,
  getEligibleGoalAchievementKeys,
  getEligibleReportAchievementKeys
} from "../src/services/achievementCalculations";
import { DEFAULT_ACHIEVEMENT_DEFINITIONS } from "../src/services/achievementDefinitions";

describe("getEligibleEntryAchievementKeys", () => {
  it("returns no keys when there are no entries", () => {
    expect(getEligibleEntryAchievementKeys(0)).toEqual([]);
  });

  it("returns first entry key for one entry", () => {
    expect(getEligibleEntryAchievementKeys(1)).toEqual(["first_entry_created"]);
  });

  it("returns cumulative entry keys at higher counts", () => {
    expect(getEligibleEntryAchievementKeys(3)).toEqual([
      "first_entry_created",
      "three_entries_created"
    ]);
    expect(getEligibleEntryAchievementKeys(7)).toEqual([
      "first_entry_created",
      "three_entries_created",
      "seven_entries_created"
    ]);
  });
});

describe("getEligibleGoalAchievementKeys", () => {
  it("returns no keys when there are no completions", () => {
    expect(getEligibleGoalAchievementKeys(0, 0)).toEqual([]);
  });

  it("returns first goal completion key", () => {
    expect(getEligibleGoalAchievementKeys(1, 1)).toEqual(["first_goal_completed"]);
  });

  it("returns cumulative goal completion keys", () => {
    expect(getEligibleGoalAchievementKeys(3, 2)).toEqual([
      "first_goal_completed",
      "three_goal_completions"
    ]);
    expect(getEligibleGoalAchievementKeys(7, 2)).toEqual([
      "first_goal_completed",
      "three_goal_completions",
      "seven_goal_completions"
    ]);
  });

  it("returns weekly rhythm key when three unique days are completed this week", () => {
    expect(getEligibleGoalAchievementKeys(1, 3)).toEqual([
      "first_goal_completed",
      "three_goal_days_this_week"
    ]);
  });
});

describe("getEligibleReportAchievementKeys", () => {
  it("returns no keys when there are no reports", () => {
    expect(getEligibleReportAchievementKeys(0)).toEqual([]);
  });

  it("returns first weekly report key", () => {
    expect(getEligibleReportAchievementKeys(1)).toEqual(["first_weekly_report"]);
  });
});

describe("countUniqueDates", () => {
  it("counts unique completion dates", () => {
    expect(countUniqueDates(["2026-08-24", "2026-08-24", "2026-08-25"])).toBe(2);
  });
});

describe("DEFAULT_ACHIEVEMENT_DEFINITIONS", () => {
  it("uses unique achievement keys", () => {
    const keys = DEFAULT_ACHIEVEMENT_DEFINITIONS.map((definition) => definition.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("includes all MVP achievement keys", () => {
    const keys = DEFAULT_ACHIEVEMENT_DEFINITIONS.map((definition) => definition.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "first_entry_created",
        "three_entries_created",
        "seven_entries_created",
        "first_goal_completed",
        "three_goal_completions",
        "seven_goal_completions",
        "three_goal_days_this_week",
        "first_weekly_report"
      ])
    );
  });
});
