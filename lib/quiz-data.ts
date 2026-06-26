import type { BadgeIconKind } from "@/components/badges/BadgeIcon";

export const THEME_LABEL = "Iconic Collabs";

export type QuizQuestion = {
  question: string;
  options: string[];
  correct: number; // 0-3
};

export const QUIZ_DATA: QuizQuestion[] = [
  {
    question:
      "Which Air Jordan silhouette first carried Travis Scott's signature reverse Swoosh?",
    options: [
      "Air Jordan 1 High OG",
      "Air Jordan 4",
      "Air Force 1",
      "Nike SB Dunk Low",
    ],
    correct: 0,
  },
  {
    question:
      "How many silhouettes did Virgil Abloh deconstruct in his 'The Ten' collection with Nike?",
    options: ["10", "8", "12", "15"],
    correct: 0,
  },
  {
    question: "What signature design feature defines the Sacai × Nike LDWaffle?",
    options: [
      "Doubled overlapping layers",
      "Transparent upper",
      "Triple-stacked Air sole",
      "Removable Swoosh patches",
    ],
    correct: 0,
  },
  {
    question:
      "What year did the Adidas Yeezy Boost 350 first release in the 'Turtle Dove' colorway?",
    options: ["2015", "2013", "2017", "2019"],
    correct: 0,
  },
  {
    question:
      "Which designer created the Air Jordan 3, introducing the Jumpman logo and elephant print?",
    options: ["Tinker Hatfield", "Peter Moore", "Mark Smith", "Bruce Kilgore"],
    correct: 0,
  },
];

/** % of players who answered each question correctly today (mock social proof).
   Low values (e.g. Q3) make a correct answer feel earned. */
export const PCT_CORRECT = [88, 72, 34, 61, 79];

export type Answer = {
  question: number;
  answer: number;
  correct: boolean;
  timeMs: number;
};

export const TOTAL_PLAYERS_TODAY = 12840;

/* ─── Badges (PRD §9 — 11 total: 6 one-time + 5 tiered) ───
   Tiered families follow Zach's tier ladder (canonical badge-system sheet):
   Base → Bronze → Silver → Gold → Legendary (no Platinum), with the earn-count
   banners baked into the artwork. */
export type BadgeRarity = "white" | "bronze" | "silver" | "gold" | "legendary";

export type Badge = {
  id: string;
  name: string;
  icon: BadgeIconKind;
  kind: "one" | "tier";
  rarity?: BadgeRarity;
  criteria: string;
  earnRate?: string;
  tiers?: { rarity: BadgeRarity; label: string; earnRate: string }[];
  /** For tiered families: the metal tier the (prototype) player currently
      holds — drives which medallion + ring state the trophy case shows. */
  currentTier?: BadgeRarity;
};

/* The four earnable tiers share the same earn-count thresholds across every
   family — x1 / x7 / x50 / x1000 — which is what the badge artwork's banners
   read. Only the rarity (earn rate) copy differs per family. */
function TIER_LADDER(
  bronze: string,
  silver: string,
  gold: string,
  legendary: string,
): NonNullable<Badge["tiers"]> {
  return [
    { rarity: "bronze",    label: "1×",    earnRate: bronze },
    { rarity: "silver",    label: "7×",    earnRate: silver },
    { rarity: "gold",      label: "50×",   earnRate: gold },
    { rarity: "legendary", label: "1000×", earnRate: legendary },
  ];
}

export const BADGES: Badge[] = [
  // One-time (6)
  {
    id: "first-play",
    name: "First Play",
    icon: "first-play",
    kind: "one",
    rarity: "white",
    criteria: "Play your first quiz",
    earnRate: "100%",
  },
  {
    id: "founding-player",
    name: "Founding Player",
    icon: "founding-player",
    kind: "one",
    rarity: "legendary",
    criteria: "Play within first 7 days post-launch",
    earnRate: "<1%",
  },
  {
    id: "streak-7",
    name: "7-Day Streak",
    icon: "streak-7",
    kind: "one",
    rarity: "bronze",
    criteria: "Play 7 consecutive days",
    earnRate: "28%",
  },
  {
    id: "streak-30",
    name: "30-Day Streak",
    icon: "streak-30",
    kind: "one",
    rarity: "silver",
    criteria: "Play 30 consecutive days",
    earnRate: "4%",
  },
  {
    id: "streak-100",
    name: "100-Day Streak",
    icon: "streak-100",
    kind: "one",
    rarity: "gold",
    criteria: "Play 100 consecutive days",
    earnRate: "0.3%",
  },
  {
    id: "streak-365",
    name: "365-Day Streak",
    icon: "streak-365",
    kind: "one",
    rarity: "legendary",
    criteria: "Play 365 consecutive days",
    earnRate: "0.01%",
  },
  // Tiered (5)
  {
    id: "perfect-score",
    name: "Perfect Score",
    icon: "perfect-score",
    kind: "tier",
    criteria: "Score a perfect 5/5 on any quiz",
    currentTier: "gold",
    tiers: TIER_LADDER("4.2%", "0.9%", "0.1%", "0.004%"),
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    icon: "speed-demon",
    kind: "tier",
    criteria: "Complete a quiz in record time",
    currentTier: "silver",
    tiers: TIER_LADDER("3%", "1%", "0.1%", "0.004%"),
  },
  {
    id: "back-to-back",
    name: "Back-to-Back",
    icon: "back-to-back",
    kind: "tier",
    criteria: "Win quizzes on consecutive days",
    currentTier: "bronze",
    tiers: TIER_LADDER("5%", "0.5%", "0.05%", "0.002%"),
  },
  {
    id: "podium-finisher",
    name: "Podium Finisher",
    icon: "podium-finisher",
    kind: "tier",
    criteria: "Rank in the top 3 on any leaderboard",
    currentTier: "gold",
    tiers: TIER_LADDER("4%", "0.9%", "0.05%", "0.002%"),
  },
  {
    id: "daily-crown",
    name: "Daily Crown",
    icon: "daily-crown",
    kind: "tier",
    criteria: "Earn #1 on the daily leaderboard",
    currentTier: "legendary",
    tiers: TIER_LADDER("0.5%", "0.1%", "0.01%", "0.0004%"),
  },
];

/* Earned-this-play options (dev panel switch) */
export type EarnedBadge = {
  id: string;
  name: string;
  icon: BadgeIconKind;
  rarity: BadgeRarity;
  earnRate: string;
  criteria: string;
} | null;

export const BADGE_OPTIONS: Record<string, EarnedBadge> = {
  none: null,
  perfect: {
    id: "perfect-score",
    name: "Perfect Score",
    icon: "perfect-score",
    rarity: "gold",
    earnRate: "4.2%",
    criteria: "Score 5/5 on any quiz",
  },
  speed: {
    id: "speed-demon",
    name: "Speed Demon",
    icon: "speed-demon",
    rarity: "silver",
    earnRate: "1%",
    criteria: "Sub-30s perfect quiz",
  },
  crown: {
    id: "daily-crown",
    name: "Daily Crown",
    icon: "daily-crown",
    rarity: "gold",
    earnRate: "0.1%",
    criteria: "Finish #1 today",
  },
};

/* ─── Leaderboard pool ─── */
export const POOL = [
  "KICKSGOD22","SAMPLE_SIZE","HEELGAME","OFFWHITER","KICKSFORLIFE","DUNKTHUNK","J5OG",
  "BAYC_NICK","SOLERESQ","DUNKMASTER","BREDLINE","BREDMASTER","TRIPLE_S","AIRMAX_GOD",
  "SWOOSH_LIFE","COPSKING","DUNKZILLA","HYPEKILLA","SAMPLE_GAWD","LACED_UP","FATLACE",
  "KICKZ4DAYS","SOLE_BROS","JORDAN_SZN","SNEAKERFLEX","ICONICKID","KICKS_INC","OG_HEAD",
  "MIDSOLE_KING","HEEL_FIRST","CITY_KICKS","BREAD_HEAD","FORCE1_FAN","AIRBORNE","GUMSOLE",
  "ICY_DROP","FOAM_LIFE","RETROHEAD","SOLE_PATROL","KICKZILLA",
];

export function lbAvatar(name: string, size = 80) {
  const code = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % 70 + 1;
  return `https://i.pravatar.cc/${size}?img=${code}`;
}

export const YOU_AVATAR = "https://i.pravatar.cc/120?img=8";

export type LbRow = { rank: number; name: string; correct: number; time: string };

export function buildLeaderboard(
  period: "TODAY" | "WEEK" | "ALLTIME",
  scope: "STATE" | "GLOBAL"
): { rows: LbRow[]; total: number } {
  const periodSeed = period === "TODAY" ? 7 : period === "WEEK" ? 23 : 41;
  const scopeSeed = scope === "STATE" ? 0 : 13;
  const seed = (periodSeed + scopeSeed) % POOL.length;

  const total =
    period === "TODAY"
      ? scope === "GLOBAL" ? 12840 : 1247
      : period === "WEEK"
      ? scope === "GLOBAL" ? 84200 : 8930
      : scope === "GLOBAL" ? 487209 : 52810;

  // Different score-distribution shape per period.
  // ALLTIME has many more grinders with 5/5; TODAY has the fewest.
  const perfectCount =
    period === "TODAY" ? 9 :
    period === "WEEK" ? 18 :
    28;
  const fourCount =
    period === "TODAY" ? 22 :
    period === "WEEK" ? 18 :
    14;

  // Time band tightens with longer windows (best-of-best surface).
  const fastBase  = period === "TODAY" ? 16 : period === "WEEK" ? 13 : 10;
  const fastStep  = period === "TODAY" ? 0.55 : period === "WEEK" ? 0.40 : 0.28;
  const slowOffset = scope === "STATE" ? 2 : 0;

  const rows: LbRow[] = [];
  for (let i = 0; i < 60; i++) {
    const correct =
      i < perfectCount ? 5 :
      i < perfectCount + fourCount ? 4 :
      i < perfectCount + fourCount + 14 ? 3 :
      2;
    const groupIndex =
      correct === 5 ? i :
      correct === 4 ? i - perfectCount :
      correct === 3 ? i - perfectCount - fourCount :
      i - perfectCount - fourCount - 14;
    const baseTime =
      correct === 5 ? fastBase + groupIndex * fastStep :
      correct === 4 ? fastBase + 8 + groupIndex * (fastStep + 0.15) :
      correct === 3 ? fastBase + 16 + groupIndex * (fastStep + 0.25) :
      fastBase + 24 + groupIndex * (fastStep + 0.35);
    const name = POOL[(i + seed) % POOL.length];
    rows.push({
      rank: i + 1,
      name,
      correct,
      time: Math.round(baseTime + slowOffset) + "s",
    });
  }
  return { rows, total };
}

/* ─── Quiz prefs (dev-tweakable) ─── */
export type QuizPrefs = {
  loggedIn: boolean;
  hasPlayed: boolean;
  streakDays: number;
  finalRank: number;
  scoreCorrect: number;
  badge: "none" | "perfect" | "speed" | "crown";
};
