"use client";

/* Single source of truth for the badge trophy grid. Rendered IDENTICALLY by
   ProfilePanel and the StreakDrawer "all badges" view so the two surfaces can
   never drift in badge size, ring treatment, or earned state again.
   (See memory: feedback_parallel_implementations.) */

import { BADGES, BADGE_OPTIONS } from "@/lib/quiz-data";
import { BadgeProgressRing } from "@/components/badges/BadgeProgressRing";
import type { UserState } from "@/lib/user-state";
import styles from "./BadgeTrophyGrid.module.css";

type Props = {
  user: UserState;
  /** Which BADGE_OPTIONS key counts as earned this session. Default "perfect". */
  earnedBadgeKey?: string;
  /** Streak length driving the in-progress ring arcs. Default 12 (prototype). */
  streakDays?: number;
};

export function BadgeTrophyGrid({
  user,
  earnedBadgeKey = "perfect",
  streakDays = 12,
}: Props) {
  const earnedBadgeId = BADGE_OPTIONS[earnedBadgeKey]?.id ?? null;

  const isEarned = (b: (typeof BADGES)[number]): boolean => {
    if (b.id === "first-play") return true;
    if (b.id === "founding-player") return true;
    if (b.id === "streak-7") return user.userStreak >= 7;
    if (b.id === "streak-30") return user.userStreak >= 30;
    if (b.id === "streak-100") return user.userStreak >= 100;
    if (b.id === "streak-365") return user.userStreak >= 365;
    if (b.id === earnedBadgeId) return true;
    // Tiered families showcase a held metal tier in the prototype trophy case.
    if (b.kind === "tier" && b.currentTier) return true;
    return false;
  };

  return (
    <div className={styles.grid}>
      {BADGES.map((b) => {
        const earned = isEarned(b);
        return (
          <div
            key={b.id}
            className={`${styles.tile} ${earned ? styles.tileEarned : ""}`}
          >
            <div className={styles.ringWrap}>
              <BadgeProgressRing
                badge={b}
                streakDays={streakDays}
                forceEarned={earned}
                size={100}
                iconSize={80}
              />
            </div>
            <div className={styles.tileName}>{b.name}</div>
            <div className={styles.tileCriteria}>{b.criteria}</div>
          </div>
        );
      })}
    </div>
  );
}
