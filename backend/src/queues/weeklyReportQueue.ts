import type { Channel } from "amqplib";
import { getRabbitmqChannel } from "../config/rabbitmq";

export type WeeklyReportJobMessage = {
  userId: string;
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
    console.log(
      `[weekly-report-queue] Queue "${WEEKLY_REPORT_QUEUE_NAME}" asserted (durable)`
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
    console.warn(
      `[weekly-report-queue] sendToQueue returned false for user ${job.userId} (${job.weekStartDate} to ${job.weekEndDate})`
    );
  } else {
    console.log(
      `[weekly-report-queue] Queued weekly report job for user ${job.userId} (${job.weekStartDate} to ${job.weekEndDate})`
    );
  }
}

