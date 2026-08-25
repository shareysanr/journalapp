import amqplib, { type Channel, type ChannelModel } from "amqplib";
import { logger } from "./logger";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let connecting: Promise<Channel> | null = null;

function getRabbitmqUrl(): string {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error("RABBITMQ_URL is not set. Configure it for RabbitMQ connectivity.");
  }
  return url;
}

function rabbitmqEndpoint(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "invalid_url";
  }
}

export async function getRabbitmqChannel(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  if (connecting) {
    return connecting;
  }

  connecting = (async () => {
    const url = getRabbitmqUrl();
    logger.info(
      { event: "rabbitmq_connecting", endpoint: rabbitmqEndpoint(url) },
      "Connecting to RabbitMQ"
    );

    connection = await amqplib.connect(url);
    connection.on("error", (err) => {
      logger.error({ event: "rabbitmq_connection_error", err }, "RabbitMQ connection error");
    });
    connection.on("close", () => {
      logger.warn({ event: "rabbitmq_connection_closed" }, "RabbitMQ connection closed");
      connection = null;
      channel = null;
      connecting = null;
    });

    const createdChannel = await connection.createChannel();
    channel = createdChannel;
    logger.info({ event: "rabbitmq_channel_created" }, "RabbitMQ channel created");
    return createdChannel;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

