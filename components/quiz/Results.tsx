"use client";

import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import {
  Answer,
  BADGE_OPTIONS,
  BADGES,
  QUIZ_DATA,
  PCT_CORRECT,
  QuizPrefs,
  THEME_LABEL,
  TOTAL_PLAYERS_TODAY,
} from "@/lib/quiz-data";
import { BadgeMark } from "@/components/badges/BadgeIcon";
import { useTheme } from "@/components/Theme";
import { LeaderboardPanel } from "@/components/results/LeaderboardPanel";
import { ProfilePanel } from "@/components/results/ProfilePanel";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ShareCardModal, type ShareData } from "@/components/share/ShareCardModal";
import { CopyToast } from "@/components/ui/CopyToast";
import { buildChallengeText, copyText } from "@/lib/share";
import { useScreenSize } from "@/hooks/use-screen-size";
import { useUserState } from "@/lib/user-state";
import styles from "./Results.module.css";

type Props = {
  prefs: QuizPrefs;
  answers: Answer[];
  totalElapsedMs: number;
  claimed: boolean;
  onTriggerLogin: () => void;
  onPlayAgain: () => void;
};

const DATE_LABEL = "MAY 21";

export function Results({
  prefs,
  answers,
  totalElapsedMs,
  claimed,
  onTriggerLogin,
  onPlayAgain,
}: Props) {
  const { theme } = useTheme();
  const screen = useScreenSize();
  const isMobile = screen.width > 0 && screen.lessThan("lg");
  const [user] = useUserState();
  const [toast, setToast] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState(3);
  const [rail, setRail] = useState<"leaderboard" | "profile">(() => {
    if (typeof window === "undefined") return "leaderboard";
    return new URLSearchParams(window.location.search).get("rail") === "profile"
      ? "profile"
      : "leaderboard";
  });
  const [overlay, setOverlay] = useState<"leaderboard" | "profile" | null>(null);
  const [mobileSheet, setMobileSheet] = useState<"leaderboard" | "profile" | null>(null);
  // Dev/demo — `?share=1` opens the share sheet on load (QA/screenshots).
  const [shareOpen, setShareOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!new URLSearchParams(window.location.search).get("share");
  });

  const correctCount = answers.filter((a) => a.correct).length;
  const earnedBadge = BADGE_OPTIONS[prefs.badge];
  const isGated = !prefs.loggedIn && !claimed;

  // Shared CopyToast handles the auto-hide; just set the message.
  const showToast = (m: string) => setToast(m);

  const handleGated = (action: () => void) => () => {
    if (isGated) {
      onTriggerLogin();
      return;
    }
    action();
  };

  // Challenge = instant copy + toast (no modal) — the /c link unfurl carries
  // the "You've been challenged" framing for the recipient.
  const handleChallenge = handleGated(() => {
    copyText(buildChallengeText(correctCount, answers.length));
    showToast("Challenge link copied. Send it.");
  });
  const handleShare = handleGated(() => setShareOpen(true));
  const handleCopyText = handleGated(() => showToast("Result text copied"));
  const handleViewLeaderboard = () => setOverlay("leaderboard");
  const handleBadges = handleGated(() => setOverlay("profile"));

  const prevBadges = BADGES
    .filter((b) => ["first-play", "streak-7", "back-to-back", "podium-finisher"].includes(b.icon))
    .map((b) => ({ icon: b.icon, name: b.name }));

  const shareData: ShareData = {
    score: correctCount,
    total: answers.length,
    squares: answers.map((a) => !!a.correct),
    rank: prefs.finalRank,
    of: TOTAL_PLAYERS_TODAY,
    streak: user.userStreak,
    dateAllCaps: `${DATE_LABEL}, 2026`,
    title: THEME_LABEL,
    time: `${Math.round(totalElapsedMs / 1000)}s`,
    earnedBadge:
      earnedBadge && !isGated
        ? { icon: earnedBadge.icon, name: earnedBadge.name, earnRate: earnedBadge.earnRate }
        : null,
    prevBadges,
  };

  const shareModal = (
    <ShareCardModal
      open={shareOpen}
      data={shareData}
      onClose={() => setShareOpen(false)}
    />
  );

  /* ─── Editorial theme: two-column scorecard + toggleable rail ─── */
  if (theme === "3") {
    return (
      <div className={styles.shell}>
        <CopyToast show={!!toast} onDone={() => setToast(null)}>{toast}</CopyToast>
        {shareModal}

        <div className={styles.eGrid}>
          <div className={styles.inner}>
            <div className={styles.eHead}>
              TODAY · {THEME_LABEL.toUpperCase()} · {DATE_LABEL}
            </div>

            <div className={styles.scoreHero}>
              {/* Score wears its verdict (4 tiers per Figma 326:7197):
                  5/5 = #00FF85, 4/5 = #00C46A, 3–2/5 = #FF9500, 1–0/5 = #FF453A. */}
              <div
                className={styles.scoreHeroNum}
                data-grade={
                  correctCount === 5
                    ? "perfect"
                    : correctCount === 4
                      ? "sharp"
                      : correctCount >= 2
                        ? "solid"
                        : "rookie"
                }
              >
                {correctCount}<span className={styles.scoreHeroSlash}>/{answers.length}</span>
              </div>
              <div className={styles.scoreHeroLabel}>CORRECT</div>
              <div className={styles.statPillRow}>
                <span className={styles.statPill}>
                  <span className={styles.statPillValue}>
                    {Math.round(totalElapsedMs / 1000)}s
                  </span>
                  <span className={styles.statPillLabel}>TIME</span>
                </span>
                {!isGated && (
                  <span className={styles.statPill}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/figma/editorial/flame.svg"
                      alt=""
                      aria-hidden
                      className={styles.statPillFlame}
                    />
                    <span className={styles.statPillValue}>{user.userStreak}</span>
                    <span className={styles.statPillLabel}>STREAK</span>
                  </span>
                )}
              </div>
            </div>

            <div className={styles.rDivider} aria-hidden />

            {/* Prominent score-aware sign-in CTA (gated only) — the primary
                action; share/challenge become secondary side-by-side below. */}
            {/* Share + Challenge — side by side */}
            <div className={styles.eButtonsRow}>
              <button
                onClick={handleShare}
                className={isGated ? styles.eBtnOutline : styles.eBtnFilled}
              >
                <img
                  src="/figma/icon-share.svg"
                  alt=""
                  className={`${styles.eBtnIcon} ${isGated ? "" : styles.eBtnIconInverted}`}
                  aria-hidden
                />
                SHARE SCORE
              </button>
              <button onClick={handleChallenge} className={styles.eBtnOutline}>
                <img
                  src="/figma/icon-trophy.svg"
                  alt=""
                  className={styles.eBtnIcon}
                  aria-hidden
                />
                CHALLENGE A FRIEND
              </button>
            </div>

            {/* Sign-in promo (gated) — a banner, not a top primary button. */}
            {isGated && (
              <button type="button" onClick={onTriggerLogin} className={styles.signInBanner} data-apple-press>
                <span className={styles.sibLock} aria-hidden>
                  <Lock size={24} strokeWidth={2.4} className={styles.sibLockIcon} />
                </span>
                <span className={styles.sibText}>
                  <span className={styles.sibTitle}>
                    Sign in to save your score, build your streak and earn badges.
                  </span>
                  <span className={styles.sibSub}>It only takes a second.</span>
                </span>
                <span className={styles.sibBtn}>
                  SIGN IN <ArrowRight size={16} strokeWidth={2.6} aria-hidden />
                </span>
              </button>
            )}

            <section className={styles.eReviewBlock}>
              <div className={styles.eReviewHead}>
                <span className={styles.eReviewKicker}>ANSWER REVIEW</span>
              </div>
              <div className={styles.eReviewList}>
                {QUIZ_DATA.map((q, i) => {
                  const a = answers[i];
                  const ok = a?.correct;
                  const userIdx = a?.answer ?? q.correct;
                  const correctLetter = String.fromCharCode(65 + q.correct);
                  const userLetter = String.fromCharCode(65 + userIdx);
                  return (
                    <div
                      key={i}
                      className={`${styles.eReviewRow} ${ok ? styles.eReviewRowCorrect : styles.eReviewRowWrong}`}
                    >
                      <span className={styles.eReviewQNum} aria-hidden>
                        Q{i + 1}
                      </span>
                      <div className={styles.eReviewBody}>
                        <div className={styles.eReviewQText}>{q.question}</div>
                        {ok ? (
                          <div className={styles.eReviewAnsSingle}>
                            <span
                              className={`${styles.eReviewAnsLetter} ${styles.eReviewLetterCorrect}`}
                            >
                              {correctLetter}
                            </span>
                            <span className={styles.eReviewAnsTextCorrect}>
                              {q.options[q.correct]}
                            </span>
                          </div>
                        ) : (
                          <div className={styles.eReviewAnsCompare}>
                            <div className={styles.eReviewAnsLineWrong}>
                              <span
                                className={`${styles.eReviewAnsLetter} ${styles.eReviewLetterYou}`}
                              >
                                {userLetter}
                              </span>
                              <span className={styles.eReviewAnsTextYou}>
                                {q.options[userIdx]}
                              </span>
                            </div>
                            <div className={styles.eReviewAnsLineWrong}>
                              <span
                                className={`${styles.eReviewAnsLetter} ${styles.eReviewLetterCorrect}`}
                              >
                                {correctLetter}
                              </span>
                              <span className={styles.eReviewAnsTextCorrect}>
                                {q.options[q.correct]}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className={styles.eReviewPct}>
                          {PCT_CORRECT[i]}% of players got this right
                        </div>
                      </div>
                      <span
                        className={`${styles.eReviewVerdict} ${ok ? styles.eReviewVerdictWin : styles.eReviewVerdictLoss}`}
                        aria-label={ok ? "Correct" : "Incorrect"}
                      >
                        {ok ? <PixelCheck /> : <PixelCross />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className={styles.eFooter}>
              <span className={styles.eTomorrow}>SEE YOU TOMORROW · 8 AM ET</span>
            </div>

            <button onClick={onPlayAgain} className={styles.eReplay}>
              ↺ Replay (dev)
            </button>
          </div>

          <aside className={styles.rail}>
            {rail === "leaderboard" ? (
              <LeaderboardPanel onViewProfile={() => setRail("profile")} />
            ) : (
              <ProfilePanel onBack={() => setRail("leaderboard")} />
            )}
          </aside>
        </div>

        {/* Mobile-only sticky CTA bar */}
        <div className={styles.eMobileCta}>
          <button
            type="button"
            onClick={() => setMobileSheet("leaderboard")}
            className={styles.eMobileCtaBtn}
          >
            VIEW LEADERBOARD
          </button>
          <button
            type="button"
            onClick={() => setMobileSheet("profile")}
            className={`${styles.eMobileCtaBtn} ${styles.eMobileCtaBtnFilled}`}
          >
            VIEW PROFILE
          </button>
        </div>

        {/* Mobile-only bottom sheets */}
        {isMobile && (
          <>
            <BottomSheet
              mode="modal"
              open={mobileSheet === "leaderboard"}
              onClose={() => setMobileSheet(null)}
              fullHeightVh={90}
              ariaLabel="Leaderboard"
            >
              <LeaderboardPanel
                onViewProfile={() => setMobileSheet("profile")}
              />
            </BottomSheet>
            <BottomSheet
              mode="modal"
              open={mobileSheet === "profile"}
              onClose={() => setMobileSheet(null)}
              fullHeightVh={90}
              ariaLabel="Profile and badges"
            >
              <ProfilePanel />
            </BottomSheet>
          </>
        )}
      </div>
    );
  }

  /* ─── Other themes: original single-column scorecard with modal access to panels ─── */
  return (
    <div className={styles.shell}>
      <CopyToast show={!!toast} onDone={() => setToast(null)}>{toast}</CopyToast>
      {shareModal}

      <div className={styles.inner}>
        <header className={styles.heroBlock}>
          <span className={styles.todayLabel}>Today · {THEME_LABEL}</span>
          <div className={styles.score}>
            {correctCount}<span className={styles.scoreSlash}>/</span>{answers.length}
          </div>
          <div className={styles.time}>
            {Math.round(totalElapsedMs / 1000)}
            <span className={styles.timeUnit}>seconds</span>
          </div>
        </header>

        <section className={styles.statsGrid}>
          <Stat label="Correct" value={`${correctCount}/5`} />
          <Stat label="Time" value={`${Math.round(totalElapsedMs / 1000)}s`} />
          <Stat
            label="Streak"
            value={isGated ? "-" : String(claimed ? 1 : prefs.streakDays)}
            accent
          />
          <Stat
            label="Best"
            value={isGated ? "-" : String(Math.max(prefs.streakDays, 12))}
            accent
          />
        </section>

        {earnedBadge && (
          <section className={styles.badgeRow}>
            <div
              className={`${styles.badgeArt} ${styles[`badge_${earnedBadge.rarity}`]} ${
                isGated ? styles.badgeLocked : ""
              }`}
            >
              <BadgeMark
                icon={earnedBadge.icon}
                size={44}
                tier={earnedBadge.rarity === "white" ? undefined : earnedBadge.rarity}
              />
            </div>
            <div className={styles.badgeBody}>
              <span className={styles.badgeKicker}>
                Badge {isGated ? "locked" : "earned"}
              </span>
              <span className={styles.badgeName}>{earnedBadge.name}</span>
              <span className={styles.badgeRate}>{earnedBadge.earnRate} earn rate</span>
            </div>
            <button onClick={handleBadges} className={styles.badgeView}>
              View
            </button>
          </section>
        )}

        <section className={styles.shareGrid}>
          <button onClick={handleChallenge} className={styles.btnFilled}>
            Challenge a friend
          </button>
          <button onClick={handleShare} className={styles.btnFilled}>
            Share score
          </button>
        </section>
        <div className={styles.shareMeta}>
          {isGated ? (
            <span>Sign in to unlock sharing & leaderboard placement.</span>
          ) : (
            <>
              <button className={styles.metaPill} onClick={handleCopyText}>Copy text</button>
              <span className={styles.metaSep}>·</span>
              <button className={styles.metaPill}>1:1</button>
              <button className={styles.metaPill}>9:16</button>
            </>
          )}
        </div>

        <button onClick={handleViewLeaderboard} className={styles.btnOutline}>
          View leaderboard →
        </button>

        <section className={styles.reviewBlock}>
          <span className={styles.reviewKicker}>Your answers</span>
          <div className={styles.review}>
            {QUIZ_DATA.map((q, i) => {
              const a = answers[i];
              const ok = a?.correct;
              return (
                <div key={i} className={styles.reviewRow}>
                  <span className={styles.reviewNum}>Q{i + 1}</span>
                  <div className={styles.reviewBody}>
                    <span className={styles.reviewQ}>{q.question}</span>
                    <div className={styles.reviewAnswer}>
                      <span className={styles.reviewMark}>▸</span>
                      <span className={styles.reviewLetter}>
                        {String.fromCharCode(65 + q.correct)}
                      </span>
                      <span className={styles.reviewRight}>{q.options[q.correct]}</span>
                    </div>
                    {!ok && a && (
                      <div className={styles.reviewAnswer}>
                        <span className={styles.reviewMarkWrong}>◂</span>
                        <span className={styles.reviewLetter}>
                          {String.fromCharCode(65 + a.answer)}
                        </span>
                        <span className={styles.reviewWrong}>
                          {q.options[a.answer]}
                        </span>
                        <span className={styles.reviewYou}>YOU</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.sentBlock}>
          <span className={styles.sentKicker}>How hard was today?</span>
          <div className={styles.sentBox}>
            <input
              type="range"
              min={1}
              max={5}
              value={sentiment}
              onChange={(e) => setSentiment(parseInt(e.target.value))}
              className={styles.sentSlider}
            />
            <div className={styles.sentLabels}>
              <span className={sentiment <= 2 ? styles.sentActive : ""}>Easy</span>
              <span className={sentiment === 3 ? styles.sentActive : ""}>Difficult</span>
              <span className={sentiment >= 4 ? styles.sentActive : ""}>Hard</span>
            </div>
          </div>
        </section>

        {(prefs.loggedIn || claimed) && (
          <section className={styles.emailRow}>
            <input
              type="email"
              placeholder="EMAIL FOR DAILY REMINDER"
              className={styles.emailInput}
            />
            <button
              onClick={() => showToast("Opted in")}
              className={styles.emailBtn}
            >
              Enable
            </button>
          </section>
        )}

        <div className={styles.tomorrow}>See you tomorrow · 8 AM ET</div>

        <button onClick={handleBadges} className={styles.linkBtn}>
          View all badges →
        </button>

        <button onClick={onPlayAgain} className={styles.linkBtnSub}>
          ↺ Replay (dev)
        </button>
      </div>

      {overlay && (
        <div
          className={styles.panelOverlay}
          onClick={() => setOverlay(null)}
          role="dialog"
          aria-modal
        >
          <div
            className={styles.panelOverlayCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOverlay(null)}
              className={styles.panelOverlayClose}
              aria-label="Close"
            >
              ×
            </button>
            {overlay === "leaderboard" ? <LeaderboardPanel /> : <ProfilePanel />}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={styles.statBox}>
      <div className={`${styles.statValue} ${accent ? styles.statValueAccent : ""}`}>
        {value}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function EStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.eStatBox}>
      <div className={styles.eStatValue}>{value}</div>
      <div className={styles.eStatLabel}>{label}</div>
    </div>
  );
}

function PixelCheck() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 10 10"
      style={{ shapeRendering: "crispEdges", display: "block" }}
      fill="currentColor"
      aria-hidden
    >
      <rect x="0" y="5" width="2" height="2" />
      <rect x="2" y="7" width="2" height="2" />
      <rect x="4" y="6" width="2" height="2" />
      <rect x="6" y="4" width="2" height="2" />
      <rect x="8" y="2" width="2" height="2" />
    </svg>
  );
}

function PixelCross() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 10 10"
      style={{ shapeRendering: "crispEdges", display: "block" }}
      fill="currentColor"
      aria-hidden
    >
      <rect x="0" y="0" width="2" height="2" />
      <rect x="2" y="2" width="2" height="2" />
      <rect x="4" y="4" width="2" height="2" />
      <rect x="6" y="6" width="2" height="2" />
      <rect x="8" y="8" width="2" height="2" />
      <rect x="8" y="0" width="2" height="2" />
      <rect x="6" y="2" width="2" height="2" />
      <rect x="2" y="6" width="2" height="2" />
      <rect x="0" y="8" width="2" height="2" />
    </svg>
  );
}
