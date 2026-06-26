"use client";

import { useEffect, useState } from "react";
import { TODAY } from "@/lib/today";
import styles from "./ScoreboardLogo.module.css";

/**
 * 5FOR5 home lockup — COMPLEX wordmark over the squarish 5-for-5 badge logo
 * (public/figma/5for5-logo.svg) with a live split-flap bottom plate, per
 * Mark's scoreboard direction (2026-06-06 Slack mock): the QUIZ plate flips
 * on its horizontal axis to reveal the category of the day, then flips back.
 *
 * The static SVG still carries the frame, COMPLEX wordmark and 5·5 cells;
 * the flap is DOM text overlaid on the bottom band so the category comes
 * from TODAY.category rather than baked artwork.
 */

const HOLD_QUIZ_MS = 2400;
const HOLD_CATEGORY_MS = 3400;

export function ScoreboardLogo() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setTimeout>;
    let showCategory = false;
    const tick = () => {
      showCategory = !showCategory;
      setFlipped(showCategory);
      t = setTimeout(tick, showCategory ? HOLD_CATEGORY_MS : HOLD_QUIZ_MS);
    };
    t = setTimeout(tick, HOLD_QUIZ_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.lockup}>
      <div className={styles.badge}>
        {/* Self-contained badge — frame, COMPLEX wordmark, 5·5 cells. Its baked
            bottom plate is permanently covered by the flap below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/figma/5for5-logo.svg"
          alt="Complex 5 for 5 — Daily Sneaker Quiz"
          className={styles.logoImg}
        />
        {/* Split-flap slot: black housing shows through mid-flip, like a real
            scoreboard. Decorative — the img alt already names the quiz. */}
        <div className={styles.flapScene} aria-hidden="true">
          <div className={`${styles.flap} ${flipped ? styles.flipped : ""}`}>
            <span className={`${styles.face} ${styles.faceQuiz}`}>Quiz</span>
            <span className={`${styles.face} ${styles.faceCategory}`}>
              {TODAY.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
