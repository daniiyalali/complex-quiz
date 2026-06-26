"use client";

import { useEffect, useState } from "react";
import Stepper, { Step } from "@/components/ui/Stepper";
import styles from "./HowItWorksPopup.module.css";

/* Honors the OS reduced-motion setting — live timer freezes, entrance
   staggers are disabled via the CSS media query. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

type Props = {
  onClose: () => void;
  onNext?: () => void;
};

export function HowItWorksPopup({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal
      aria-labelledby="how-it-works-heading"
      onClick={onClose}
    >
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <h2 id="how-it-works-heading" className={styles.heading}>
            How it works?
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          <Stepper
            initialStep={1}
            onFinalStepCompleted={onClose}
            backButtonText="Back"
            nextButtonText="Next"
            finalButtonText="Let's play"
          >
            <Step>
              <TimerVisual />
              <h3 className={styles.stepTitle}>Five questions. One shot.</h3>
              <p className={styles.stepBody}>
                A new quiz drops every day at 8 AM ET. No retries. Answer fast because speed breaks the tie.
              </p>
            </Step>
            <Step>
              <WeeklyVisual />
              <h3 className={styles.stepTitle}>Build your streak</h3>
              <p className={styles.stepBody}>
                Play any day to keep your weekly streak going. A missed day won&apos;t break it. Play every day to grow the flame and lock a perfect week.
              </p>
            </Step>
            <Step>
              <BadgesVisual />
              <h3 className={styles.stepTitle}>Earn badges</h3>
              <p className={styles.stepBody}>
                Perfect scores, speed runs, podium finishes, streak milestones. Every achievement earns a badge for your trophy case.
              </p>
            </Step>
            <Step>
              <LeaderboardVisual />
              <h3 className={styles.stepTitle}>Climb the board</h3>
              <p className={styles.stepBody}>
                Daily, weekly, all-time. Land in the top three and take the crown.
              </p>
            </Step>
          </Stepper>
        </div>
      </div>
    </div>
  );
}

/* ─── Step visuals ─── */

function TimerColon() {
  return (
    <span aria-hidden className={styles.timerColon}>
      <span /><span />
    </span>
  );
}

function TimerVisual() {
  const reduced = usePrefersReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  // Live, running stopwatch — counts up from 0 while the step is on screen
  // (the Stepper remounts each step, so this restarts on every visit).
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setElapsed(now - start);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // Reduced motion → hold a representative frozen time.
  const total = reduced ? 6970 : elapsed;
  const mm = Math.floor(total / 60000);
  const ss = Math.floor((total % 60000) / 1000);
  const cc = Math.floor((total % 1000) / 10);
  const p2 = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={styles.visual + " " + styles.timerVisual}>
      <span className={styles.timerText} aria-hidden>
        {p2(mm)}<TimerColon />{p2(ss)}<TimerColon />{p2(cc)}
      </span>
    </div>
  );
}

function WeeklyVisual() {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "TODAY", "SUN"];
  return (
    <div className={styles.visual + " " + styles.weeklyVisual}>
      <div className={styles.weeklyHead}>
        <span className={styles.weeklyHeadLeft}>THIS WEEK</span>
        <span className={styles.weeklyHeadRight}>ALL 7 = PERFECT WEEK</span>
      </div>
      <div className={styles.weeklyGrid}>
        {days.map((d, i) => {
          const done = i < 6; // first 6 done, Sun pending
          const isToday = i === 5;
          return (
            <div
              key={d}
              className={styles.weeklyCol}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span
                className={`${styles.weeklyDay} ${isToday ? styles.weeklyDayToday : ""}`}
              >
                {d}
              </span>
              <div
                className={`${styles.weeklyCell} ${done ? styles.weeklyCellDone : ""} ${isToday ? styles.weeklyCellToday : ""}`}
              >
                {done && (
                  <svg width="14" height="14" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden>
                    {[
                      [0,4],[0,5],[1,5],[1,6],[2,6],[2,7],
                      [3,5],[3,6],[4,4],[4,5],[5,3],[5,4],
                      [6,2],[6,3],[7,1],[7,2],
                    ].map(([x, y]) => (
                      // black glyph on green (house signal rule) — white was invisible
                      <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" />
                    ))}
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.weeklyNudge}>WEEKLY STREAK ON · SEE YOU TOMORROW</div>
    </div>
  );
}

function BadgesVisual() {
  return (
    <div className={styles.visual + " " + styles.badgesVisual}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/badges/streak-30.png"
        alt=""
        aria-hidden
        className={styles.badgeImgSide}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/badges/founding-player.png"
        alt=""
        aria-hidden
        className={styles.badgeImgCenter}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/badges/streak-7.png"
        alt=""
        aria-hidden
        className={styles.badgeImgSide}
      />
    </div>
  );
}

function LeaderboardVisual() {
  const top = [
    { rank: "02", name: "HEELGAME", score: "5/5", time: "14s", avatar: "https://i.pravatar.cc/120?img=8" },
    { rank: "01", name: "SAMPLE_SIZE", score: "5/5", time: "14s", avatar: "https://i.pravatar.cc/120?img=5", gold: true },
    { rank: "03", name: "OFFWHITER", score: "5/5", time: "15s", avatar: "https://i.pravatar.cc/120?img=3" },
  ];
  return (
    <div className={styles.visual + " " + styles.lbVisual}>
      {top.map((p) => (
        <div
          key={p.rank}
          className={styles.lbEntry}
          /* Reveal in rank order 01 → 02 → 03 regardless of DOM (02,01,03) */
          style={{ animationDelay: `${(parseInt(p.rank, 10) - 1) * 130 + 80}ms` }}
        >
          <span className={styles.lbRank}>{p.rank}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.avatar}
            alt=""
            aria-hidden
            className={`${styles.lbAvatar} ${p.gold ? styles.lbAvatarGold : ""}`}
          />
          <span className={`${styles.lbName} ${p.gold ? styles.lbNameGold : ""}`}>
            {p.name}
          </span>
          <span className={styles.lbScore}>{p.score} · {p.time}</span>
        </div>
      ))}
    </div>
  );
}
