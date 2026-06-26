"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Countdown } from "@/components/quiz/Countdown";
import { Question } from "@/components/quiz/Question";
import { Reveal } from "@/components/quiz/Reveal";
import { Results } from "@/components/quiz/Results";
import { AuthModal } from "@/components/quiz/AuthModal";
import { ClaimConfirm } from "@/components/quiz/ClaimConfirm";
import { BadgeUnlockedPopup } from "@/components/quiz/BadgeUnlockedPopup";
import { AlreadyPlayedCard } from "@/components/quiz/AlreadyPlayedCard";
import { ShareCardModal, type ShareData } from "@/components/share/ShareCardModal";
import { GamesNav } from "@/components/landing/GamesNav";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { CopyToast } from "@/components/ui/CopyToast";
import { buildChallengeText, copyText } from "@/lib/share";
import { Answer, QUIZ_DATA, QuizPrefs, THEME_LABEL, TOTAL_PLAYERS_TODAY } from "@/lib/quiz-data";
import { TODAY } from "@/lib/today";
import { badgeForStreak, readPhaseOverride, useUserState, type BadgeUnlock } from "@/lib/user-state";

type Screen = "countdown" | "question" | "reveal" | "badge-unlock" | "results";

// Guest by default. Playing today's quiz is free; everything that *keeps* a
// result (streak, leaderboard placement, badge, sharing, reminders) is gated
// behind an account and routes through AuthModal. Auth flips loggedIn → true,
// which unlocks the Results screen in place.
const DEFAULT_PREFS: QuizPrefs = {
  loggedIn: false,
  hasPlayed: false,
  streakDays: 12,
  finalRank: 47,
  scoreCorrect: 4,
  badge: "none",
};

// Rank-aware copy for the gated sign-in moment — drives the AuthModal headline/sub.
function gatedAuthCopy(prefs: QuizPrefs): { headline: string; sub: string } {
  const rank = prefs.finalRank;
  if (rank === 1)
    return { headline: "You're at #1.", sub: "Sign in to claim the Crown before someone catches you." };
  if (rank <= 3)
    return { headline: "You're on the podium.", sub: `Sign in to claim your #${rank} spot before someone catches you.` };
  if (rank <= 100)
    return { headline: `Top ${rank} today.`, sub: "Sign in to claim your spot and start your streak." };
  const pct = Math.max(1, Math.round((rank / TOTAL_PLAYERS_TODAY) * 100));
  if (rank <= TOTAL_PLAYERS_TODAY / 2)
    return { headline: `Top ${pct}% today.`, sub: "Sign in to claim your place and start your streak." };
  return { headline: "Save your result.", sub: "Sign in to keep your badge, save your result, and start a streak." };
}

function synthAnswers(prefs: QuizPrefs): Answer[] {
  const target = prefs.scoreCorrect;
  return QUIZ_DATA.map((q, i) => ({
    question: i,
    answer: i < target ? q.correct : (q.correct + 1) % 4,
    correct: i < target,
    timeMs: 6000 + i * 800,
  }));
}

function readSkip(): Screen | null {
  if (typeof window === "undefined") return null;
  const skip = new URLSearchParams(window.location.search).get("skip");
  if (
    skip === "results" ||
    skip === "reveal" ||
    skip === "question" ||
    skip === "badge-unlock"
  ) return skip as Screen;
  return null;
}

export default function PlayPage() {
  // Dev/demo — `?score=N` (0–5) seeds the synth/demo score so each Results
  // verdict tier can be reviewed (matches the `?skip=` / `?as=` conventions).
  const [prefs] = useState<QuizPrefs>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFS;
    const raw = new URLSearchParams(window.location.search).get("score");
    if (raw == null) return DEFAULT_PREFS;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, scoreCorrect: Math.max(0, Math.min(5, n)) };
  });
  const [screen, setScreen] = useState<Screen>("countdown");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [totalElapsedMs, setTotalElapsedMs] = useState(0);
  const [questionStart, setQuestionStart] = useState<number | null>(null);
  // Single AuthModal that every gated action raises (mirrors LandingPage's
  // AuthCtx pattern). headline/sub are overridable for the rank-aware variant.
  const [auth, setAuth] = useState<{ open: boolean; headline?: string; sub?: string }>({ open: false });
  const openAuth = useCallback(
    (opts?: { headline?: string; sub?: string }) => setAuth({ open: true, ...opts }),
    [],
  );
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  // Share/Challenge sheet for the replay-lock screen (member already played).
  const [share, setShare] = useState<{ open: boolean }>({ open: false });
  const [challengeCopied, setChallengeCopied] = useState(false);
  // Member tapped "Play Again" after already playing today → bounce to the lock.
  const [forceLock, setForceLock] = useState(false);
  // Hydration gate — prevents the default countdown ("3") from flashing
  // on `/play?skip=question` before the URL effect re-targets the screen.
  const [hydrated, setHydrated] = useState(false);

  const [user, updateUser] = useUserState();
  const previousBestRef = useRef(user.userBestStreak);
  const [pendingBadge, setPendingBadge] = useState<BadgeUnlock | null>(null);
  const [celebrationStreak, setCelebrationStreak] = useState<number>(user.userStreak);
  const committedRef = useRef(false);

  // Commit a play to user state — only once per page mount.
  const commitPlay = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    previousBestRef.current = user.userBestStreak;
    const newStreak = user.userStreak + 1;
    const newBest = Math.max(user.userBestStreak, newStreak);
    const newWeekly = [...user.weeklyPlays];
    newWeekly[user.todayDayIndex] = true;
    // Always surface a badge moment after a play. Streak milestones win;
    // otherwise fall back to FIRST PLAY so the badge popup always fires.
    const milestone = badgeForStreak(newStreak);
    const badge: BadgeUnlock = milestone ?? {
      name: "FIRST PLAY",
      color: "#4DC034",
      description: "You just completed today's quiz.",
      iconPath: "/figma/badges/first-play.png",
    };
    const isFirstPlayBadge = !milestone && user.userBadgeCount === 0 && user.userStreak === 0;
    const newBadgeCount =
      milestone || isFirstPlayBadge ? user.userBadgeCount + 1 : user.userBadgeCount;
    setCelebrationStreak(newStreak);
    setPendingBadge(badge);
    updateUser({
      userStreak: newStreak,
      userBestStreak: newBest,
      userBadgeCount: newBadgeCount,
      weeklyPlays: newWeekly,
      todayPlayed: true,
      streakIncrementedToday: true,
      badgeUnlockedToday: badge,
    });
  }, [user, updateUser]);

  // Dev shortcut — ?skip=results jumps straight past the countdown + quiz to
  // the Results screen with synth answers, for quick QA of post-quiz UI.
  useEffect(() => {
    const target = readSkip();
    if (target === "results") {
      setAnswers(synthAnswers(prefs));
      setTotalElapsedMs(38000);
      setScreen("results");
    } else if (target === "reveal") {
      setAnswers(synthAnswers(prefs));
      setTotalElapsedMs(38000);
      setScreen("reveal");
    } else if (target === "badge-unlock") {
      // Dev shortcut — show the badge popup with a fallback badge for QA.
      setAnswers(synthAnswers(prefs));
      setTotalElapsedMs(14000);
      setPendingBadge(
        badgeForStreak(7) ?? {
          name: "FIRST PLAY",
          color: "#4DC034",
          description: "You just completed your first complex quiz!",
          iconPath: "/figma/badges/first-play.png",
        },
      );
      setScreen("badge-unlock");
    } else if (target === "question") {
      setScreen("question");
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dev/demo override — `/play?as=member|played|guest` seeds persisted state so
  // the replay-lock can be demoed without playing a full round first.
  useEffect(() => {
    const o = readPhaseOverride();
    if (o) updateUser(o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // record question start whenever we enter a fresh question
  useEffect(() => {
    if (screen === "question" && selected === null) {
      setQuestionStart(performance.now());
    }
  }, [screen, qIndex, selected]);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (selected !== null) return;
      const now = performance.now();
      const timeMs = questionStart != null ? now - questionStart : 0;
      const newTotal = totalElapsedMs + timeMs;
      setSelected(answerIndex);
      setTotalElapsedMs(newTotal);
      const isCorrect = answerIndex === QUIZ_DATA[qIndex].correct;
      const newAns: Answer = {
        question: qIndex,
        answer: answerIndex,
        correct: isCorrect,
        timeMs,
      };
      const next = [...answers, newAns];
      setAnswers(next);
      setTimeout(() => {
        if (qIndex < QUIZ_DATA.length - 1) {
          setQIndex((i) => i + 1);
          setSelected(null);
        } else {
          setScreen("reveal");
        }
      }, 280);
    },
    [selected, questionStart, totalElapsedMs, qIndex, answers],
  );

  const handleRevealDone = useCallback(() => {
    // Real play (not dev-skip) → commit the play and surface the badge popup.
    if (!user.todayPlayed && answers.length === QUIZ_DATA.length) {
      commitPlay();
      setScreen("badge-unlock");
      return;
    }
    setScreen("results");
  }, [user.todayPlayed, answers.length, commitPlay]);

  // No auto sign-in modal on landing (user call, 2026-06-11: it interfered
  // with the results moment). Auth is asked for at the point of intent only —
  // share / challenge / claim / profile taps route through onTriggerLogin.
  const handleBadgeUnlockDone = useCallback(() => {
    setScreen("results");
  }, []);

  // Auth succeeded → persist login (single source of truth across surfaces;
  // unlocks Results in place) and play the "saved" confirmation beat.
  const handleAuthed = useCallback(() => {
    updateUser({ loggedIn: true });
    setAuth({ open: false });
    setClaiming(true);
  }, [updateUser]);

  const handleClaimDone = () => {
    setClaiming(false);
    setClaimed(true);
  };

  const handlePlayAgain = () => {
    // Members get one shot a day — bounce to the locked card instead of a
    // fresh round. Guests can replay freely (their result was never saved).
    if (user.loggedIn && user.todayPlayed) {
      setForceLock(true);
      return;
    }
    setQIndex(0);
    setAnswers([]);
    setSelected(null);
    setTotalElapsedMs(0);
    setScreen("countdown");
  };

  // Effective answers — use real if we have them, otherwise synth for direct nav
  const displayAnswers = answers.length === QUIZ_DATA.length ? answers : synthAnswers(prefs);
  const displayTime = totalElapsedMs > 0 ? totalElapsedMs : 38000;

  // Login is authoritative from persisted user state; prefs keeps the rank/
  // score/badge demo knobs. Results' `isGated` reads prefs.loggedIn, so feed it
  // the live value.
  const effectivePrefs = { ...prefs, loggedIn: user.loggedIn };

  // Replay lock — a logged-in member who already played today can't replay
  // (one shot a day). Guests are exempt (their result was never saved). QA
  // skip-params bypass it. Derived at render so it's robust to effect ordering.
  const isReplayLock =
    user.loggedIn &&
    user.todayPlayed &&
    readSkip() === null &&
    (!committedRef.current || forceLock);

  const shareData: ShareData = {
    score: prefs.scoreCorrect,
    total: QUIZ_DATA.length,
    squares: QUIZ_DATA.map((_, i) => i < prefs.scoreCorrect),
    rank: prefs.finalRank,
    of: TOTAL_PLAYERS_TODAY,
    streak: user.userStreak,
    dateAllCaps: TODAY.dateAllCaps,
    title: THEME_LABEL,
    earnedBadge: null,
    prevBadges: [],
  };

  // Hold a black frame on the very first paint so we don't flash the default
  // countdown when arriving via /play?skip=question from the home overlay.
  if (!hydrated) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          zIndex: 0,
        }}
        aria-hidden
      />
    );
  }

  // Member who already played today → one-shot-a-day lock (no replay).
  if (isReplayLock) {
    return (
      <>
        <GamesNav
          dark
          loggedIn={user.loggedIn}
          onSignIn={() =>
            openAuth({
              headline: "Save your streak",
              sub: "Sign in to save your streak, earn badges, and climb the board.",
            })
          }
        />
        <AlreadyPlayedCard
          variant="screen"
          streak={user.userStreak}
          onViewResults={() => setScreen("results")}
          onShare={() => setShare({ open: true })}
          onChallenge={() => {
            copyText(buildChallengeText(shareData.score, shareData.total));
            setChallengeCopied(true);
          }}
          onLeaderboard={() => { window.location.href = "/"; }}
        />
        <ShareCardModal
          open={share.open}
          data={shareData}
          onClose={() => setShare({ open: false })}
        />
        <CopyToast show={challengeCopied} onDone={() => setChallengeCopied(false)}>
          Challenge link copied. Send it.
        </CopyToast>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      {/* Persistent Complex Playground bar — stays up through the whole flow */}
      <GamesNav
        dark
        loggedIn={user.loggedIn}
        onSignIn={() =>
          openAuth({
            headline: "Save your streak",
            sub: "Sign in to save your streak, earn badges, and climb the board.",
          })
        }
      />

      {screen === "countdown" && (
        <Countdown onDone={() => setScreen("question")} />
      )}

      {screen === "question" && (
        <Question
          index={qIndex}
          totalElapsedMs={totalElapsedMs}
          selected={selected}
          onAnswer={handleAnswer}
        />
      )}

      {screen === "reveal" && (
        <Reveal
          answers={displayAnswers}
          totalElapsedMs={displayTime}
          prefs={prefs}
          onDone={handleRevealDone}
          /* A badge-unlock screen follows only on a fresh, complete real play
             (same branch handleRevealDone takes) — otherwise it's results. */
          badgeNext={!user.todayPlayed && answers.length === QUIZ_DATA.length}
        />
      )}

      {screen === "badge-unlock" && pendingBadge && (
        <BadgeUnlockedPopup
          badge={pendingBadge}
          newStreak={celebrationStreak}
          backdrop="pixels"
          onContinue={handleBadgeUnlockDone}
        />
      )}

      {screen === "results" && (
        <Results
          prefs={effectivePrefs}
          answers={displayAnswers}
          totalElapsedMs={displayTime}
          claimed={claimed}
          onTriggerLogin={() => openAuth(gatedAuthCopy(effectivePrefs))}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* Site footer — results only. The question/reveal/badge screens are
          fixed full-viewport moments; a flow footer behind them bleeds through
          their translucent scrims (user-reported). */}
      {screen === "results" && <SiteFooter />}

      <AuthModal
        open={auth.open}
        onClose={() => setAuth({ open: false })}
        headline={auth.headline}
        sub={auth.sub}
        onAuthed={handleAuthed}
      />

      {claiming && <ClaimConfirm onDone={handleClaimDone} />}
    </>
  );
}
