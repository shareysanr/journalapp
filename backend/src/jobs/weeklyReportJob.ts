import cron from "node-cron";
import { prisma } from "../config/prisma";
import { publishWeeklyReportJob } from "../queues/weeklyReportQueue";
import {
  dateStringToUtcStart,
  getPreviousWeekRange,
  WEEKLY_REPORT_SCHEDULE
} from "../utils/reportSchedule";

async function getUserIdsWithEntriesInRange(
  weekStartDate: string,
  weekEndDate: string
): Promise<number[]> {
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
    console.log("[weekly-report-job] No users with entries in this week. Nothing to queue.");
    return;
  }

  console.log(
    `[weekly-report-job] Found ${userIds.length} user(s) with entries — queueing weekly report jobs`
  );

  for (const userId of userIds) {
    try {
      await publishWeeklyReportJob({ userId, weekStartDate, weekEndDate });
      console.log(
        `[weekly-report-job] Queued weekly report job for user ${userId} (${weekStartDate} to ${weekEndDate})`
      );
    } catch (err) {
      console.error(
        `[weekly-report-job] Failed to queue weekly report job for user ${userId}:`,
        err
      );
    }
  }

  console.log("[weekly-report-job] Weekly report queueing pass finished");
}

export function startWeeklyReportJob(): void {
  cron.schedule(WEEKLY_REPORT_SCHEDULE, () => {
    void runWeeklyReportJob();
  });

  console.log(
    `[weekly-report-job] Scheduled weekly report job (${WEEKLY_REPORT_SCHEDULE}, server local time)`
  );
}
