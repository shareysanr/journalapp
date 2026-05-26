import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { initDb } from "./config/db";
import authRoutes from "./routes/auth.routes";
import entriesRoutes from "./routes/entries.routes";
import weeklyReportsRoutes from "./routes/weeklyReports.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend is running" });
});

app.use(authRoutes);
app.use(entriesRoutes);
app.use(weeklyReportsRoutes);

// Port information
const PORT = process.env.PORT ?? 3000;

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
