import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import type { UserAchievement } from "../achievements";

type AchievementsResponse = {
  data: {
    achievements: UserAchievement[];
  };
};

const CATEGORY_LABELS: Record<string, string> = {
  entries: "Entries",
  goals: "Goals",
  reports: "Reports"
};

const CATEGORY_ORDER = ["entries", "goals", "reports"];

function iconLabel(icon: string): string {
  switch (icon) {
    case "journal":
      return "📓";
    case "journal-stack":
      return "📚";
    case "journal-week":
      return "🗓️";
    case "goal":
      return "✅";
    case "goal-stack":
      return "🎯";
    case "goal-week":
      return "🏆";
    case "goal-calendar":
      return "📅";
    case "report":
      return "📊";
    default:
      return "⭐";
  }
}

function formatUnlockedDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function AchievementBadge({ achievement }: { achievement: UserAchievement }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        achievement.unlocked
          ? "border-indigo-200 bg-indigo-50"
          : "border-slate-200 bg-slate-100 opacity-70"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
            achievement.unlocked ? "bg-white text-indigo-700" : "bg-slate-200 text-slate-500"
          }`}
        >
          {iconLabel(achievement.icon)}
        </div>
        <div>
          <h3
            className={`text-sm font-semibold ${
              achievement.unlocked ? "text-slate-900" : "text-slate-600"
            }`}
          >
            {achievement.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{achievement.description}</p>
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="mt-2 text-xs font-medium text-indigo-700">
              Unlocked {formatUnlockedDate(achievement.unlockedAt)}
            </p>
          )}
          {!achievement.unlocked && (
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Locked
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAchievements() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest<AchievementsResponse>("/api/v1/achievements", {
          auth: true
        });
        setAchievements(response.data.achievements);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load achievements");
      } finally {
        setLoading(false);
      }
    }

    void loadAchievements();
  }, []);

  const groupedAchievements = useMemo(() => {
    const groups = new Map<string, UserAchievement[]>();

    for (const achievement of achievements) {
      const existing = groups.get(achievement.category);
      if (existing) {
        existing.push(achievement);
      } else {
        groups.set(achievement.category, [achievement]);
      }
    }

    return CATEGORY_ORDER.filter((category) => groups.has(category)).map((category) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      items: groups.get(category) ?? []
    }));
  }, [achievements]);

  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Achievements</h1>
      <p className="mt-2 text-sm text-slate-600">
        Earn badges by journaling, completing daily goals, and receiving weekly reports.
      </p>

      {!loading && !error && (
        <p className="mt-4 text-sm font-medium text-slate-700">
          {unlockedCount} of {achievements.length} unlocked
        </p>
      )}

      {loading && <p className="mt-6 text-sm text-slate-600">Loading achievements...</p>}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 space-y-8">
          {groupedAchievements.map((group) => (
            <section key={group.category}>
              <h2 className="text-lg font-semibold text-slate-900">{group.label}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.items.map((achievement) => (
                  <AchievementBadge key={achievement.key} achievement={achievement} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
