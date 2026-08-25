import pino from "pino";

const level = process.env.LOG_LEVEL ?? "info";

export const logger = pino({
  level,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "clarity-backend",
    environment: process.env.NODE_ENV ?? "development"
  }
});

export function withRequestContext(requestId: string, route?: string) {
  return logger.child({
    requestId,
    route
  });
}
