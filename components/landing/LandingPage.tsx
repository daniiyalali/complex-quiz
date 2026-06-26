"use client";

/**
 * 5 FOR 5 — Pre-quiz landing (Apple Light system).
 *
 * A light, elevated sibling to the dark quiz flow. Serves three visitor
 * states from one page (BRD Module 8): guest, returning (logged-in,
 * not-played-today), played (logged-in, played-today). A floating dev
 * switcher (bottom-right) flips between them for review.
 *
 * Motion: scroll-triggered entrance (spring), staggered grids, count-up
 * stats, spring hover-lift. All reduced-motion safe.
 *
 * Patterns sourced via 21st.dev (bento stagger, bounce-card hover, podium
 * leaderboard, radial progress ring) and re-implemented in the project's
 * CSS-Modules + framer-motion idiom (no Tailwind/shadcn in this repo).
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  animate,
  type Variants,
} from "framer-motion";
import {
  Play, ArrowRight, Crown, Flame, Share2, Lock, Check, Users, Target, Sun, Moon, Menu, X,
} from "lucide-react";
import { TODAY } from "@/lib/today";
import { buildLeaderboard, BADGES, type LbRow } from "@/lib/quiz-data";
import { DEFAULT_STREAK, nearestMission } from "@/lib/streak-data";
import { useUserState, visitorPhase } from "@/lib/user-state";
import { BadgeMark } from "@/components/badges/BadgeIcon";
import { LedBackdrop } from "@/components/quiz/LedBackdrop";
import { AuthModal } from "@/components/quiz/AuthModal";
import { ShareCardModal, type ShareData } from "@/components/share/ShareCardModal";
import { CopyToast } from "@/components/ui/CopyToast";
import { buildChallengeText, copyText } from "@/lib/share";
import { GamesNav } from "./GamesNav";
import { PixelTrail } from "@/components/ui/pixel-trail";
import { GooeyFilter } from "@/components/ui/gooey-filter";
import { LeaderboardRankings } from "./LeaderboardRankings";
import { StreakCalendar } from "./StreakCalendar";
import { AchievementList } from "./AchievementList";
import { CommitsGrid } from "./CommitsGrid";
import styles from "./LandingPage.module.css";

/* ─────────────────────────── visitor state ─────────────────────────── */

type Visitor = "guest" | "returning" | "played";
type Mode = "light" | "dark";

/* One place every gated action calls to raise the "Join 5 for 5" screen.
   Avoids prop-drilling through every module. */
type AuthOpts = { headline?: string; sub?: string };
const AuthCtx = createContext<(opts?: AuthOpts) => void>(() => {});
const useAuth = () => useContext(AuthCtx);

/* Same pattern for the share/challenge sheet. */
type ShareVariant = "share" | "challenge";
const ShareCtx = createContext<(variant?: ShareVariant) => void>(() => {});
const useShare = () => useContext(ShareCtx);

/* URL-param helpers — let the Figma export drive each state via the URL
   (?mode=dark&state=played&nav=open) and a ?capture=1 / #figmacapture flag that
   reveals all whileInView sections (the html-to-design snapshot doesn't scroll). */
const urlParam = (key: string): string | null =>
  typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(key);
const isCaptureMode = (): boolean =>
  typeof window !== "undefined" &&
  (urlParam("capture") === "1" || window.location.hash.includes("figmacapture"));

const PLAYED = {
  score: 4,
  total: 5,
  rank: 47,
  of: 12840,
  time: "0:42",
  squares: [true, true, false, true, true] as boolean[],
  beat: 12793,
};

/* ─────────────────────────── content data ──────────────────────────── */

type Vertical = {
  key: string;
  name: string;
  theme: string;
  players: number;
  avg: string;
  status: "active" | "open";
  score?: number;
};

const VERTICALS: Vertical[] = [
  { key: "sneakers", name: "Sneakers", theme: "Iconic Collabs", players: 12840, avg: "3.2", status: "active", score: 4 },
  { key: "hiphop", name: "Hip Hop", theme: "The Verzuz Era", players: 9120, avg: "3.5", status: "open" },
  { key: "style", name: "Style", theme: "Runway to Street", players: 6740, avg: "2.9", status: "open" },
  { key: "sports", name: "Sports", theme: "Dynasty Years", players: 8310, avg: "3.1", status: "open" },
  { key: "pop", name: "Pop Culture", theme: "2010s on Screen", players: 7050, avg: "3.4", status: "open" },
];

const HOW_FACTS = [
  { k: "5", label: "questions a day" },
  { k: "8AM", label: "ET drop, every day" },
  { k: "1", label: "shot, no replays" },
  { k: "⚡", label: "speed breaks ties" },
];

const HOW_STEPS = [
  "A new 5-question quiz drops at 8:00 AM ET.",
  "You get one attempt. Answer fast. Speed breaks ties.",
  "Play any day to keep your weekly streak going. A missed day won't break it. Play every day to grow the flame.",
  "Hit milestones to unlock collectible badges and climb the daily, weekly, and all-time boards.",
];

const ARCHIVE_THEMES = [
  ["Iconic Collabs", "Sneakers"], ["Jordan Dynasty", "Sneakers"], ["The Verzuz Era", "Hip Hop"],
  ["Runway to Street", "Style"], ["Dynasty Years", "Sports"], ["2010s on Screen", "Pop Culture"],
  ["Grail Drops", "Sneakers"], ["Mixtape Run", "Hip Hop"], ["Logomania", "Style"],
  ["Buzzer Beaters", "Sports"], ["Sample Season", "Hip Hop"], ["Air Maxes", "Sneakers"],
  ["Red Carpet", "Style"], ["Award Szn", "Pop Culture"],
];

/* ─────────────────────────────── icons ─────────────────────────────── */

// Real icon set (lucide). Aliased to keep call sites stable.
type IconProps = { size?: number; className?: string };
const IconPlay = (p: IconProps) => <Play {...p} fill="currentColor" strokeWidth={0} />;
const IconArrow = (p: IconProps) => <ArrowRight {...p} />;
const IconCrown = (p: IconProps) => <Crown {...p} />;
const IconFlame = (p: IconProps) => <Flame {...p} />;
const IconShare = (p: IconProps) => <Share2 {...p} />;
const IconLock = (p: IconProps) => <Lock {...p} />;
const IconCheck = (p: IconProps) => <Check {...p} />;
const IconUsers = (p: IconProps) => <Users {...p} />;
const IconTarget = (p: IconProps) => <Target {...p} />;

/* ───────────────────────────── motion bits ─────────────────────────── */

const reveal: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18, mass: 0.7 } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 140, damping: 17 } },
};

function Reveal({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" }) {
  const M = as === "section" ? motion.section : motion.div;
  return (
    <M className={className} variants={reveal} initial="hidden" whileInView="show"
      viewport={{ once: true, margin: "-12% 0px" }}>
      {children}
    </M>
  );
}

/** Count up to a number when scrolled into view. Reduced-motion → snaps. */
function CountUp({ to, className, suffix = "" }: { to: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration: 1.3,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, reduce]);
  const shown = reduce ? to : val;
  return <span ref={ref} className={className}>{Math.round(shown).toLocaleString()}{suffix}</span>;
}

/* ───────────────────────────── section head ────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>;
}

/* ════════════════════════════════ NAV ══════════════════════════════ */

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#board", label: "Leaderboard" },
  { href: "#verticals", label: "Categories" },
  { href: "#archive", label: "Archive" },
];

function ThemeSwitch({ mode, onToggle }: { mode: Mode; onToggle: () => void }) {
  return (
    <button className={styles.themeSwitch} onClick={onToggle} role="switch"
      aria-checked={mode === "dark"} aria-label="Dark mode" data-apple-press data-mode={mode}>
      <Sun size={13} className={styles.tsSun} />
      <Moon size={13} className={styles.tsMoon} />
      <span className={styles.tsKnob} />
    </button>
  );
}

function Nav({ visitor, mode, onToggle }: { visitor: Visitor; mode: Mode; onToggle: () => void }) {
  const [open, setOpen] = useState(() => urlParam("nav") === "open");
  const openAuth = useAuth();
  return (
    <motion.nav className={styles.nav} data-open={open}
      initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 20, delay: 0.1 }}>
      <div className={styles.navBar}>
        <a href="#top" className={styles.logo} aria-label="5 for 5 home" onClick={() => setOpen(false)}>
          <span className={styles.logoMark}>5<span className={styles.logoSlash}>/</span>5</span>
        </a>
        <div className={styles.navLinks}>
          {NAV_LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </div>
        <div className={styles.navRight}>
          <ThemeSwitch mode={mode} onToggle={onToggle} />
          <div className={styles.navAuth}>
            {visitor === "guest" ? (
              <>
                <button type="button" className={styles.navGhost} onClick={() => openAuth()}>Sign in</button>
                <button type="button" className={styles.navCta} data-apple-press
                  onClick={() => openAuth({ headline: "Create your free account", sub: "Join 5 for 5 to track your streak, climb the leaderboard, and earn badges." })}>
                  Create account
                </button>
              </>
            ) : (
              <div className={styles.navUser}>
                <span className={styles.navStreak}><IconFlame size={14} />{DEFAULT_STREAK.dayStreak}</span>
                <span className={styles.avatar} aria-label="Your profile">AK</span>
              </div>
            )}
          </div>
          <button className={styles.hamburger} onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} data-apple-press>
            <AnimatePresence mode="wait" initial={false}>
              {open
                ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.16 }}><X size={20} /></motion.span>
                : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.16 }}><Menu size={20} /></motion.span>}
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className={styles.navSheet}
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 30 }}>
            <div className={styles.navSheetInner}>
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className={styles.navSheetLink} onClick={() => setOpen(false)}>
                  {l.label}<IconArrow size={16} />
                </a>
              ))}
              {visitor === "guest" ? (
                <div className={styles.navSheetAuth}>
                  <button type="button" className={styles.btnGhostSm}
                    onClick={() => { setOpen(false); openAuth(); }}>Sign in</button>
                  <button type="button" className={styles.btnPrimarySm} data-apple-press
                    onClick={() => { setOpen(false); openAuth({ headline: "Create your free account", sub: "Join 5 for 5 to track your streak, climb the leaderboard, and earn badges." }); }}>
                    Create account
                  </button>
                </div>
              ) : (
                <div className={styles.navSheetUser}>
                  <span className={styles.avatar} aria-hidden>AK</span>
                  <span className={styles.navSheetName}>Anusha</span>
                  <span className={styles.navStreak}><IconFlame size={14} />{DEFAULT_STREAK.dayStreak}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ═══════════════════════ MODULE 1 — DAILY ENTRY ════════════════════ */

function Hero({ visitor, mode }: { visitor: Visitor; mode: Mode }) {
  const total = buildLeaderboard("TODAY", "GLOBAL").total;
  const reduce = useReducedMotion();
  const openAuth = useAuth();
  return (
    <header className={styles.hero} id="top">
      <LedBackdrop color={mode === "dark" ? "#00FF85" : "#1D1D1F"} />
      <div className={styles.heroScrim} aria-hidden />
      {!reduce && (
        <div className={styles.cursorLayer} aria-hidden>
          <PixelTrail
            pixelSize={28}
            delay={380}
            fadeDuration={420}
            pixelColor={mode === "dark" ? "rgba(255,255,255,0.55)" : "rgba(29,29,31,0.5)"}
          />
        </div>
      )}
      <motion.div className={styles.heroInner}
        initial="hidden" animate="show" variants={stagger}>
        <motion.div className={styles.heroKicker} variants={item}>
          <span className={styles.live}><i />{TODAY.dateAllCaps} · {TODAY.opensAt}</span>
          <span className={styles.catPill}>{TODAY.category}</span>
        </motion.div>

        <motion.h1 className={styles.heroTitle} variants={item}>
          Five questions.<br />
          <span className={styles.heroAccent}>One shot</span> a day.
        </motion.h1>

        <motion.p className={styles.heroSub} variants={item}>
          Today&apos;s drop: <strong>{TODAY.title}</strong>. Go {TODAY.questionCount} for {TODAY.questionCount},
          beat the clock, and stake your spot before the board locks.
        </motion.p>

        <AnimatePresence mode="wait">
          <motion.div className={styles.heroActions} key={visitor}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}>
            {visitor === "played" ? (
              <PlayedSummary />
            ) : (
              <>
                <a href="/" className={styles.btnPrimary} data-apple-press>
                  <IconPlay size={18} />
                  {visitor === "returning" ? "Play today's quiz" : "Play today"}
                </a>
                {visitor === "guest" ? (
                  <button type="button" className={styles.btnGhost}
                    onClick={() => openAuth({ headline: "Save your score", sub: "Sign in first so today's result counts toward your streak and rank." })}>
                    Sign in to save your score
                  </button>
                ) : (
                  <span className={styles.streakNudge}>
                    <IconFlame size={16} /> Keep your <strong>{DEFAULT_STREAK.dayStreak}-day</strong> streak alive
                  </span>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.dl className={styles.heroStats} variants={item}>
          <div><dt>Playing today</dt><dd><CountUp to={total} /></dd></div>
          <div><dt>Community avg</dt><dd>{TODAY.avgScore}</dd></div>
          <div><dt>Avg time</dt><dd className={styles.mono}>0:48</dd></div>
        </motion.dl>
      </motion.div>
    </header>
  );
}

function PlayedSummary() {
  const openShare = useShare();
  return (
    <div className={styles.playedCard}>
      <div className={styles.playedTop}>
        <div>
          <span className={styles.playedLabel}>You played today</span>
          <div className={styles.playedScore}>
            <span className={styles.mono}>{PLAYED.score}</span>
            <span className={styles.playedSlash}>/ {PLAYED.total}</span>
          </div>
        </div>
        <div className={styles.playedMeta}>
          <span>Rank <strong className={styles.mono}>#{PLAYED.rank}</strong> of {PLAYED.of.toLocaleString()}</span>
          <span>Time <strong className={styles.mono}>{PLAYED.time}</strong></span>
        </div>
      </div>
      <div className={styles.squares}>
        {PLAYED.squares.map((ok, i) => (
          <span key={i} className={ok ? styles.sqOk : styles.sqNo} />
        ))}
      </div>
      <div className={styles.playedActions}>
        <button type="button" className={styles.btnPrimarySm} data-apple-press onClick={() => openShare("share")}><IconShare size={15} />Share</button>
        <button type="button" className={styles.btnGhostSm} onClick={() => openShare("challenge")}>Challenge a friend</button>
        <a href="#board" className={styles.btnGhostSm}>View board</a>
      </div>
    </div>
  );
}

/* ═══════════════════════ MODULE 2 — HOW IT WORKS ═══════════════════ */

function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <Reveal as="section" className={styles.section}>
      <div className={styles.sectionHead}>
        <Eyebrow>How it works</Eyebrow>
        <h2 className={styles.h2}>Simple to start. Hard to stop.</h2>
      </div>

      <motion.div className={styles.howGrid} variants={stagger} initial="hidden"
        whileInView="show" viewport={{ once: true, margin: "-10% 0px" }}>
        <motion.article className={styles.howCardBig} variants={item}>
          <span className={styles.howIcon}><IconTarget size={22} /></span>
          <h3>The Daily</h3>
          <p>Five questions on one theme. One attempt. The faster you lock in correct answers,
            the higher you climb. Speed is the tiebreaker.</p>
          <div className={styles.factRow}>
            {HOW_FACTS.map((f) => (
              <div key={f.label} className={styles.fact}>
                <span className={styles.factK}>{f.k}</span>
                <span className={styles.factL}>{f.label}</span>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article className={styles.howCard} variants={item}>
          <span className={styles.howIcon}><IconFlame size={22} /></span>
          <h3>The Long Game</h3>
          <p>Play every day to build a streak. Hit milestones, like 7, 30, 100, 365 days, perfect
            scores, and podium finishes, to unlock collectible badges and crowns.</p>
          <button className={styles.linkBtn} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "Hide walkthrough" : "Full walkthrough"} <IconArrow size={15} />
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.ol className={styles.steps}
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }}>
                {HOW_STEPS.map((s, i) => (
                  <li key={i}><span className={styles.stepNum}>{i + 1}</span>{s}</li>
                ))}
              </motion.ol>
            )}
          </AnimatePresence>
        </motion.article>
      </motion.div>
    </Reveal>
  );
}

/* ═══════════════════════ MODULE 5 — VERTICALS ══════════════════════ */

function Verticals() {
  return (
    <Reveal as="section" className={styles.section} >
      <div id="verticals" className={styles.anchor} />
      <div className={styles.sectionHead}>
        <Eyebrow>Browse by category</Eyebrow>
        <h2 className={styles.h2}>Five worlds. One every day.</h2>
        <p className={styles.sectionSub}>Today&apos;s drop is in Sneakers. The rest are live to play too.</p>
      </div>
      <motion.div className={styles.vertGrid} variants={stagger} initial="hidden"
        whileInView="show" viewport={{ once: true, margin: "-8% 0px" }}>
        {VERTICALS.map((v) => (
          <motion.a key={v.key} href="/" variants={item}
            className={`${styles.vertCard} ${v.status === "active" ? styles.vertActive : ""}`}
            whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}>
            {v.status === "active" && <span className={styles.vertBadge}>Today&apos;s drop</span>}
            <span className={styles.vertName}>{v.name}</span>
            <span className={styles.vertTheme}>{v.theme}</span>
            <div className={styles.vertFoot}>
              <span><CountUp to={v.players} /> playing</span>
              {v.score != null ? (
                <span className={styles.vertScore}><IconCheck size={13} />{v.score}/5</span>
              ) : (
                <span className={styles.vertAvg}>avg {v.avg}/5</span>
              )}
            </div>
          </motion.a>
        ))}
      </motion.div>
    </Reveal>
  );
}

/* ═══════════════════════ MODULE 4 — LEADERBOARD ════════════════════ */

const TABS = [
  { k: "TODAY", label: "Today" },
  { k: "WEEK", label: "This Week" },
  { k: "ALLTIME", label: "All-Time" },
] as const;

function Leaderboard({ visitor }: { visitor: Visitor }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("TODAY");
  const { rows, total } = buildLeaderboard(tab, "GLOBAL");
  const podium = rows.slice(0, 3);
  const list = rows.slice(3, 10);
  const order = [1, 0, 2]; // visual podium order: 2nd, 1st, 3rd

  return (
    <Reveal as="section" className={styles.sectionAlt}>
      <div id="board" className={styles.anchor} />
      <div className={styles.boardWrap}>
        <div className={styles.sectionHead}>
          <Eyebrow>Leaderboard</Eyebrow>
          <h2 className={styles.h2}>Who&apos;s winning right now.</h2>
        </div>

        <div className={styles.boardLayout}>
          <div className={styles.boardMain}>
            <div className={styles.tabs} role="tablist">
              {TABS.map((t) => (
                <button key={t.k} role="tab" aria-selected={tab === t.k}
                  className={`${styles.tab} ${tab === t.k ? styles.tabOn : ""}`}
                  onClick={() => setTab(t.k)}>
                  {tab === t.k && <motion.span layoutId="tabPill" className={styles.tabPill}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }} />}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.podium}>
              {order.map((idx, slot) => {
                const r = podium[idx];
                const place = idx + 1;
                return (
                  <motion.div key={r.rank} className={`${styles.pod} ${styles["pod" + place]}`}
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ type: "spring", stiffness: 150, damping: 16, delay: slot * 0.08 }}>
                    {place === 1 && <IconCrown size={26} className={styles.podCrown} />}
                    <span className={styles.podAvatar} data-place={place}>{r.name.slice(0, 2)}</span>
                    <span className={styles.podName}>{r.name}</span>
                    <span className={styles.podScore}><b className={styles.mono}>{r.correct}/5</b> · {r.time}</span>
                    <span className={styles.podRank}>{place}</span>
                  </motion.div>
                );
              })}
            </div>

            <LeaderboardRankings
              rows={list}
              you={visitor === "played"
                ? { rank: PLAYED.rank, name: "ANUSHA", correct: PLAYED.score, time: PLAYED.time }
                : undefined}
            />
          </div>

          <aside className={styles.boardRail}>
            <div className={styles.railCard}>
              <span className={styles.railTitle}>Today</span>
              <div className={styles.railStat}>
                <span className={styles.railNum}><CountUp to={total} /></span>
                <span>players in</span>
              </div>
              <div className={styles.railStat}>
                <span className={styles.railNum}>{TODAY.avgScore}</span>
                <span>community average</span>
              </div>
              <div className={styles.railStat}>
                <span className={`${styles.railNum} ${styles.mono}`}>0:48</span>
                <span>average time</span>
              </div>
            </div>
            {visitor === "played" ? (
              <div className={styles.railResult}>
                <span className={styles.railTitle}>Your result</span>
                <div className={styles.railScore}><span className={styles.mono}>{PLAYED.score}/5</span> · #{PLAYED.rank}</div>
                <span className={styles.railBeat}>You beat <strong>{PLAYED.beat.toLocaleString()}</strong> players today.</span>
              </div>
            ) : (
              <PersonalRow visitor={visitor} />
            )}
          </aside>
        </div>
      </div>
    </Reveal>
  );
}

function LbRowItem({ row, you }: { row: LbRow; you?: boolean }) {
  return (
    <li className={`${styles.lbRow} ${you ? styles.lbYou : ""}`}>
      <span className={styles.lbRank + " " + styles.mono}>{row.rank}</span>
      <span className={styles.lbAvatar}>{row.name.slice(0, 2)}</span>
      <span className={styles.lbName}>{row.name}{you && <em> · you</em>}</span>
      <span className={styles.lbScore + " " + styles.mono}>{row.correct}/5</span>
      <span className={styles.lbTime + " " + styles.mono}>{row.time}</span>
    </li>
  );
}

function PersonalRow({ visitor }: { visitor: Visitor }) {
  const openAuth = useAuth();
  if (visitor === "played") {
    return (
      <div className={styles.youAnchor}>
        <LbRowItem you row={{ rank: PLAYED.rank, name: "ANUSHA", correct: PLAYED.score, time: PLAYED.time }} />
        <span className={styles.beat}>You beat <strong>{PLAYED.beat.toLocaleString()}</strong> players today</span>
      </div>
    );
  }
  if (visitor === "returning") {
    return (
      <a href="/" className={styles.youCta} data-apple-press>
        <span><IconTarget size={16} /> Play today to get on the board</span>
        <IconArrow size={16} />
      </a>
    );
  }
  return (
    <button type="button" className={styles.youCta} data-apple-press
      onClick={() => openAuth({ headline: "Claim your spot", sub: "Sign in to compete on the leaderboard and see exactly where you rank." })}>
      <span><IconLock size={15} /> Sign in to compete and rank</span>
      <IconArrow size={16} />
    </button>
  );
}

/* ═══════════════════════ MODULE 6 — STREAK & BADGES ════════════════ */

function StreakBadges({ visitor }: { visitor: Visitor }) {
  const loggedIn = visitor !== "guest";
  const s = DEFAULT_STREAK;
  const mission = nearestMission(s);
  const pct = Math.round((mission.progress / mission.total) * 100);
  const remaining = mission.total - mission.progress;

  return (
    <Reveal as="section" className={styles.section}>
      <GooeyFilter id="badge-goo" strength={14} />
      <div className={styles.gooeyBg} style={{ filter: "url(#badge-goo)" }} aria-hidden>
        <span /><span /><span />
      </div>
      <div className={styles.sectionHead}>
        <Eyebrow>Streaks &amp; badges</Eyebrow>
        <h2 className={styles.h2}>{loggedIn ? "Your run so far." : "Earn it, keep it, show it."}</h2>
      </div>

      {loggedIn ? (
        <div className={styles.streakStack}>
        <div className={styles.streakGrid}>
          <div className={styles.streakHero}>
            <Ring pct={pct} center={
              <>
                <IconFlame size={26} className={styles.ringFlame} />
                <span className={styles.ringNum + " " + styles.mono}>{s.dayStreak}</span>
                <span className={styles.ringCap}>day streak</span>
              </>
            } />
            <div className={styles.streakNext}>
              <span className={styles.nextLabel}>Next badge</span>
              <strong className={styles.nextName}>{mission.badgeName}</strong>
              <span className={styles.nextMeta}>{remaining} more {mission.unit} · {pct}% there</span>
              <div className={styles.bar}><motion.span
                initial={{ width: 0 }} whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }} transition={{ type: "spring", stiffness: 80, damping: 18 }} /></div>
            </div>
          </div>

          <div className={styles.recent}>
            <span className={styles.recentLabel}>Recently earned</span>
            <div className={styles.recentBadge}>
              <BadgeMark icon="perfect-score" size={48} />
              <div><strong>Perfect Score</strong><span>Scored 5/5 · top 4.2%</span></div>
            </div>
            <div className={styles.totalBadges}>
              <span className={styles.mono}>3</span> of {BADGES.length} badges earned
            </div>
          </div>
        </div>
          <StreakCalendar weeks={14} currentStreak={s.dayStreak} />
          <AchievementList earnedIds={["first-play", "streak-7", "perfect-score"]} />
        </div>
      ) : (
        <div className={styles.streakStack}>
          <AchievementList earnedIds={[]} />
        </div>
      )}
    </Reveal>
  );
}

/** Conic-gradient progress ring with a content slot in the middle. */
function Ring({ pct, center }: { pct: number; center: React.ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, pct, { duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94], onUpdate: (v) => setP(v) });
    return () => c.stop();
  }, [inView, pct, reduce]);
  const shown = reduce ? pct : p;
  return (
    <div ref={ref} className={styles.ring}
      style={{ background: `conic-gradient(var(--l-accent) ${shown * 3.6}deg, var(--l-surface-3) 0deg)` }}>
      <div className={styles.ringInner}>{center}</div>
    </div>
  );
}

/* ═══════════════════════ MODULE 3 — COMMUNITY ══════════════════════ */

function Community({ visitor }: { visitor: Visitor }) {
  const total = buildLeaderboard("ALLTIME", "GLOBAL").total;
  const today = buildLeaderboard("TODAY", "GLOBAL").total;
  const openAuth = useAuth();
  const openShare = useShare();

  if (visitor === "played") {
    return (
      <Reveal as="section" className={styles.section}>
        <div className={styles.cardC}>
          <div>
            <Eyebrow>Challenge friends</Eyebrow>
            <h2 className={styles.h2}>You went {PLAYED.score} for {PLAYED.total} today.</h2>
            <p className={styles.sectionSub}>Send your score straight to the group chat and see who folds.</p>
          </div>
          <div className={styles.cardCActions}>
            <button type="button" className={styles.btnPrimary} data-apple-press onClick={() => openShare("challenge")}><IconShare size={17} />Challenge a friend</button>
            <button type="button" className={styles.btnGhost} onClick={() => openShare("share")}>Share score</button>
          </div>
        </div>
      </Reveal>
    );
  }

  if (visitor === "returning") {
    return (
      <Reveal as="section" className={styles.section}>
        <div className={styles.cardIn}>
          <span className={styles.inFlame}><IconFlame size={20} /></span>
          <div><strong>You&apos;re in.</strong> {DEFAULT_STREAK.dayStreak}-day streak going. Play today to keep it climbing.</div>
          <a href="/" className={styles.btnPrimarySm} data-apple-press>Play now</a>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal as="section" className={styles.section}>
      <div className={styles.sectionHead}>
        <Eyebrow>Join the community</Eyebrow>
        <h2 className={styles.h2}>Why make an account?</h2>
      </div>
      <motion.div className={styles.joinGrid} variants={stagger} initial="hidden"
        whileInView="show" viewport={{ once: true, margin: "-8% 0px" }}>
        <motion.div className={styles.joinCard} variants={item} whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}>
          <span className={styles.joinIcon}><IconFlame size={22} /></span>
          <h3>Play and track</h3>
          <p>Build your streak, earn badges, keep every score. Your whole history lives in one place.</p>
          <div className={styles.joinStat}><CountUp to={total} /> registered · <CountUp to={today} /> played today</div>
          <button type="button" className={styles.btnPrimarySm} data-apple-press
            onClick={() => openAuth({ headline: "Create your free account", sub: "Build your streak, earn badges, and keep every score in one place." })}>
            Create free account
          </button>
        </motion.div>
        <motion.div className={styles.joinCard} variants={item} whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}>
          <span className={styles.joinIcon}><IconUsers size={22} /></span>
          <h3>Compete on the board</h3>
          <p><strong><CountUp to={today} /></strong> players are battling today. See exactly where you rank against the city.</p>
          <div className={styles.joinStat}><IconCrown size={14} /> Top today: <strong>KICKSGOD22</strong> · 5/5 · 0:16</div>
          <button type="button" className={styles.btnGhostSm}
            onClick={() => openAuth({ headline: "Claim your spot", sub: "Sign in to compete on the leaderboard and see exactly where you rank." })}>
            Sign in to compete
          </button>
        </motion.div>
      </motion.div>
    </Reveal>
  );
}

/* ═══════════════════════ MODULE 7 — ARCHIVE ════════════════════════ */

function Archive({ visitor }: { visitor: Visitor }) {
  const loggedIn = visitor !== "guest";
  // Deterministic mock: count days down from today's issue number.
  const days = ARCHIVE_THEMES.map(([theme, vertical], i) => {
    const dayNum = TODAY.dayNumber - i;
    const played = loggedIn && i % 3 !== 0 && i < 9;
    return {
      dayNum, theme, vertical,
      label: i === 0 ? "Today" : `Day ${dayNum}`,
      avg: (2.7 + ((i * 7) % 13) / 10).toFixed(1),
      played,
      score: played ? 3 + (i % 3) : null,
    };
  });
  return (
    <Reveal as="section" className={styles.sectionAlt}>
      <div id="archive" className={styles.anchor} />
      <div className={styles.boardWrap}>
        <div className={styles.sectionHead}>
          <Eyebrow>Archive</Eyebrow>
          <h2 className={styles.h2}>Missed a day? Catch up.</h2>
          <p className={styles.sectionSub}>The last two weeks of drops.{!loggedIn && " Sign in to track which ones you've played."}</p>
        </div>
        <div className={styles.archiveScroll}>
          {days.map((d, i) => (
            <motion.a key={d.dayNum} href="/" className={`${styles.archCard} ${i === 0 ? styles.archToday : ""}`}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 160, damping: 18, delay: Math.min(i, 8) * 0.04 }}
              whileHover={{ y: -5 }}>
              <div className={styles.archTop}>
                <span className={styles.archDay}>{d.label}</span>
                {loggedIn && (
                  <span className={d.played ? styles.dotDone : styles.dotOpen}
                    aria-label={d.played ? "Played" : "Not played"} />
                )}
              </div>
              <strong className={styles.archTheme}>{d.theme}</strong>
              <span className={styles.archVert}>{d.vertical}</span>
              <div className={styles.archFoot}>
                {d.score != null
                  ? <span className={styles.archScore}><IconCheck size={12} />{d.score}/5</span>
                  : <span className={styles.archAvg}>avg {d.avg}</span>}
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════ MODULE 9 — SHARE / CHALLENGE ══════════════ */

function ShareCta({ visitor }: { visitor: Visitor }) {
  const openShare = useShare();
  if (visitor !== "played") return null;
  const shareText = `Went ${PLAYED.score} for ${PLAYED.total} today. #${PLAYED.rank} of ${PLAYED.of.toLocaleString()}. ${DEFAULT_STREAK.dayStreak}-day streak. Can you beat it?`;
  return (
    <Reveal as="section" className={styles.section}>
      <div id="share" className={styles.anchor} />
      <div className={styles.shareWrap}>
        <div className={styles.shareCard}>
          <span className={styles.shareLogo}>5<span className={styles.logoSlash}>/</span>5</span>
          <span className={styles.shareDate}>{TODAY.dateAllCaps} · {TODAY.title}</span>
          <div className={styles.shareScore}>
            <span className={styles.mono}>{PLAYED.score}</span><span>/{PLAYED.total}</span>
          </div>
          <div className={styles.squaresBig}>
            {PLAYED.squares.map((ok, i) => <span key={i} className={ok ? styles.sqOk : styles.sqNo} />)}
          </div>
          <div className={styles.shareMeta}>
            <span>#{PLAYED.rank} of {PLAYED.of.toLocaleString()}</span>
            <span><IconFlame size={13} />{DEFAULT_STREAK.dayStreak}-day streak</span>
          </div>
        </div>
        <div className={styles.shareSide}>
          <Eyebrow>Share &amp; challenge</Eyebrow>
          <h2 className={styles.h2}>Make them prove it.</h2>
          <p className={styles.shareCopy}>&ldquo;{shareText}&rdquo;</p>
          <div className={styles.shareBtns}>
            <button className={styles.btnPrimary} data-apple-press onClick={() => openShare("share")}><IconShare size={17} />Share story card</button>
            <button className={styles.btnGhost} onClick={() => openShare("challenge")}>Copy challenge link</button>
          </div>
          <span className={styles.shareNote}>9:16 for Stories · 1:1 for feed · deep link drops them straight into today&apos;s quiz.</span>
        </div>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════ FOOTER ════════════════════════════ */

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerMark}><CommitsGrid text="5/5" /></div>
      <p>A daily game by <strong>Complex</strong>. New drop every morning, 8AM ET.</p>
      <a href="/" className={styles.btnPrimary} data-apple-press><IconPlay size={17} />Play today&apos;s quiz</a>
    </footer>
  );
}

/* ═══════════════════════════ DEV STATE SWITCHER ════════════════════ */

function StateSwitcher({ visitor, set }: { visitor: Visitor; set: (v: Visitor) => void }) {
  const opts: { k: Visitor; label: string }[] = [
    { k: "guest", label: "Guest" },
    { k: "returning", label: "Logged in" },
    { k: "played", label: "Played today" },
  ];
  return (
    <div className={styles.switcher} role="group" aria-label="Preview visitor state">
      <span className={styles.switcherLabel}>State</span>
      {opts.map((o) => (
        <button key={o.k} className={`${styles.switBtn} ${visitor === o.k ? styles.switOn : ""}`}
          onClick={() => set(o.k)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════ PAGE ══════════════════════════════ */

export default function LandingPage() {
  const [user, updateUser] = useUserState();
  // Defer client-only reads (isCaptureMode hashes) until after mount so the
  // StateSwitcher's presence matches the server render — avoids a hydration
  // mismatch on `/home#figmacapture`.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const stateParam = urlParam("state");
  const [visitor, setVisitor] = useState<Visitor>(() =>
    stateParam === "returning" || stateParam === "played" ? stateParam : "guest",
  );
  const [mode, setMode] = useState<Mode>(() => (urlParam("mode") === "dark" ? "dark" : "light"));
  const [auth, setAuth] = useState<{ open: boolean } & AuthOpts>({ open: false });
  const openAuth = useCallback((opts?: AuthOpts) => setAuth({ open: true, ...opts }), []);

  // Keep the local visitor state in sync with persisted login × todayPlayed so
  // signing in / playing on the dark surfaces carries through here. An explicit
  // `?state=` URL param (Figma capture) wins over the persisted state.
  useEffect(() => {
    if (stateParam === "returning" || stateParam === "played" || stateParam === "guest") return;
    const phase = visitorPhase(user);
    setVisitor(phase === "member-played" ? "played" : phase === "member-ready" ? "returning" : "guest");
  }, [user.loggedIn, user.todayPlayed, stateParam]);

  // Flip the canonical persisted state alongside the local demo toggle, so the
  // StateSwitcher drives every surface (navigate to `/` to see the cabinet match).
  const setVisitorState = useCallback(
    (v: Visitor) => {
      setVisitor(v);
      if (v === "guest") updateUser({ loggedIn: false, todayPlayed: false });
      else if (v === "returning") updateUser({ loggedIn: true, todayPlayed: false });
      else
        updateUser({
          loggedIn: true,
          todayPlayed: true,
          userStreak: 12,
          userBestStreak: 12,
          userBadgeCount: 3,
          weeklyPlays: [true, true, true, true, true, true, false],
        });
    },
    [updateUser],
  );
  const [share, setShare] = useState<{ open: boolean }>({ open: false });
  const [challengeCopied, setChallengeCopied] = useState(false);
  // Share opens the card sheet; challenge is instant — copy the dare + /c
  // link and confirm with a toast (the link unfurl carries the framing).
  const openShare = useCallback((variant: ShareVariant = "share") => {
    if (variant === "challenge") {
      copyText(buildChallengeText());
      setChallengeCopied(true);
      return;
    }
    setShare({ open: true });
  }, []);

  // Figma capture: scroll through once so every whileInView section reveals and
  // stays revealed (once:true), then return to top before the snapshot fires.
  useEffect(() => {
    if (!isCaptureMode()) return;
    let y = 0;
    const tick = () => {
      y += Math.round(window.innerHeight * 0.85);
      window.scrollTo(0, y);
      if (y < document.documentElement.scrollHeight) window.setTimeout(tick, 90);
      else window.setTimeout(() => window.scrollTo(0, 0), 150);
    };
    const start = window.setTimeout(tick, 80);
    return () => window.clearTimeout(start);
  }, []);

  const shareData: ShareData = {
    score: PLAYED.score, total: PLAYED.total, squares: PLAYED.squares,
    rank: PLAYED.rank, of: PLAYED.of, streak: DEFAULT_STREAK.dayStreak,
    dateAllCaps: TODAY.dateAllCaps, title: TODAY.title, time: PLAYED.time,
    earnedBadge: null, // 4/5 today → no new badge; show the player's prior badges
    prevBadges: BADGES
      .filter((b) => ["first-play", "streak-7", "perfect-score"].includes(b.icon))
      .map((b) => ({ icon: b.icon, name: b.name })),
  };

  return (
    <AuthCtx.Provider value={openAuth}>
      <ShareCtx.Provider value={openShare}>
        <div className={`${styles.lightRoot} lightRoot`} data-mode={mode}>
          <GamesNav />
          <Nav visitor={visitor} mode={mode}
            onToggle={() => setMode((m) => (m === "light" ? "dark" : "light"))} />
          <Hero visitor={visitor} mode={mode} />
          <StatsStrip />
          <main className={styles.main}>
            <HowItWorks />
            <Verticals />
            <Leaderboard visitor={visitor} />
            <StreakBadges visitor={visitor} />
            <Community visitor={visitor} />
            <Archive visitor={visitor} />
            <ShareCta visitor={visitor} />
          </main>
          <Footer />
          {mounted && !isCaptureMode() && <StateSwitcher visitor={visitor} set={setVisitorState} />}
        </div>
        <AuthModal
          open={auth.open}
          onClose={() => setAuth({ open: false })}
          headline={auth.headline}
          sub={auth.sub}
          onAuthed={() => { updateUser({ loggedIn: true }); setVisitor("returning"); }}
        />
        <ShareCardModal
          open={share.open}
          data={shareData}
          onClose={() => setShare({ open: false })}
        />
        <CopyToast show={challengeCopied} onDone={() => setChallengeCopied(false)}>
          Challenge link copied. Send it.
        </CopyToast>
      </ShareCtx.Provider>
    </AuthCtx.Provider>
  );
}

/* ─────────────────── social-proof strip (under hero) ──────────────── */

function StatsStrip() {
  const all = buildLeaderboard("ALLTIME", "GLOBAL").total;
  const stats = [
    { n: all, label: "players registered", suffix: "" },
    { n: 365, label: "drops a year", suffix: "" },
    { n: BADGES.length, label: "badges to collect", suffix: "" },
    { n: 5, label: "categories", suffix: "" },
  ];
  return (
    <motion.div className={styles.proof} variants={stagger} initial="hidden"
      whileInView="show" viewport={{ once: true, margin: "-10% 0px" }}>
      {stats.map((s) => (
        <motion.div key={s.label} className={styles.proofItem} variants={item}>
          <span className={styles.proofNum + " " + styles.mono}><CountUp to={s.n} suffix={s.suffix} /></span>
          <span className={styles.proofLabel}>{s.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
