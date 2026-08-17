import { describe, expect, it } from "vitest";
import {
  fallbackWeeklyNarrative,
  type WeeklyNarrativeInput
} from "../src/config/openai";

describe("fallbackWeeklyNarrative", () => {
  it("returns the zero-entry branch copy", () => {
    const input: WeeklyNarrativeInput = {
      weekStartDate: "2026-07-07",
      weekEndDate: "2026-07-13",
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
      entryCount: 0
    };

    const result = fallbackWeeklyNarrative(input);

    expect(result.summary).toBe(
      "No journal entries were recorded between 2026-07-07 and 2026-07-13."
    );
    expect(result.recommendations).toContain("at least one entry per day");
  });

  it("returns the non-empty branch with counts and average rating", () => {
    const input: WeeklyNarrativeInput = {
      weekStartDate: "2026-07-07",
      weekEndDate: "2026-07-13",
      accomplishments: 8,
      failures: 2,
      averageRating: 4.5,
      averageMood: 7,
      averageMotivation: 4,
      highestMood: 8,
      lowestMood: 6,
      highestMotivation: 5,
      lowestMotivation: 3,
      commonDistractions: ["phone"],
      commonNegativeComponents: ["stress"],
      commonPositiveComponents: ["focus"],
      entryCount: 5
    };

    const result = fallbackWeeklyNarrative(input);

    expect(result.summary).toBe(
      "From 2026-07-07 to 2026-07-13, you logged 5 entries, " +
        "completed 8 goals, and had 2 uncompleted goals. Your average rating was 4.5. " +
        "Average mood was 7.0 (range 6–8). Average motivation was 4.0 (range 3–5)."
    );
    expect(result.recommendations).toContain("most common distractions");
  });

  it("omits mood and motivation when those stats are unavailable", () => {
    const input: WeeklyNarrativeInput = {
      weekStartDate: "2026-07-07",
      weekEndDate: "2026-07-13",
      accomplishments: 8,
      failures: 2,
      averageRating: 4.5,
      averageMood: null,
      averageMotivation: null,
      highestMood: null,
      lowestMood: null,
      highestMotivation: null,
      lowestMotivation: null,
      commonDistractions: ["phone"],
      commonNegativeComponents: ["stress"],
      commonPositiveComponents: ["focus"],
      entryCount: 5
    };

    const result = fallbackWeeklyNarrative(input);

    expect(result.summary).toBe(
      "From 2026-07-07 to 2026-07-13, you logged 5 entries, " +
        "completed 8 goals, and had 2 uncompleted goals. Your average rating was 4.5."
    );
  });
});
