"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Countdown.module.css";

type Props = {
  onDone: () => void;
  /** When true, render as a translucent overlay (50% black) — used when countdown sits on top of the home screen. */
  overlay?: boolean;
};

export function Countdown({ onDone, overlay = false }: Props) {
  const [n, setN] = useState<number | "GO">(3);

  // Hold the latest onDone in a ref so the timer effect doesn't depend on it.
  // If we depended on `onDone` directly, any parent re-render (resize, state
  // change) would create a new function ref, re-run the effect, and the
  // cleanup would cancel the in-flight countdown.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let val: number | "GO" = 3;

    const tick = () => {
      if (cancelled) return;
      if (typeof val === "number") {
        if (val === 1) {
          val = "GO";
          setN("GO");
          timers.push(
            setTimeout(() => {
              if (!cancelled) onDoneRef.current();
            }, 380),
          );
          return;
        }
        val = (val - 1) as number;
        setN(val);
        timers.push(setTimeout(tick, 700));
      }
    };
    timers.push(setTimeout(tick, 700));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className={`${styles.wrap} ${overlay ? styles.wrapOverlay : ""}`}>
      <span className={styles.kicker}>Starting in</span>
      {/* GO lands in signal green — the "go" light */}
      <span key={String(n)} className={styles.num} data-go={n === "GO" ? "" : undefined}>
        {n}
      </span>
    </div>
  );
}
