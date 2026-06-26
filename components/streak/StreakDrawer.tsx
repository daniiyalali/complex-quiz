"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { UserState } from "@/lib/user-state";
import { StreakSummary } from "./StreakSummary";
import { BadgeMark, type BadgeIconKind } from "@/components/badges/BadgeIcon";
import { BadgeCatalog } from "@/components/badges/BadgeCatalog";
import styles from "./StreakDrawer.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  user: UserState;
  /** Which view to land on each time the drawer opens — defaults to "summary". */
  initialView?: "summary" | "all";
};

type BadgeListItem = {
  name: string;
  icon: BadgeIconKind;
  earned: boolean;
  description: string;
  nextHint?: string;
};

const ALL_BADGES: BadgeListItem[] = [
  { name: "FIRST PLAY", icon: "first-play", earned: true, description: "Play your first quiz" },
  { name: "PERFECT SCORE", icon: "perfect-score", earned: true, description: "Score 5/5 on any quiz" },
  { name: "SPEED DEMON", icon: "speed-demon", earned: true, description: "Complete a perfect quiz under a time threshold" },
  { name: "7-DAY STREAK", icon: "streak-7", earned: false, description: "Play 7 consecutive days", nextHint: "NEXT" },
  { name: "30-DAY STREAK", icon: "streak-30", earned: false, description: "Play 30 consecutive days" },
  { name: "100-DAY STREAK", icon: "streak-100", earned: false, description: "Play 100 consecutive days" },
  { name: "365-DAY STREAK", icon: "streak-365", earned: false, description: "Play 365 consecutive days" },
  { name: "BACK-TO-BACK", icon: "back-to-back", earned: false, description: "Consecutive perfect-score days" },
  { name: "PODIUM FINISHER", icon: "podium-finisher", earned: false, description: "Finish top 3 on the global leaderboard" },
  { name: "DAILY CROWN", icon: "daily-crown", earned: false, description: "Finish #1 on the global leaderboard" },
  { name: "FOUNDING PLAYER", icon: "founding-player", earned: false, description: "Play within first 7 days post-launch" },
];

// Only the streak-milestone badges belong in this panel — the full set lives on
// the dedicated badges screen (reachable via "SEE ALL").
const STREAK_BADGES = ALL_BADGES.filter((b) => b.icon.startsWith("streak-"));

export function StreakDrawer({ open, onClose, user, initialView = "summary" }: Props) {
  const [view, setView] = useState<"summary" | "all">(initialView);
  const [isMobile, setIsMobile] = useState(false);
  // Gate the portal until after mount so the first client render matches the
  // server (both null) — otherwise the always-rendered drawer root trips a
  // hydration mismatch (and Next's dev error overlay) on every load.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ active: boolean; startY: number; lastY: number; lastT: number; velY: number }>({
    active: false,
    startY: 0,
    lastY: 0,
    lastT: 0,
    velY: 0,
  });

  // Track viewport bucket for drag-only-on-mobile behavior
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset view to the requested initial view every time the drawer reopens
  useEffect(() => {
    if (open) setView(initialView);
  }, [open, initialView]);

  // Body scroll lock + Esc + focus trap + focus restore
  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusable = () =>
      panel?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? null;

    // First-focus target — the close button is consistently first in document order
    requestAnimationFrame(() => {
      const items = focusable();
      items?.[0]?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Restore focus to whatever opened the drawer (the strip button)
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [open, onClose]);

  // Drag-to-dismiss — mobile only. Bound to the handle area at the top of the panel.
  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    dragRef.current = {
      active: true,
      startY: e.clientY,
      lastY: e.clientY,
      lastT: Date.now(),
      velY: 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (panelRef.current) panelRef.current.style.transition = "none";
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    const now = Date.now();
    const dt = now - dragRef.current.lastT;
    if (dt > 0) dragRef.current.velY = (e.clientY - dragRef.current.lastY) / dt;
    dragRef.current.lastY = e.clientY;
    dragRef.current.lastT = now;
    if (panelRef.current) panelRef.current.style.transform = `translateY(${dy}px)`;
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    const vel = dragRef.current.velY;
    dragRef.current.active = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (panelRef.current) {
      panelRef.current.style.transform = "";
      panelRef.current.style.transition = "";
    }
    // v3 §11 — Release past 40% of panel height → dismiss; else snap back.
    const panelHeight = panelRef.current?.offsetHeight ?? window.innerHeight * 0.68;
    if (dy > panelHeight * 0.4 || vel > 0.7) onClose();
  };

  if (!mounted || typeof document === "undefined") return null;

  const badgeProgress = Math.min(user.userStreak, 7);
  const fillPct = (badgeProgress / 7) * 100;
  const daysRemaining = Math.max(0, 7 - badgeProgress);

  return createPortal(
    <div className={`${styles.root} ${open ? styles.rootOpen : ""}`} aria-hidden={!open}>
      <div className={styles.overlay} onClick={onClose} />

      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Streak and badges"
      >
        <div
          className={styles.handleHit}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div className={styles.handle} aria-hidden />
        </div>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {view === "all" ? "ALL BADGES" : "STREAK & BADGES"}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles.sep} />

        {view === "summary" ? (
          <div className={styles.summaryScroll}>
            <StreakSummary user={user} onSeeAllBadges={() => setView("all")} />
          </div>
        ) : (
          <>
            <button
              type="button"
              className={styles.allBack}
              onClick={() => setView("summary")}
            >
              ← STREAK
            </button>
            <div className={styles.allScroll}>
              <BadgeCatalog user={user} />
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function BadgeChip({
  icon,
  label,
  description,
  locked,
  nextHint,
  size = 72,
}: {
  icon: BadgeIconKind;
  label: string;
  description?: string;
  locked?: boolean;
  nextHint?: string;
  size?: number;
}) {
  return (
    <div className={styles.badgeChip}>
      {locked && nextHint && <div className={styles.badgeNextPill}>{nextHint}</div>}
      {/* BadgeMark applies the same per-PNG bounding-box measurement the
          ProfilePanel badge grid uses, so every badge reads at a uniform
          visual size regardless of the artwork's transparent padding. */}
      <div
        className={`${styles.badgeMarkWrap} ${locked ? styles.badgeMarkLocked : ""}`}
        style={{ width: size, height: size }}
      >
        <BadgeMark icon={icon} size={size} />
      </div>
      <div className={styles.badgeName}>{label}</div>
      {description && <div className={styles.badgeDesc}>{description}</div>}
    </div>
  );
}
