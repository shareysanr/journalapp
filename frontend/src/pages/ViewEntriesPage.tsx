import { useCallback, useEffect, useMemo, useState } from "react";
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

type WeekGroup = {
  weekStartDate: string;
  entries: Entry[];
};

function formatDisplayDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStartDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return formatLocalDate(date);
}

function getWeekEndDate(weekStartDate: string): string {
  const [year, month, day] = weekStartDate.split("-").map(Number);
  const weekStart = new Date(year, month - 1, day);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return formatLocalDate(weekEnd);
}

function formatWeekRange(weekStartDate: string): string {
  return `${formatDisplayDate(weekStartDate)} – ${formatDisplayDate(getWeekEndDate(weekStartDate))}`;
}

function groupEntriesByWeek(entries: Entry[]): WeekGroup[] {
  const groups = new Map<string, Entry[]>();

  for (const entry of entries) {
    const weekStartDate = getWeekStartDate(entry.date);
    const existing = groups.get(weekStartDate);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(weekStartDate, [entry]);
    }
  }

  return [...groups.entries()].map(([weekStartDate, weekEntries]) => ({
    weekStartDate,
    entries: weekEntries
  }));
}

function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}...`;
}

function EntryCard({
  entry,
  deletingId,
  onDelete
}: {
  entry: Entry;
  deletingId: number | null;
  onDelete: (entry: Entry) => void;
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{entry.date}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Goals: {entry.goalsCompleted}/{entry.numGoals} · Rating: {entry.rating} ·
            Difficulty: {entry.difficulty} · Mood: {entry.mood ?? "—"} · Motivation:{" "}
            {entry.motivation ?? "—"}
          </p>
          {entry.goalsPlanned.trim() && (
            <p className="mt-2 text-sm text-slate-700">{truncate(entry.goalsPlanned, 120)}</p>
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
            onClick={() => onDelete(entry)}
            disabled={deletingId === entry.id}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deletingId === entry.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function ViewEntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
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

  const { currentWeekEntries, previousWeeks } = useMemo(() => {
    if (!startDate) {
      return { currentWeekEntries: [] as Entry[], previousWeeks: [] as WeekGroup[] };
    }

    const currentWeekEnd = getWeekEndDate(startDate);
    const currentWeekEntries = entries.filter(
      (entry) => entry.date >= startDate && entry.date <= currentWeekEnd
    );
    const previousEntries = entries.filter((entry) => entry.date < startDate);

    return {
      currentWeekEntries,
      previousWeeks: groupEntriesByWeek(previousEntries)
    };
  }, [entries, startDate]);

  const dateRangeLabel = startDate ? formatWeekRange(startDate) : null;

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

      {!loading && !error && currentWeekEntries.length === 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No entries yet this week.{" "}
          <Link to="/entries/new" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create a new entry
          </Link>
        </div>
      )}

      {!loading && !error && currentWeekEntries.length > 0 && (
        <ul className="mt-6 flex flex-col gap-4">
          {currentWeekEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              deletingId={deletingId}
              onDelete={(item) => void handleDelete(item)}
            />
          ))}
        </ul>
      )}

      {!loading && !error && previousWeeks.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">Previous weeks</h2>
          <p className="mt-1 text-sm text-slate-600">Browse older journal entries, newest first.</p>

          <div className="mt-6 flex flex-col gap-8">
            {previousWeeks.map((week) => (
              <section key={week.weekStartDate}>
                <h3 className="text-sm font-semibold text-slate-700">
                  {formatWeekRange(week.weekStartDate)}
                </h3>
                <ul className="mt-3 flex flex-col gap-4">
                  {week.entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      deletingId={deletingId}
                      onDelete={(item) => void handleDelete(item)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
