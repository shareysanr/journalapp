import { describe, expect, it } from "vitest";
import { isWeeklyReportJobMessage } from "../src/queues/weeklyReportJobMessage";

describe("isWeeklyReportJobMessage", () => {
  it("accepts a valid job payload", () => {
    expect(
      isWeeklyReportJobMessage({
        userId: 1,
        weekStartDate: "2026-07-07",
        weekEndDate: "2026-07-13"
      })
    ).toBe(true);
  });

  it("rejects null, non-objects, and incomplete payloads", () => {
    expect(isWeeklyReportJobMessage(null)).toBe(false);
    expect(isWeeklyReportJobMessage("x")).toBe(false);
    expect(isWeeklyReportJobMessage({})).toBe(false);
    expect(
      isWeeklyReportJobMessage({
        userId: "1",
        weekStartDate: "2026-07-07",
        weekEndDate: "2026-07-13"
      })
    ).toBe(false);
    expect(
      isWeeklyReportJobMessage({
        userId: 1.5,
        weekStartDate: "2026-07-07",
        weekEndDate: "2026-07-13"
      })
    ).toBe(false);
  });
});
