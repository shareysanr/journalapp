export type AchievementDefinitionSeed = {
  key: string;
  title: string;
  description: string;
  category: "entries" | "goals" | "reports";
  icon: string;
  sortOrder: number;
};

export const DEFAULT_ACHIEVEMENT_DEFINITIONS: AchievementDefinitionSeed[] = [
  {
    key: "first_entry_created",
    title: "First Entry",
    description: "Create your first journal entry.",
    category: "entries",
    icon: "journal",
    sortOrder: 1
  },
  {
    key: "three_entries_created",
    title: "Getting Started",
    description: "Create 3 journal entries.",
    category: "entries",
    icon: "journal-stack",
    sortOrder: 2
  },
  {
    key: "seven_entries_created",
    title: "Consistent Journaler",
    description: "Create 7 journal entries.",
    category: "entries",
    icon: "journal-week",
    sortOrder: 3
  },
  {
    key: "first_goal_completed",
    title: "First Habit",
    description: "Complete your first recurring goal.",
    category: "goals",
    icon: "goal",
    sortOrder: 1
  },
  {
    key: "three_goal_completions",
    title: "Building Momentum",
    description: "Complete goals 3 total times.",
    category: "goals",
    icon: "goal-stack",
    sortOrder: 2
  },
  {
    key: "seven_goal_completions",
    title: "Habit Builder",
    description: "Complete goals 7 total times.",
    category: "goals",
    icon: "goal-week",
    sortOrder: 3
  },
  {
    key: "three_goal_days_this_week",
    title: "Weekly Rhythm",
    description: "Complete goals on 3 different days this week.",
    category: "goals",
    icon: "goal-calendar",
    sortOrder: 4
  },
  {
    key: "first_weekly_report",
    title: "First Report",
    description: "Receive your first weekly report.",
    category: "reports",
    icon: "report",
    sortOrder: 1
  }
];
