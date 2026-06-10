import { useEffect, useState } from "react";
import { apiRequest } from "../api";

type StoredWeeklyReport = {
  id: number;
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

function ReportDetails({ report }: { report: StoredWeeklyReport }) {
  return (
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
  );
}

export default function ViewReportCard() {
  const [reports, setReports] = useState<StoredWeeklyReport[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest<{ data: StoredWeeklyReport[] }>(
          "/api/v1/weekly-reports",
          { auth: true }
        );

        setReports(response.data);
        setSelectedId(response.data[0]?.id ?? null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load reports.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadReports();
  }, []);

  const selectedReport = reports.find((report) => report.id === selectedId) ?? null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">View Report</h1>
      <p className="mt-1 text-sm text-slate-600">
        Scheduled weekly reports saved by the cron job. These are separate from on-demand previews.
      </p>

      {loading && <p className="mt-6 text-sm text-slate-600">Loading reports...</p>}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No scheduled reports yet. Reports appear here after the weekly cron job runs.
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <>
          {reports.length > 1 && (
            <label className="mt-6 flex flex-col gap-1 text-sm font-medium text-slate-700">
              Select report
              <select
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-base font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {reports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.weekStartDate} to {report.weekEndDate}
                  </option>
                ))}
              </select>
            </label>
          )}

          {selectedReport && <ReportDetails report={selectedReport} />}
        </>
      )}
    </div>
  );
}
