import { describe, expect, it } from "vitest";
import {
  parseCompletionDate,
  parseCreateGoalPayload,
  parseGoalId,
  parseUpdateGoalPayload
} from "../src/utils/goalValidation";

describe("parseCreateGoalPayload", () => {
  it("accepts a title and optional description", () => {
    const result = parseCreateGoalPayload({
      title: "Morning walk",
      description: "20 minutes outside"
    });

    expect(result).toEqual({
      ok: true,
      data: {
        title: "Morning walk",
        description: "20 minutes outside"
      }
    });
  });

  it("rejects missing titles", () => {
    expect(parseCreateGoalPayload({ description: "No title" })).toEqual({
      ok: false,
      message: "title is required"
    });
  });
});

describe("parseUpdateGoalPayload", () => {
  it("requires at least one field", () => {
    expect(parseUpdateGoalPayload({})).toEqual({
      ok: false,
      message: "At least one field must be provided"
    });
  });

  it("accepts isActive updates", () => {
    expect(parseUpdateGoalPayload({ isActive: false })).toEqual({
      ok: true,
      data: { isActive: false }
    });
  });
});

describe("parseCompletionDate", () => {
  it("accepts valid YYYY-MM-DD values", () => {
    expect(parseCompletionDate("2026-08-30")).toEqual({
      ok: true,
      data: "2026-08-30"
    });
  });

  it("rejects invalid dates", () => {
    expect(parseCompletionDate("08-30-2026")).toEqual({
      ok: false,
      message: "date must be a valid YYYY-MM-DD value"
    });
  });
});

describe("parseGoalId", () => {
  it("parses positive integers", () => {
    expect(parseGoalId("12")).toBe(12);
  });

  it("rejects invalid ids", () => {
    expect(parseGoalId("0")).toBeNull();
    expect(parseGoalId("abc")).toBeNull();
  });
});
