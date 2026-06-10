import { useState, type FormEvent } from "react";
import { apiRequest, parseCommaList } from "../api";

const inputClassName =
  "rounded-lg border border-slate-300 px-3 py-2 text-base font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export type Entry = {
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

type EntryResponse = {
  data: Entry;
};

type EntryFormProps = {
  entryId?: number;
  initialValues?: Entry;
  onSaved?: () => void;
};

function joinList(items: string[]): string {
  return items.join(", ");
}

function getInitialFormState(initialValues?: Entry) {
  return {
    goalsPlanned: initialValues?.goalsPlanned ?? "",
    numGoals: initialValues ? String(initialValues.numGoals) : "3",
    goalsCompleted: initialValues ? String(initialValues.goalsCompleted) : "2",
    distractions: initialValues ? joinList(initialValues.distractions) : "",
    negativeComponents: initialValues ? joinList(initialValues.negativeComponents) : "",
    positiveComponents: initialValues ? joinList(initialValues.positiveComponents) : "",
    difficulty: initialValues ? String(initialValues.difficulty) : "5",
    rating: initialValues ? String(initialValues.rating) : "7",
    notes: initialValues?.notes ?? ""
  };
}

export default function EntryForm({ entryId, initialValues, onSaved }: EntryFormProps) {
  const isEditMode = entryId !== undefined;
  const initial = getInitialFormState(initialValues);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [goalsPlanned, setGoalsPlanned] = useState(initial.goalsPlanned);
  const [numGoals, setNumGoals] = useState(initial.numGoals);
  const [goalsCompleted, setGoalsCompleted] = useState(initial.goalsCompleted);
  const [distractions, setDistractions] = useState(initial.distractions);
  const [negativeComponents, setNegativeComponents] = useState(initial.negativeComponents);
  const [positiveComponents, setPositiveComponents] = useState(initial.positiveComponents);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [rating, setRating] = useState(initial.rating);
  const [notes, setNotes] = useState(initial.notes);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      goalsPlanned,
      numGoals: Number(numGoals),
      goalsCompleted: Number(goalsCompleted),
      distractions: parseCommaList(distractions),
      negativeComponents: parseCommaList(negativeComponents),
      positiveComponents: parseCommaList(positiveComponents),
      difficulty: Number(difficulty),
      rating: Number(rating),
      notes: notes || undefined
    };

    try {
      if (isEditMode) {
        await apiRequest<EntryResponse>(`/api/v1/entries/${entryId}`, {
          method: "PUT",
          auth: true,
          body: JSON.stringify(payload)
        });
        onSaved?.();
        return;
      }

      const response = await apiRequest<EntryResponse>("/api/v1/entries", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload)
      });

      setSuccess(`Entry created for ${response.data.date} (id ${response.data.id}).`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Failed to update entry."
            : "Failed to create entry.";
      setError(message);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEditMode ? "Edit entry" : "Create entry"}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {isEditMode
          ? `Update your journal entry from ${initialValues?.date ?? "this date"}.`
          : "Log today's goals, distractions, and reflection."}
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Goals planned
          <textarea
            value={goalsPlanned}
            onChange={(e) => setGoalsPlanned(e.target.value)}
            required
            rows={3}
            className={inputClassName}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Number of goals
            <input
              type="number"
              min={0}
              value={numGoals}
              onChange={(e) => setNumGoals(e.target.value)}
              required
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Goals completed
            <input
              type="number"
              min={0}
              value={goalsCompleted}
              onChange={(e) => setGoalsCompleted(e.target.value)}
              required
              className={inputClassName}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Distractions (comma-separated)
          <input
            type="text"
            value={distractions}
            onChange={(e) => setDistractions(e.target.value)}
            placeholder="phone, social media"
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Negative components (comma-separated)
          <input
            type="text"
            value={negativeComponents}
            onChange={(e) => setNegativeComponents(e.target.value)}
            placeholder="procrastination, fatigue"
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Positive components (comma-separated)
          <input
            type="text"
            value={positiveComponents}
            onChange={(e) => setPositiveComponents(e.target.value)}
            placeholder="exercise, deep work"
            className={inputClassName}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Difficulty (1-10)
            <input
              type="number"
              min={1}
              max={10}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              required
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Rating (1-10)
            <input
              type="number"
              min={1}
              max={10}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              required
              className={inputClassName}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClassName}
          />
        </label>

        <button
          type="submit"
          className="self-start rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {isEditMode ? "Save changes" : "Create entry"}
        </button>
      </form>
    </div>
  );
}
