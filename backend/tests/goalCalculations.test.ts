import { describe, expect, it } from "vitest";
import {
  buildWeekDisplayData,
  countWeeklyCompletions,
  getWeekDayDates,
  isAlreadyCompleted
} from "../src/services/goalCalculations";
import { getCurrentWeekRange } from "../src/utils/reportSchedule";

describe("getWeekDayDates", () => {
  it("returns seven dates for a Monday through Sunday week", () => {
    expect(getWeekDayDates("2026-08-24", "2026-08-30")).toEqual([
      "2026-08-24",
      "2026-08-25",
      "2026-08-26",
      "2026-08-27",
      "2026-08-28",
      "2026-08-29",
      "2026-08-30"
    ]);
  });
});

describe("getCurrentWeekRange", () => {
  it("returns Monday through Sunday for a midweek date", () => {
    const wednesday = new Date(2026, 7, 26, 12, 0, 0);

    expect(getCurrentWeekRange(wednesday)).toEqual({
      weekStartDate: "2026-08-24",
      weekEndDate: "2026-08-30"
    });
  });
});

describe("countWeeklyCompletions", () => {
  it("counts only completions that fall inside the week range", () => {
    const completedDates = ["2026-08-23", "2026-08-24", "2026-08-26", "2026-08-31"];

    expect(countWeeklyCompletions(completedDates, "2026-08-24", "2026-08-30")).toBe(2);
  });
});

describe("buildWeekDisplayData", () => {
  it("returns seven day boxes with completion state and labels", () => {
    const weekDays = buildWeekDisplayData("2026-08-24", "2026-08-30", [
      "2026-08-24",
      "2026-08-26"
    ]);

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]).toEqual({
      date: "2026-08-24",
      label: "Mon",
      completed: true
    });
    expect(weekDays[1]).toEqual({
      date: "2026-08-25",
      label: "Tue",
      completed: false
    });
    expect(weekDays[2]).toEqual({
      date: "2026-08-26",
      label: "Wed",
      completed: true
    });
  });
});

describe("isAlreadyCompleted", () => {
  it("detects duplicate completion dates", () => {
    const completedDates = new Set(["2026-08-24", "2026-08-26"]);

    expect(isAlreadyCompleted(completedDates, "2026-08-24")).toBe(true);
    expect(isAlreadyCompleted(completedDates, "2026-08-25")).toBe(false);
  });
});
