export type UnlockedAchievement = {
  key: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlockedAt: string;
};

export type UserAchievement = {
  key: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

export function showAchievementToasts(
  showToast: (message: string) => void,
  achievements: UnlockedAchievement[]
): void {
  for (const achievement of achievements) {
    showToast(`Achievement unlocked: ${achievement.title}`);
  }
}
