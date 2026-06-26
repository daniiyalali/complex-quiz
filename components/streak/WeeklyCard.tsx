"use client";

/* Shared weekly tracker card — 7 day cells inside a rounded pill with header
   row + integrated nudge footer. Used by the drawer and by ProfilePanel. */

import type { UserState } from "@/lib/user-state";
import { PixelCheck } from "./PixelIcons";
import styles from "./WeeklyCard.module.css";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type CellState = "done" | "todayPlayed" | "today" | "future" | "missed";

type Props = {
  user: UserState;
};

export function WeeklyCard({ user }: Props) {
  function cellState(i: number): CellState {
    const isToday = i === user.todayDayIndex;
    const played = user.weeklyPlays[i];
    if (isToday && played) return "todayPlayed";
    if (isToday) return "today";
    if (i < user.todayDayIndex) return played ? "done" : "missed";
    return "future";
  }

  return (
    <div className={styles.weekCard}>
      <div className={styles.weekHead}>
        <span className={styles.weekHeadTitle}>THIS WEEK</span>
      </div>
      <div className={styles.weekGrid}>
        {DAY_LABELS.map((label, i) => {
          const state = cellState(i);
          const cellLabel = i === user.todayDayIndex ? "TODAY" : label;
          const isToday = i === user.todayDayIndex;
          return (
            <div key={i} className={styles.cellCol}>
              <span
                className={`${styles.dayLabel} ${isToday ? styles.dayLabelToday : ""}`}
              >
                {cellLabel}
              </span>
              <div className={`${styles.cell} ${styles[state]}`}>
                {(state === "done" || state === "todayPlayed") && (
                  <PixelCheck size={22} color="#000" />
                )}
                {state === "today" && <span className={styles.cellDot} />}
                {state === "missed" && <span className={styles.cellMissX}>✕</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
