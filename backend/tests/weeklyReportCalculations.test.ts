import { describe, expect, it } from "vitest";
import {
  TOP_COMMON_LIMIT,
  computeAverageRating,
  computeWeeklyEntryMetrics,
  formatDateString,
  isValidDateString,
  toDateOnly,
  topCommon,
  type EntryStatsInput
} from "../src/services/weeklyReportCalculations";

describe("isValidDateString", () => {
  it("accepts a valid YYYY-MM-DD date", () => {
    expect(isValidDateString("2026-07-13")).toBe(true);
  });

  it("rejects non-strings", () => {
    expect(isValidDateString(20260713)).toBe(false);
    expect(isValidDateString(null)).toBe(false);
    expect(isValidDateString(undefined)).toBe(false);
  });

  it("rejects bad formats", () => {
    expect(isValidDateString("2026/07/13")).toBe(false);
    expect(isValidDateString("07-13-2026")).toBe(false);
    expect(isValidDateString("2026-7-13")).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
  });
});

describe("topCommon", () => {
  it("skips empty and whitespace-only values after trim", () => {
    expect(topCommon(["  phone  ", "", "  ", "phone"], 5)).toEqual(["phone"]);
  });

  it("sorts by frequency descending", () => {
    expect(topCommon(["a", "b", "a", "c", "a", "b"], 5)).toEqual(["a", "b", "c"]);
  });

  it("breaks ties alphabetically", () => {
    expect(topCommon(["zeta", "alpha", "zeta", "alpha"], 5)).toEqual(["alpha", "zeta"]);
  });

  it("respects the limit", () => {
    expect(topCommon(["a", "a", "b", "b", "c", "d"], 2)).toEqual(["a", "b"]);
  });

  it("returns an empty array for empty input", () => {
    expect(topCommon([], 5)).toEqual([]);
  });
});

describe("computeAverageRating", () => {
  it("returns 0 for an empty list", () => {
    expect(computeAverageRating([])).toBe(0);
  });

  it("averages and rounds to one decimal place", () => {
    expect(computeAverageRating([4, 5, 3])).toBe(4);
    expect(computeAverageRating([4, 5])).toBe(4.5);
    expect(computeAverageRating([1, 2, 2])).toBe(1.7);
  });
});

describe("computeWeeklyEntryMetrics", () => {
  const entries: EntryStatsInput[] = [
    {
      id: 10,
      goalsCompleted: 2,
      numGoals: 3,
      rating: 4,
      mood: 6,
      motivation: 5,
      distractions: ["phone", ""],
      negativeComponents: ["stress"],
      positiveComponents: ["focus"]
    },
    {
      id: 11,
      goalsCompleted: 1,
      numGoals: 2,
      rating: 5,
      mood: 8,
      motivation: 3,
      distractions: ["phone", "tv"],
      negativeComponents: ["stress", "fatigue"],
      positiveComponents: ["focus", "exercise"]
    }
  ];

  it("computes accomplishments, failures, and preserves entry IDs in order", () => {
    const metrics = computeWeeklyEntryMetrics(entries);
    expect(metrics.accomplishments).toBe(3);
    expect(metrics.failures).toBe(2);
    expect(metrics.entryIds).toEqual([10, 11]);
    expect(metrics.entryCount).toBe(2);
  });

  it("computes average rating and common lists using TOP_COMMON_LIMIT", () => {
    const metrics = computeWeeklyEntryMetrics(entries);
    expect(metrics.averageRating).toBe(4.5);
    expect(metrics.commonDistractions).toEqual(["phone", "tv"]);
    expect(metrics.commonNegativeComponents).toEqual(["stress", "fatigue"]);
    expect(metrics.commonPositiveComponents).toEqual(["focus", "exercise"]);
    expect(TOP_COMMON_LIMIT).toBe(5);
  });

  it("computes mood and motivation averages, highs, and lows", () => {
    const metrics = computeWeeklyEntryMetrics(entries);
    expect(metrics.averageMood).toBe(7);
    expect(metrics.highestMood).toBe(8);
    expect(metrics.lowestMood).toBe(6);
    expect(metrics.averageMotivation).toBe(4);
    expect(metrics.highestMotivation).toBe(5);
    expect(metrics.lowestMotivation).toBe(3);
  });

  it("skips null mood and motivation when computing scale stats", () => {
    const metrics = computeWeeklyEntryMetrics([
      {
        id: 1,
        goalsCompleted: 1,
        numGoals: 1,
        rating: 5,
        mood: null,
        motivation: 4,
        distractions: [],
        negativeComponents: [],
        positiveComponents: []
      },
      {
        id: 2,
        goalsCompleted: 1,
        numGoals: 1,
        rating: 5,
        mood: 8,
        motivation: null,
        distractions: [],
        negativeComponents: [],
        positiveComponents: []
      }
    ]);

    expect(metrics.averageMood).toBe(8);
    expect(metrics.highestMood).toBe(8);
    expect(metrics.lowestMood).toBe(8);
    expect(metrics.averageMotivation).toBe(4);
    expect(metrics.highestMotivation).toBe(4);
    expect(metrics.lowestMotivation).toBe(4);
  });

  it("handles an empty entry list", () => {
    const metrics = computeWeeklyEntryMetrics([]);
    expect(metrics).toEqual({
      accomplishments: 0,
      failures: 0,
      averageRating: 0,
      averageMood: null,
      averageMotivation: null,
      highestMood: null,
      lowestMood: null,
      highestMotivation: null,
      lowestMotivation: null,
      commonDistractions: [],
      commonNegativeComponents: [],
      commonPositiveComponents: [],
      entryIds: [],
      entryCount: 0
    });
  });

  it("never reports negative failures", () => {
    const metrics = computeWeeklyEntryMetrics([
      {
        id: 1,
        goalsCompleted: 5,
        numGoals: 3,
        rating: 5,
        mood: 5,
        motivation: 5,
        distractions: [],
        negativeComponents: [],
        positiveComponents: []
      }
    ]);
    expect(metrics.failures).toBe(0);
  });
});

describe("formatDateString", () => {
  it("formats a Date as YYYY-MM-DD in UTC", () => {
    expect(formatDateString(new Date("2026-07-13T00:00:00.000Z"))).toBe("2026-07-13");
  });

  it("strips time from a date-like string", () => {
    expect(formatDateString("2026-07-13T12:30:00.000Z")).toBe("2026-07-13");
  });
});

describe("toDateOnly", () => {
  it("returns UTC midnight for a YYYY-MM-DD string", () => {
    expect(toDateOnly("2026-07-13").toISOString()).toBe("2026-07-13T00:00:00.000Z");
  });
});
