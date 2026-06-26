"use client";

import { useEffect, useState } from "react";

const BREAKPOINTS: Record<string, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export interface ScreenSize {
  width: number;
  height: number;
  lessThan: (bp: keyof typeof BREAKPOINTS | string) => boolean;
  greaterThan: (bp: keyof typeof BREAKPOINTS | string) => boolean;
}

export function useScreenSize(): ScreenSize {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return {
    width: size.width,
    height: size.height,
    lessThan: (bp) => size.width < (BREAKPOINTS[bp] ?? 768),
    greaterThan: (bp) => size.width > (BREAKPOINTS[bp] ?? 768),
  };
}
