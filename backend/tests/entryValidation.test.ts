import { describe, expect, it } from "vitest";
import { parseEntryPayload } from "../src/utils/entryValidation";

const validPayload = {
  goalsPlanned: "Ship the weekly report",
  numGoals: 3,
  goalsCompleted: 2,
  distractions: ["phone"],
  negativeComponents: ["fatigue"],
  positiveComponents: ["focus"],
  difficulty: 5,
  rating: 7,
  mood: 6,
  motivation: 8,
  notes: "Felt steady"
};

describe("parseEntryPayload", () => {
  it("accepts a complete valid payload", () => {
    const result = parseEntryPayload(validPayload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mood).toBe(6);
      expect(result.data.motivation).toBe(8);
      expect(result.data.notes).toBe("Felt steady");
    }
  });

  it("defaults missing list fields to empty arrays", () => {
    const result = parseEntryPayload({
      ...validPayload,
      distractions: undefined,
      negativeComponents: undefined,
      positiveComponents: undefined
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.distractions).toEqual([]);
      expect(result.data.negativeComponents).toEqual([]);
      expect(result.data.positiveComponents).toEqual([]);
    }
  });

  it("requires goalsPlanned", () => {
    const result = parseEntryPayload({ ...validPayload, goalsPlanned: "  " });
    expect(result).toEqual({ ok: false, message: "goalsPlanned is required" });
  });

  it("requires mood and motivation as integers 1-10", () => {
    expect(parseEntryPayload({ ...validPayload, mood: 0 })).toEqual({
      ok: false,
      message: "mood must be an integer between 1 and 10"
    });
    expect(parseEntryPayload({ ...validPayload, motivation: 11 })).toEqual({
      ok: false,
      message: "motivation must be an integer between 1 and 10"
    });
    expect(parseEntryPayload({ ...validPayload, mood: 6.5 })).toEqual({
      ok: false,
      message: "mood must be an integer between 1 and 10"
    });
    expect(parseEntryPayload({ ...validPayload, motivation: undefined })).toEqual({
      ok: false,
      message: "motivation must be an integer between 1 and 10"
    });
  });

  it("validates difficulty and rating as integers 1-10", () => {
    expect(parseEntryPayload({ ...validPayload, difficulty: 0 })).toEqual({
      ok: false,
      message: "difficulty must be an integer between 1 and 10"
    });
    expect(parseEntryPayload({ ...validPayload, rating: 11 })).toEqual({
      ok: false,
      message: "rating must be an integer between 1 and 10"
    });
  });
});
