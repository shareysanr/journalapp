import cron from "node-cron";
import { prisma } from "../config/prisma";
import { publishWeeklyReportJob } from "../queues/weeklyReportQueue";
import { logger } from "../config/logger";
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
  logger.info({ event: "weekly_report_job_started" }, "Weekly report job started");

  const { weekStartDate, weekEndDate } = getPreviousWeekRange();
  logger.info({ event: "weekly_report_job_range", weekStartDate, weekEndDate });

  const userIds = await getUserIdsWithEntriesInRange(weekStartDate, weekEndDate);

  if (userIds.length === 0) {
    logger.info({ event: "weekly_report_job_no_users", weekStartDate, weekEndDate });
    return;
  }

  logger.info({ event: "weekly_report_job_users_found", count: userIds.length });

  for (const userId of userIds) {
    try {
      await publishWeeklyReportJob({ userId, weekStartDate, weekEndDate });
      logger.info({
        event: "weekly_report_job_queued",
        userId,
        weekStartDate,
        weekEndDate
      });
    } catch (err) {
      logger.error(
        { event: "weekly_report_job_queue_failed", userId, weekStartDate, weekEndDate, err },
        "Failed to queue weekly report job"
      );
    }
  }

  logger.info({ event: "weekly_report_job_finished" }, "Weekly report queueing pass finished");
}

export function startWeeklyReportJob(): void {
  cron.schedule(WEEKLY_REPORT_SCHEDULE, () => {
    void runWeeklyReportJob();
  });

  logger.info(
    { event: "weekly_report_job_scheduled", schedule: WEEKLY_REPORT_SCHEDULE },
    "Scheduled weekly report job"
  );
}
