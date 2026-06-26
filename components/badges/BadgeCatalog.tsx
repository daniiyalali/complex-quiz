"use client";

/* Full badge catalog — the "see all badges" destination. Shows the WHOLE
   system so it's never ambiguous what a player is working toward:
   - MILESTONES: the 6 one-time progression badges (reusing BadgeProgressRing).
   - ACHIEVEMENTS: one tier-ladder card per family (Bronze→Legendary), with the
     current tier highlighted and locked tiers dimmed.
   Reuses BadgeMark for every medallion and the BADGES/tiers data — no new art. */

import { Lock } from "lucide-react";
import { BADGES, type Badge, type BadgeRarity } from "@/lib/quiz-data";
import { BadgeMark, type BadgeTier } from "./BadgeIcon";
import { BadgeProgressRing } from "./BadgeProgressRing";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import type { UserState } from "@/lib/user-state";
import styles from "./BadgeCatalog.module.css";

const TIER_RANK: Record<BadgeRarity, number> = {
  white: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
  legendary: 4,
};

const TIER_NAME: Record<BadgeRarity, string> = {
  white: "Base",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  legendary: "Legendary",
};

/* Ring signal ramp — mirrors BadgeProgressRing (Milestones) so Level Up reads
   in the same language: earned = green, in-progress toward next = yellow,
   locked = a faint waiting track. */
const RING_GREEN = "var(--correct, #00FF85)";
const RING_GREEN_FAINT = "rgba(0, 255, 133, 0.16)";
const RING_YELLOW = "#FFD60A";
const RING_YELLOW_FAINT = "rgba(255, 214, 10, 0.16)";
const RING_TRACK_FAINT = "rgba(255, 255, 255, 0.10)";

/* No live earn-counter exists in the prototype, so derive a deterministic,
   per-family demo fill (34–62%) for the current tier's ring — enough to show
   "where you are before you unlock the next thing" (Zack's note, 2026-06-16). */
function demoProgressToNext(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 0.34 + (h % 29) / 100; // 0.34 .. 0.62
}

/* Streak / one-time earned rules mirror BadgeTrophyGrid.isEarned. */
function progressionEarned(b: Badge, streak: number): boolean {
  if (b.id === "first-play" || b.id === "founding-player") return true;
  if (b.id === "streak-7") return streak >= 7;
  if (b.id === "streak-30") return streak >= 30;
  if (b.id === "streak-100") return streak >= 100;
  if (b.id === "streak-365") return streak >= 365;
  return false;
}

export function BadgeCatalog({
  user,
  streakDays = 12,
}: {
  user: UserState;
  /** Streak driving milestone ring fill + streak-badge earned state. */
  streakDays?: number;
}) {
  void user; // earned state is demo-driven via streakDays + currentTier
  const progression = BADGES.filter((b) => b.kind === "one");
  const families = BADGES.filter((b) => b.kind === "tier");

  // Counter: earnable badges = 6 progression + Σ family tiers (Base art is the
  // family identity, not counted).
  let earned = 0;
  let total = 0;
  for (const b of progression) {
    total += 1;
    if (progressionEarned(b, streakDays)) earned += 1;
  }
  for (const f of families) {
    total += f.tiers?.length ?? 0;
    earned += TIER_RANK[f.currentTier ?? "white"];
  }
  const pct = total ? Math.round((earned / total) * 100) : 0;

  return (
    <div className={styles.catalog}>
      <header className={styles.header}>
        <div className={styles.counter}>
          <span className={`${styles.counterNum} mono`}>{earned}</span>
          <span className={styles.counterOf}>of {total} collected</span>
        </div>
        <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={earned}>
          <div className={styles.barFill} style={{ width: `${pct}%` }} />
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.eyebrow}>Milestones</div>
        <div className={styles.mGrid}>
          {progression.map((b) => {
            const e = progressionEarned(b, streakDays);
            return (
              <div key={b.id} className={styles.mTile}>
                <div className={styles.mRing}>
                  <BadgeProgressRing badge={b} streakDays={streakDays} forceEarned={e} size={80} iconSize={62} />
                </div>
                <div className={styles.mName}>{b.name}</div>
                <div className={styles.mCrit}>{b.criteria}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.eyebrow}>Achievements · Level up</div>
        <div className={styles.ladders}>
          {families.map((f) => (
            <LadderCard key={f.id} badge={f} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LadderCard({ badge }: { badge: Badge }) {
  const cur = TIER_RANK[badge.currentTier ?? "white"];
  const tiers = badge.tiers ?? [];
  const next = tiers.find((t) => TIER_RANK[t.rarity] > cur);
  const toNextPct = Math.round(demoProgressToNext(badge.id) * 100);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardIcon}>
          <BadgeMark icon={badge.icon} tier="base" size={38} />
        </span>
        <span className={styles.cardText}>
          <span className={styles.cardName}>{badge.name}</span>
          <span className={styles.cardCrit}>{badge.criteria}</span>
        </span>
      </div>

      <div className={styles.ladder}>
        {tiers.map((t) => {
          const rank = TIER_RANK[t.rarity];
          const state = rank < cur ? "earned" : rank === cur ? "current" : "locked";
          const stateWord = state === "current" ? "current tier" : state === "earned" ? "earned" : "locked";

          // Colour appears ONLY when the ring is complete, i.e. the tier is
          // actually earned (or the current tier is maxed with no next).
          // In-progress + locked tiers stay black & white — same rule as the
          // Milestone rings, so Achievements reads consistently (Anusha, 06-19).
          const colorOn = state === "earned" || (state === "current" && !next);

          // Ring carries the progress signal (mirrors Milestones): earned tiers
          // read full green, the current tier shows partial yellow fill toward
          // the next unlock, locked tiers wait on a faint track.
          let ringValue = 0;
          let ringPrimary = RING_TRACK_FAINT;
          let ringSecondary = RING_TRACK_FAINT;
          if (state === "earned") {
            ringValue = 100; ringPrimary = RING_GREEN; ringSecondary = RING_GREEN_FAINT;
          } else if (state === "current") {
            if (next) {
              ringValue = toNextPct; ringPrimary = RING_YELLOW; ringSecondary = RING_YELLOW_FAINT;
            } else {
              ringValue = 100; ringPrimary = RING_GREEN; ringSecondary = RING_GREEN_FAINT;
            }
          }
          const aria =
            state === "current" && next
              ? `${TIER_NAME[t.rarity]} — current tier, ${toNextPct}% toward ${TIER_NAME[next.rarity]}`
              : `${TIER_NAME[t.rarity]} — ${stateWord}`;

          return (
            <div key={t.rarity} className={styles.node} data-state={state}>
              <span className={styles.nodeIcon} aria-label={aria} role="img">
                <AnimatedCircularProgressBar
                  value={ringValue}
                  max={100}
                  min={0}
                  gaugePrimaryColor={ringPrimary}
                  gaugeSecondaryColor={ringSecondary}
                  strokeWidth={7}
                  hideLabel
                  className={styles.tierGauge}
                  centerLabel={
                    <span className={`${styles.tierMark} ${colorOn ? "" : styles.tierMarkDim}`}>
                      <BadgeMark icon={badge.icon} tier={t.rarity as BadgeTier} size={40} />
                    </span>
                  }
                />
                {state === "locked" && (
                  <span className={styles.lock} aria-hidden="true">
                    <Lock size={13} strokeWidth={2.6} />
                  </span>
                )}
                {state === "current" && <span className={styles.now}>NOW</span>}
              </span>
              <span className={styles.nodeLabel}>{TIER_NAME[t.rarity]}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.nextHint}>
        {next ? `${toNextPct}% toward ${TIER_NAME[next.rarity]}` : "Maxed — Legendary unlocked"}
      </div>
    </div>
  );
}
