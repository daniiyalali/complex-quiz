"use client";

/* Another player's public badges — a compact preview grid of ONLY the badges
   they've UNLOCKED, as plain medallions (no progress rings, no in-progress or
   locked states). Earned set is derived from their public stats so it varies
   believably per player (Zack, 2026-06-18). */

import { BADGES, type BadgeRarity } from "@/lib/quiz-data";
import { BadgeMark, type BadgeTier } from "@/components/badges/BadgeIcon";
import type { PlayerProfile } from "./ProfilePanel";
import styles from "./ProfilePanel.module.css";

function timeSeconds(t: string): number {
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 99;
}

/* Earn order — the sequence a real player unlocks them in, so the grid reads
   as a progression: entry badges first, then the streak ladder ASCENDING
   (you can't hold 365 without 7/30/100), then skill, then competitive.
   Sorting the earned set by this index is what makes the prototype honest
   (Anusha, 2026-06-19). */
const BADGE_ORDER = [
  "first-play",
  "founding-player",
  "streak-7",
  "streak-30",
  "streak-100",
  "streak-365",
  "speed-demon",
  "perfect-score",
  "back-to-back",
  "podium-finisher",
  "daily-crown",
];
const orderIndex = (id: string) => {
  const i = BADGE_ORDER.indexOf(id);
  return i === -1 ? BADGE_ORDER.length : i;
};

/* Which badges this player has unlocked, from their public stats. The streak
   ladder cascades (>= thresholds) so a higher streak badge always implies the
   lower ones — never an impossible "365 with no 30". */
function earnedBadgeIds(player: PlayerProfile, streakDays: number): Set<string> {
  const ids = new Set<string>(["first-play", "founding-player"]);
  if (streakDays >= 7) ids.add("streak-7");
  if (streakDays >= 30) ids.add("streak-30");
  if (streakDays >= 100) ids.add("streak-100");
  if (streakDays >= 365) ids.add("streak-365");
  if (streakDays >= 2) ids.add("back-to-back");
  if (player.correct === 5) ids.add("perfect-score");
  if (player.rank <= 3) ids.add("podium-finisher");
  if (player.rank === 1) ids.add("daily-crown");
  if (timeSeconds(player.time) < 20) ids.add("speed-demon");
  return ids;
}

/* The metal tier THIS player holds in a given family — derived from their own
   public stats, NOT the global showcase tier. A medallion at a given tier
   inherently implies every lower tier was earned first (you reach gold by
   passing bronze + silver), so showing the held tier is the honest signal.
   Legendary is intentionally near-unreachable for a random board player. */
function playerTier(id: string, player: PlayerProfile, streakDays: number, played: number): BadgeRarity {
  const byExp: BadgeRarity = played >= 150 ? "gold" : played >= 60 ? "silver" : "bronze";
  switch (id) {
    case "perfect-score":
      // More experience → more perfect runs banked → higher tier.
      return byExp;
    case "speed-demon": {
      const s = timeSeconds(player.time);
      return s < 12 ? "gold" : s < 16 ? "silver" : "bronze";
    }
    case "back-to-back":
      return streakDays >= 20 ? "gold" : streakDays >= 8 ? "silver" : "bronze";
    case "podium-finisher":
      return player.rank === 1 ? "gold" : "silver"; // only shown when rank <= 3
    case "daily-crown":
      return "bronze"; // earned #1 today — the run that's on screen
    default:
      return "bronze";
  }
}

export function ProfileBadges({
  player,
  streakDays,
}: {
  player: PlayerProfile;
  streakDays: number;
}) {
  const earned = earnedBadgeIds(player, streakDays);
  // Reconstruct a believable "quizzes played" from streak for tier scaling.
  const played = 24 + ((player.rank * 13) % 70);
  const badges = BADGES
    .filter((b) => earned.has(b.id))
    .sort((a, b) => orderIndex(a.id) - orderIndex(b.id));

  return (
    <section className={styles.badgesBlock}>
      <span className={styles.badgesTitle}>Badges</span>
      {badges.length === 0 ? (
        <p className={styles.badgesEmpty}>No badges yet.</p>
      ) : (
        <div className={styles.badgesGrid}>
          {badges.map((b) => (
            <div key={b.id} className={styles.badgeTile}>
              <BadgeMark
                icon={b.icon}
                size={56}
                tier={
                  b.kind === "tier"
                    ? (playerTier(b.id, player, streakDays, played) as BadgeTier)
                    : undefined
                }
              />
              <span className={styles.badgeName}>{b.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
