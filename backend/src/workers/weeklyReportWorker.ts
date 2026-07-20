import "dotenv/config";
import type { ConsumeMessage } from "amqplib";
import { getRabbitmqChannel } from "../config/rabbitmq";
import {
  WEEKLY_REPORT_QUEUE_NAME,
  type WeeklyReportJobMessage
} from "../queues/weeklyReportQueue";
import { generateWeeklyReport, saveWeeklyReport } from "../services/weeklyReportService";

function isWeeklyReportJobMessage(payload: unknown): payload is WeeklyReportJobMessage {
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

export async function startWeeklyReportWorker(): Promise<void> {
  const channel = await getRabbitmqChannel();

  await channel.assertQueue(WEEKLY_REPORT_QUEUE_NAME, {
    durable: true
  });
  channel.prefetch(1);

  console.log(
    `[weekly-report-worker] Waiting for jobs in queue "${WEEKLY_REPORT_QUEUE_NAME}" (prefetch=1)`
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
          console.error(
            "[weekly-report-worker] Invalid job payload, acknowledging to discard:",
            raw
          );
          channel.ack(msg);
          return;
        }

        const { userId, weekStartDate, weekEndDate } = parsed;
        console.log(
          `[weekly-report-worker] Processing job for user ${userId} (${weekStartDate} to ${weekEndDate})`
        );

        const report = await generateWeeklyReport(userId, weekStartDate, weekEndDate);
        const saved = await saveWeeklyReport(userId, report);

        console.log(
          `[weekly-report-worker] Saved weekly report id ${saved.id} for user ${userId} (${weekStartDate} to ${weekEndDate})`
        );

        channel.ack(msg);
      } catch (err) {
        console.error("[weekly-report-worker] Error while processing job:", err);
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
    console.error("[weekly-report-worker] Fatal error during startup:", err);
    process.exit(1);
  });
}

