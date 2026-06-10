import cron from "node-cron";
import { prisma } from "../config/prisma";
import { generateWeeklyReport, saveWeeklyReport } from "../services/weeklyReportService";
import {
  dateStringToUtcStart,
  getPreviousWeekRange,
  WEEKLY_REPORT_SCHEDULE
} from "../utils/reportSchedule";

async function getUserIdsWithEntriesInRange(
  weekStartDate: string,
  weekEndDate: string
): Promise<string[]> {
  const rows = await prisma.entry.findMany({
    where: {
      date: {
        gte: dateStringToUtcStart(weekStartDate),
        lte: dateStringToUtcStart(weekEndDate)
      }
    },
    select: { userId: true },
    distinct: ["userId"]
  });

  return rows.map((row) => row.userId);
}

async function runWeeklyReportJob(): Promise<void> {
  console.log("[weekly-report-job] Weekly report job started");

  const { weekStartDate, weekEndDate } = getPreviousWeekRange();
  console.log(`[weekly-report-job] Week range: ${weekStartDate} to ${weekEndDate}`);

  const userIds = await getUserIdsWithEntriesInRange(weekStartDate, weekEndDate);

  if (userIds.length === 0) {
    console.log("[weekly-report-job] No users with entries in this week. Nothing to do.");
    return;
  }

  console.log(`[weekly-report-job] Found ${userIds.length} user(s) with entries`);

  for (const userId of userIds) {
    try {
      const report = await generateWeeklyReport(userId, weekStartDate, weekEndDate);
      const saved = await saveWeeklyReport(userId, report);

      console.log(`[weekly-report-job] Success for user ${userId} (report id ${saved.id})`);
      console.log(`  Summary: ${report.summary}`);
      console.log(`  Recommendations: ${report.recommendations}`);
      console.log(
        `  Stats — accomplishments: ${report.accomplishments}, failures: ${report.failures}, averageRating: ${report.averageRating}, entries: ${report.entryIds.length}`
      );
    } catch (err) {
      console.error(`[weekly-report-job] Failed for user ${userId}:`, err);
    }
  }

  console.log("[weekly-report-job] Weekly report job finished");
}

export function startWeeklyReportJob(): void {
  cron.schedule(WEEKLY_REPORT_SCHEDULE, () => {
    void runWeeklyReportJob();
  });

  console.log(
    `[weekly-report-job] Scheduled weekly report job (${WEEKLY_REPORT_SCHEDULE}, server local time)`
  );
}
