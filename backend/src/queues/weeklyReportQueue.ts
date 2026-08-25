import type { Channel } from "amqplib";
import { getRabbitmqChannel } from "../config/rabbitmq";
import { logger } from "../config/logger";

export type WeeklyReportJobMessage = {
  userId: number;
  weekStartDate: string;
  weekEndDate: string;
};

export const WEEKLY_REPORT_QUEUE_NAME = "weekly_reports";

let queueAsserted = false;

async function getQueueChannel(): Promise<Channel> {
  const ch = await getRabbitmqChannel();
  if (!queueAsserted) {
    await ch.assertQueue(WEEKLY_REPORT_QUEUE_NAME, {
      durable: true
    });
    queueAsserted = true;
    logger.info(
      { event: "weekly_report_queue_asserted", queue: WEEKLY_REPORT_QUEUE_NAME, durable: true },
      "Weekly report queue asserted"
    );
  }
  return ch;
}

export async function publishWeeklyReportJob(
  job: WeeklyReportJobMessage
): Promise<void> {
  const ch = await getQueueChannel();
  const payload = Buffer.from(JSON.stringify(job));

  const ok = ch.sendToQueue(WEEKLY_REPORT_QUEUE_NAME, payload, {
    persistent: true
  });

  if (!ok) {
    logger.warn(
      {
        event: "weekly_report_job_publish_backpressure",
        queue: WEEKLY_REPORT_QUEUE_NAME,
        userId: job.userId,
        weekStartDate: job.weekStartDate,
        weekEndDate: job.weekEndDate
      },
      "sendToQueue returned false"
    );
  } else {
    logger.info(
      {
        event: "weekly_report_job_published",
        queue: WEEKLY_REPORT_QUEUE_NAME,
        userId: job.userId,
        weekStartDate: job.weekStartDate,
        weekEndDate: job.weekEndDate
      },
      "Queued weekly report job"
    );
  }
}

