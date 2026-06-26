"use client";

import { Component, lazy, Suspense, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./LedBackdrop.module.css";

/* The animated LED dot-matrix field (same component as the BADGE UNLOCKED
   backdrop), reusable as the ambient background across quiz screens. Lazy so
   Three.js never blocks first paint; WebGL-guarded with a static-dot fallback
   so it always shows something. Volt by default — matches the badge field. */
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

export function LedBackdrop({ color = "#FFFFFF" }: { color?: string }) {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setLive(true), 350);
    return () => window.clearTimeout(t);
  }, []);

  const staticDots = (
    <div className={styles.staticDots} style={{ ["--led-dot"]: color } as CSSProperties} />
  );

  return (
    <div className={styles.layer} aria-hidden>
      {live ? (
        <WebGLBoundary fallback={staticDots}>
          <Suspense fallback={staticDots}>
            <PixelBlast
              variant="circle"
              color={color}
              pixelSize={6}
              patternScale={3}
              patternDensity={1.0}
              pixelSizeJitter={0.4}
              speed={0.55}
              enableRipples={false}
              edgeFade={0.25}
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
