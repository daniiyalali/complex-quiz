"use client";

import { useEffect, useRef, useState } from "react";
import { Answer, BADGE_OPTIONS, QuizPrefs } from "@/lib/quiz-data";
import { BadgeMark } from "@/components/badges/BadgeIcon";
import { QuizCornerAccents } from "./QuizCornerAccents";
import styles from "./Reveal.module.css";

type Props = {
  answers: Answer[];
  totalElapsedMs: number;
  prefs: QuizPrefs;
  onDone: () => void;
  /** True when a badge-unlock screen follows this one (not results directly).
   *  Drives the CTA label: "NEXT" → badge ahead, "SEE RESULTS" → results. */
  badgeNext?: boolean;
};

export function Reveal({ answers, totalElapsedMs, prefs, onDone, badgeNext }: Props) {
  const [phase, setPhase] = useState(0); // 0 suspense  1 ticks  2 score  3 time  5 badge
  // How many answer boxes have animated in so far. The COLOR of each box is
  // read directly from the live `answers` prop at render time (see below) —
  // the same array `correctCount` is computed from — so the green/red boxes
  // can never disagree with the score. (Previously we cached each box's
  // correctness in a captured array, which could desync from the score.)
  const [revealedCount, setRevealedCount] = useState(0);
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [ctaVisible, setCtaVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [complete, setComplete] = useState(false);
  const cancelledRef = useRef(false);
  const correctCount = answers.filter((a) => a.correct).length;
  const earnedBadge = BADGE_OPTIONS[prefs.badge];
  // Editorial one-word verdict, indexed by score (0..5).
  const PERF_LABELS = ["Tomorrow.", "Brutal.", "Rough.", "Respectable.", "Solid.", "Perfect."];
  const perfLabel = PERF_LABELS[correctCount] ?? "";

  // Score count-up — 0 to correctCount over 650ms once phase 2 begins
  useEffect(() => {
    if (phase < 2) return;
    const dur = 650;
    const t0 = performance.now();
    let raf: number;
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setScoreDisplay(Math.round(correctCount * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, correctCount]);

  const finish = () => {
    // Always advance — call onDone synchronously. Previous setTimeout-based
    // exit animation was masking the navigation when the user tapped early.
    onDone();
  };

  useEffect(() => {
    cancelledRef.current = false;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    // v3 spec §8 — Cinematic Reveal sequencing
    //   0ms        → first answer-box reveal begins (400ms after mount)
    //   +110ms     → each subsequent box (stagger)
    //   +180ms     → score appears (after last box's 260ms anim peaks)
    //   +600ms     → time appears
    //   +380ms     → rank appears
    //   +280ms     → CTA fades in
    (async () => {
      await sleep(400);
      if (cancelledRef.current) return;
      setPhase(1);
      for (let i = 0; i < answers.length; i++) {
        if (cancelledRef.current) return;
        await sleep(110);
        // Only advance the count — never cache the answer's correctness here.
        // Math.max guards against any double-invoke (e.g. dev StrictMode).
        setRevealedCount((c) => Math.max(c, i + 1));
      }
      await sleep(180);
      if (cancelledRef.current) return;
      setPhase(2);
      await sleep(600);
      if (cancelledRef.current) return;
      setPhase(3);
      // Daily rank removed (not known until the day's leaderboard settles) —
      // hold a beat after the time, then bring in the CTA.
      await sleep(660);
      if (cancelledRef.current) return;
      setCtaVisible(true);

      if (earnedBadge) {
        await sleep(420);
        if (cancelledRef.current) return;
        setPhase(5);
        await sleep(1500);
        if (cancelledRef.current) return;
      }
      // Cinematic done — wait for the user's tap on SEE RESULTS.
      setComplete(true);
    })();

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`${styles.shell} ${exiting ? styles.shellExit : ""}`}
    >
      <QuizCornerAccents mobileBoth />
      <div className={styles.stack}>
        {/* Per-Q reveal bar */}
        <div className={styles.ticks}>
          <span className={styles.label}>Your answers</span>
          <div className={styles.segs}>
            {Array.from({ length: answers.length }).map((_, i) => {
              // Color straight from the live answer once this box has revealed.
              const shown = i < revealedCount;
              const cls = !shown
                ? styles.seg
                : answers[i]?.correct
                ? `${styles.seg} ${styles.segRight}`
                : `${styles.seg} ${styles.segWrong}`;
              return (
                <div key={i} className={cls}>
                  <span className={styles.segNum}>{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score + Time wrapped in a single #1C1C1E card per v3 spec §8.
            (Daily rank removed — not known until the day's leaderboard settles.) */}
        {phase >= 2 && (
          <div className={styles.statsCard}>
            <div className={styles.perfLabel}>{perfLabel}</div>
            <div className={styles.bigBlock}>
              <span className={styles.label}>Score</span>
              <div className={styles.score}>
                {scoreDisplay}<span className={styles.scoreSlash}>/</span>{answers.length}
              </div>
            </div>

            {phase >= 3 && (
              <div className={styles.timeBlock}>
                <span className={styles.label}>Time</span>
                <div className={styles.time}>
                  {Math.round(totalElapsedMs / 1000)}
                  <span className={styles.timeUnit}>seconds</span>
                </div>
              </div>
            )}
          </div>
        )}

        {phase >= 5 && earnedBadge && (
          <div className={styles.badge}>
            <span className={styles.label}>Badge unlocked</span>
            <div className={`${styles.badgeArt} ${styles[`badge_${earnedBadge.rarity}`]}`}>
              <BadgeMark
                icon={earnedBadge.icon}
                size={80}
                tier={earnedBadge.rarity === "white" ? undefined : earnedBadge.rarity}
              />
            </div>
            <div className={styles.badgeName}>{earnedBadge.name}</div>
            <div className={styles.badgeSub}>
              Only {earnedBadge.earnRate} of players earned this today
            </div>
          </div>
        )}
      </div>

      {ctaVisible && (
        <div className={styles.ctaRow}>
          <button
            type="button"
            className={styles.primaryCta}
            onClick={finish}
          >
            {badgeNext ? "NEXT  →" : complete ? "SEE RESULTS  →" : "SKIP TO RESULTS  →"}
          </button>
        </div>
      )}
    </div>
  );
}
