"use client";

import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import styles from "./HeroBackdrop.module.css";

/* Lazy so Three.js never blocks the hero / first paint — loads after idle,
   only when motion is allowed. Mirrors the dark HomeBackdrop strategy. */
const PixelBlast = lazy(() =>
  import("@/components/quiz/PixelBlast").then((m) => ({ default: m.PixelBlast })),
);

/**
 * HeroBackdrop — the signature LED dot-matrix from the BADGE UNLOCKED moment,
 * reused as a branding motif behind the light landing hero.
 *
 * Color note: the dark home echo uses desaturated gold (#B8901E) because gold
 * pops on black. On a WHITE surface gold dithers to mud, so on light we render
 * the dots in graphite ink and let the cosmos gradient carry the color.
 */
const BACKDROP_COLOR = "#1D1D1F"; // graphite ink — readable on white

/* If WebGL is unavailable (headless, blocked, low-end), PixelBlast can throw.
   Degrade to the static CSS dot texture instead of taking the page down. */
class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function HeroBackdrop() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Skip the WebGL field entirely if a context can't be created.
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setLive(true), 450);
    return () => window.clearTimeout(t);
  }, []);

  const staticDots = <div className={styles.staticDots} />;

  return (
    <div className={styles.layer} aria-hidden>
      {live ? (
        <WebGLBoundary fallback={staticDots}>
          <Suspense fallback={staticDots}>
            <PixelBlast
              variant="circle"
              color={BACKDROP_COLOR}
              pixelSize={7}
              patternScale={2.8}
              patternDensity={0.5}
              pixelSizeJitter={0.35}
              speed={0.14}
              enableRipples={false}
              edgeFade={0.6}
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
