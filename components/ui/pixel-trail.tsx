"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./pixel-trail.module.css";

interface PixelTrailProps {
  /** Edge length of each pixel cell, in px. */
  pixelSize?: number;
  /** How long the pixel stays visible before fading. */
  delay?: number;
  /** Fade-out duration after the delay. 0 = instant pop-off. */
  fadeDuration?: number;
  /** Background color of each pixel cell. */
  pixelColor?: string;
  /** Optional class applied to every pixel cell. */
  pixelClassName?: string;
  /** CSS selector for elements the trail should NOT paint over (e.g. buttons,
      clickable cards). When the cursor is over a match, no cell is emitted. */
  avoidSelector?: string;
}

interface Pixel {
  id: number;
  x: number;
  y: number;
}

/**
 * A cursor-driven trail of grid-aligned pixel cells. Pair with <GooeyFilter />
 * (parent gets `filter: url(#id)`) and adjacent cells will blob together.
 *
 * Implementation note: each mousemove that crosses into a new grid cell adds
 * a pixel to state and schedules its own removal after delay + fadeDuration.
 * We render only the currently-lit pixels, not the full grid — O(lit) cost.
 */
export const PixelTrail: React.FC<PixelTrailProps> = ({
  pixelSize = 32,
  delay = 500,
  fadeDuration = 0,
  pixelColor = "#FFFFFF",
  pixelClassName,
  avoidSelector,
}) => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const idRef = useRef(0);
  const lastKeyRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return;

      // Don't paint over interactive controls — let only the pointer cursor
      // show there. The trail layer is pointer-events:none, so elementFromPoint
      // returns the real underlying element.
      if (avoidSelector) {
        const hit = document.elementFromPoint(clientX, clientY);
        if (hit && hit.closest(avoidSelector)) {
          lastKeyRef.current = "";
          return;
        }
      }

      const col = Math.floor(x / pixelSize);
      const row = Math.floor(y / pixelSize);
      const key = `${row}_${col}`;
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      const id = idRef.current++;
      const pixel: Pixel = { id, x: col * pixelSize, y: row * pixelSize };
      setPixels((prev) => [...prev, pixel]);

      window.setTimeout(() => {
        setPixels((prev) => prev.filter((p) => p.id !== id));
      }, delay + fadeDuration + 50);
    },
    [pixelSize, delay, fadeDuration],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handleMove(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [handleMove]);

  const lifetime = delay + fadeDuration;

  return (
    <div ref={containerRef} className={styles.stage}>
      {pixels.map((p) => (
        <div
          key={p.id}
          className={`${styles.pixel} ${pixelClassName ?? ""}`}
          style={{
            left: p.x,
            top: p.y,
            width: pixelSize,
            height: pixelSize,
            background: pixelColor,
            animation:
              fadeDuration > 0
                ? `${styles.fadeKf} ${fadeDuration}ms linear ${delay}ms forwards`
                : `${styles.flashKf} ${lifetime}ms steps(2, end) forwards`,
          }}
        />
      ))}
    </div>
  );
};
