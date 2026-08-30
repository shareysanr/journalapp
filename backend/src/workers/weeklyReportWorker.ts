import "dotenv/config";
import type { ConsumeMessage } from "amqplib";
import { getRabbitmqChannel } from "../config/rabbitmq";
import { logger } from "../config/logger";
import { WEEKLY_REPORT_QUEUE_NAME } from "../queues/weeklyReportQueue";
import { isWeeklyReportJobMessage } from "../queues/weeklyReportJobMessage";
import { generateWeeklyReport, saveWeeklyReport } from "../services/weeklyReportService";
import { evaluateReportAchievements } from "../services/achievementService";

export async function startWeeklyReportWorker(): Promise<void> {
  const channel = await getRabbitmqChannel();

  await channel.assertQueue(WEEKLY_REPORT_QUEUE_NAME, {
    durable: true
  });
  channel.prefetch(1);

  logger.info(
    { event: "weekly_report_worker_waiting", queue: WEEKLY_REPORT_QUEUE_NAME, prefetch: 1 },
    "Weekly report worker waiting for jobs"
  );

  channel.consume(
    WEEKLY_REPORT_QUEUE_NAME,
    async (msg: ConsumeMessage | null) => {
      if (!msg) {
        return;
      }

      try {
        const raw = msg.content.toString("utf8");
        const parsed = JSON.parse(raw);

        if (!isWeeklyReportJobMessage(parsed)) {
          logger.error(
            { event: "weekly_report_worker_invalid_payload", queue: WEEKLY_REPORT_QUEUE_NAME, raw },
            "Invalid job payload, discarding"
          );
          channel.ack(msg);
          return;
        }

        const { userId, weekStartDate, weekEndDate } = parsed;
        logger.info({
          event: "weekly_report_worker_processing",
          userId,
          weekStartDate,
          weekEndDate
        });

        const report = await generateWeeklyReport(userId, weekStartDate, weekEndDate);
        const saved = await saveWeeklyReport(userId, report);
        const newlyUnlockedAchievements = await evaluateReportAchievements(userId);

        if (newlyUnlockedAchievements.length > 0) {
          logger.info({
            event: "weekly_report_achievements_unlocked",
            userId,
            achievementKeys: newlyUnlockedAchievements.map((achievement) => achievement.key)
          });
        }

        logger.info({
          event: "weekly_report_worker_saved",
          reportId: saved.id,
          userId,
          weekStartDate,
          weekEndDate
        });

        channel.ack(msg);
      } catch (err) {
        logger.error({ event: "weekly_report_worker_process_error", err }, "Worker job error");
        // Do not requeue to avoid an infinite retry loop in this minimal version.
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  startWeeklyReportWorker().catch((err) => {
    logger.fatal({ event: "weekly_report_worker_startup_fatal", err }, "Worker startup failed");
    process.exit(1);
  });
}

