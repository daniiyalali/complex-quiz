/**
 * Shared content for today's quiz — all three layouts read from this so
 * the same data renders three different ways.
 */

export const TODAY = {
  date: "Thursday, May 21, 2026",
  dateShort: "May 21, 2026",
  dateAllCaps: "MAY 21, 2026",
  dayNumber: 47,
  issueNum: "047",
  editor: "John Doe",
  category: "Sneakers",
  questionCount: 5,
  title: "Iconic Collabs",
  titleAllCaps: "ICONIC COLLABS",
  /** broken into lines for magazine-stack treatment */
  titleLines: ["Iconic", "Collabs"],
  opensAt: "8:00 AM ET",
  nextReset: "14:32:09",
  totalPlayers: 2847,
  avgScore: "3.2/5",
  streakDays: 12,
};

export type LeaderRow = {
  rank: number;
  name: string;
  score: string;
  time: string;
  crown?: boolean;
};

export const TOP5: LeaderRow[] = [
  { rank: 1, name: "SneakerHead99", score: "5/5", time: "0:31", crown: true },
  { rank: 2, name: "jordan_hawk",   score: "5/5", time: "0:34" },
  { rank: 3, name: "fkj",           score: "5/5", time: "0:37" },
  { rank: 4, name: "cabbage_patch", score: "4/5", time: "0:29" },
  { rank: 5, name: "yelawolf",      score: "4/5", time: "0:42" },
];
