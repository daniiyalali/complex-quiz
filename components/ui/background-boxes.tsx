"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import styles from "./background-boxes.module.css";

/**
 * Skewed isometric grid of boxes that fill with a random pastel on hover.
 * Adapted from Aceternity UI — converted off Tailwind to CSS Module since
 * this project doesn't use Tailwind. Reduced cell count from 15k → ~2k for
 * mobile performance (still dense enough for the effect).
 */
export const BoxesCore = ({ className }: { className?: string }) => {
  const rows = React.useMemo(() => new Array(50).fill(1), []);
  const cols = React.useMemo(() => new Array(40).fill(1), []);

  const colors = [
    "rgb(125 211 252)", // sky-300
    "rgb(249 168 212)", // pink-300
    "rgb(134 239 172)", // green-300
    "rgb(253 224 71)",  // yellow-300
    "rgb(252 165 165)", // red-300
    "rgb(216 180 254)", // purple-300
    "rgb(147 197 253)", // blue-300
    "rgb(165 180 252)", // indigo-300
    "rgb(196 181 253)", // violet-300
  ];

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      style={{
        transform:
          "translate(-40%, -60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)",
      }}
      className={cn(styles.grid, className)}
    >
      {rows.map((_, i) => (
        <motion.div key={`row-${i}`} className={styles.row}>
          {cols.map((_, j) => (
            <motion.div
              whileHover={{
                backgroundColor: getRandomColor(),
                transition: { duration: 0 },
              }}
              animate={{ transition: { duration: 2 } }}
              key={`col-${i}-${j}`}
              className={styles.cell}
            >
              {j % 2 === 0 && i % 2 === 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={styles.plus}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m6-6H6"
                  />
                </svg>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);
