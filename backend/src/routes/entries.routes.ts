import { Request, Response, Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

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

router.post("/api/v1/entries", requireAuth, (req: Request, res: Response) => {
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

router.get("/api/v1/entries/:entryId", requireAuth, (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  res.json({ data: entry });
});

router.put("/api/v1/entries/:entryId", requireAuth, (req: Request, res: Response) => {
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

router.delete("/api/v1/entries/:entryId", requireAuth, (req: Request, res: Response) => {
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

export default router;
