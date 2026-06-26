"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Countdown } from "@/components/quiz/Countdown";
import { HomeBackdrop } from "./HomeBackdrop";
import { HowItWorksPopup } from "@/components/quiz/HowItWorksPopup";
import { StreakDrawer } from "@/components/streak/StreakDrawer";
import { AuthModal } from "@/components/quiz/AuthModal";
import { ConfirmDialog } from "@/components/quiz/ConfirmDialog";
import { SheetModal } from "@/components/ui/SheetModal";
import { ProfilePanel } from "@/components/results/ProfilePanel";
import { AlreadyPlayedCard } from "@/components/quiz/AlreadyPlayedCard";
import { ShareCardModal, type ShareData } from "@/components/share/ShareCardModal";
import { CopyToast } from "@/components/ui/CopyToast";
import { buildChallengeText, copyText } from "@/lib/share";
import { CornerFrameAnimatedButton } from "@/components/ui/corner-frame-animated-button";
import { PixelTrail } from "@/components/ui/pixel-trail";
import { useScreenSize } from "@/hooks/use-screen-size";
import { badgeUnlockFor, readPhaseOverride, useUserState, visitorPhase } from "@/lib/user-state";
import { BadgeUnlockedPopup } from "@/components/quiz/BadgeUnlockedPopup";
import { TODAY } from "@/lib/today";
import { BADGES, THEME_LABEL, TOTAL_PLAYERS_TODAY } from "@/lib/quiz-data";
import { BadgeProgressRing } from "@/components/badges/BadgeProgressRing";
import { LeaderboardEmpty } from "./LeaderboardEmpty";
import { GamesNav } from "@/components/landing/GamesNav";
import { SiteFooter } from "@/components/landing/SiteFooter";
import styles from "./EditorialLayout.module.css";

/**
 * Option 3 (Editorial) — Figma node 68:3491.
 * Desktop ≥1024px: two-column — cabinet + stats strip (left), leaderboard sidebar (right).
 * Mobile <1024px: single column stack.
 */
type Period = "today" | "week" | "all";

/**
 * Podium slot card — anatomy adapted from 21st.dev "first-place-leaderboard"
 * (nayan_radadiya6): avatar overlapping a green-stroked card, pixel crown on
 * the #1 avatar, yellow rank chip, green name + score bar. Shared by the
 * desktop sidebar podium and the mobile sheet podium.
 */
function PodiumSlot({
  rank,
  name,
  avatar,
  score,
  time,
  variant,
}: {
  rank: string;
  name: string;
  avatar: string;
  score: string;
  time: string;
  variant: "gold" | "sm" | "xs";
}) {
  const variantClass =
    variant === "gold"
      ? styles.podiumEntryGold
      : variant === "sm"
        ? styles.podiumEntrySm
        : styles.podiumEntryXs;
  return (
    <div className={`${styles.podiumEntry} ${variantClass}`}>
      <span className={styles.podiumAvatarWrap}>
        {variant === "gold" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/figma/editorial/crown.svg"
            alt=""
            aria-hidden
            className={styles.crownIcon}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="" aria-hidden className={styles.podiumAvatar} />
        <span className={styles.podiumRankChip}>{rank}</span>
      </span>
      <div className={styles.podiumCard}>
        <span className={styles.podiumName}>{name}</span>
        <span className={styles.podiumScore}>{score}</span>
        <span className={styles.podiumTime}>{time}</span>
      </div>
    </div>
  );
}

export function EditorialLayout({ challenged = false }: { challenged?: boolean } = {}) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [period, setPeriod] = useState<Period>("today");
  const [boardEmpty, setBoardEmpty] = useState(false); // demo: empty board (first-time / early)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialView, setDrawerInitialView] = useState<"summary" | "all">("summary");
  const [countdownActive, setCountdownActive] = useState(false);
  const [auth, setAuth] = useState<{ open: boolean; headline?: string; sub?: string; after?: () => void }>({ open: false });
  const [share, setShare] = useState<{ open: boolean }>({ open: false });
  const [challengeCopied, setChallengeCopied] = useState(false);
  const [user, updateUser] = useUserState();
  const leaderboardRef = useRef<HTMLElement>(null);

  // Single source of truth for the visitor phase (guest / member-ready /
  // member-played), derived from persisted login × todayPlayed.
  const phase = visitorPhase(user);

  // Dev/demo override — `/?as=member|played|guest` seeds persisted state so the
  // member / "come back tomorrow" states can be demoed without a full round.
  useEffect(() => {
    const o = readPhaseOverride();
    if (o) updateUser(o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dev/demo — `/?drawer=summary|all` opens the streak drawer on load (for QA
  // and review screenshots), matching the `?as=` / `?skip=` dev conventions.
  useEffect(() => {
    const d = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("drawer")
      : null;
    if (d === "summary" || d === "all") {
      setDrawerInitialView(d);
      setDrawerOpen(true);
    }
    // `?hiw=1` opens the HOW IT WORKS stepper on load (QA/screenshots).
    if (new URLSearchParams(window.location.search).get("hiw")) {
      setShowHowItWorks(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openDrawerOn(view: "summary" | "all") {
    setDrawerInitialView(view);
    setDrawerOpen(true);
  }

  // ── Claim-badge flow ──
  // Tapping the Badges section plays the unlock animation for each pending
  // leaderboard badge (Daily Crown / Podium Finisher earned the day before),
  // then lands on the collection. With nothing pending it opens the collection.
  const [claimQueue, setClaimQueue] = useState<string[] | null>(null);
  const [claimIdx, setClaimIdx] = useState(0);

  // Account menu (avatar) → Profile sheet / Log out confirm.
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navInitials = user.handle ? user.handle.slice(0, 2).toUpperCase() : "AK";
  const pendingCount = user.pendingBadges.length;
  const currentClaim = claimQueue ? badgeUnlockFor(claimQueue[claimIdx]) : null;

  function openBadges() {
    if (pendingCount > 0) {
      setClaimQueue(user.pendingBadges);
      setClaimIdx(0);
    } else {
      openDrawerOn("all");
    }
  }
  function onClaimContinue() {
    if (!claimQueue) return;
    const next = claimIdx + 1;
    if (next < claimQueue.length) {
      setClaimIdx(next);
      return;
    }
    // Every pending badge claimed → bank them and reveal the collection.
    updateUser({ userBadgeCount: user.userBadgeCount + claimQueue.length, pendingBadges: [] });
    setClaimQueue(null);
    setClaimIdx(0);
    openDrawerOn("all");
  }

  // `after` is the action the user was reaching for when they hit the auth
  // gate — run it once sign-in succeeds so the click "continues" instead of
  // dropping them back on the home screen.
  const openAuth = (opts?: { headline?: string; sub?: string; after?: () => void }) =>
    setAuth({ open: true, ...opts });

  const handleViewLeaderboard = () =>
    leaderboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  function startQuiz() {
    setCountdownActive(true);
  }

  function handleCountdownDone() {
    if (typeof window !== "undefined") {
      window.location.href = "/play?skip=question";
    }
  }
  const screen = useScreenSize();

  const stripPulsing = !user.todayPlayed;

  // Share/challenge card payload for the member-played state. Demo score; the
  // streak is live from persisted state.
  const shareData: ShareData = {
    score: 4,
    total: 5,
    squares: [true, true, false, true, true],
    rank: 47,
    of: TOTAL_PLAYERS_TODAY,
    streak: user.userStreak,
    dateAllCaps: TODAY.dateAllCaps,
    title: THEME_LABEL,
    timeSec: 38,
    earnedBadge: null,
    prevBadges: [],
  };

  // Next-badge card target — the 7-day streak medal (grayscale until earned,
  // yellow in-progress arc from BadgeProgressRing).
  const nextBadge = BADGES.find((b) => b.id === "streak-7");

  const rankings = [
    { rank: 4, name: "KICKSFORLIFE", score: "5/5", time: "15s", avatar: 11 },
    { rank: 5, name: "DUNKTHUNK", score: "5/5", time: "16s", avatar: 12 },
    { rank: 6, name: "J5OG", score: "5/5", time: "16s", avatar: 13 },
    { rank: 7, name: "BAYC_NICK", score: "5/5", time: "16s", avatar: 14 },
    { rank: 8, name: "SOLERESQ", score: "5/5", time: "17s", avatar: 15 },
    { rank: 9, name: "DUNKMASTER", score: "5/5", time: "17s", avatar: 16 },
    { rank: 10, name: "BREDLINE", score: "5/5", time: "18s", avatar: 17 },
  ];

  return (
    <div className={styles.page} data-layout="editorial">
      {/* Persistent Complex Playground bar (inverse) — always a way back home */}
      <GamesNav
        dark
        loggedIn={user.loggedIn}
        initials={navInitials}
        onSignIn={() =>
          openAuth({
            headline: "Save your streak",
            sub: "Sign in to save your streak, earn badges, and climb the board.",
          })
        }
        onProfile={() => setProfileOpen(true)}
        onLogout={() => setLogoutOpen(true)}
      />
      <HomeBackdrop />
      <div className={styles.grid}>
        {/* ── LEFT: Cabinet (now hosts the streak + badge pips top-right) ── */}
        <div className={styles.leftCol}>
          <div className={styles.cabinet}>
            {/* Pixel trail — sharp cells (no gooey blur), layered ABOVE the
                cabinet content with an exclusion blend so it reads over the
                hero photo as well as the copy side, trippy where it crosses
                the sneaker. */}
            <div className={styles.pixelStage} aria-hidden>
              <PixelTrail
                pixelSize={screen.lessThan("md") ? 10 : 14}
                delay={620}
                fadeDuration={0}
                pixelColor="rgba(0,255,133,0.85)"
                avoidSelector="[data-no-trail]"
              />
            </div>

            <div className={`${styles.cabinetContent} ${phase === "member-played" ? styles.cabinetPlayed : ""}`}>
              {/* Challenge deep link (/c): the recipient lands with the dare framing. */}
              {challenged && (
                <div className={styles.challengedBanner} role="status">
                  <span className={styles.challengedDot} aria-hidden />
                  YOU&apos;VE BEEN CHALLENGED · BEAT THEIR SCORE ON TODAY&apos;S QUIZ
                </div>
              )}

              {/* Editorial split: left-aligned copy column · hero photo right
                  (desktop). On mobile the hero leads and the copy follows. */}
              <div className={styles.cabinetMain}>
                <div className={styles.cabinetCopy}>
                  {/* 5FOR5 lockup (flat logo, per Figma 326:6685) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/figma/editorial/logo-5for5.png"
                    alt="Complex 5 for 5 — Daily Sneaker Quiz"
                    className={styles.quizLogo}
                  />

                  <p className={styles.eyebrow}>DAILY QUIZ · MAY 21, 2026</p>
                  <h2 className={styles.theme}>ICONIC COLLABS</h2>
                  <p className={styles.themeSub}>
                    Test your sneaker knowledge. 5 questions. The faster you
                    answer, the better.
                  </p>

                  {phase === "member-played" ? (
                    /* One shot a day — member already played. No replay; pivot
                       to share / challenge / leaderboard / Complex.com. */
                    <AlreadyPlayedCard
                      onViewResults={() => { window.location.href = "/play?skip=results"; }}
                      onShare={() => setShare({ open: true })}
                      onChallenge={() => {
                        copyText(buildChallengeText(shareData.score, shareData.total));
                        setChallengeCopied(true);
                      }}
                      onLeaderboard={handleViewLeaderboard}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={startQuiz}
                        className={styles.startQuiz}
                        data-apple-press
                        data-no-trail
                      >
                        START QUIZ
                        <ArrowRight size={19} strokeWidth={2.4} aria-hidden />
                      </button>
                      {phase === "guest" && (
                        <button
                          type="button"
                          className={styles.signInSave}
                          onClick={() =>
                            openAuth({
                              headline: "Save your streak",
                              sub: "Playing is free. Sign in to save your result, build a streak, and earn badges.",
                            })
                          }
                        >
                          Sign in to save your streak
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    className={styles.howItWorks}
                    data-no-trail
                    onClick={() => setShowHowItWorks(true)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/figma/editorial/alert-circle.svg"
                      alt=""
                      aria-hidden
                      className={styles.alertIcon}
                    />
                    <span>HOW IT WORKS?</span>
                  </button>
                </div>

                <div className={styles.cabinetHero}>
                  {/* Sharp-cornered hero image (Figma 326:6683 desktop /
                      326:7149 mobile). Mobile uses a wider crop; the desktop
                      <img> is the fallback. */}
                  <picture>
                    <source
                      media="(max-width: 1023px)"
                      srcSet="/figma/editorial/hero-collabs-mobile.png"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/figma/editorial/hero-collabs.png"
                      alt=""
                      aria-hidden
                      className={styles.cabinetHeroImg}
                    />
                  </picture>
                </div>
              </div>

              {/* ── BOTTOM-ANCHOR STREAK + BADGES STRIP ──
                  Two independent buttons — STREAK opens drawer to streak view,
                  BADGES opens drawer directly to the all-badges grid. */}
              <div className={styles.streakStrip}>
                <button
                  type="button"
                  className={styles.streakStripCol}
                  onClick={() =>
                    phase === "guest"
                      ? openAuth({
                          headline: "Track your streak",
                          sub: "Sign in to start a streak, earn badges, and climb the board.",
                          after: () => openDrawerOn("summary"),
                        })
                      : openDrawerOn("summary")
                  }
                  aria-label={`View streak, ${user.userStreak} days`}
                >
                  <span className={styles.streakStripRow}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/figma/editorial/flame.svg"
                      alt=""
                      aria-hidden
                      className={styles.streakStripFlameIcon}
                    />
                    <span className={styles.streakStripNum}>×{user.userStreak}</span>
                  </span>
                  <span className={styles.streakStripLabel}>STREAK</span>
                </button>
                <button
                  type="button"
                  className={styles.streakStripCol}
                  onClick={() =>
                    phase === "guest"
                      ? openAuth({
                          headline: "Earn your first badge",
                          sub: "Sign in to start a streak, earn badges, and climb the board.",
                          after: openBadges,
                        })
                      : openBadges()
                  }
                  aria-label={
                    pendingCount > 0
                      ? `Claim ${pendingCount} new badge${pendingCount > 1 ? "s" : ""}`
                      : `View badges, ${user.userBadgeCount} earned`
                  }
                >
                  {pendingCount > 0 && <span className={styles.claimDot}>{pendingCount}</span>}
                  <span className={styles.streakStripRow}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/figma/editorial/badge-emoji.svg"
                      alt=""
                      aria-hidden
                      className={styles.streakStripBadgeIcon}
                    />
                    <span className={styles.streakStripNum}>×{user.userBadgeCount}</span>
                  </span>
                  <span className={styles.streakStripLabel}>
                    {pendingCount > 0 ? "CLAIM" : "BADGES"}
                  </span>
                </button>
              </div>

              {/* ── GAME CARDS (desktop) — streak · collection · next badge ── */}
              <div className={styles.gameCards}>
                <button
                  type="button"
                  className={`${styles.gameCard} ${styles.gameCardClickable}`}
                  data-no-trail
                  onClick={() =>
                    phase === "guest"
                      ? openAuth({
                          headline: "Track your streak",
                          sub: "Sign in to start a streak, earn badges, and climb the board.",
                          after: () => openDrawerOn("summary"),
                        })
                      : openDrawerOn("summary")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/figma/editorial/flame.svg" alt="" aria-hidden className={styles.gameCardFlame} />
                  <span className={styles.gameCardBody}>
                    <span className={styles.gameCardLabel}>CURRENT STREAK</span>
                    <span className={styles.gameCardNum}>
                      {user.userStreak} <em>DAYS</em>
                    </span>
                    {phase === "guest" && (
                      <span className={styles.gameCardSub}>Sign in to save your streak</span>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className={`${styles.gameCard} ${styles.gameCardClickable}`}
                  data-no-trail
                  onClick={openBadges}
                >
                  {pendingCount > 0 && <span className={styles.claimDot}>{pendingCount}</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/figma/editorial/badge-emoji.svg" alt="" aria-hidden className={styles.gameCardBadge} />
                  <span className={styles.gameCardBody}>
                    <span className={styles.gameCardLabel}>BADGE COLLECTION</span>
                    <span className={styles.gameCardNum}>
                      {user.userBadgeCount} <em>OF {BADGES.length} EARNED</em>
                    </span>
                    <span className={styles.gameCardCta}>
                      {pendingCount > 0
                        ? `Claim ${pendingCount} new badge${pendingCount > 1 ? "s" : ""} →`
                        : "View collection →"}
                    </span>
                  </span>
                </button>

                {phase !== "guest" && (
                /* Preview only — not clickable (the streak detail is reached via
                   the Current Streak card). */
                <div className={styles.gameCard} data-no-trail>
                  <span className={styles.gameCardRing}>
                    {nextBadge && (
                      <BadgeProgressRing badge={nextBadge} streakDays={user.userStreak} size={54} iconSize={40} />
                    )}
                  </span>
                  <span className={styles.gameCardBody}>
                    <span className={styles.gameCardLabel}>NEXT BADGE TO UNLOCK</span>
                    <span className={styles.gameCardName}>7-DAY STREAK</span>
                    <span className={styles.gameCardTrack}>
                      <span
                        className={styles.gameCardFill}
                        style={{ width: `${Math.min(100, (user.userStreak / 7) * 100)}%` }}
                      />
                    </span>
                    <span className={styles.gameCardSub}>{Math.min(user.userStreak, 7)} / 7 days</span>
                    <span className={styles.gameCardCta}>View streak →</span>
                  </span>
                </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT: Leaderboard sidebar ── */}
        <aside className={styles.sidebar} ref={leaderboardRef}>
          <div className={styles.lbHead}>
            <h2 className={styles.lbTitle}>Leaderboard</h2>
            <button type="button" className={styles.lbStateChip}
              onClick={() => setBoardEmpty((v) => !v)}>
              {boardEmpty ? "Empty" : "Full"}
            </button>
          </div>

          {/* Period tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={`${styles.tab} ${period === "today" ? styles.tabActive : ""}`}
            >
              TODAY
            </button>
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`${styles.tab} ${period === "week" ? styles.tabActive : ""}`}
            >
              THIS WEEK
            </button>
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={`${styles.tab} ${period === "all" ? styles.tabActive : ""}`}
            >
              ALL-TIME
            </button>
          </div>

          {/* Stats grid */}
          <div className={styles.lbStats}>
            <div className={styles.lbStatCell}>
              <div className={styles.lbStatNum}>{boardEmpty ? "0" : "1,247"}</div>
              <div className={styles.lbStatLabel}>PLAYERS</div>
            </div>
            <div className={`${styles.lbStatCell} ${styles.lbStatCellDivider}`}>
              <div className={styles.lbStatNum}>{boardEmpty ? "-" : "3.6/5"}</div>
              <div className={styles.lbStatLabel}>AVG SCORE</div>
            </div>
            <div className={`${styles.lbStatCell} ${styles.lbStatCellDivider}`}>
              <div className={styles.lbStatNum}>{boardEmpty ? "-" : "00:42"}</div>
              <div className={styles.lbStatLabel}>AVG TIME</div>
            </div>
          </div>

          {boardEmpty ? (
            <LeaderboardEmpty />
          ) : (
            <>
          {/* Top 3 podium */}
          <h3 className={styles.podiumHeader}>★ TOP 3 · TODAY</h3>
          <div className={styles.podium}>
            <PodiumSlot rank="2" name="HEELGAME" avatar="https://i.pravatar.cc/104?img=8" score="5/5" time="14s" variant="sm" />
            <PodiumSlot rank="1" name="SAMPLE_SIZE" avatar="https://i.pravatar.cc/128?img=5" score="5/5" time="14s" variant="gold" />
            <PodiumSlot rank="3" name="OFFWHITER" avatar="https://i.pravatar.cc/92?img=3" score="5/5" time="15s" variant="xs" />
          </div>

          {/* Rankings list #4–10 */}
          <h3 className={styles.rankingsHeader}>RANKINGS · #4 AND BELOW</h3>
          <ul className={styles.rankings}>
            {rankings.map((r) => (
              <li key={r.rank} className={styles.rankRow}>
                <span className={styles.rankNum}>{r.rank}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://i.pravatar.cc/60?img=${r.avatar}`} alt="" aria-hidden className={styles.rankAvatar} />
                <span className={styles.rankName}>{r.name}</span>
                <span className={styles.rankScore}>
                  {r.score} · {r.time}
                </span>
              </li>
            ))}
          </ul>
            </>
          )}
        </aside>
      </div>

      {/* Complex site footer (SMPLX dark) — full-bleed past the page padding */}
      <div className={styles.footerBleed}>
        <SiteFooter />
      </div>

      {showHowItWorks && (
        <HowItWorksPopup onClose={() => setShowHowItWorks(false)} />
      )}

      <StreakDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        initialView={drawerInitialView}
      />

      {/* Account menu → your profile. Centered pop-up on desktop, bottom sheet
          on mobile — same shell as Streak & Badges. */}
      <SheetModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        ariaLabel="Your profile"
      >
        <ProfilePanel />
      </SheetModal>

      {/* Account menu → log out confirm. */}
      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        body="Are you sure you want to log out?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onConfirm={() => {
          updateUser({ loggedIn: false });
          setLogoutOpen(false);
          setProfileOpen(false);
        }}
        onCancel={() => setLogoutOpen(false)}
      />

      {/* Claim-badge takeover — replays the unlock animation per pending badge.
          key remounts the orchestration so each badge animates fresh. */}
      {currentClaim && (
        <BadgeUnlockedPopup
          key={claimIdx}
          badge={currentClaim}
          backdrop="pixels"
          solidScrim
          continueLabel={
            claimQueue && claimIdx + 1 < claimQueue.length ? "CONTINUE →" : "SEE COLLECTION →"
          }
          onContinue={onClaimContinue}
        />
      )}

      {countdownActive && <Countdown overlay onDone={handleCountdownDone} />}

      <AuthModal
        open={auth.open}
        onClose={() => setAuth({ open: false })}
        headline={auth.headline}
        sub={auth.sub}
        onAuthed={() => {
          updateUser({ loggedIn: true });
          auth.after?.();
        }}
      />

      <ShareCardModal
        open={share.open}
        data={shareData}
        onClose={() => setShare({ open: false })}
      />

      <CopyToast show={challengeCopied} onDone={() => setChallengeCopied(false)}>
        Challenge link copied. Send it.
      </CopyToast>
    </div>
  );
}
