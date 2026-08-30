import { isValidDateString } from "../services/weeklyReportCalculations";

export type ParsedCreateGoalInput = {
  title: string;
  description: string | null;
};

export type ParsedUpdateGoalInput = {
  title?: string;
  description?: string | null;
  isActive?: boolean;
};

export type ParseGoalResult<T> = { ok: true; data: T } | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCreateGoalPayload(body: unknown): ParseGoalResult<ParsedCreateGoalInput> {
  if (!isRecord(body)) {
    return { ok: false, message: "Request body must be an object" };
  }

  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    return { ok: false, message: "title is required" };
  }

  if (body.title.trim().length > 200) {
    return { ok: false, message: "title must be 200 characters or fewer" };
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== "string") {
    return { ok: false, message: "description must be a string" };
  }

  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  if (description && description.length > 1000) {
    return { ok: false, message: "description must be 1000 characters or fewer" };
  }

  return {
    ok: true,
    data: {
      title: body.title.trim(),
      description
    }
  };
}

export function parseUpdateGoalPayload(body: unknown): ParseGoalResult<ParsedUpdateGoalInput> {
  if (!isRecord(body)) {
    return { ok: false, message: "Request body must be an object" };
  }

  const data: ParsedUpdateGoalInput = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return { ok: false, message: "title must be a non-empty string" };
    }
    if (body.title.trim().length > 200) {
      return { ok: false, message: "title must be 200 characters or fewer" };
    }
    data.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      return { ok: false, message: "description must be a string or null" };
    }
    data.description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;
    if (data.description && data.description.length > 1000) {
      return { ok: false, message: "description must be 1000 characters or fewer" };
    }
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return { ok: false, message: "isActive must be a boolean" };
    }
    data.isActive = body.isActive;
  }

  if (data.title === undefined && data.description === undefined && data.isActive === undefined) {
    return { ok: false, message: "At least one field must be provided" };
  }

  return { ok: true, data };
}

export function parseCompletionDate(value: unknown): ParseGoalResult<string> {
  if (value === undefined || value === null) {
    return { ok: false, message: "date query parameter is required" };
  }

  if (typeof value !== "string" || !isValidDateString(value)) {
    return { ok: false, message: "date must be a valid YYYY-MM-DD value" };
  }

  return { ok: true, data: value };
}

export function parseGoalId(value: string): number | null {
  const goalId = Number(value);
  if (!Number.isInteger(goalId) || goalId <= 0) {
    return null;
  }
  return goalId;
}
