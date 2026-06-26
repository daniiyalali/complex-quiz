"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import styles from "./StreakCalendar.module.css";

const ROWS = 7;

/** Deterministic 0..3 intensity level for a cell index (no Date / no random). */
function levelFor(i: number): number {
  // 0 = unplayed. 1/2/3 = played at increasing intensity.
  const v = (i * 7 + 3) % 5; // 0..4, deterministic
  if (v === 0) return 0;
  if (v <= 1) return 1;
  if (v <= 3) return 2;
  return 3;
}

const OPACITY: Record<number, number> = { 1: 0.4, 2: 0.7, 3: 1 };

export function StreakCalendar({
  weeks = 14,
  playedDays,
  currentStreak,
}: {
  weeks?: number;
  playedDays?: boolean[];
  currentStreak?: number;
}) {
  const total = weeks * ROWS;

  const cells = useMemo(() => {
    return Array.from({ length: total }, (_, i) => {
      if (playedDays) {
        return playedDays[i] ? ((i % 3) + 1) : 0;
      }
      return levelFor(i);
    });
  }, [total, playedDays]);

  const streak =
    currentStreak ?? cells.filter((l) => l > 0).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.title}>Your streak</span>
        <span className={styles.streak}>
          <Flame size={15} strokeWidth={2.4} className={styles.flame} aria-hidden="true" />
          <span className={`${styles.streakNum} mono`}>{streak}</span>
          <span className={styles.streakLbl}>day{streak === 1 ? "" : "s"}</span>
        </span>
      </div>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
      >
        {cells.map((level, i) => (
          <motion.span
            key={i}
            className={styles.cell}
            style={
              level > 0
                ? {
                    background: "var(--l-correct, #34C759)",
                    opacity: OPACITY[level],
                  }
                : undefined
            }
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: level > 0 ? OPACITY[level] : 1,
              scale: 1,
            }}
            transition={{
              duration: 0.34,
              delay: Math.min(i * 0.006, 0.7),
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        ))}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendLbl}>Less</span>
        <span className={styles.legendCell} style={{ background: "var(--l-surface-3)" }} />
        <span className={styles.legendCell} style={{ background: "var(--l-correct, #34C759)", opacity: 0.4 }} />
        <span className={styles.legendCell} style={{ background: "var(--l-correct, #34C759)", opacity: 0.7 }} />
        <span className={styles.legendCell} style={{ background: "var(--l-correct, #34C759)", opacity: 1 }} />
        <span className={styles.legendLbl}>More</span>
      </div>
    </div>
  );
}
