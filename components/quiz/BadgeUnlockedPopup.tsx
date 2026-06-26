"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BadgeUnlock } from "@/lib/user-state";
import { BadgeSparks } from "./BadgeSparks";
import { LightRays } from "./LightRays";
import { PixelBlast } from "./PixelBlast";
import styles from "./BadgeUnlockedPopup.module.css";

type Props = {
  badge: BadgeUnlock;
  onContinue: () => void;
  newStreak?: number;
  /** Trial backdrop variant. `"rays"` = volumetric light rays, `"pixels"` =
   *  Bayer-dithered pixel blast. Both dim the popup backdrop so the WebGL
   *  layer shows through. Default unset → standard solid dark backdrop. */
  backdrop?: "rays" | "pixels";
  /** Continue-button label. Defaults to the end-of-quiz "SEE RESULTS →". */
  continueLabel?: string;
  /** Force a near-opaque scrim even with a WebGL backdrop — for surfaces that
   *  aren't already dark (e.g. the claim flow over the bright home cabinet). */
  solidScrim?: boolean;
};

/**
 * Orchestration state — each step is a boolean flag that turns on once.
 * Using a single reducer avoids stale-closure bugs across all the timeouts.
 */
type OState = {
  chip: boolean;       // Step 1  — "BADGE UNLOCKED" chip
  badge: boolean;      // Step 2  — badge entrance transform
  burst1: number;      // Step 3  — initial spark burst key (non-zero = fire)
  flash: boolean;      // Step 4  — haptic white flash
  burst2: number;      // Step 4  — landing spark burst key
  rings: boolean;      // Step 5  — ring pulses
  glow: boolean;       // Step 6  — resting glow
  infoCard: boolean;   // Step 7  — info card slide-up
  button: boolean;     // Step 8  — continue button fade-in
};

type OAction =
  | { type: "CHIP" }
  | { type: "BADGE_AND_BURST1" }
  | { type: "LAND" }
  | { type: "INFO_CARD" }
  | { type: "BUTTON" }
  | { type: "FLASH_END" };

function reduce(s: OState, a: OAction): OState {
  switch (a.type) {
    case "CHIP":
      return { ...s, chip: true };
    case "BADGE_AND_BURST1":
      return { ...s, badge: true, burst1: Date.now() };
    case "LAND":
      return { ...s, flash: true, burst2: Date.now() + 1, rings: true, glow: true };
    case "FLASH_END":
      return { ...s, flash: false };
    case "INFO_CARD":
      return { ...s, infoCard: true };
    case "BUTTON":
      return { ...s, button: true };
    default:
      return s;
  }
}

const INIT: OState = {
  chip: false,
  badge: false,
  burst1: 0,
  flash: false,
  burst2: 0,
  rings: false,
  glow: false,
  infoCard: false,
  button: false,
};

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/[\s-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function BadgeUnlockedPopup({
  badge,
  onContinue,
  newStreak,
  backdrop,
  continueLabel,
  solidScrim,
}: Props) {
  const hasBackdrop = backdrop === "rays" || backdrop === "pixels";
  const [mounted, setMounted] = useState(false);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [orch, dispatch] = useReducer(reduce, INIT);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /**
   * Dismiss with an exit transition before unmount. Critical for iOS Safari:
   * the `.backdrop` uses `backdrop-filter: blur(...)`, and removing such a
   * node from the DOM in one frame leaves a stale rasterized blur layer
   * ("ghost dim") painted over whatever renders next — only a forced
   * recomposite (e.g. a resize) clears it. By fading the backdrop's opacity
   * to 0 and dropping the filter *while still mounted* (`.closing`), Safari
   * repaints the de-blurred region first; the actual unmount a frame later
   * removes an already-transparent node, so no ghost remains.
   */
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    // A pure opacity fade carries no vestibular motion, so it's safe under
    // reduced-motion — and we still need the in-DOM repaint to kill the
    // Safari backdrop-filter ghost. Same path for everyone.
    setClosing(true);
    timersRef.current.push(setTimeout(onContinue, 280));
  }, [onContinue]);

  // Keyboard + body-scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") requestClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [requestClose]);

  // Mount gate (portal needs document)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Orchestration — fires once on mount
  useEffect(() => {
    if (!mounted) return;
    const timers = timersRef.current;

    if (reducedMotion) {
      // Instantly reveal everything — no animation, no particles
      dispatch({ type: "CHIP" });
      dispatch({ type: "BADGE_AND_BURST1" });
      dispatch({ type: "LAND" });
      dispatch({ type: "INFO_CARD" });
      dispatch({ type: "BUTTON" });
      return;
    }

    // Step 1: chip at 200ms
    timers.push(setTimeout(() => dispatch({ type: "CHIP" }), 200));

    // Steps 2+3: badge entrance + first spark burst at 380ms.
    // Entrance now runs 820ms so the 360° rotation reads clearly at scale.
    timers.push(setTimeout(() => dispatch({ type: "BADGE_AND_BURST1" }), 380));

    // Steps 4+5+6: landing flash, second burst, rings, glow ~91% through
    // entrance → 380 + 820 × 0.91 ≈ 1126ms.
    timers.push(setTimeout(() => dispatch({ type: "LAND" }), 1130));

    // Flash only lasts 45ms
    timers.push(setTimeout(() => dispatch({ type: "FLASH_END" }), 1175));

    // Step 7: info card slides up shortly after the rings begin dissipating
    timers.push(setTimeout(() => dispatch({ type: "INFO_CARD" }), 1320));

    // Step 8: continue button — fades in after the info card has settled
    timers.push(setTimeout(() => dispatch({ type: "BUTTON" }), 2200));

    return () => {
      timers.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [mounted, reducedMotion]);

  if (typeof document === "undefined") return null;

  // Badge entrance: scale-up + 360° rotateY combined, slowed to 820ms so the
  // rotation reads at intermediate scales rather than blurring through during
  // the tiny-to-full grow. Spring-bounce overshoots scale to ~1.06 and rotation
  // briefly past 360° for physical weight before settling.
  const badgeEntranceStyle: React.CSSProperties = orch.badge
    ? {
        opacity: 1,
        transform: "perspective(900px) scale(1.0) rotateY(360deg)",
        transition: reducedMotion
          ? "none"
          : `opacity 80ms var(--spring-clean),
             transform 820ms var(--spring-bounce)`,
      }
    : {
        opacity: 0,
        transform: "perspective(900px) scale(0.06) rotateY(0deg)",
      };

  // Outer glow only — the visible border is rendered by `.badgeRing`'s
  // rotating conic gradient. Diffused white halo (pink palette retired).
  const glowStyle: React.CSSProperties = orch.glow
    ? {
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.20), 0 0 26px 8px rgba(255,255,255,0.16)",
        transition: reducedMotion ? "none" : "box-shadow 380ms ease-out",
      }
    : {
        boxShadow: "0 0 14px 4px rgba(255,255,255,0.18)",
        transition: "none",
      };

  const flashStyle: React.CSSProperties = {
    background: orch.flash
      ? "rgba(255,255,255,0.055)"
      : "rgba(255,255,255,0)",
    transition: orch.flash ? "none" : "background 45ms linear",
  };

  return createPortal(
    <div
      className={`${styles.root} ${mounted ? styles.mounted : ""} ${
        hasBackdrop ? styles.rootBackdrop : ""
      } ${solidScrim ? styles.rootSolidScrim : ""} ${closing ? styles.closing : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="New badge unlocked"
    >
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={requestClose} aria-hidden />

      {/* Trial: WebGL backdrop. `pointer-events: none` on the layer so the
          dismiss-backdrop beneath still receives clicks. */}
      {hasBackdrop && !reducedMotion && (
        <div className={styles.bgLayer} aria-hidden>
          {backdrop === "rays" && (
            <LightRays
              raysOrigin="top-center"
              raysColor="#FFFFFF"
              raysSpeed={1.4}
              lightSpread={0.85}
              rayLength={1.4}
              pulsating
              fadeDistance={1.3}
              saturation={1.0}
              followMouse={false}
              mouseInfluence={0}
              noiseAmount={0.05}
              distortion={0.04}
            />
          )}
          {backdrop === "pixels" && (
            <PixelBlast
              variant="circle"
              color="#FFFFFF"
              pixelSize={6}
              patternScale={3}
              patternDensity={1.2}
              pixelSizeJitter={0.5}
              enableRipples
              rippleSpeed={0.4}
              rippleThickness={0.12}
              rippleIntensityScale={1.5}
              liquid={false}
              speed={0.6}
              edgeFade={0.25}
              transparent
            />
          )}
        </div>
      )}

      {/* Centered content */}
      <div className={styles.content}>
        {/* Step 1 — BADGE UNLOCKED chip */}
        <div
          className={`${styles.chip} ${orch.chip ? styles.chipVisible : ""}`}
          aria-live="polite"
        >
          BADGE UNLOCKED
        </div>

        {/* Steps 2–6 — Badge stage with rings, sparks, flash */}
        <div className={styles.badgeStage}>
          {/* Ring 1 */}
          {!reducedMotion && (
            <div
              className={`${styles.ring1} ${orch.rings ? styles.ring1Active : ""}`}
              aria-hidden
            />
          )}
          {/* Ring 2 */}
          {!reducedMotion && (
            <div
              className={`${styles.ring2} ${orch.rings ? styles.ring2Active : ""}`}
              aria-hidden
            />
          )}

          {/* Canvas particle system */}
          {!reducedMotion && (
            <BadgeSparks
              originX={110}
              originY={110}
              burst1Key={orch.burst1}
              burst2Key={orch.burst2}
            />
          )}

          {/* Isolator disk — solid dark backdrop just outside the badge so
              the WebGL pixel pattern doesn't visually bleed into the art. */}
          <div className={styles.badgeIsolator} aria-hidden />

          {/* Rotating magenta gradient ring — continuous 360° spin. */}
          <div className={styles.badgeRing} aria-hidden />

          {/* Badge circle container — flash + glow wrappers */}
          <div
            className={styles.badgeCircle}
            style={{ ...glowStyle, ...flashStyle }}
          >
            <div
              className={styles.badgeEntrance}
              style={badgeEntranceStyle}
            >
              {/* For FIRST PLAY: looping 3D turntable video (webm + mp4
                  fallback). For other badges: the static PNG. The video
                  loops naturally, providing the constant rotation after
                  the entrance animation lands. */}
              {badge.name === "FIRST PLAY" ? (
                <video
                  className={styles.badgeMedia}
                  poster="/figma/badges/first-play.png"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  aria-label={badge.name}
                >
                  <source
                    src="/figma/badges/first-play-3d.webm"
                    type="video/webm"
                  />
                  <source
                    src="/figma/badges/first-play-3d.mp4"
                    type="video/mp4"
                  />
                </video>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={badge.iconPath || "/figma/badges/first-play.png"}
                  alt={badge.name}
                  className={styles.badgeMedia}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/figma/badges/first-play.png";
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Step 7 — Info card */}
        <div
          className={`${styles.infoCard} ${orch.infoCard ? styles.infoCardVisible : ""}`}
        >
          <p className={styles.badgeName}>{toTitleCase(badge.name)}</p>
          <p className={styles.badgeDesc}>{badge.description}</p>

          <div className={styles.divider} aria-hidden />

          <div className={styles.chipRow}>
            {/* Streak only — the date chip added nothing (user call 2026-06-11).
                Orange = the streak/fire signal. */}
            {typeof newStreak === "number" && newStreak > 0 && (
              <div className={styles.statChip}>
                <span className={styles.statNum} style={{ color: "var(--streak)" }}>
                  {newStreak}
                </span>
                <span className={styles.statLabel}>STREAK</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 8 — Continue button */}
        <button
          type="button"
          className={`${styles.continueBtn} ${orch.button ? styles.continueBtnVisible : ""}`}
          onClick={requestClose}
        >
          {continueLabel ?? "SEE RESULTS →"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
