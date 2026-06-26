"use client";

import styles from "./CosmosGradient.module.css";

/**
 * CosmosGradient — the cosmos-spectrum gradient (21st.dev / aliimam), extracted
 * to just its SVG spectrum bars and used as the MAIN branding element behind the
 * hero. All the page's color lives here; the UI chrome stays Apple-neutral. A
 * black PixelBlast dot field overlays this (see HeroBackdrop) for the LED look.
 *
 * No GSAP — a slow CSS drift gives it life; reduced-motion holds it still.
 */

const THEMES: Record<string, string[]> = {
  // cosmic blues → purples → pinks. No yellow (per direction).
  "blue-pink": ["#1E3A8A", "#3B82F6", "#7C5CFF", "#A855F7", "#EC4899", "#F472B6", "#FBCFE8", "#FDF2F8"],
  "pink-purple": ["#3B1769", "#6D28D9", "#9333EA", "#C026D3", "#EC4899", "#F472B6", "#F9A8D4", "#FDF2F8"],
  monochrome: ["#0A0A0A", "#262626", "#404040", "#666666", "#999999", "#CCCCCC", "#E5E5E5", "#FFFFFF"],
};

export function CosmosGradient({
  theme = "blue-pink",
  className,
}: {
  theme?: keyof typeof THEMES;
  className?: string;
}) {
  const c = THEMES[theme] ?? THEMES["blue-pink"];
  return (
    <div className={`${styles.wrap} ${className ?? ""}`} aria-hidden>
      <svg
        className={styles.svg}
        viewBox="0 0 1567 584"
        preserveAspectRatio="none"
        fill="none"
      >
        <g clipPath="url(#cg-clip)" filter="url(#cg-blur)">
          <path d="M1219 584H1393V184H1219V584Z" fill="url(#cg0)" />
          <path d="M1045 584H1219V104H1045V584Z" fill="url(#cg1)" />
          <path d="M348 584H174L174 184H348L348 584Z" fill="url(#cg2)" />
          <path d="M522 584H348L348 104H522L522 584Z" fill="url(#cg3)" />
          <path d="M697 584H522L522 54H697L697 584Z" fill="url(#cg4)" />
          <path d="M870 584H1045V54H870V584Z" fill="url(#cg5)" />
          <path d="M870 584H697L697 0H870L870 584Z" fill="url(#cg6)" />
          <path d="M174 585H0.000183105L-3.75875e-06 295H174L174 585Z" fill="url(#cg7)" />
          <path d="M1393 584H1567V294H1393V584Z" fill="url(#cg8)" />
        </g>
        <defs>
          <filter id="cg-blur" x="-30" y="-30" width="1627" height="644"
            filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="34" result="b" />
          </filter>
          {Array.from({ length: 9 }, (_, i) => (
            <linearGradient key={i} id={`cg${i}`} x1="50%" y1="100%" x2="50%" y2="0%"
              gradientUnits="objectBoundingBox">
              <stop stopColor={c[0]} />
              <stop offset="0.182709" stopColor={c[1]} />
              <stop offset="0.283673" stopColor={c[2]} />
              <stop offset="0.413484" stopColor={c[3]} />
              <stop offset="0.586565" stopColor={c[4]} />
              <stop offset="0.682722" stopColor={c[5]} />
              <stop offset="0.802892" stopColor={c[6]} />
              <stop offset="1" stopColor={c[7]} stopOpacity="0" />
            </linearGradient>
          ))}
          <clipPath id="cg-clip"><rect width="1567" height="584" fill="white" /></clipPath>
        </defs>
      </svg>
    </div>
  );
}
