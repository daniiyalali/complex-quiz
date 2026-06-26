"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import styles from "./corner-frame-animated-button.module.css";

type Props = {
  buttonText?: string;
  className?: string;
  href?: string;
  onClick?: () => void;
  /** Tailwind-style gradient utility name on the original — we map a few presets to module classes. */
  gradient?: "default" | "purple" | "orange" | "white" | "signal";
};

/**
 * Adapted from 21st.dev / Aceternity-style corner-frame button.
 * Four L-bracket corners at rest; on hover they fade out as a gradient
 * fills in behind the label.
 */
export function CornerFrameAnimatedButton({
  buttonText = "Hover Button",
  className,
  href,
  onClick,
  gradient = "purple",
}: Props) {
  const inner = (
    <>
      {/* corner brackets — 4 L-shapes drawn via 8 linear-gradient backgrounds */}
      <motion.span
        aria-hidden
        className={styles.brackets}
        variants={{ hover: { opacity: 0, transition: { duration: 0.2 } } }}
      />
      {/* hover gradient fill */}
      <motion.span
        aria-hidden
        className={cn(styles.fill, styles[`fill_${gradient}`])}
        initial={{ opacity: 0 }}
        variants={{
          hover: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
        }}
      />
      <motion.span
        className={styles.label}
        // Signal-green fill takes black type (house rule: black glyph on green)
        variants={{
          hover: {
            color: gradient === "signal" ? "#000" : "#fff",
            transition: { duration: 0.3 },
          },
        }}
      >
        {buttonText}
      </motion.span>
    </>
  );

  // Apple-style press: snappy down, springy release.
  const tapTransition = {
    type: "spring" as const,
    stiffness: 600,
    damping: 28,
    mass: 0.6,
  };

  if (href) {
    return (
      <motion.a
        href={href}
        onClick={onClick}
        className={cn(styles.btn, gradient === "signal" && styles.btnSignal, className)}
        whileHover="hover"
        whileTap="tap"
        variants={{ tap: { scale: 0.965 } }}
        transition={tapTransition}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(styles.btn, gradient === "signal" && styles.btnSignal, className)}
      whileHover="hover"
      whileTap="tap"
      variants={{ tap: { scale: 0.965 } }}
      transition={tapTransition}
    >
      {inner}
    </motion.button>
  );
}

export default CornerFrameAnimatedButton;
