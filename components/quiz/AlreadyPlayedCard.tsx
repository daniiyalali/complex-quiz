"use client";

import { ArrowRight } from "lucide-react";
import styles from "./AlreadyPlayedCard.module.css";

/* Shown to a logged-in member who has already played today's quiz. One shot a
   day — no replay. Surfaced both on the cabinet (in place of START) and on
   /play (replay guard). Purely presentational; the host owns the modals and
   passes the action handlers. */

type Props = {
  /** Current streak to celebrate (the run they just extended). */
  streak?: number;
  /** Back to today's results scorecard (score, answer review, share card). */
  onViewResults: () => void;
  onShare: () => void;
  onChallenge: () => void;
  onLeaderboard: () => void;
  /** Layout hint — "dark" full-screen (play) vs "inline" (cabinet column). */
  variant?: "screen" | "inline";
};

export function AlreadyPlayedCard({
  streak,
  onViewResults,
  onShare,
  onChallenge,
  onLeaderboard,
  variant = "inline",
}: Props) {
  return (
    <div className={`${styles.wrap} ${variant === "screen" ? styles.screen : ""}`}>
      {variant !== "screen" && <span className={styles.todayDone}>TODAY · DONE</span>}
      <h2 className={styles.headline}>
        You already played today.
        {variant === "screen" && (
          <>
            {" "}
            <button type="button" onClick={onViewResults} className={styles.viewResults}>
              <span className={styles.vrLabel}>View results</span>
              <ArrowRight size={17} strokeWidth={2.6} aria-hidden />
            </button>
          </>
        )}
      </h2>
      <p className={styles.sub}>
        One shot a day. Come back tomorrow · 8 AM ET.
      </p>

      {typeof streak === "number" && streak > 0 && (
        <div className={styles.streakRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/editorial/flame.svg" alt="" aria-hidden className={styles.flame} />
          <span className={styles.streakNum}>{streak}</span>
          <span className={styles.streakLabel}>day streak going</span>
        </div>
      )}

      <div className={styles.ctas}>
        <button type="button" onClick={onShare} className={styles.btnPrimary}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/icon-share.svg" alt="" aria-hidden className={`${styles.btnIcon} ${styles.btnIconInverted}`} />
          Share your result
        </button>
        <button type="button" onClick={onChallenge} className={styles.btnOutline}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/icon-trophy.svg" alt="" aria-hidden className={styles.btnIcon} />
          Challenge a friend
        </button>
        {/* View leaderboard only on the full-screen replay-lock — on the
            cabinet the board is already on the page (sidebar / peek sheet). */}
        {variant === "screen" && (
          <button type="button" onClick={onLeaderboard} className={styles.btnGhost}>
            View leaderboard
          </button>
        )}
      </div>

      {variant !== "screen" && (
        <a
          href="https://www.complex.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.complexLink}
        >
          Go to Complex.com →
        </a>
      )}
    </div>
  );
}
