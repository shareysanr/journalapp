import type { WeeklyReportJobMessage } from "./weeklyReportQueue";

export function isWeeklyReportJobMessage(
  payload: unknown
): payload is WeeklyReportJobMessage {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const value = payload as Partial<WeeklyReportJobMessage>;
  return (
    typeof value.userId === "number" &&
    Number.isInteger(value.userId) &&
    typeof value.weekStartDate === "string" &&
    typeof value.weekEndDate === "string"
  );
}
