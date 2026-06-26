"use client";

import { Component, lazy, Suspense, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./QuizCornerAccents.module.css";

/* Tasteful pixel-pattern accents for the question/answer screen. Instead of a
   full-bleed field (which would fight the question + shoe for attention), the
   same animated LED dot-matrix is masked to just two opposite corners —
   top-right and bottom-left — so it reads as a quiet diagonal frame.
   Lazy + WebGL-guarded with a static-dot fallback, same strategy as
   HomeBackdrop / LedBackdrop. (Anusha direction, 2026-06-12.) */
const PixelBlast = lazy(() =>
  import("./PixelBlast").then((m) => ({ default: m.PixelBlast })),
);

class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function QuizCornerAccents({
  color = "#FFFFFF",
  mobileBoth = false,
}: {
  color?: string;
  /** Keep the bottom-left accent on mobile too (safe on screens with no
   *  full-width options at the bottom, e.g. the reveal/result screen). */
  mobileBoth?: boolean;
}) {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setLive(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  const staticDots = (
    <div className={styles.staticDots} style={{ ["--led-dot"]: color } as CSSProperties} />
  );

  return (
    <div className={`${styles.layer} ${mobileBoth ? styles.mobileBoth : ""}`} aria-hidden>
      {live ? (
        <WebGLBoundary fallback={staticDots}>
          <Suspense fallback={staticDots}>
            <PixelBlast
              variant="circle"
              color={color}
              pixelSize={8}
              patternScale={2}
              /* High density — the shader only turns a cell on when
                 feed+bayer > 0.5, and feed scales with (density-0.5)*0.3, so a
                 dense halftone field needs density well above 1. */
              patternDensity={3}
              pixelSizeJitter={0.25}
              speed={0.22}
              enableRipples={false}
              /* No internal edge fade — it would darken the canvas corners,
                 the exact spot the corner mask concentrates the pattern.
                 The .layer mask shapes the corners instead. */
              edgeFade={0}
              transparent
              autoPauseOffscreen
            />
          </Suspense>
        </WebGLBoundary>
      ) : (
        staticDots
      )}
    </div>
  );
}
