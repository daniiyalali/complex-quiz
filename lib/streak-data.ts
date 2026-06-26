/* Streak & mission data model — council-approved UX (May 2026 decisions).
   Mocked client state for the prototype; will be backed by real data later. */

export type WeekCellState = "done" | "today" | "undone" | "freeze" | "missed";

export type Mission = {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  unit: string; // "days" | "times" | "wins"
  badgeName: string;
};

export type StreakState = {
  dayStreak: number;
  bestStreak: number;
  /** 7 cells, Sunday → Saturday. */
  weekProgress: WeekCellState[];
  /** Has the user's monthly freeze been used? */
  freezeUsedThisMonth: number; // 0 or 1
  /** Always exactly 4. Sorted by progress %, then by recency. */
  activeMissions: Mission[];
};

export const DEFAULT_STREAK: StreakState = {
  dayStreak: 12,
  bestStreak: 12,
  weekProgress: ["done", "done", "done", "done", "today", "undone", "undone"],
  freezeUsedThisMonth: 0,
  activeMissions: [
    {
      id: "perfect-week",
      title: "PERFECT WEEK",
      description: "Play all 7 days this week",
      progress: 4,
      total: 7,
      unit: "days",
      badgeName: "PERFECT WEEK",
    },
    {
      id: "streak-30",
      title: "STREAK CLIMBER",
      description: "Hit a 30-day streak",
      progress: 12,
      total: 30,
      unit: "days",
      badgeName: "STREAK · 30 DAYS",
    },
    {
      id: "perfectionist",
      title: "PERFECTIONIST",
      description: "Get 5/5 three times this week",
      progress: 1,
      total: 3,
      unit: "times",
      badgeName: "PERFECTIONIST",
    },
    {
      id: "early-bird",
      title: "EARLY BIRD",
      description: "Play before 9am, five days running",
      progress: 2,
      total: 5,
      unit: "days",
      badgeName: "EARLY BIRD",
    },
  ],
};

export function nearestMission(state: StreakState): Mission {
  return [...state.activeMissions].sort(
    (a, b) => b.progress / b.total - a.progress / a.total,
  )[0];
}

export function weekDoneCount(state: StreakState): number {
  return state.weekProgress.filter((c) => c === "done" || c === "freeze").length;
}

export function isMatchingBest(state: StreakState): boolean {
  return state.dayStreak > 0 && state.dayStreak === state.bestStreak;
}
