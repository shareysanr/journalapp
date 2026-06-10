import { useEffect, useState } from "react";
import { apiRequest } from "../api";

type DashboardStats = {
  entriesThisWeek: number;
  goalsCompletedThisWeek: number;
  latestRating: number | null;
  daysUntilNextReport: number;
};

type DashboardStatsResponse = {
  data: DashboardStats;
};

function formatNextReport(days: number): string {
  if (days === 0) {
    return "Today";
  }
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest<DashboardStatsResponse>("/api/v1/dashboard/stats", {
          auth: true
        });
        setStats(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {loading && <p className="mt-6 text-sm text-slate-600">Loading stats...</p>}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Entries This Week</h2>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {stats.entriesThisWeek === 0 ? "No entries yet" : stats.entriesThisWeek}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Goals Completed</h2>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {stats.entriesThisWeek === 0 ? "No entries yet" : stats.goalsCompletedThisWeek}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Latest Rating</h2>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {stats.latestRating === null ? "No entries yet" : stats.latestRating}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Next Report</h2>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatNextReport(stats.daysUntilNextReport)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
