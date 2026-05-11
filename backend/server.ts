import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

type Entry = {
  id: number;
  date: string; // Keep as string not Date object, as JSON will send dates as strings anyways
  goalsPlanned: string;
  numGoals: number;
  goalsCompleted: number;
  distractions: string[]; // Change to enum later
  negativeComponents: string[]; // Change to enum later
  positiveComponents: string[]; // Change to enum later
  difficulty: number;
  rating: number;
  notes: string;
};

let entries: Entry[] = [];
let nextId = 1;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend is running" });
});

// Placeholder requireAuth
const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: { message: "Unauthorized" }
    });
  }

  next();
};


// Entries API
app.post("/api/v1/entries", requireAuth, (req: Request, res: Response) => {
  const {
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  } = req.body;

  const entry: Entry = {
    id: nextId++,
    date: new Date().toISOString().split("T")[0],
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  };

  entries.push(entry);

  res.status(201).json({ data: entry });
});

app.get("/api/v1/entries/:entryId", requireAuth, (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  res.json({ data: entry });
});

app.put("/api/v1/entries/:entryId", requireAuth, (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const index = entries.findIndex((e) => e.id === entryId);

  if (index === -1) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  const {
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  } = req.body;

  const updatedEntry: Entry = {
    id: entryId,
    date: entries[index].date,
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  };

  entries[index] = updatedEntry;

  res.json({ data: updatedEntry });
});

app.delete("/api/v1/entries/:entryId", requireAuth, (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const index = entries.findIndex((e) => e.id === entryId);

  if (index === -1) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  entries.splice(index, 1);

  res.json({
    data: { result: "success" }
  });
});


// Weekly reports API
// Place holder entries so far
app.get("/api/v1/weekly-reports/:reportId", requireAuth, (req: Request, res: Response) => {
  const reportId = Number(req.params.reportId);

  res.json({
    data: {
      id: reportId,
      weekStartDate: "2026-05-04",
      weekEndDate: "2026-05-10",
      summary: "Placeholder weekly report summary.",
      commonDistractions: [],
      commonNegativeComponents: [],
      commonPositiveComponents: [],
      accomplishments: 0,
      failures: 0,
      recommendations: "Placeholder recommendation.",
      averageRating: 0,
      entryIds: []
    }
  });
});

app.post("/api/v1/weekly-reports", requireAuth, (req: Request, res: Response) => {
  res.status(201).json({
    data: {
      id: 1,
      weekStartDate: req.body.weekStartDate,
      weekEndDate: req.body.weekEndDate,
      summary: "Generated placeholder weekly report.",
      commonDistractions: [],
      commonNegativeComponents: [],
      commonPositiveComponents: [],
      accomplishments: 0,
      failures: 0,
      recommendations: "Placeholder recommendation.",
      averageRating: 0,
      entryIds: []
    }
  });
});


// Sign up / login API
// Placeholder for now
app.post("/api/v1/signup", (req: Request, res: Response) => {
  res.status(201).json({
    data: {
      message: "Signup placeholder"
    }
  });
});

app.post("/api/v1/login", (req: Request, res: Response) => {
  res.json({
    data: {
      message: "Login placeholder"
    }
  });
});

app.get("/api/v1/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    data: {
      id: "placeholder-user-id",
      email: "placeholder@example.com"
    }
  });
});


// Port information
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});