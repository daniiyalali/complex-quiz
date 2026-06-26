"use client";

import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { BadgeMark, type BadgeTier } from "./BadgeIcon";
import type { Badge } from "@/lib/quiz-data";
import styles from "./BadgeProgressRing.module.css";

type Props = {
  badge: Badge;
  streakDays: number;
  /** When true, treat as earned regardless of streak math (e.g., earned this play). */
  forceEarned?: boolean;
  /** Ring diameter in px. Default 112. */
  size?: number;
  /** Badge icon size in px. Default = size * 0.72 — badge is hero, ring is frame. */
  iconSize?: number;
  /** Hide the badge icon (used when you only want the ring). */
  hideIcon?: boolean;
  /** Arc stroke width in viewBox units (100×100 viewBox). Default 4 — thin frame. */
  strokeWidth?: number;
};

/* Gaming-signal ramp (CEO direction, 2026-06-11): earned = signal green,
   in-progress = yellow ("working toward it"). */
const IN_PROGRESS = "#FFD60A";
const IN_PROGRESS_FAINT = "rgba(255, 214, 10, 0.16)";
const GREEN = "var(--correct, #00FF85)";
const GREEN_FAINT = "rgba(0, 255, 133, 0.16)";

export function BadgeProgressRing({
  badge,
  streakDays,
  forceEarned = false,
  size = 112,
  iconSize,
  hideIcon = false,
  strokeWidth = 4,
}: Props) {
  const progress = forceEarned ? 1 : badgeProgress(badge, streakDays);
  const pct = Math.round(progress * 100);
  const earned = progress >= 1;
  const innerSize = iconSize ?? Math.round(size * 0.72);

  return (
    <div
      className={`${styles.shell} ${earned ? styles.earned : styles.inProgress}`}
      style={{ width: size, height: size }}
    >
      <AnimatedCircularProgressBar
        value={pct}
        max={100}
        min={0}
        gaugePrimaryColor={earned ? GREEN : IN_PROGRESS}
        gaugeSecondaryColor={earned ? GREEN_FAINT : IN_PROGRESS_FAINT}
        strokeWidth={strokeWidth}
        hideLabel
        className={styles.gauge}
        centerLabel={
          hideIcon ? null : (
            <div className={styles.iconWrap}>
              <BadgeMark
                icon={badge.icon}
                size={innerSize}
                tier={badge.kind === "tier" ? (badge.currentTier as BadgeTier | undefined) : undefined}
              />
            </div>
          )
        }
      />
    </div>
  );
}

/* Pure function — exported so tests / other surfaces can reuse. */
export function badgeProgress(badge: Badge, streakDays: number): number {
  switch (badge.id) {
    case "first-play":
    case "founding-player":
      return 1; // earned by virtue of opening the app at least once
    case "streak-7":
      return clamp01(streakDays / 7);
    case "streak-30":
      return clamp01(streakDays / 30);
    case "streak-100":
      return clamp01(streakDays / 100);
    case "streak-365":
      return clamp01(streakDays / 365);
    default:
      // Tiered families — no live counter in the prototype, so treat a held
      // showcase tier as earned (full green ring under the metal medallion);
      // otherwise show an empty track waiting to fill.
      return badge.currentTier ? 1 : 0;
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
