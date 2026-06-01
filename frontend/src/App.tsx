import { useState, type FormEvent } from "react";
import {
  API_BASE,
  apiRequest,
  clearAccessToken,
  getAccessToken,
  parseCommaList,
  setAccessToken
} from "./api";
import "./App.css";

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

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "None";
}

function App() {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [goalsPlanned, setGoalsPlanned] = useState("");
  const [numGoals, setNumGoals] = useState("3");
  const [goalsCompleted, setGoalsCompleted] = useState("2");
  const [distractions, setDistractions] = useState("");
  const [negativeComponents, setNegativeComponents] = useState("");
  const [positiveComponents, setPositiveComponents] = useState("");
  const [difficulty, setDifficulty] = useState("5");
  const [rating, setRating] = useState("7");
  const [notes, setNotes] = useState("");

  const [weekStartDate, setWeekStartDate] = useState("");
  const [weekEndDate, setWeekEndDate] = useState("");
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  function handleError(err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    setError(message);
    setSuccess(null);
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<{
        data: { accessToken: string };
      }>("/api/v1/login", {
        method: "POST",
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      setAccessToken(response.data.accessToken);
      setAccessTokenState(response.data.accessToken);
      setSuccess("Logged in successfully.");
    } catch (err) {
      handleError(err);
    }
  }

  function handleLogout() {
    clearAccessToken();
    setAccessTokenState(null);
    setReport(null);
    setError(null);
    setSuccess("Logged out.");
  }

  async function handleCreateEntry(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<{ data: { id: number; date: string } }>(
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
      handleError(err);
    }
  }

  async function handleGenerateWeeklyReport() {
    setReportError(null);
    setReport(null);
    setSuccess(null);

    const token = getAccessToken();
    if (!token) {
      setReportError("You are not logged in. Please log in first.");
      return;
    }

    if (!weekStartDate || !weekEndDate) {
      setReportError("Please select both week start and week end dates.");
      return;
    }

    setReportLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/weekly-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ weekStartDate, weekEndDate })
      });

      const json = (await response.json()) as {
        data?: WeeklyReport;
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(json.error?.message ?? `Request failed (${response.status})`);
      }

      if (!json.data) {
        throw new Error("No report data returned from the server.");
      }

      setReport(json.data);
      setSuccess("Weekly report generated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate weekly report.";
      setReportError(message);
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Journal App</h1>
        <p className="subtitle">Simple frontend for login, entries, and weekly reports.</p>
      </header>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <section className="card">
        <h2>Login</h2>
        {accessToken ? (
          <div>
            <p className="status">You are logged in.</p>
            <button type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label>
              Username or email
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit">Log in</button>
          </form>
        )}
      </section>

      <section className="card">
        <h2>Create Entry</h2>
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
      </section>

      <section className="card">
        <h2>Weekly Report</h2>
        <div className="form">
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
          <button
            type="button"
            onClick={handleGenerateWeeklyReport}
            disabled={reportLoading}
          >
            {reportLoading ? "Generating..." : "Generate weekly report"}
          </button>
        </div>

        {reportError && <div className="message error report-message">{reportError}</div>}
        {reportLoading && <p className="status loading">Loading weekly report...</p>}

        {report && !reportLoading && (
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
              <strong>Common distractions:</strong> {formatList(report.commonDistractions)}
            </p>
            <p>
              <strong>Common negative components:</strong>{" "}
              {formatList(report.commonNegativeComponents)}
            </p>
            <p>
              <strong>Common positive components:</strong>{" "}
              {formatList(report.commonPositiveComponents)}
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
      </section>
    </div>
  );
}

export default App;
