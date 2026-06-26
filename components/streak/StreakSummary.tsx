"use client";

/* Shared "Streak & Badges" summary — rendered identically in the home streak
   drawer and the end-of-quiz profile so the two surfaces never drift. Five
   sections: hero (progress ring + side stats), this-week strip, month calendar,
   next-milestone card, badges-earned footer. Dates are computed with explicit
   new Date(y,m,d) (never new Date()) so SSR/client match. */

import { useState } from "react";
import {
  TrendingUp,
  Flame,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { BadgeMark, type BadgeIconKind } from "@/components/badges/BadgeIcon";
import type { UserState } from "@/lib/user-state";
import styles from "./StreakSummary.module.css";

const YEAR = 2026;
const MONTH = 5; // June (0-indexed)
const TODAY_DATE = 10;
const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];
const DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const MILESTONES = [7, 30, 100, 365] as const;
const STREAK_ICON: Record<number, BadgeIconKind> = {
  7: "streak-7",
  30: "streak-30",
  100: "streak-100",
  365: "streak-365",
};

function nextMilestone(streak: number): number {
  return MILESTONES.find((m) => m > streak) ?? 365;
}

type CalState = "done" | "todayDone" | "today" | "missed" | "future";

export function StreakSummary({
  user,
  onSeeAllBadges,
}: {
  user: UserState;
  onSeeAllBadges: () => void;
}) {
  const milestone = nextMilestone(user.userStreak);
  const ringPct = Math.min(100, Math.round((user.userStreak / milestone) * 100));
  const daysRemaining = Math.max(0, milestone - user.userStreak);

  return (
    <div className={styles.summary}>
      <StreakHero user={user} milestone={milestone} pct={ringPct} daysRemaining={daysRemaining} />
      <Calendar user={user} />
      <button type="button" className={styles.badgesFooter} onClick={onSeeAllBadges}>
        <span className={styles.bfLeft}>
          <ShieldCheck size={26} className={styles.bfShield} aria-hidden />
          <span className={styles.bfText}>
            <span className={styles.eyebrow}>Badges earned</span>
            <span className={`${styles.bfNum} mono`}>{user.userBadgeCount}</span>
          </span>
        </span>
        <span className={styles.bfCta}>
          See all badges <ArrowRight size={18} aria-hidden />
        </span>
      </button>
    </div>
  );
}

/* ── 1. Hero — current streak + next badge + progress, merged into one card
   (Zack, 2026-06-18): streak | next-badge on top, "N days away" line, a
   green→orange progress bar with endpoints, then best/total under a divider. ── */
function StreakHero({
  user,
  milestone,
  pct,
  daysRemaining,
}: {
  user: UserState;
  milestone: number;
  pct: number;
  daysRemaining: number;
}) {
  return (
    <div className={styles.hero}>
      <div className={styles.heroTop}>
        <div className={styles.heroStreak}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/editorial/flame.svg" alt="" aria-hidden className={styles.heroFlame} />
          <span className={styles.heroCol}>
            <span className={styles.eyebrow}>Current streak</span>
            <span className={styles.heroNumRow}>
              <span className={`${styles.heroNum} mono`}>{user.userStreak}</span>
              <span className={styles.heroUnit}>Days</span>
            </span>
          </span>
        </div>
        <div className={styles.heroVRule} aria-hidden />
        <div className={styles.heroNext}>
          <span className={styles.heroCol}>
            <span className={styles.eyebrow}>Next badge</span>
            <span className={styles.heroNextName}>{milestone}-Day Streak Badge</span>
          </span>
          <span className={styles.heroNextBadge}>
            <BadgeMark icon={STREAK_ICON[milestone]} size={56} />
          </span>
        </div>
      </div>

      <p className={styles.heroAway}>
        <span className={styles.heroAwayNum}>{daysRemaining} days</span> away from your {milestone}-day badge
      </p>

      <div className={styles.heroBarRow}>
        <span className={styles.heroBarCap} data-side="start">
          <span className={`${styles.heroBarCapNum} mono`}>{user.userStreak}</span> Days
        </span>
        <div className={styles.heroBar}>
          <div className={styles.heroBarFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.heroBarCap} data-side="end">
          <span className={`${styles.heroBarCapNum} mono`}>{milestone}</span> Days
        </span>
      </div>

      <div className={styles.heroStats}>
        <div className={styles.statRow}>
          <TrendingUp size={20} className={styles.statIconGreen} aria-hidden />
          <span className={styles.statText}>
            <span className={styles.statLabel}>Best streak</span>
            <span className={styles.statVal}>
              <span className="mono">{user.userBestStreak}</span> <em>Days</em>
            </span>
          </span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statRow}>
          <Flame size={20} className={styles.statIconOrange} aria-hidden />
          <span className={styles.statText}>
            <span className={styles.statLabel}>Total days played</span>
            <span className={styles.statVal}>
              <span className="mono">{user.userTotalDaysPlayed}</span> <em>Days</em>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 2. Month calendar — circular day cells + per-week streak column.
   The weekly widget was folded in here (Zack, 2026-06-17): the WEEK column
   shows 🔥 for a fully-completed week, N/7 for a partial week, — for weeks
   still ahead. Missed days read as a soft red ring (no aggressive X). ── */
function Calendar({ user }: { user: UserState }) {
  const [offset, setOffset] = useState(0);
  const base = new Date(YEAR, MONTH + offset, 1);
  const dYear = base.getFullYear();
  const dMonth = base.getMonth();
  const isCurrent = offset === 0;

  const daysInMonth = new Date(dYear, dMonth + 1, 0).getDate();
  const firstWeekday = new Date(dYear, dMonth, 1).getDay(); // 0=Sun
  const leadBlanks = (firstWeekday + 6) % 7; // Monday-first

  const lastPlayed = user.todayPlayed ? TODAY_DATE : TODAY_DATE - 1;
  const firstPlayed = TODAY_DATE - Math.max(0, user.userStreak) + 1;
  const isPlayed = (d: number) => user.userStreak > 0 && d >= firstPlayed && d <= lastPlayed;
  const hasHistory =
    user.userStreak > 0 || user.userBestStreak > 0 || user.userBadgeCount > 0 || user.todayPlayed;

  function stateFor(d: number): CalState {
    if (!isCurrent) return "future";
    if (d === TODAY_DATE) return user.todayPlayed ? "todayDone" : "today";
    if (d > TODAY_DATE) return "future";
    if (isPlayed(d)) return "done";
    return hasHistory ? "missed" : "future";
  }
  const isDone = (s: CalState) => s === "done" || s === "todayDone";

  // Monday-first week rows (each padded to 7 with nulls).
  const weeks: (number | null)[][] = [];
  let row: (number | null)[] = [];
  for (let i = 0; i < leadBlanks; i++) row.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    row.push(d);
    if (row.length === 7) { weeks.push(row); row = []; }
  }
  if (row.length) { while (row.length < 7) row.push(null); weeks.push(row); }

  const playedThisMonth = weeks.flat().filter((d) => d !== null && isDone(stateFor(d))).length;

  // Per-week streak icon (Zack, 2026-06-19). The "X/7" fraction is dropped for a
  // three-state system + an active-week flame:
  //   fire    → the current (active) week, still in progress
  //   perfect → a finished week played all 7 days (check-in-circle)
  //   streak  → a finished week played at least once (weekly streak kept ✓)
  //   none    → a missed finished week, or a week still ahead (dash)
  function weekState(week: (number | null)[]): "fire" | "perfect" | "streak" | "none" {
    const dates = week.filter((d): d is number => d !== null);
    if (dates.length === 0) return "none";
    if (isCurrent && dates.includes(TODAY_DATE)) return "fire"; // active week
    const ended = isCurrent && dates.every((d) => d < TODAY_DATE);
    if (!ended) return "none"; // future week (or other month — no history)
    const done = dates.filter((d) => isDone(stateFor(d))).length;
    if (dates.length === 7 && done === 7) return "perfect";
    if (done >= 1) return "streak";
    return "none";
  }

  return (
    <div className={styles.card}>
      <div className={styles.calHead}>
        <span className={styles.calMonth}>
          {MONTH_NAMES[dMonth]} {dYear}
        </span>
        <div className={styles.calNav}>
          <button type="button" className={styles.calArrow} onClick={() => setOffset((o) => o - 1)} aria-label="Previous month">
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button type="button" className={styles.calArrow} onClick={() => setOffset((o) => o + 1)} aria-label="Next month">
            <ChevronRight size={16} aria-hidden />
          </button>
          <button type="button" className={styles.calToday} onClick={() => setOffset(0)}>
            TODAY
          </button>
        </div>
      </div>

      <div className={styles.calDow}>
        {DOW.map((d, i) => (
          <span key={i} className={styles.calDowCell}>{d}</span>
        ))}
        <span className={`${styles.calDowCell} ${styles.calDowWeek}`}>Week</span>
      </div>

      <div className={styles.calGrid}>
        {weeks.map((week, wi) => {
          const st = weekState(week);
          const wkLabel =
            st === "fire" ? "This week, streak active"
            : st === "perfect" ? "Perfect week, all 7 days"
            : st === "streak" ? "Weekly streak kept"
            : "No play";
          return (
            <div key={wi} className={styles.calWeekRow}>
              {week.map((d, di) => {
                if (d === null) return <span key={di} className={styles.calBlank} aria-hidden />;
                const s = stateFor(d);
                return (
                  <div
                    key={di}
                    className={`${styles.calCell} ${styles[`cal_${s}`]}`}
                    aria-label={`${MONTH_NAMES[dMonth]} ${d}, ${s}`}
                  >
                    <span className={styles.calDate}>{d}</span>
                  </div>
                );
              })}
              <div className={styles.calWeekCell} aria-label={wkLabel}>
                {st === "fire" && <Flame size={16} className={styles.calWeekFire} aria-hidden />}
                {st === "perfect" && (
                  <span className={styles.calWeekPerfect} aria-hidden>
                    <Check size={12} strokeWidth={3.4} />
                  </span>
                )}
                {st === "streak" && <Check size={17} strokeWidth={3} className={styles.calWeekCheck} aria-hidden />}
                {st === "none" && <span className={styles.calWeekNone} aria-hidden>—</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.calLegend}>
        <span className={styles.legItem}>
          <span className={`${styles.legDot} ${styles.legDone}`} /> Completed
        </span>
        <span className={styles.legItem}>
          <span className={`${styles.legDot} ${styles.legMiss}`} /> Missed
        </span>
        <span className={styles.legItem}>
          <span className={`${styles.legDot} ${styles.legUp}`} /> Upcoming
        </span>
        <span className={styles.calPlayed}>{playedThisMonth} days played this month</span>
      </div>

      {/* Weekly-streak explainer — a missed day doesn't break the weekly streak. */}
      <div className={styles.weekNote}>
        <span className={styles.weekKey}>
          <span className={styles.weekKeyItem}>
            <Check size={13} strokeWidth={3} className={styles.calWeekCheck} aria-hidden /> Weekly streak
          </span>
          <span className={styles.weekKeyItem}>
            <span className={styles.calWeekPerfect} aria-hidden><Check size={9} strokeWidth={3.4} /></span> Perfect week
          </span>
          <span className={styles.weekKeyItem}>
            <Flame size={13} className={styles.calWeekFire} aria-hidden /> This week
          </span>
        </span>
        <span className={styles.weekNoteText}>
          Play any day to keep your <strong>weekly streak</strong> going. All 7 days is a perfect week.
        </span>
      </div>
    </div>
  );
}

