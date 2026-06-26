"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import styles from "./BottomSheet.module.css";

type Mode = "peek-full" | "modal";

type Props = {
  mode: Mode;
  /** controlled — used in "modal" mode */
  open?: boolean;
  /** "modal" dismiss */
  onClose?: () => void;
  /** "peek-full" telemetry */
  onSnap?: (state: "peek" | "full") => void;
  /** Counter that, when incremented by the parent, snaps the sheet to "full". Only meaningful in peek-full mode. */
  requestFull?: number;
  /** how many px of the sheet are visible in peek state */
  peekHeight?: number;
  /** full-state height as % of viewport */
  fullHeightVh?: number;
  initialState?: "peek" | "full";
  /** optional header element above the body */
  header?: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
};

const SNAP_SPRING = { type: "spring" as const, stiffness: 380, damping: 38 };
const VELOCITY_THRESHOLD = 500;

export function BottomSheet({
  mode,
  open = true,
  onClose,
  onSnap,
  requestFull,
  peekHeight = 280,
  fullHeightVh = 90,
  initialState = "peek",
  header,
  children,
  ariaLabel,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [logicalState, setLogicalState] = useState<"peek" | "full" | "closed">(
    mode === "modal" ? "closed" : initialState,
  );

  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  /* viewport-derived measurements (recomputed on resize) */
  const [vh, setVh] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerHeight : 800,
  );
  useEffect(() => {
    setMounted(true);
    const onResize = () => setVh(window.innerHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fullPx = (vh * fullHeightVh) / 100;
  const peekOffset = Math.max(0, fullPx - peekHeight);
  const closedOffset = fullPx + 40;

  const targets: Record<"peek" | "full" | "closed", number> = {
    full: 0,
    peek: peekOffset,
    closed: closedOffset,
  };

  /* sync `open` prop -> state in modal mode */
  useEffect(() => {
    if (mode !== "modal") return;
    setLogicalState(open ? "full" : "closed");
  }, [open, mode]);

  /* parent-driven snap-to-full in peek-full mode */
  useEffect(() => {
    if (mode !== "peek-full") return;
    if (requestFull === undefined) return;
    setLogicalState("full");
  }, [requestFull, mode]);

  /* animate y to the current logical state */
  useEffect(() => {
    if (!mounted) return;
    const ctrl = animate(y, targets[logicalState], SNAP_SPRING);
    return () => ctrl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logicalState, mounted, peekOffset, fullPx, closedOffset]);

  /* set initial position immediately on mount so we don't flash full */
  useLayoutEffect(() => {
    if (!mounted) return;
    y.set(targets[logicalState]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  /* notify caller of snap transitions in peek-full */
  useEffect(() => {
    if (mode === "peek-full" && (logicalState === "peek" || logicalState === "full")) {
      onSnap?.(logicalState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logicalState]);

  /* Esc closes modal */
  useEffect(() => {
    if (mode !== "modal" || logicalState !== "full") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, logicalState, onClose]);

  /* body scroll lock when modal is fully open */
  useEffect(() => {
    if (mode !== "modal") return;
    if (logicalState === "full") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mode, logicalState]);

  /* Scrim only dims for the final approach to FULL. It stays fully transparent
     across the entire peek + lower-expand range, so the main screen reads at
     full brightness on landing (peek) and the leaderboard is visible from the
     start with no cover over the cabinet. Modal mode dims the whole way. */
  const scrimRange = mode === "modal" ? [0, peekOffset] : [0, peekOffset * 0.35];
  const scrimOpacity = useTransform(
    y,
    scrimRange,
    [mode === "modal" ? 0.7 : 0.55, 0],
  );
  const scrimPointer = useTransform(scrimOpacity, (v) => (v > 0.05 ? "auto" : "none"));

  function handleDragEnd(_: PointerEvent | TouchEvent | MouseEvent, info: PanInfo) {
    const currentY = y.get();
    const velocity = info.velocity.y;
    if (mode === "peek-full") {
      const midpoint = peekOffset / 2;
      const goPeek = velocity > VELOCITY_THRESHOLD || currentY > midpoint;
      setLogicalState(goPeek ? "peek" : "full");
    } else {
      const dismissed = velocity > VELOCITY_THRESHOLD || currentY > peekHeight;
      if (dismissed) {
        onClose?.();
      } else {
        setLogicalState("full");
      }
    }
  }

  function handleHandleTap() {
    if (mode === "peek-full") {
      setLogicalState((s) => (s === "peek" ? "full" : "peek"));
    } else {
      onClose?.();
    }
  }

  function startDrag(e: React.PointerEvent) {
    // If the body content is scrolled, let it scroll instead of dragging the sheet
    if (bodyRef.current && bodyRef.current.scrollTop > 0) return;
    dragControls.start(e);
  }

  if (!mounted) return null;

  const sheetContent = (
    <>
      <motion.div
        className={styles.scrim}
        style={{ opacity: scrimOpacity, pointerEvents: scrimPointer }}
        onClick={() => {
          if (mode === "peek-full") setLogicalState("peek");
          else onClose?.();
        }}
        aria-hidden
      />
      <motion.div
        className={styles.sheet}
        style={{ y, height: `${fullHeightVh}vh` }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={{ top: 0, bottom: closedOffset }}
        dragElastic={{ top: 0.04, bottom: 0.06 }}
        onDragEnd={handleDragEnd}
        role="dialog"
        aria-modal={mode === "modal"}
        aria-label={ariaLabel}
      >
        <div
          className={styles.handleZone}
          onPointerDown={startDrag}
          onClick={handleHandleTap}
          role="button"
          tabIndex={0}
          aria-label={
            mode === "modal"
              ? "Close"
              : logicalState === "peek"
                ? "Expand leaderboard"
                : "Collapse leaderboard"
          }
        >
          <span className={styles.handleBar} aria-hidden />
          {mode === "peek-full" && logicalState === "peek" && (
            <span className={styles.handleChevron} aria-hidden>
              ▲
            </span>
          )}
        </div>

        {mode === "modal" && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => onClose?.()}
            aria-label="Close"
          >
            ×
          </button>
        )}

        {header && <div className={styles.titleRow}>{header}</div>}

        <div className={styles.body} ref={bodyRef}>
          {children}
        </div>
      </motion.div>
    </>
  );

  return createPortal(sheetContent, document.body);
}
