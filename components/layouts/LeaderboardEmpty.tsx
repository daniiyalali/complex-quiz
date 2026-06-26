"use client";

import { useState } from "react";
import { AuthModal } from "@/components/quiz/AuthModal";
import { useUserState } from "@/lib/user-state";
import styles from "./LeaderboardEmpty.module.css";

/* Empty-board body for the home leaderboard (sidebar + mobile sheet): ghost
   podium + "be first" + auth-split CTA. Mirrors LeaderboardPanel's empty state.
   Shown for a first-time visitor / early board (no one's played yet). */

const SLOTS = [2, 1, 3]; // visual order: 02 · 01 · 03

export function LeaderboardEmpty() {
  const [authOpen, setAuthOpen] = useState(false);
  const [, updateUser] = useUserState();
  return (
    <div className={styles.wrap}>
      <div className={styles.podium}>
        {SLOTS.map((n) => (
          <div key={n} className={`${styles.col} ${n === 1 ? styles.colGold : ""}`}>
            <span className={styles.rank}>0{n}</span>
            <div className={styles.avatar}>{n === 1 ? "?" : ""}</div>
            <span className={styles.name}>Open</span>
            <div className={styles.ped} style={{ height: n === 1 ? 70 : n === 2 ? 50 : 40 }} />
          </div>
        ))}
      </div>
      <div className={styles.msg}>
        <div className={styles.title}>No one&apos;s on the board yet.</div>
        <div className={styles.sub}>{"Be first. The day's wide open."}</div>
        <button className={styles.cta} onClick={() => setAuthOpen(true)}>
          Sign in to claim #1
        </button>
      </div>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        headline="Claim your spot"
        sub="Sign in to get on the board, track your streak, and earn badges."
        onAuthed={() => updateUser({ loggedIn: true })}
      />
    </div>
  );
}
