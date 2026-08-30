import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";

type WeekDay = {
  date: string;
  label: string;
  completed: boolean;
};

type GoalItem = {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
  completedToday: boolean;
  weekDays: WeekDay[];
  completedDaysThisWeek: number;
  totalDaysThisWeek: number;
};

type GoalsResponse = {
  data: {
    today: string;
    weekStartDate: string;
    weekEndDate: string;
    goals: GoalItem[];
  };
};

function WeekProgress({ weekDays }: { weekDays: WeekDay[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {weekDays.map((day) => (
        <div key={day.date} className="flex flex-col items-center gap-1">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
              day.completed
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-300 bg-white text-slate-400"
            }`}
            aria-label={`${day.label} ${day.completed ? "completed" : "not completed"}`}
          >
            {day.completed ? "✓" : ""}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionGoalId, setActionGoalId] = useState<number | null>(null);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<GoalsResponse>("/api/v1/goals", { auth: true });
      setGoals(response.data.goals);
      setToday(response.data.today);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  async function handleCreateGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await apiRequest("/api/v1/goals", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || undefined
        })
      });
      setTitle("");
      setDescription("");
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleToday(goal: GoalItem) {
    setActionGoalId(goal.id);
    setError(null);

    try {
      if (goal.completedToday) {
        await apiRequest(`/api/v1/goals/${goal.id}/complete?date=${encodeURIComponent(today)}`, {
          method: "DELETE",
          auth: true
        });
      } else {
        await apiRequest(`/api/v1/goals/${goal.id}/complete`, {
          method: "POST",
          auth: true
        });
      }

      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update goal completion");
    } finally {
      setActionGoalId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Daily Goals</h1>
        <p className="mt-2 text-sm text-slate-600">
          Track simple daily habits. Mark each goal complete for today and review your progress for
          the current week.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateGoal} className="mt-6 space-y-4">
          <div>
            <label htmlFor="goal-title" className="block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Morning walk"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label htmlFor="goal-description" className="block text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="20 minutes outside before work"
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating..." : "Add Goal"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Active Goals</h2>

        {loading && <p className="mt-4 text-sm text-slate-600">Loading goals...</p>}

        {!loading && goals.length === 0 && (
          <p className="mt-4 text-sm text-slate-600">
            No active goals yet. Add your first daily habit above.
          </p>
        )}

        {!loading && goals.length > 0 && (
          <ul className="mt-4 space-y-4">
            {goals.map((goal) => (
              <li
                key={goal.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{goal.title}</h3>
                    {goal.description && (
                      <p className="mt-1 text-sm text-slate-600">{goal.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleToggleToday(goal)}
                    disabled={actionGoalId === goal.id}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      goal.completedToday
                        ? "border border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {actionGoalId === goal.id
                      ? "Saving..."
                      : goal.completedToday
                        ? "Completed Today"
                        : "Mark Complete"}
                  </button>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">This week</p>
                    <p className="text-sm text-slate-600">
                      {goal.completedDaysThisWeek} / {goal.totalDaysThisWeek} this week
                    </p>
                  </div>
                  <WeekProgress weekDays={goal.weekDays} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
