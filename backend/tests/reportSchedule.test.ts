import { describe, expect, it } from "vitest";
import {
  dateStringToUtcStart,
  formatLocalDate,
  getCurrentWeekRange,
  getDaysUntilNextReport,
  getPreviousWeekRange,
  getUpcomingReportEntryRange
} from "../src/utils/reportSchedule";

/** Local calendar date at noon to avoid DST edge cases around midnight. */
function localDate(year: number, monthIndex: number, day: number, hour = 12): Date {
  return new Date(year, monthIndex, day, hour, 0, 0, 0);
}

describe("formatLocalDate", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(formatLocalDate(localDate(2026, 6, 13))).toBe("2026-07-13");
  });

  it("zero-pads month and day", () => {
    expect(formatLocalDate(localDate(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("dateStringToUtcStart", () => {
  it("parses a date string as UTC midnight", () => {
    const result = dateStringToUtcStart("2026-07-13");
    expect(result.toISOString()).toBe("2026-07-13T00:00:00.000Z");
  });
});

describe("getPreviousWeekRange", () => {
  it("on Monday returns the previous Mon–Sun week", () => {
    // Monday July 13, 2026 → previous week Jul 6–12
    expect(getPreviousWeekRange(localDate(2026, 6, 13))).toEqual({
      weekStartDate: "2026-07-06",
      weekEndDate: "2026-07-12"
    });
  });

  it("on mid-week (Wednesday) returns the week ending the prior Sunday", () => {
    // Wednesday July 15, 2026 → prior Sunday Jul 12 → week Jul 6–12
    expect(getPreviousWeekRange(localDate(2026, 6, 15))).toEqual({
      weekStartDate: "2026-07-06",
      weekEndDate: "2026-07-12"
    });
  });

  it("on Sunday returns that week's Mon–Sun", () => {
    // Sunday July 12, 2026 → Jul 6–12
    expect(getPreviousWeekRange(localDate(2026, 6, 12))).toEqual({
      weekStartDate: "2026-07-06",
      weekEndDate: "2026-07-12"
    });
  });
});

describe("getCurrentWeekRange", () => {
  it("on Monday returns Mon–Sun of the current week", () => {
    expect(getCurrentWeekRange(localDate(2026, 6, 13))).toEqual({
      weekStartDate: "2026-07-13",
      weekEndDate: "2026-07-19"
    });
  });

  it("on Wednesday returns Mon–Sun spanning that week", () => {
    expect(getCurrentWeekRange(localDate(2026, 6, 15))).toEqual({
      weekStartDate: "2026-07-13",
      weekEndDate: "2026-07-19"
    });
  });

  it("on Sunday returns Mon–Sun ending that Sunday", () => {
    expect(getCurrentWeekRange(localDate(2026, 6, 19))).toEqual({
      weekStartDate: "2026-07-13",
      weekEndDate: "2026-07-19"
    });
  });
});

describe("getUpcomingReportEntryRange", () => {
  it("on Monday spans Monday through today", () => {
    expect(getUpcomingReportEntryRange(localDate(2026, 6, 13))).toEqual({
      startDate: "2026-07-13",
      endDate: "2026-07-13"
    });
  });

  it("on mid-week spans Monday through today", () => {
    expect(getUpcomingReportEntryRange(localDate(2026, 6, 15))).toEqual({
      startDate: "2026-07-13",
      endDate: "2026-07-15"
    });
  });

  it("on Sunday spans Monday through Sunday", () => {
    expect(getUpcomingReportEntryRange(localDate(2026, 6, 19))).toEqual({
      startDate: "2026-07-13",
      endDate: "2026-07-19"
    });
  });
});

describe("getDaysUntilNextReport", () => {
  it("returns days until the upcoming Sunday for a weekday", () => {
    // Wednesday July 15, 2026 → next Sunday is 4 days away
    expect(getDaysUntilNextReport(localDate(2026, 6, 15))).toBe(4);
  });

  it("returns 0 on Sunday before the report run time", () => {
    const sundayBefore = new Date(2026, 6, 19, 12, 0, 0, 0);
    expect(getDaysUntilNextReport(sundayBefore)).toBe(0);
  });

  it("returns 7 on Sunday at or after the report run time", () => {
    const sundayAtRun = new Date(2026, 6, 19, 23, 59, 59, 999);
    expect(getDaysUntilNextReport(sundayAtRun)).toBe(7);
  });
});
