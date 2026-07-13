import amqplib, { type Channel, type ChannelModel } from "amqplib";

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

export async function getRabbitmqChannel(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  if (connecting) {
    return connecting;
  }

  connecting = (async () => {
    const url = getRabbitmqUrl();
    console.log(`[rabbitmq] Connecting to ${url}`);

    connection = await amqplib.connect(url);
    connection.on("error", (err) => {
      console.error("[rabbitmq] Connection error:", err);
    });
    connection.on("close", () => {
      console.log("[rabbitmq] Connection closed");
      connection = null;
      channel = null;
      connecting = null;
    });

    const createdChannel = await connection.createChannel();
    channel = createdChannel;
    console.log("[rabbitmq] Channel created");
    return createdChannel;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

