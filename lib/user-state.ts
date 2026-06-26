"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cq:user-state:v2-firsttime";
const HARD_RELOAD_FLAG = "cq:hard-reload-pending";

export type BadgeUnlock = {
  name: string;
  color: string;
  description: string;
  iconPath: string;
};

export type UserState = {
  /**
   * Whether this session is signed in. Single source of truth for auth across
   * every surface (landing, cabinet, play, profile). NOTE: like all of
   * UserState this is wiped on any browser RELOAD (see the load effect below),
   * so every reload returns to a logged-out guest. Member / "played" states are
   * reached by acting in-session (sign in, play), via the landing StateSwitcher
   * (which persists and survives full-page navigation), or via `?as=` (see
   * `readPhaseOverride`).
   */
  loggedIn: boolean;
  /**
   * The @handle chosen right after first login (Complex.com registration →
   * redirected back here to claim a quiz handle, NOT Complex onboarding).
   * null until claimed; once set, the claim prompt never shows again.
   */
  handle: string | null;
  userStreak: number;
  userBestStreak: number;
  /** All-time count of days the user has played (drives "Total days played"). */
  userTotalDaysPlayed: number;
  userBadgeCount: number;
  /** 7 booleans Mon..Sun — true if the user played that day this week. */
  weeklyPlays: boolean[];
  /** 0..6 — which weekday is "today" (5 = Sat for the demo seed). */
  todayDayIndex: number;
  todayPlayed: boolean;
  streakIncrementedToday: boolean;
  badgeUnlockedToday: BadgeUnlock | null;
  /**
   * Badge ids earned from the FINAL daily leaderboard (Daily Crown #1,
   * Podium Finisher top-3) — decided after the day closes, so the winner
   * wasn't in-app. Surfaced the next day as a claimable notification on the
   * Badges section; each is played through the unlock animation, then cleared.
   */
  pendingBadges: string[];
};

export const DEFAULT_USER: UserState = {
  loggedIn: false,
  handle: null,
  userStreak: 0,
  userBestStreak: 0,
  userTotalDaysPlayed: 0,
  userBadgeCount: 0,
  weeklyPlays: [false, false, false, false, false, false, false],
  todayDayIndex: 5,
  todayPlayed: false,
  streakIncrementedToday: false,
  badgeUnlockedToday: null,
  pendingBadges: [],
};

/**
 * The three meaningful visitor phases, derived from two persisted axes
 * (loggedIn × todayPlayed). Use this everywhere instead of re-deriving the
 * boolean algebra. Landing vocabulary: member-ready = "returning",
 * member-played = "played".
 */
export type VisitorPhase = "guest" | "member-ready" | "member-played";

export function visitorPhase(
  u: Pick<UserState, "loggedIn" | "todayPlayed">,
): VisitorPhase {
  if (!u.loggedIn) return "guest";
  return u.todayPlayed ? "member-played" : "member-ready";
}

/**
 * Dev/demo override read from `?as=guest|member|played` in the URL. Returns a
 * UserState patch to apply on mount (or null when no param). Because it reads
 * the URL fresh each load, it survives the reload-reset — giving stable demo
 * entry points like `/?as=played` and `/play?as=member`. The "played" seed
 * includes streak/badge data so the streak + trophy UI has something to render.
 */
export function readPhaseOverride(): Partial<UserState> | null {
  if (typeof window === "undefined") return null;
  const as = new URLSearchParams(window.location.search).get("as");
  if (as === "guest") return { loggedIn: false, todayPlayed: false };
  if (as === "member")
    // A returning member with real history, so the streak panel renders like
    // the design (current 24 · best 32 · 48 played). Badge count is capped to
    // the catalog and earned-consistent: first-play + founding-player + 7-day
    // streak + the 5 skill/competitive families = 8 of 11 (no 30-day at 24d).
    return {
      loggedIn: true,
      todayPlayed: false,
      userStreak: 24,
      userBestStreak: 32,
      userTotalDaysPlayed: 48,
      userBadgeCount: 8,
      weeklyPlays: [true, true, true, true, true, false, false],
      todayDayIndex: 4,
      // Placed #1 + top-3 on yesterday's board → two badges waiting to claim.
      pendingBadges: ["daily-crown", "podium-finisher"],
    };
  if (as === "played")
    return {
      loggedIn: true,
      todayPlayed: true,
      userStreak: 12,
      userBestStreak: 12,
      userTotalDaysPlayed: 36,
      userBadgeCount: 3,
      weeklyPlays: [true, true, true, true, true, true, false],
    };
  return null;
}

/* Resolves a claimable leaderboard-badge id → the BadgeUnlock the unlock
   animation consumes. Used by the "claim badge" flow on the Badges section. */
export function badgeUnlockFor(id: string): BadgeUnlock | null {
  switch (id) {
    case "daily-crown":
      return {
        name: "DAILY CROWN",
        color: "#FFD60A",
        description: "You finished #1 on yesterday's leaderboard.",
        iconPath: "/figma/badges/daily-crown.png",
      };
    case "podium-finisher":
      return {
        name: "PODIUM FINISHER",
        color: "#FF9500",
        description: "You placed top 3 on yesterday's leaderboard.",
        iconPath: "/figma/badges/podium-finisher.png",
      };
    default:
      return null;
  }
}

export function badgeForStreak(streak: number): BadgeUnlock | null {
  if (streak === 7) return {
    name: "7-DAY STREAK",
    color: "#FF7300",
    description: "A week of momentum. Keep the fire going.",
    iconPath: "/figma/badges/streak-7.png",
  };
  if (streak === 30) return {
    name: "30-DAY STREAK",
    color: "#CEFF00",
    description: "A month deep. You're in rare air.",
    iconPath: "/figma/badges/streak-30.png",
  };
  if (streak === 100) return {
    name: "100-DAY STREAK",
    color: "#8B00FF",
    description: "A hundred days. Cultural authority earned.",
    iconPath: "/figma/badges/streak-100.png",
  };
  return null;
}

export function useUserState(): [UserState, (patch: Partial<UserState>) => void, () => void] {
  const [state, setState] = useState<UserState>(DEFAULT_USER);

  // Detect hard-reload keystrokes so the next mount can wipe localStorage.
  // Cmd/Ctrl+Shift+R, Ctrl+F5, and Shift+F5 are the standard shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const isHardReload =
        (e.shiftKey && (e.metaKey || e.ctrlKey) && k === "r") ||
        (k === "f5" && (e.ctrlKey || e.shiftKey));
      if (isHardReload) {
        try { sessionStorage.setItem(HARD_RELOAD_FLAG, "1"); } catch {}
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    try {
      // Any browser refresh (normal OR hard) starts the demo from scratch —
      // zero streak, zero badges. Navigation between routes via full page
      // loads keeps state (type === "navigate"); only "reload" wipes.
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const isReload =
        nav?.type === "reload" ||
        sessionStorage.getItem(HARD_RELOAD_FLAG) === "1";
      if (isReload) {
        sessionStorage.removeItem(HARD_RELOAD_FLAG);
        localStorage.removeItem(STORAGE_KEY);
        setState(DEFAULT_USER);
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT_USER, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const update = useCallback((patch: Partial<UserState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_USER);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return [state, update, reset];
}
