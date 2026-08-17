import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { apiRequest } from "../api";
import { type Entry } from "./EntryForm";

type EntriesListResponse = {
  data: {
    entries: Entry[];
  };
};

type ChartPoint = {
  date: string;
  mood: number | null;
  motivation: number | null;
};

const MOOD_COLOR = "#4f46e5";
const MOTIVATION_COLOR = "#0d9488";

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatAxisDate(dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function formatTooltipDate(dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function toChartPoints(entries: Entry[]): ChartPoint[] {
  const byDate = new Map<string, { moods: number[]; motivations: number[] }>();

  const chronological = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id - b.id
  );

  for (const entry of chronological) {
    const bucket = byDate.get(entry.date) ?? { moods: [], motivations: [] };
    if (entry.mood !== null) {
      bucket.moods.push(entry.mood);
    }
    if (entry.motivation !== null) {
      bucket.motivations.push(entry.motivation);
    }
    byDate.set(entry.date, bucket);
  }

  return [...byDate.entries()]
    .filter(([, scores]) => scores.moods.length > 0 || scores.motivations.length > 0)
    .map(([date, scores]) => ({
      date,
      mood: average(scores.moods),
      motivation: average(scores.motivations)
    }));
}

function ChartTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-md">
      <p className="text-sm font-semibold text-slate-900">{formatTooltipDate(point.date)}</p>
      <p className="mt-1.5 text-sm" style={{ color: MOOD_COLOR }}>
        Mood: {point.mood ?? "—"}
      </p>
      <p className="text-sm" style={{ color: MOTIVATION_COLOR }}>
        Motivation: {point.motivation ?? "—"}
      </p>
    </div>
  );
}

export default function MoodMotivationChart() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest<EntriesListResponse>("/api/v1/entries", {
          auth: true
        });
        setEntries(response.data.entries);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chart data");
      } finally {
        setLoading(false);
      }
    }

    void loadEntries();
  }, []);

  const data = useMemo(() => toChartPoints(entries), [entries]);

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Mood vs Motivation</h2>
      <p className="mt-1 text-sm text-slate-600">
        Historical scores from your journal entries, from 1 to 10.
      </p>

      {loading && <p className="mt-6 text-sm text-slate-600">Loading chart...</p>}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No mood or motivation scores yet. Add them when you create or edit an entry.
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="mt-6 h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickMargin={8}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[1, 10]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: 16, fontSize: 13, color: "#334155" }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                name="Mood"
                stroke={MOOD_COLOR}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: MOOD_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="motivation"
                name="Motivation"
                stroke={MOTIVATION_COLOR}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: MOTIVATION_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
