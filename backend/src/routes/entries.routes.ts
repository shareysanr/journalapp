import { Request, Response, Router } from "express";
import { pool } from "../config/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

type Entry = {
  id: number;
  date: string;
  goalsPlanned: string;
  numGoals: number;
  goalsCompleted: number;
  distractions: string[];
  negativeComponents: string[];
  positiveComponents: string[];
  difficulty: number;
  rating: number;
  notes: string;
};

type EntryRow = {
  id: number;
  user_id: string;
  date: Date | string;
  goals_planned: string;
  num_goals: number;
  goals_completed: number;
  distractions: string[];
  negative_components: string[];
  positive_components: string[];
  difficulty: number;
  rating: number;
  notes: string | null;
};

function rowToEntry(row: EntryRow): Entry {
  const date =
    typeof row.date === "string"
      ? row.date.split("T")[0]
      : row.date.toISOString().split("T")[0];

  return {
    id: row.id,
    date,
    goalsPlanned: row.goals_planned,
    numGoals: row.num_goals,
    goalsCompleted: row.goals_completed,
    distractions: row.distractions,
    negativeComponents: row.negative_components,
    positiveComponents: row.positive_components,
    difficulty: row.difficulty,
    rating: row.rating,
    notes: row.notes ?? ""
  };
}

router.post("/api/v1/entries", requireAuth, async (req: Request, res: Response) => {
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

  const date = new Date().toISOString().split("T")[0];

  const result = await pool.query<EntryRow>(
    `INSERT INTO entries (
      user_id, date, goals_planned, num_goals, goals_completed,
      distractions, negative_components, positive_components,
      difficulty, rating, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      req.auth!.sub,
      date,
      goalsPlanned,
      numGoals,
      goalsCompleted,
      distractions ?? [],
      negativeComponents ?? [],
      positiveComponents ?? [],
      difficulty,
      rating,
      notes ?? null
    ]
  );

  res.status(201).json({ data: rowToEntry(result.rows[0]) });
});

router.get("/api/v1/entries/:entryId", requireAuth, async (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const result = await pool.query<EntryRow>(
    `SELECT * FROM entries WHERE id = $1 AND user_id = $2`,
    [entryId, req.auth!.sub]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  res.json({ data: rowToEntry(result.rows[0]) });
});

router.put("/api/v1/entries/:entryId", requireAuth, async (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
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

  const result = await pool.query<EntryRow>(
    `UPDATE entries SET
      goals_planned = $1,
      num_goals = $2,
      goals_completed = $3,
      distractions = $4,
      negative_components = $5,
      positive_components = $6,
      difficulty = $7,
      rating = $8,
      notes = $9
    WHERE id = $10 AND user_id = $11
    RETURNING *`,
    [
      goalsPlanned,
      numGoals,
      goalsCompleted,
      distractions ?? [],
      negativeComponents ?? [],
      positiveComponents ?? [],
      difficulty,
      rating,
      notes ?? null,
      entryId,
      req.auth!.sub
    ]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  res.json({ data: rowToEntry(result.rows[0]) });
});

router.delete("/api/v1/entries/:entryId", requireAuth, async (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const result = await pool.query(
    `DELETE FROM entries WHERE id = $1 AND user_id = $2 RETURNING id`,
    [entryId, req.auth!.sub]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  res.json({
    data: { result: "success" }
  });
});

export default router;
