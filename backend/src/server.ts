import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import authRoutes from "./routes/auth.routes";
import entriesRoutes from "./routes/entries.routes";
import weeklyReportsRoutes from "./routes/weeklyReports.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import goalsRoutes from "./routes/goals.routes";
import achievementsRoutes from "./routes/achievements.routes";
import { startWeeklyReportJob } from "./jobs/weeklyReportJob";
import { logger, withRequestContext } from "./config/logger";

const app = express();

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl
  })
);
app.use(express.json());
app.use((req, res, next) => {
  const requestId = randomUUID();
  const requestLogger = withRequestContext(requestId, req.path);
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    if (res.statusCode >= 400) {
      requestLogger.warn({
        event: "request_failed",
        method: req.method,
        path: req.path,
        statusCode: res.statusCode
      });
    }
  });

  (req as Request & { log?: typeof requestLogger }).log = requestLogger;
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend is running" });
});

app.use(authRoutes);
app.use(entriesRoutes);
app.use(weeklyReportsRoutes);
app.use(dashboardRoutes);
app.use(goalsRoutes);
app.use(achievementsRoutes);
app.use((err: unknown, req: Request, res: Response, _next: express.NextFunction) => {
  const requestLogger = (req as Request & { log?: typeof logger }).log ?? logger;
  requestLogger.error(
    {
      event: "unexpected_error",
      method: req.method,
      path: req.path,
      err
    },
    "Unhandled application error"
  );
  res.status(500).json({ error: { message: "Internal server error" } });
});

// Port information
const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  logger.info({ event: "server_started", port: Number(PORT), frontendUrl }, "Server started");
  startWeeklyReportJob();
});

process.on("unhandledRejection", (reason) => {
  logger.error({ event: "unhandled_rejection", reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ event: "uncaught_exception", err }, "Uncaught exception");
});
