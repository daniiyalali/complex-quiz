"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import styles from "./HomeBackdrop.module.css";

/* Lazy import so Three.js / the WebGL field never lands in the home bundle and
   never blocks START from painting — it loads only after the screen is idle.
   (Design council — Andrew Chen: don't tax time-to-interactive on the most-
   visited screen.) */
const PixelBlast = lazy(() =>
  import("@/components/quiz/PixelBlast").then((m) => ({ default: m.PixelBlast })),
);

/**
 * HomeBackdrop — the ambient LED dot-matrix behind the home/first screen.
 *
 * A deliberately de-tuned echo of the BADGE UNLOCKED signature field. The badge
 * moment keeps the vivid, dense, fully-animated version (the emotional climax +
 * shareable artifact); home is a quiet recessive texture so the reward still
 * lands and the yellow START button stays the only vivid yellow on screen.
 * (Synthesised from the design council: Jony / Brian / Andrew / Nikita.)
 *
 * First paint renders only a cheap static CSS dot texture. Once the page is idle
 * — and only when motion is allowed — we fade in the live drift field on top.
 */
export function HomeBackdrop() {
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setLive(true), 500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={styles.layer} aria-hidden>
      {live ? (
        <Suspense fallback={<div className={styles.staticDots} />}>
          <PixelBlast
            variant="circle"
            /* White LED field — the ambient hero. Volt stays reserved for the
               BADGE UNLOCKED climax + the START button (color is "religious"). */
            color="#FFFFFF"
            pixelSize={8}
            patternScale={2.6}
            patternDensity={0.55}
            pixelSizeJitter={0.3}
            /* near-static drift — far slower than the badge field's life */
            speed={0.12}
            enableRipples={false}
            edgeFade={0.55}
            transparent
            autoPauseOffscreen
          />
        </Suspense>
      ) : (
        <div className={styles.staticDots} />
      )}
    </div>
  );
}
