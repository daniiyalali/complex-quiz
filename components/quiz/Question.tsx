"use client";

import { useEffect, useRef, useState } from "react";
import { QUIZ_DATA } from "@/lib/quiz-data";
import { QuizCornerAccents } from "./QuizCornerAccents";
import styles from "./Question.module.css";

type Props = {
  index: number;
  totalElapsedMs: number;
  selected: number | null;
  onAnswer: (i: number) => void;
};

/** Square stacked-dot colon for the timer. Sized in `em` so it scales with
 *  the parent font-size. NOT Doto — built from raw rectangles. */
function TimerColon() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        padding: "0 0.35em",
        gap: "0.12em",
        height: "0.6em",
        position: "relative",
        top: "-0.06em",
      }}
    >
      <span
        style={{
          width: "0.18em",
          height: "0.18em",
          background: "currentColor",
          borderRadius: 0,
          display: "block",
        }}
      />
      <span
        style={{
          width: "0.18em",
          height: "0.18em",
          background: "currentColor",
          borderRadius: 0,
          display: "block",
        }}
      />
    </span>
  );
}

export function Question({ index, totalElapsedMs, selected, onAnswer }: Props) {
  const q = QUIZ_DATA[index];
  const [elapsed, setElapsed] = useState(totalElapsedMs);
  const startRef = useRef<number>(performance.now());

  // Tick the live timer until the user answers
  useEffect(() => {
    if (selected !== null) return;
    startRef.current = performance.now();
    setElapsed(totalElapsedMs);
    let raf: number;
    const tick = () => {
      setElapsed(totalElapsedMs + (performance.now() - startRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, selected, totalElapsedMs]);

  const totalMs = elapsed;
  const m = Math.floor(totalMs / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const cs = Math.floor((totalMs % 1000) / 10);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const cc = String(cs).padStart(2, "0");
  // Time spent on THIS question (the display stays a running stopwatch, but
  // the colour escalates with per-question dwell): amber ≥30s, red pulse ≥45s.
  const questionSecs = Math.max(0, Math.floor((elapsed - totalElapsedMs) / 1000));
  // Green ≤10s (good — median), amber 10–20s, red pulse >20s (spending too long).
  const warn = questionSecs >= 10;
  const hot = questionSecs >= 20;
  const progress =
    ((index + (selected !== null ? 1 : 0)) / QUIZ_DATA.length) * 100;

  // A/B/C/D + 1/2/3/4 keyboard shortcuts
  useEffect(() => {
    if (selected !== null) return;
    const map: Record<string, number> = {
      a: 0,
      b: 1,
      c: 2,
      d: 3,
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 3,
    };
    const handler = (e: KeyboardEvent) => {
      const i = map[e.key.toLowerCase()];
      if (typeof i === "number") onAnswer(i);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, onAnswer]);

  return (
    <div className={styles.shell}>
      <div className={styles.qLayout}>
        <QuizCornerAccents />
        {/* QUESTION N OF 5 + segmented progress */}
        <div className={styles.qHead}>
          <p className={styles.qCount}>
            QUESTION <span>{index + 1}</span> OF {QUIZ_DATA.length}
          </p>
          <div className={styles.qSegs} aria-hidden>
            {QUIZ_DATA.map((_, i) => (
              <span
                key={i}
                className={`${styles.qSeg} ${
                  i < index + (selected !== null ? 1 : 0) || i === index
                    ? styles.qSegOn
                    : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* LED stopwatch — label above on mobile, below on desktop */}
        <div className={styles.timerZone}>
          <span className={styles.timerLabel}>YOUR TIME</span>
          <span
            className={styles.timer}
            data-warn={warn ? "" : undefined}
            data-hot={hot ? "" : undefined}
            aria-label={`Elapsed time ${mm}:${ss}:${cc}`}
          >
            {mm}
            <TimerColon />
            {ss}
            <TimerColon />
            {cc}
          </span>
        </div>

        {/* Contained hero band — full shoe visible, top+bottom masked into
            black so it blends rather than cropping behind the content. */}
        <div className={styles.qHeroBand} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/figma/editorial/sneaker-hero-gold.png"
            alt=""
            className={styles.qHeroImg}
          />
        </div>

        {/* Question text */}
        <h2 className={styles.qText}>{q.question}</h2>

        {/* Answers — letter chips; 1-col mobile, 2×2 desktop */}
        <div
          className={styles.options}
          role="radiogroup"
          aria-label="Answer choices"
        >
          {q.options.map((opt, i) => (
            <button
              // Composite key remounts the button on question change — kills
              // mobile :focus carryover that made the previously-tapped option
              // look pre-selected.
              key={`${index}-${i}`}
              className={`${styles.opt} ${selected === i ? styles.optSelected : ""}`}
              disabled={selected !== null}
              onClick={(e) => {
                e.currentTarget.blur();
                onAnswer(i);
              }}
              role="radio"
              aria-checked={selected === i}
              type="button"
            >
              <span className={styles.optKey}>{"ABCD"[i]}</span>
              <span className={styles.optText}>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
