import { useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "../api";

const inputClassName =
  "rounded-lg border border-slate-300 px-3 py-2 text-base font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

type WeeklyReport = {
  weekStartDate: string;
  weekEndDate: string;
  summary: string;
  recommendations: string;
  accomplishments: number;
  failures: number;
  averageRating: number;
  commonDistractions: string[];
  commonNegativeComponents: string[];
  commonPositiveComponents: string[];
  entryIds: number[];
};

function formatListOrNone(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "None";
}

export default function WeeklyReportCard() {
  const [weekStartDate, setWeekStartDate] = useState("");
  const [weekEndDate, setWeekEndDate] = useState("");
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => weekStartDate !== "" && weekEndDate !== "",
    [weekStartDate, weekEndDate]
  );

  async function handlePreviewWeeklyReport(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setReport(null);

    if (!canSubmit) {
      setError("Please select both week start and week end dates.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{ data: WeeklyReport }>("/api/v1/weekly-reports", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ weekStartDate, weekEndDate })
      });

      setReport(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate weekly report.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Weekly report preview</h1>
      <p className="mt-1 text-sm text-slate-600">
        Generate an on-demand preview from your entries. This is not the scheduled cron report.
      </p>

      <form onSubmit={handlePreviewWeeklyReport} className="mt-6 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Week start
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Week end
            <input
              type="date"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
              className={inputClassName}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="self-start rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-400"
        >
          {loading ? "Generating..." : "Preview Weekly Report"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading && <p className="mt-4 text-sm text-slate-600">Loading weekly report...</p>}

      {report && !loading && (
        <div className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {report.weekStartDate} to {report.weekEndDate}
          </h2>

          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Accomplishments:</span> {report.accomplishments}
            </p>
            <p>
              <span className="font-semibold">Failures:</span> {report.failures}
            </p>
            <p>
              <span className="font-semibold">Average rating:</span> {report.averageRating}
            </p>
            <p>
              <span className="font-semibold">Common distractions:</span>{" "}
              {formatListOrNone(report.commonDistractions)}
            </p>
            <p>
              <span className="font-semibold">Common negative components:</span>{" "}
              {formatListOrNone(report.commonNegativeComponents)}
            </p>
            <p>
              <span className="font-semibold">Common positive components:</span>{" "}
              {formatListOrNone(report.commonPositiveComponents)}
            </p>
            <p>
              <span className="font-semibold">Entries:</span>{" "}
              {report.entryIds.length > 0 ? report.entryIds.join(", ") : "None"}
            </p>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {report.summary}
            </p>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Recommendations</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {report.recommendations}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
