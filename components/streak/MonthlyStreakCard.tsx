"use client";

/* Strava-style monthly streak calendar. Mon–Sun week rows, played days marked,
   a flame pill carrying the current streak. Demo month is fixed (June 2026,
   "today" = the 10th, matching the current date); played days are the current
   streak ending today. Dates are computed with explicit `new Date(y, m, d)`
   (never `new Date()`), so server and client render identically — no hydration
   mismatch. */

import type { UserState } from "@/lib/user-state";
import { PixelCheck, PixelCross } from "./PixelIcons";
import styles from "./MonthlyStreakCard.module.css";

const YEAR = 2026;
const MONTH = 5; // June (0-indexed)
const MONTH_LABEL = "JUNE 2026";
const TODAY_DATE = 10;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/* Gamified traffic-light states (system semantics):
   done = green, today = yellow, missed = red, future = neutral. */
type CellState = "done" | "todayDone" | "today" | "missed" | "future" | "blank";
type Cell = { date: number | null; state: CellState };

export function MonthlyStreakCard({ user }: { user: UserState }) {
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  const firstWeekday = new Date(YEAR, MONTH, 1).getDay(); // 0=Sun..6=Sat
  const leadBlanks = (firstWeekday + 6) % 7; // shift so Monday is column 0

  // The streak is the run of consecutive days ending today. When today hasn't
  // been played yet the run ends yesterday.
  const lastPlayed = user.todayPlayed ? TODAY_DATE : TODAY_DATE - 1;
  const firstPlayed = TODAY_DATE - Math.max(0, user.userStreak) + 1;
  const isPlayed = (d: number) =>
    user.userStreak > 0 && d >= firstPlayed && d <= lastPlayed;

  // A brand-new user (no history at all) hasn't "missed" anything — only mark
  // past unplayed days red once the user is established, so new users don't see
  // a wall of red on day one.
  const hasHistory =
    user.userStreak > 0 || user.userBestStreak > 0 || user.userBadgeCount > 0 || user.todayPlayed;

  function stateFor(d: number): CellState {
    if (d === TODAY_DATE) return user.todayPlayed ? "todayDone" : "today";
    if (d > TODAY_DATE) return "future";
    if (isPlayed(d)) return "done"; // past day played → green
    return hasHistory ? "missed" : "future"; // red only for established users
  }

  const cells: Cell[] = [];
  for (let i = 0; i < leadBlanks; i++) cells.push({ date: null, state: "blank" });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: d, state: stateFor(d) });
  while (cells.length % 7 !== 0) cells.push({ date: null, state: "blank" });

  const playedThisMonth = cells.filter(
    (c) => c.state === "done" || c.state === "todayDone",
  ).length;

  // Strava-style perfect-week rail: a full 7/7 week earns the gold check;
  // the week containing today is still "open"; anything else stays neutral.
  type WeekStatus = "perfect" | "open" | "none";
  const weeks: { cells: Cell[]; status: WeekStatus }[] = [];
  for (let w = 0; w < cells.length / 7; w++) {
    const wk = cells.slice(w * 7, w * 7 + 7);
    const playedAll = wk.every((c) => c.state === "done" || c.state === "todayDone");
    const hasOpenDays = wk.some(
      (c) => c.state === "today" || c.state === "future" || c.date === null,
    );
    weeks.push({
      cells: wk,
      status: playedAll ? "perfect" : hasOpenDays ? "open" : "none",
    });
  }
  const perfectWeeks = weeks.filter((w) => w.status === "perfect").length;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.month}>{MONTH_LABEL}</span>
        <span className={styles.streakPill}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/editorial/flame.svg" alt="" aria-hidden className={styles.flame} />
          <span className={styles.streakNum}>{user.userStreak}</span>
        </span>
      </div>

      <div className={styles.weekRow}>
        {DAY_LABELS.map((l, i) => (
          <span key={i} className={styles.weekDay}>{l}</span>
        ))}
        {/* perfect-week rail header (Strava pattern) */}
        <span className={styles.weekDay} aria-hidden />
      </div>

      <div className={styles.grid}>
        {weeks.map((week, w) => (
          <div key={w} className={styles.weekCells}>
            {week.cells.map((c, i) => {
              if (c.date === null)
                return <span key={i} className={styles.empty} aria-hidden />;
              const filled = c.state === "done" || c.state === "todayDone";
              return (
                <div
                  key={i}
                  className={`${styles.cell} ${styles[c.state]}`}
                  aria-label={`${MONTH_LABEL} ${c.date}, ${c.state}`}
                >
                  {filled ? (
                    <PixelCheck size={12} color="#000" />
                  ) : c.state === "missed" ? (
                    <PixelCross size={11} color="#fff" />
                  ) : (
                    <span className={styles.dateNum}>{c.date}</span>
                  )}
                </div>
              );
            })}
            {/* perfect week = all 7 played (gold check, Strava-style) */}
            <div
              className={`${styles.weekStatus} ${styles[`week_${week.status}`]}`}
              aria-label={
                week.status === "perfect" ? "Perfect week" :
                week.status === "open" ? "Week in progress" : "Incomplete week"
              }
            >
              {week.status === "perfect" && <PixelCheck size={11} color="#000" />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.foot}>
        {playedThisMonth} days played this month
        {perfectWeeks > 0 && ` · ${perfectWeeks} perfect ${perfectWeeks === 1 ? "week" : "weeks"}`}
      </div>
    </div>
  );
}
