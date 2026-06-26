"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flame, X } from "lucide-react";
import { QuizPrefs, YOU_AVATAR } from "@/lib/quiz-data";
import { BadgeCatalog } from "@/components/badges/BadgeCatalog";
import { StreakSummary } from "@/components/streak/StreakSummary";
import { ProfileBadges } from "./ProfileBadges";
import { AuthModal } from "@/components/quiz/AuthModal";
import { useUserState } from "@/lib/user-state";
import styles from "./ProfilePanel.module.css";

const DEFAULT_PREFS: QuizPrefs = {
  loggedIn: true,
  hasPlayed: true,
  streakDays: 12,
  finalRank: 47,
  scoreCorrect: 4,
  badge: "perfect",
};

// Demo profile data (no points/history in state — synthesized like the old "87").
const QUIZZES_PLAYED = 87;
// Quiz history is collapsed to a preview; "Show all" reveals the rest.
const HISTORY_PREVIEW = 7;
type HistoryRow = { date: string; score: number; total: number; time: string; rank: number };
/* RULE — Quiz History is a log of PLAYED ATTEMPTS ONLY, newest first. Missed
   days are OMITTED (never shown as "no attempt" rows); the streak calendar
   (MonthlyStreakCard) is what surfaces missed days, in red. Date gaps here are
   expected and normal (e.g. Jun 4 → Jun 2 skips an unplayed Jun 3). When wired
   to real data: `attempts.filter(a => a.played).sort(desc by date)`. */
const QUIZ_HISTORY: HistoryRow[] = [
  { date: "Jun 9", score: 5, total: 5, time: "31.4s", rank: 13 },
  { date: "Jun 8", score: 5, total: 5, time: "21.5s", rank: 22 },
  { date: "Jun 7", score: 5, total: 5, time: "24.1s", rank: 62 },
  { date: "Jun 6", score: 5, total: 5, time: "21.5s", rank: 46 },
  { date: "Jun 5", score: 5, total: 5, time: "27.4s", rank: 10 },
  { date: "Jun 4", score: 3, total: 5, time: "31.5s", rank: 76 },
  { date: "Jun 2", score: 5, total: 5, time: "35.3s", rank: 21 },
  { date: "Jun 1", score: 3, total: 5, time: "34.2s", rank: 93 },
  { date: "May 31", score: 4, total: 5, time: "38.1s", rank: 27 },
  { date: "May 30", score: 5, total: 5, time: "44.3s", rank: 19 },
  { date: "May 29", score: 3, total: 5, time: "35.1s", rank: 66 },
  { date: "May 28", score: 5, total: 5, time: "31.6s", rank: 24 },
  { date: "May 27", score: 5, total: 5, time: "23.9s", rank: 36 },
  { date: "May 26", score: 4, total: 5, time: "26.3s", rank: 31 },
];

/** Another player's board entry, promoted to a full profile view. */
export type PlayerProfile = {
  name: string;
  avatar: string;
  rank: number;
  correct: number;
  time: string;
};

/* Deterministic demo data for another player's profile (seeded by rank — no
   randomness, so SSR/client and repeat visits always match). The streak
   formula mirrors the old mini-popup so numbers stay consistent. */
function synthPlayer(p: PlayerProfile) {
  const streak = ((p.rank * 3) % 30) + 2;
  const best = streak + ((p.rank * 7) % 12);
  const played = 24 + ((p.rank * 13) % 70);
  const dates = ["Today", "Jun 9", "Jun 8", "Jun 7", "Jun 5", "Jun 4", "Jun 2", "Jun 1", "May 30", "May 29"];
  const history: HistoryRow[] = dates.map((date, i) => {
    if (i === 0) return { date, score: p.correct, total: 5, time: p.time, rank: p.rank };
    return {
      date,
      score: 3 + ((p.rank + i * 2) % 3),
      total: 5,
      time: `${21 + ((p.rank * (i + 3)) % 24)}.${(p.rank + i) % 10}s`,
      rank: 5 + ((p.rank * (i + 2)) % 90),
    };
  });
  return { streak, best, played, history };
}

export function ProfilePanel({
  player,
  onBack,
}: {
  /** When set, renders that player's public profile (read-only) instead of your own. */
  player?: PlayerProfile;
  /** Back affordance shown in the header (player mode) — returns to the leaderboard. */
  onBack?: () => void;
} = {}) {
  const prefs = DEFAULT_PREFS;
  const [user, updateUser] = useUserState();
  const [name, setName] = useState("COMPLEX USER");
  const [editing, setEditing] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string>(YOU_AVATAR);
  const [authOpen, setAuthOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  // On mobile the profile lives in a bottom sheet, so "See all badges" navigates
  // in-sheet (with a back affordance) rather than opening a centred modal.
  const [badgeView, setBadgeView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const handleSeeAllBadges = () => (isMobile ? setBadgeView(true) : setCatalogOpen(true));

  const synth = player ? synthPlayer(player) : null;

  // Guests get a locked teaser — the full profile stays mounted but blurred
  // behind a sign-in overlay, so they see exactly what they're missing.
  // Other players' profiles are public: never locked.
  const locked = !user.loggedIn && !player;

  // One set of display values feeds the same UI for both modes.
  const statStreak = synth ? synth.streak : user.userStreak;
  const statPlayed = synth ? synth.played : QUIZZES_PLAYED;
  const statBest = synth ? synth.best : user.userBestStreak;
  const history = synth ? synth.history : QUIZ_HISTORY;
  const gridUser = synth ? { ...user, userStreak: synth.streak, loggedIn: true } : user;
  const gridStreakDays = synth ? synth.streak : prefs.streakDays;
  // Players only get the "perfect" session badge if today's run was 5/5.
  const gridEarnedKey = player ? (player.correct === 5 ? "perfect" : "none") : prefs.badge;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarSrc(URL.createObjectURL(file));
  };

  return (
    <div className={styles.panel}>
      {badgeView ? (
        <>
          <header className={`${styles.railHead} ${styles.railHeadRow}`}>
            <button type="button" className={styles.backBtn} onClick={() => setBadgeView(false)}>
              <span className={styles.backChip} aria-hidden>←</span>
              <span className={styles.backLabel}>All badges</span>
            </button>
          </header>
          <div className={styles.scroll}>
            <BadgeCatalog user={gridUser} />
          </div>
        </>
      ) : (
      <>
      {/* Mirrors the Leaderboard header: title left, boxed toggle top-right. */}
      <header className={`${styles.railHead} ${onBack ? styles.railHeadRow : ""}`}>
        <span className={styles.railTitle}>Profile</span>
        {onBack && (
          <button type="button" className={styles.headBackBtn} onClick={onBack}>
            <span aria-hidden>←</span> Back to leaderboard
          </button>
        )}
      </header>

      {locked && (
        <div className={styles.lockOverlay}>
          <span className={styles.lockGlyph} aria-hidden>
            <LockIcon />
          </span>
          <h3 className={styles.lockHeadline}>Start your profile</h3>
          <p className={styles.lockSub}>
            Sign in to build a streak, earn badges, and claim your spot on the board.
          </p>
          <button className={styles.lockCta} onClick={() => setAuthOpen(true)}>
            Sign in
          </button>
        </div>
      )}

      {!player && (
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          headline="Start your profile"
          sub="Sign in to build a streak, earn badges, and claim your spot on the board."
          onAuthed={() => updateUser({ loggedIn: true })}
        />
      )}

      {catalogOpen &&
        createPortal(
          <div
            role="presentation"
            onClick={() => setCatalogOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 500,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="All badges"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(560px, 100%)",
                maxHeight: "86vh",
                display: "flex",
                flexDirection: "column",
                background: "var(--surface, #1c1c1e)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px 12px",
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", color: "#fff" }}>
                  All badges
                </span>
                <button
                  type="button"
                  onClick={() => setCatalogOpen(false)}
                  aria-label="Close"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--surface-2, #2c2c2e)",
                    border: 0,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
              <div style={{ overflowY: "auto", padding: "0 20px 24px" }}>
                <BadgeCatalog user={gridUser} />
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className={`${styles.scroll} ${locked ? styles.blurred : ""}`} aria-hidden={locked}>
        <div className={styles.idRow}>
          {player ? (
            <span className={styles.avatarWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={player.avatar} alt="" className={styles.avatar} />
            </span>
          ) : (
            <label className={styles.avatarWrap} aria-label="Change profile picture">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSrc} alt="" className={styles.avatar} />
              <span className={styles.avatarEdit} aria-hidden>
                <PencilIcon size={12} />
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className={styles.fileInput}
              />
            </label>
          )}
          <div className={styles.idBody}>
            {player ? (
              <div className={styles.nameWrap}>
                <div className={styles.name}>{player.name}</div>
              </div>
            ) : editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                onBlur={() => setEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditing(false);
                }}
                autoFocus
                className={styles.nameInput}
              />
            ) : (
              <div className={styles.nameWrap}>
                <div className={styles.name}>{name}</div>
                <button
                  onClick={() => setEditing(true)}
                  className={styles.editBtn}
                  aria-label="Edit name"
                >
                  <PencilIcon size={14} />
                </button>
              </div>
            )}
            <div className={styles.joined}>
              {player
                ? `RANK #${player.rank} TODAY · ${player.correct}/5 · ${player.time}`
                : "Joined May 2026"}
            </div>
          </div>
        </div>

        {/* Own profile: the full streak panel (hero + calendar + badges).
            Another player's public profile is lighter — just the badges they've
            unlocked, then their quiz history (Zack, 2026-06-18). */}
        {player ? (
          <ProfileBadges player={player} streakDays={synth?.streak ?? prefs.streakDays} />
        ) : (
          <StreakSummary user={gridUser} onSeeAllBadges={handleSeeAllBadges} />
        )}

        <section className={styles.historyBlock}>
          <span className={styles.historyTitle}>Quiz history</span>
          <div className={styles.historyTable}>
            <div className={`${styles.historyRow} ${styles.historyHead}`}>
              <span>DATE</span>
              <span>SCORE</span>
              <span>TIME</span>
              <span className={styles.historyRankCol}>RANK</span>
            </div>
            {(showAllHistory ? history : history.slice(0, HISTORY_PREVIEW)).map((h, i) => {
              const perfect = h.score === h.total;
              return (
                <div key={i} className={styles.historyRow}>
                  <span className={styles.historyDate}>{h.date}</span>
                  <span className={`${styles.historyScore} ${perfect ? styles.historyScorePerfect : ""}`}>
                    {h.score}/{h.total}
                    {perfect && <Flame size={12} className={styles.historyFire} aria-hidden />}
                  </span>
                  <span className={styles.historyTime}>{h.time}</span>
                  <span className={styles.historyRankCol}>#{h.rank}</span>
                </div>
              );
            })}
          </div>
          {history.length > HISTORY_PREVIEW && (
            <button
              type="button"
              className={styles.historyMore}
              onClick={() => setShowAllHistory((v) => !v)}
            >
              {showAllHistory ? "Show less" : `Show all ${history.length}`}
            </button>
          )}
        </section>

        {!player && (
          <div className={styles.privacyRow}>
            <div>
              <div className={styles.privacyLabel}>Private leaderboard</div>
              <div className={styles.privacySub}>
                Opt out of global rankings
              </div>
            </div>
            <button
              onClick={() => setPrivacy((p) => !p)}
              className={`${styles.toggle} ${privacy ? styles.toggleOn : ""}`}
              aria-pressed={privacy}
            >
              <div className={styles.toggleDot} />
            </button>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function LockIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: "block" }}>
      <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.83l-1.17-1.17a2 2 0 0 0-2.83 0L4 16v4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
