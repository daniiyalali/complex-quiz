"use client";

import { cn } from "@/lib/utils";
import styles from "./animated-circular-progress-bar.module.css";

/* ─── Ported from Magic UI registry: animated-circular-progress-bar.tsx.
   Source: github.com/magicuidesign/magicui (MIT).
   Adapted to this project: no Tailwind — Tailwind utility classes replaced
   with a minimal CSS module. The CSS-variable animation engine that powers
   the gauge is preserved verbatim. */

interface AnimatedCircularProgressBarProps {
  max?: number;
  min?: number;
  value: number;
  gaugePrimaryColor: string;
  gaugeSecondaryColor: string;
  className?: string;
  /** If true, hides the numeric label that Magic UI renders in the center —
   *  useful when you're rendering something else (a badge icon) inside. */
  hideLabel?: boolean;
  /** Override the center label content. Defaults to the integer percent. */
  centerLabel?: React.ReactNode;
  /** Arc stroke width in viewBox units (the viewBox is 100×100, so 10 = 10% of diameter).
   *  Default 10 — Magic UI's original. Lower for a thinner ring. */
  strokeWidth?: number;
}

export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor,
  gaugeSecondaryColor,
  className,
  hideLabel = false,
  centerLabel,
  strokeWidth = 10,
}: AnimatedCircularProgressBarProps) {
  const circumference = 2 * Math.PI * 45;
  const percentPx = circumference / 100;
  const currentPercent = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div
      className={cn(styles.wrap, className)}
      style={
        {
          "--circle-size": "100px",
          "--circumference": circumference,
          "--percent-to-px": `${percentPx}px`,
          "--gap-percent": "5",
          "--offset-factor": "0",
          "--transition-length": "1s",
          "--transition-step": "200ms",
          "--delay": "0s",
          "--percent-to-deg": "3.6deg",
          transform: "translateZ(0)",
        } as React.CSSProperties
      }
    >
      <svg
        fill="none"
        className={styles.svg}
        strokeWidth={2}
        viewBox="0 0 100 100"
      >
        {currentPercent <= 90 && currentPercent >= 0 && (
          <circle
            cx="50"
            cy="50"
            r="45"
            strokeWidth={strokeWidth}
            strokeDashoffset="0"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              {
                stroke: gaugeSecondaryColor,
                "--stroke-percent": 90 - currentPercent,
                "--offset-factor-secondary": "calc(1 - var(--offset-factor))",
                strokeDasharray:
                  "calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)",
                transform:
                  "rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1)",
                transition: "all var(--transition-length) ease var(--delay)",
                transformOrigin:
                  "calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)",
              } as React.CSSProperties
            }
          />
        )}
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth={strokeWidth}
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            {
              stroke: gaugePrimaryColor,
              "--stroke-percent": currentPercent,
              strokeDasharray:
                "calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)",
              transition:
                "var(--transition-length) ease var(--delay),stroke var(--transition-length) ease var(--delay)",
              transitionProperty: "stroke-dasharray,transform",
              transform:
                "rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)))",
              transformOrigin:
                "calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)",
            } as React.CSSProperties
          }
        />
      </svg>
      {!hideLabel && (
        <span
          data-current-value={currentPercent}
          className={styles.label}
        >
          {centerLabel ?? currentPercent}
        </span>
      )}
      {hideLabel && centerLabel && (
        <div className={styles.center}>{centerLabel}</div>
      )}
    </div>
  );
}
