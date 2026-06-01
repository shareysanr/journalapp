import cron from "node-cron";
import { prisma } from "../config/prisma";
import { generateWeeklyReport } from "../services/weeklyReportService";

// Every Sunday at 11:59 PM (server local time).
// Cron format: minute hour day-of-month month day-of-week
//const WEEKLY_REPORT_SCHEDULE = "59 23 * * 0";

const WEEKLY_REPORT_SCHEDULE = "* * * * *";
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Monday through Sunday of the week ending when the job runs on Sunday night.
function getPreviousWeekRange(): { weekStartDate: string; weekEndDate: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday

  const weekEnd = new Date(today);
  if (dayOfWeek !== 0) {
    weekEnd.setDate(today.getDate() - dayOfWeek);
  }

  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekEnd.getDate() - 6);

  return {
    weekStartDate: formatLocalDate(weekStart),
    weekEndDate: formatLocalDate(weekEnd)
  };
}

async function getUserIdsWithEntriesInRange(
  weekStartDate: string,
  weekEndDate: string
): Promise<string[]> {
  const rows = await prisma.entry.findMany({
    where: {
      date: {
        gte: new Date(`${weekStartDate}T00:00:00.000Z`),
        lte: new Date(`${weekEndDate}T00:00:00.000Z`)
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

      console.log(`[weekly-report-job] Success for user ${userId}`);
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
