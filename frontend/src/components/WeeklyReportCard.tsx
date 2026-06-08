import { useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "../api";

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

  const canSubmit = useMemo(() => weekStartDate !== "" && weekEndDate !== "", [weekStartDate, weekEndDate]);

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
      const response = await apiRequest<{ data: WeeklyReport }>(
        "/api/v1/weekly-reports",
        {
          method: "POST",
          auth: true,
          body: JSON.stringify({ weekStartDate, weekEndDate })
        }
      );

      setReport(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate weekly report.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Weekly Report</h2>

      <form className="form" onSubmit={handlePreviewWeeklyReport}>
        <div className="row">
          <label>
            Week start
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
            />
          </label>
          <label>
            Week end
            <input
              type="date"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
            />
          </label>
        </div>

        <button type="submit" disabled={!canSubmit || loading}>
          {loading ? "Generating..." : "Preview Weekly Report"}
        </button>
      </form>

      {error && <div className="message error report-message">{error}</div>}
      {loading && <p className="status loading">Loading weekly report...</p>}

      {report && !loading && (
        <div className="report">
          <h3>
            Report: {report.weekStartDate} to {report.weekEndDate}
          </h3>

          <p>
            <strong>Accomplishments:</strong> {report.accomplishments} &nbsp;|&nbsp;
            <strong>Failures:</strong> {report.failures} &nbsp;|&nbsp;
            <strong>Average rating:</strong> {report.averageRating}
          </p>

          <p>
            <strong>Common distractions:</strong> {formatListOrNone(report.commonDistractions)}
          </p>
          <p>
            <strong>Common negative components:</strong>{" "}
            {formatListOrNone(report.commonNegativeComponents)}
          </p>
          <p>
            <strong>Common positive components:</strong>{" "}
            {formatListOrNone(report.commonPositiveComponents)}
          </p>

          <p>
            <strong>Entries:</strong>{" "}
            {report.entryIds.length > 0 ? report.entryIds.join(", ") : "None"}
          </p>

          <div className="report-block">
            <h4>Summary</h4>
            <p>{report.summary}</p>
          </div>

          <div className="report-block">
            <h4>Recommendations</h4>
            <p>{report.recommendations}</p>
          </div>
        </div>
      )}
    </div>
  );
}

