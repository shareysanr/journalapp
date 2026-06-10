import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import { type Entry } from "../components/EntryForm";

type EntriesListResponse = {
  data: {
    entries: Entry[];
    startDate: string;
    endDate: string;
  };
};

function formatDisplayDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}...`;
}

export default function ViewEntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<EntriesListResponse>("/api/v1/entries", {
        auth: true
      });
      setEntries(response.data.entries);
      setStartDate(response.data.startDate);
      setEndDate(response.data.endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  async function handleDelete(entry: Entry) {
    const confirmed = window.confirm(`Delete the entry from ${entry.date}?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(entry.id);
    setError(null);

    try {
      await apiRequest(`/api/v1/entries/${entry.id}`, {
        method: "DELETE",
        auth: true
      });
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setDeletingId(null);
    }
  }

  const dateRangeLabel =
    startDate && endDate
      ? startDate === endDate
        ? formatDisplayDate(startDate)
        : `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
      : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">View Entries</h1>
      <p className="mt-1 text-sm text-slate-600">
        {dateRangeLabel
          ? `Entries for ${dateRangeLabel} (included in your upcoming weekly report).`
          : "Entries included in your upcoming weekly report."}
      </p>

      {loading && <p className="mt-6 text-sm text-slate-600">Loading entries...</p>}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No entries yet this week.{" "}
          <Link to="/entries/new" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create a new entry
          </Link>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <ul className="mt-6 flex flex-col gap-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{entry.date}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Goals: {entry.goalsCompleted}/{entry.numGoals} · Rating: {entry.rating} ·
                    Difficulty: {entry.difficulty}
                  </p>
                  {entry.goalsPlanned.trim() && (
                    <p className="mt-2 text-sm text-slate-700">
                      {truncate(entry.goalsPlanned, 120)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/entries/${entry.id}/edit`}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(entry)}
                    disabled={deletingId === entry.id}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === entry.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
