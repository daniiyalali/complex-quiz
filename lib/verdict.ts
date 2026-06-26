/* Score verdict — single source of truth for the share card's headline copy,
   subtitle, accent color, and which badges unlocked. Centralized here so every
   surface that opens ShareCardModal shows identical language. */

import type { BadgeIconKind, BadgeTier } from "@/components/badges/BadgeIcon";

export type Grade = "flawless" | "sharp" | "ingame" | "off" | "airball";

export type Verdict = {
  grade: Grade;
  label: string;
  subtitle: string;
  /** Drives score / theme label / stat icons / badge rule / sparkle. */
  accent: string;
};

const SIGNAL = "#00FF85";
const SIGNAL_DIM = "#00C46A";
const AMBER = "#FF9500";
const RED = "#FF453A";

/* Copy is written to read well when SHARED — a third party sees this card, so
   every verdict is neutral and gracious (no self-deprecating slang). The big
   score number carries the result; the line just frames it (Anusha, 06-19). */
export function scoreVerdict(score: number, total = 5): Verdict {
  if (score >= total) {
    return { grade: "flawless", label: "PERFECT SCORE", subtitle: "Aced today's sneaker quiz", accent: SIGNAL };
  }
  if (score === total - 1) {
    return { grade: "sharp", label: "SHARP", subtitle: "One away from perfect today", accent: SIGNAL_DIM };
  }
  if (score === 3) {
    return { grade: "ingame", label: "SOLID RUN", subtitle: "A strong run on today's quiz", accent: AMBER };
  }
  if (score === 2) {
    return { grade: "off", label: "ON THE BOARD", subtitle: "On the board for today's quiz", accent: AMBER };
  }
  return { grade: "airball", label: "GOOD TRY", subtitle: "Back for tomorrow's quiz", accent: RED };
}

export type CardBadge = { icon: BadgeIconKind; name: string; criteria: string; tier?: BadgeTier };

const STREAK_MILESTONES = [7, 30, 100, 365];

/** Up to 3 badges unlocked by this run (share-card display logic). Rules per
   score state — see scoreVerdict table. Returns [] for 2/5 and 0–1/5. */
export function cardBadges(args: {
  score: number;
  total?: number;
  streak: number;
  rank: number;
  of: number;
  timeSec?: number;
}): CardBadge[] {
  // rank/of/timeSec accepted for API stability; current rules key off score+streak
  const { score, total = 5, streak } = args;
  const out: CardBadge[] = [];

  const streakBadge: CardBadge = {
    icon: "streak-7",
    name: "ON FIRE",
    // a fresh 5/5 commits today's play → streak is at least 1
    criteria: `${Math.max(streak, 1)}-Day Streak`,
  };
  const topTier: CardBadge = {
    icon: "podium-finisher",
    name: "TOP TIER",
    criteria: "Ranked in the Top 1%",
    tier: "legendary",
  };
  const playmakers: CardBadge = {
    icon: "speed-demon",
    name: "PLAYMAKERS",
    criteria: "Answered 5 questions in under 10 seconds",
    tier: "gold",
  };

  const isMilestone = STREAK_MILESTONES.includes(streak);

  if (score >= total) {
    // 5/5 — unlocks all performance badges (per spec)
    out.push(playmakers, streakBadge, topTier);
  } else if (score === total - 1) {
    // 4/5 — streak badge if applicable, no perfection badge
    if (streak > 0) out.push(streakBadge);
  } else if (score === 3) {
    // 3/5 — streak badge only on a milestone
    if (isMilestone) out.push(streakBadge);
  }
  // 2/5 and 0–1/5 → none
  return out.slice(0, 3);
}

/** Airball (0–1/5): the BADGES section is replaced with this line. */
export const AIRBALL_BADGE_LINE = "Play again tomorrow to keep your streak.";
