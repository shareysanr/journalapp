import { describe, expect, it } from "vitest";
import { DEFAULT_ACHIEVEMENT_DEFINITIONS } from "../src/services/achievementDefinitions";

describe("achievement definition seeds", () => {
  it("groups achievements by category with sort order", () => {
    const entries = DEFAULT_ACHIEVEMENT_DEFINITIONS.filter(
      (definition) => definition.category === "entries"
    );
    const goals = DEFAULT_ACHIEVEMENT_DEFINITIONS.filter(
      (definition) => definition.category === "goals"
    );
    const reports = DEFAULT_ACHIEVEMENT_DEFINITIONS.filter(
      (definition) => definition.category === "reports"
    );

    expect(entries).toHaveLength(3);
    expect(goals).toHaveLength(4);
    expect(reports).toHaveLength(1);
    expect(entries.map((definition) => definition.sortOrder)).toEqual([1, 2, 3]);
  });

  it("includes title and description for each definition", () => {
    for (const definition of DEFAULT_ACHIEVEMENT_DEFINITIONS) {
      expect(definition.title.trim().length).toBeGreaterThan(0);
      expect(definition.description.trim().length).toBeGreaterThan(0);
      expect(definition.icon.trim().length).toBeGreaterThan(0);
    }
  });
});
