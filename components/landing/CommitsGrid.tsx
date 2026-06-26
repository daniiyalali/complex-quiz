"use client";

import type { CSSProperties } from "react";
import styles from "./CommitsGrid.module.css";

/* 5 wide × 7 tall bitmap per char. Position = row * 50 + col. */
const letterPatterns: Record<string, number[]> = {
  A: [1, 2, 3, 50, 100, 150, 200, 250, 300, 54, 104, 154, 204, 254, 304, 151, 152, 153],
  B: [0, 1, 2, 3, 4, 50, 100, 150, 151, 200, 250, 300, 301, 302, 303, 304, 54, 104, 152, 153, 204, 254, 303],
  C: [0, 1, 2, 3, 4, 50, 100, 150, 200, 250, 300, 301, 302, 303, 304],
  D: [0, 1, 2, 3, 50, 100, 150, 200, 250, 300, 301, 302, 54, 104, 154, 204, 254, 303],
  E: [0, 1, 2, 3, 4, 50, 100, 150, 200, 250, 300, 301, 302, 303, 304, 151, 152],
  F: [0, 1, 2, 3, 4, 50, 100, 150, 200, 250, 300, 151, 152, 153],
  G: [0, 1, 2, 3, 4, 50, 100, 150, 200, 250, 300, 301, 302, 303, 153, 204, 154, 304, 254],
  H: [0, 50, 100, 150, 200, 250, 300, 151, 152, 153, 4, 54, 104, 154, 204, 254, 304],
  I: [0, 1, 2, 3, 4, 52, 102, 152, 202, 252, 300, 301, 302, 303, 304],
  J: [0, 1, 2, 3, 4, 52, 102, 152, 202, 250, 252, 302, 300, 301],
  K: [0, 4, 50, 100, 150, 200, 250, 300, 151, 152, 103, 54, 203, 254, 304],
  L: [0, 50, 100, 150, 200, 250, 300, 301, 302, 303, 304],
  M: [0, 50, 100, 150, 200, 250, 300, 51, 102, 53, 4, 54, 104, 154, 204, 254, 304],
  N: [0, 50, 100, 150, 200, 250, 300, 51, 102, 153, 204, 4, 54, 104, 154, 204, 254, 304],
  O: [1, 2, 3, 50, 100, 150, 200, 250, 301, 302, 303, 54, 104, 154, 204, 254],
  P: [0, 50, 100, 150, 200, 250, 300, 1, 2, 3, 54, 104, 151, 152, 153],
  Q: [1, 2, 3, 50, 100, 150, 200, 250, 301, 302, 54, 104, 154, 204, 202, 253, 304],
  R: [0, 50, 100, 150, 200, 250, 300, 1, 2, 3, 54, 104, 151, 152, 153, 204, 254, 304],
  S: [1, 2, 3, 4, 50, 100, 151, 152, 153, 204, 254, 300, 301, 302, 303],
  T: [0, 1, 2, 3, 4, 52, 102, 152, 202, 252, 302],
  U: [0, 50, 100, 150, 200, 250, 301, 302, 303, 4, 54, 104, 154, 204, 254],
  V: [0, 50, 100, 150, 200, 251, 302, 4, 54, 104, 154, 204, 253],
  W: [0, 50, 100, 150, 200, 250, 301, 152, 202, 252, 4, 54, 104, 154, 204, 254, 303],
  X: [0, 50, 203, 254, 304, 4, 54, 152, 101, 103, 201, 250, 300],
  Y: [0, 50, 101, 152, 202, 252, 302, 4, 54, 103],
  Z: [0, 1, 2, 3, 4, 54, 103, 152, 201, 250, 300, 301, 302, 303, 304],
  "0": [1, 2, 3, 50, 100, 150, 200, 250, 301, 302, 303, 54, 104, 154, 204, 254],
  "1": [1, 52, 102, 152, 202, 252, 302, 0, 2, 300, 301, 302, 303, 304],
  "2": [0, 1, 2, 3, 54, 104, 152, 153, 201, 250, 300, 301, 302, 303, 304],
  "3": [0, 1, 2, 3, 54, 104, 152, 153, 204, 254, 300, 301, 302, 303],
  "4": [0, 50, 100, 150, 4, 54, 104, 151, 152, 153, 154, 204, 254, 304],
  "5": [0, 1, 2, 3, 4, 50, 100, 151, 152, 153, 204, 254, 300, 301, 302, 303],
  "6": [1, 2, 3, 50, 100, 150, 151, 152, 153, 200, 250, 301, 302, 204, 254, 303],
  "7": [0, 1, 2, 3, 4, 54, 103, 152, 201, 250, 300],
  "8": [1, 2, 3, 50, 100, 151, 152, 153, 200, 250, 301, 302, 303, 54, 104, 204, 254],
  "9": [1, 2, 3, 50, 100, 151, 152, 153, 154, 204, 254, 304, 54, 104],
  "/": [4, 53, 102, 151, 200, 249, 300],
  " ": [],
};

const COMMIT_COLORS = ["#48d55d", "#016d32", "#0d4429"];

function cleanString(str: string): string {
  const allowed = Object.keys(letterPatterns);
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split("")
    .filter((c) => allowed.includes(c))
    .join("");
}

function buildGrid(text: string) {
  const cleaned = cleanString(text);
  const width = Math.max(cleaned.length * 6, 6) + 1;
  const height = 9; // 7 rows + top/bottom border rows
  let position = 1; // leave space for top border
  const highlighted = new Set<number>();

  cleaned.split("").forEach((char) => {
    const pattern = letterPatterns[char];
    if (pattern) {
      pattern.forEach((pos) => {
        const row = Math.floor(pos / 50);
        const col = pos % 50;
        highlighted.add((row + 1) * width + col + position);
      });
    }
    position += 6;
  });

  return { highlighted, width, height };
}

// Deterministic per-cell pseudo-random — pure (lint-safe) and stable across
// SSR/CSR so the grid never hydration-mismatches. (No Math.random in render.)
const seeded = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export function CommitsGrid({ text }: { text: string }) {
  const { highlighted, width, height } = buildGrid(text);
  const totalCells = width * height;

  return (
    <section
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
      }}
      aria-label={text}
    >
      {Array.from({ length: totalCells }).map((_, index) => {
        const isLit = highlighted.has(index);
        // Non-lit cells occasionally flash. Deterministic per cell (decorative).
        const shouldFlash = !isLit && seeded(index) < 0.28;
        const color = COMMIT_COLORS[Math.floor(seeded(index * 7 + 1) * COMMIT_COLORS.length)];
        const delay = `${(seeded(index * 3 + 2) * 0.6).toFixed(2)}s`;

        const className = [
          styles.cell,
          isLit ? styles.highlight : "",
          shouldFlash ? styles.flash : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={index}
            className={className}
            style={
              {
                animationDelay: delay,
                "--highlight": color,
              } as CSSProperties
            }
          />
        );
      })}
    </section>
  );
}
