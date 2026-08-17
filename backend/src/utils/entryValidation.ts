export type ParsedEntryInput = {
  goalsPlanned: string;
  numGoals: number;
  goalsCompleted: number;
  distractions: string[];
  negativeComponents: string[];
  positiveComponents: string[];
  difficulty: number;
  rating: number;
  mood: number;
  motivation: number;
  notes: string | null;
};

export type ParseEntryResult =
  | { ok: true; data: ParsedEntryInput }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNonNegativeInt(value: unknown, field: string): number | string {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return `${field} must be a non-negative integer`;
  }
  return value;
}

function parseScaleScore(value: unknown, field: string): number | string {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 10) {
    return `${field} must be an integer between 1 and 10`;
  }
  return value;
}

function parseStringList(value: unknown, field: string): string[] | string {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return `${field} must be an array of strings`;
  }
  return value.map((item) => item.trim()).filter((item) => item.length > 0);
}

export function parseEntryPayload(body: unknown): ParseEntryResult {
  if (!isRecord(body)) {
    return { ok: false, message: "Request body must be an object" };
  }

  if (typeof body.goalsPlanned !== "string" || body.goalsPlanned.trim().length === 0) {
    return { ok: false, message: "goalsPlanned is required" };
  }

  const numGoals = parseNonNegativeInt(body.numGoals, "numGoals");
  if (typeof numGoals === "string") {
    return { ok: false, message: numGoals };
  }

  const goalsCompleted = parseNonNegativeInt(body.goalsCompleted, "goalsCompleted");
  if (typeof goalsCompleted === "string") {
    return { ok: false, message: goalsCompleted };
  }

  const distractions = parseStringList(body.distractions, "distractions");
  if (typeof distractions === "string") {
    return { ok: false, message: distractions };
  }

  const negativeComponents = parseStringList(body.negativeComponents, "negativeComponents");
  if (typeof negativeComponents === "string") {
    return { ok: false, message: negativeComponents };
  }

  const positiveComponents = parseStringList(body.positiveComponents, "positiveComponents");
  if (typeof positiveComponents === "string") {
    return { ok: false, message: positiveComponents };
  }

  const difficulty = parseScaleScore(body.difficulty, "difficulty");
  if (typeof difficulty === "string") {
    return { ok: false, message: difficulty };
  }

  const rating = parseScaleScore(body.rating, "rating");
  if (typeof rating === "string") {
    return { ok: false, message: rating };
  }

  const mood = parseScaleScore(body.mood, "mood");
  if (typeof mood === "string") {
    return { ok: false, message: mood };
  }

  const motivation = parseScaleScore(body.motivation, "motivation");
  if (typeof motivation === "string") {
    return { ok: false, message: motivation };
  }

  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string") {
    return { ok: false, message: "notes must be a string" };
  }

  const notes =
    typeof body.notes === "string" && body.notes.trim().length > 0 ? body.notes : null;

  return {
    ok: true,
    data: {
      goalsPlanned: body.goalsPlanned.trim(),
      numGoals,
      goalsCompleted,
      distractions,
      negativeComponents,
      positiveComponents,
      difficulty,
      rating,
      mood,
      motivation,
      notes
    }
  };
}
