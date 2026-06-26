"use client";

import React from "react";

interface GooeyFilterProps {
  id?: string;
  strength?: number;
}

/**
 * Verbatim from the 21st.dev prompt.
 * SVG filter that gaussian-blurs the source then thresholds via colormatrix —
 * adjacent blobs merge into a single "gooey" shape.
 */
export const GooeyFilter: React.FC<GooeyFilterProps> = ({
  id = "goo-filter",
  strength = 10,
}) => {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden
    >
      <defs>
        <filter id={id}>
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={strength}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
};
