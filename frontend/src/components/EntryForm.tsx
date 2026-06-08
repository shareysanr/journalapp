import { useState, type FormEvent } from "react";
import { apiRequest, parseCommaList } from "../api";

type CreatedEntryResponse = {
  data: { id: number; date: string };
};

export default function EntryForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [goalsPlanned, setGoalsPlanned] = useState("");
  const [numGoals, setNumGoals] = useState("3");
  const [goalsCompleted, setGoalsCompleted] = useState("2");
  const [distractions, setDistractions] = useState("");
  const [negativeComponents, setNegativeComponents] = useState("");
  const [positiveComponents, setPositiveComponents] = useState("");
  const [difficulty, setDifficulty] = useState("5");
  const [rating, setRating] = useState("7");
  const [notes, setNotes] = useState("");

  async function handleCreateEntry(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<CreatedEntryResponse>(
        "/api/v1/entries",
        {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            goalsPlanned,
            numGoals: Number(numGoals),
            goalsCompleted: Number(goalsCompleted),
            distractions: parseCommaList(distractions),
            negativeComponents: parseCommaList(negativeComponents),
            positiveComponents: parseCommaList(positiveComponents),
            difficulty: Number(difficulty),
            rating: Number(rating),
            notes: notes || undefined
          })
        }
      );

      setSuccess(`Entry created for ${response.data.date} (id ${response.data.id}).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create entry.";
      setError(message);
    }
  }

  return (
    <div className="card">
      <h2>Create Entry</h2>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <form onSubmit={handleCreateEntry}>
        <label>
          Goals planned
          <textarea
            value={goalsPlanned}
            onChange={(e) => setGoalsPlanned(e.target.value)}
            required
            rows={3}
          />
        </label>

        <div className="row">
          <label>
            Number of goals
            <input
              type="number"
              min={0}
              value={numGoals}
              onChange={(e) => setNumGoals(e.target.value)}
              required
            />
          </label>

          <label>
            Goals completed
            <input
              type="number"
              min={0}
              value={goalsCompleted}
              onChange={(e) => setGoalsCompleted(e.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Distractions (comma-separated)
          <input
            type="text"
            value={distractions}
            onChange={(e) => setDistractions(e.target.value)}
            placeholder="phone, social media"
          />
        </label>

        <label>
          Negative components (comma-separated)
          <input
            type="text"
            value={negativeComponents}
            onChange={(e) => setNegativeComponents(e.target.value)}
            placeholder="procrastination, fatigue"
          />
        </label>

        <label>
          Positive components (comma-separated)
          <input
            type="text"
            value={positiveComponents}
            onChange={(e) => setPositiveComponents(e.target.value)}
            placeholder="exercise, deep work"
          />
        </label>

        <div className="row">
          <label>
            Difficulty (1-10)
            <input
              type="number"
              min={1}
              max={10}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              required
            />
          </label>

          <label>
            Rating (1-10)
            <input
              type="number"
              min={1}
              max={10}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>

        <button type="submit">Create entry</button>
      </form>
    </div>
  );
}

