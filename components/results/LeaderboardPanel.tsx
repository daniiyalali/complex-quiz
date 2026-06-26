"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown } from "lucide-react";
import {
  buildLeaderboard,
  lbAvatar,
  YOU_AVATAR,
} from "@/lib/quiz-data";
import { AuthModal } from "@/components/quiz/AuthModal";
import { ProfilePanel } from "@/components/results/ProfilePanel";
import { useUserState } from "@/lib/user-state";
import styles from "./LeaderboardPanel.module.css";

type Period = "TODAY" | "WEEK" | "ALLTIME";
/** Board population — empty/sparse are realistic only early-day on TODAY. */
type BoardView = "full" | "sparse" | "empty";

const PERIOD_LABELS: Record<Period, string> = {
  TODAY: "Today",
  WEEK: "This Week",
  ALLTIME: "All-Time",
};

const YOU_RANK = 47;
const YOU_SCORE = "1/5";
const YOU_TIME = "9s";
const YOU_NAME = "ANUSHA KHALID";

const PODIUM_SLOTS = [1, 0, 2] as const; // visual order: 2nd · 1st · 3rd

export function LeaderboardPanel({ onViewProfile }: { onViewProfile?: () => void } = {}) {
  const [user, updateUser] = useUserState();
  const [period, setPeriod] = useState<Period>("TODAY");
  // Board population is QA-only now (no UI toggle) — still settable via ?board=.
  const [boardView] = useState<BoardView>(() => {
    if (typeof window === "undefined") return "full";
    const b = new URLSearchParams(window.location.search).get("board");
    return b === "empty" || b === "sparse" ? b : "full";
  });
  const [authOpen, setAuthOpen] = useState(false);
  // A clicked player promotes to a full read-only ProfilePanel (back arrow returns).
  const [viewPlayer, setViewPlayer] = useState<null | {
    rank: number; name: string; correct: number; time: string;
  }>(null);

  const { rows, total } = useMemo(
    () => buildLeaderboard(period, "GLOBAL"),
    [period],
  );

  // Dev/demo — `?popup=1` opens a sample player profile on load (QA).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("popup") && rows[3]) {
      setViewPlayer(rows[3]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Empty/sparse only apply to TODAY (Week/All-Time always carry history).
  const view: BoardView = period === "TODAY" ? boardView : "full";
  const shownRows = view === "empty" ? [] : view === "sparse" ? rows.slice(0, 2) : rows;
  const playerCount = view === "empty" ? 0 : view === "sparse" ? shownRows.length : total;
  const isEmptyish = view !== "full";
  const avgScore =
    view === "empty" ? "-"
    : view === "sparse"
      ? `${(shownRows.reduce((s, r) => s + r.correct, 0) / shownRows.length).toFixed(1)}/5`
      : "3.6/5";
  const avgTime = isEmptyish ? "-" : "00:42";

  const beatCount = Math.max(0, total - YOU_RANK);
  const missedTop25By = 6;

  // Player profile view replaces the board in the same rail slot.
  if (viewPlayer) {
    return (
      <ProfilePanel
        player={{
          name: viewPlayer.name,
          avatar: lbAvatar(viewPlayer.name, 160),
          rank: viewPlayer.rank,
          correct: viewPlayer.correct,
          time: viewPlayer.time,
        }}
        onBack={() => setViewPlayer(null)}
      />
    );
  }

  return (
    <div className={styles.panel}>
      <header className={styles.railHead}>
        <span className={styles.railTitle}>Leaderboard</span>
        {onViewProfile && (
          <button type="button" className={styles.headProfileBtn} onClick={onViewProfile}>
            Profile &amp; badges <span aria-hidden>→</span>
          </button>
        )}
      </header>

      <div className={styles.scroll}>
        <div className={styles.tabs}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`${styles.tab} ${period === p ? styles.tabActive : ""}`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCell}>
            <div className={styles.statNum}>{playerCount.toLocaleString()}</div>
            <div className={styles.statLbl}>Players</div>
          </div>
          <div className={`${styles.statCell} ${styles.statCellBordered}`}>
            <div className={styles.statNum}>{avgScore}</div>
            <div className={styles.statLbl}>Avg score</div>
          </div>
          <div className={`${styles.statCell} ${styles.statCellBordered}`}>
            <div className={styles.statNum}>{avgTime}</div>
            <div className={styles.statLbl}>Avg time</div>
          </div>
        </div>

        <div className={styles.podium}>
          <div className={styles.podiumHeader}>
            ★ Top 3 · {PERIOD_LABELS[period]}
          </div>
          <div className={styles.podiumRow}>
            {PODIUM_SLOTS.map((idx) => {
              const r = shownRows[idx];
              const isFirst = idx === 0;
              const av = idx === 0 ? 64 : idx === 1 ? 52 : 46;
              const cardMin = idx === 0 ? 118 : idx === 1 ? 98 : 90;
              // Card anatomy adapted from 21st.dev "first-place-leaderboard"
              // (nayan_radadiya6): avatar overlaps the card top, crown rides
              // the #1 avatar, yellow rank chip, green stroke/name/score bar.

              // Ghost slot — no one in this position yet.
              if (!r) {
                return (
                  <div key={idx} className={`${styles.podiumCol} ${styles.podiumGhost}`}>
                    <div
                      className={styles.avatarWrap}
                      style={{ width: av, height: av, marginBottom: -av / 2 }}
                    >
                      <div className={styles.ghostAvatar} style={{ width: av, height: av }}>
                        {isFirst ? "?" : ""}
                      </div>
                    </div>
                    <div
                      className={`${styles.podiumCard} ${styles.ghostCard}`}
                      style={{ minHeight: cardMin, paddingTop: av / 2 + 8 }}
                    >
                      <div className={styles.ghostName}>Open</div>
                      <div className={styles.ghostRank}>0{idx + 1}</div>
                    </div>
                  </div>
                );
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setViewPlayer(r)}
                  className={`${styles.podiumCol} ${styles.podiumColBtn} ${isFirst ? styles.podiumGold : ""}`}
                  aria-label={`View ${r.name}'s profile`}
                >
                  <div
                    className={styles.avatarWrap}
                    style={{ width: av, height: av, marginBottom: -av / 2 }}
                  >
                    {isFirst && <Crown size={20} className={styles.crown} aria-hidden />}
                    <img
                      src={lbAvatar(r.name)}
                      alt=""
                      className={styles.podiumAvatar}
                      style={{ width: av, height: av }}
                    />
                    <span className={styles.rankBadge}>{r.rank}</span>
                  </div>
                  <div
                    className={`${styles.podiumCard} ${isFirst ? styles.cardGold : ""}`}
                    style={{ minHeight: cardMin, paddingTop: av / 2 + 8 }}
                  >
                    <div className={styles.podiumName}>{r.name}</div>
                    <div className={`${styles.pedScore} ${isFirst ? styles.pedScoreGold : ""}`}>
                      {r.correct}/5
                    </div>
                    <div className={styles.pedTime}>{r.time}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {isEmptyish ? (
          <div className={styles.beFirst}>
            <div className={styles.beFirstTitle}>
              {playerCount === 0 ? "No one's on the board yet." : "Only a couple have played."}
            </div>
            <div className={styles.beFirstSub}>{"Be first. The day's wide open."}</div>
            <button className={styles.beFirstCta} onClick={() => setAuthOpen(true)}>
              Sign in to claim #1
            </button>
          </div>
        ) : (
          <div className={styles.listBlock}>
            <div className={styles.listKicker}>Rankings · #4 and below</div>
            <div className={styles.list}>
              {rows.slice(3, 50).map((r) => {
                const isYou = r.rank === YOU_RANK;
                if (isYou) {
                  return (
                    <div key={r.rank} className={`${styles.listRow} ${styles.listRowYou}`}>
                      <span className={styles.listRank}>{r.rank}</span>
                      <img src={YOU_AVATAR} alt="" className={styles.listAvatar} />
                      <span className={styles.listName}>{YOU_NAME}</span>
                      <span className={styles.listStats}>
                        {YOU_SCORE} · {YOU_TIME}
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={r.rank}
                    onClick={() => setViewPlayer(r)}
                    className={styles.listRow}
                  >
                    <span className={styles.listRank}>{r.rank}</span>
                    <img src={lbAvatar(r.name)} alt="" className={styles.listAvatar} />
                    <span className={styles.listName}>{r.name}</span>
                    <span className={styles.listStats}>
                      {r.correct}/5 · {r.time}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isEmptyish || !user.loggedIn ? (
        <button type="button" onClick={() => setAuthOpen(true)} className={styles.youGhost}>
          Sign in to compete and get on the board →
        </button>
      ) : (
        <button
          type="button"
          onClick={onViewProfile}
          className={styles.you}
          aria-label="View profile and badges"
        >
          <span className={styles.youRank}>#{YOU_RANK.toLocaleString()}</span>
          <img src={YOU_AVATAR} alt="" className={styles.youAvatar} />
          <div className={styles.youBody}>
            <span className={styles.youName}>{YOU_NAME}</span>
            <span className={styles.youMeta}>
              BEAT {beatCount.toLocaleString()} · MISSED TOP 25 BY {missedTop25By}s
            </span>
          </div>
          <span className={styles.youStats}>
            {YOU_SCORE} · {YOU_TIME}
          </span>
        </button>
      )}

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
