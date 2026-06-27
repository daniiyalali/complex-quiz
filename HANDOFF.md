# CQ Daily Sneaker Quiz — Handoff

Next.js prototype for **Complex Daily**, a 5-question sneaker trivia game. The active visual system is **CQ Apple Dark v3** (May 2026). All non-quiz themes are legacy and slated for cleanup.

---

## ✅ CURRENT STATE (read first — 2026-06-27)

### 2026-06-27 — Home cabinet redesign (Figma 326:6680 / 326:7107) + score-card verdict colors

**Home cabinet (`EditorialLayout`) rebuilt to the new Figma. Scope was held to
the Figma frame — the leaderboard sidebar, `GamesNav`, and `SiteFooter` were left
untouched.**
- **Layout flipped** to hero-LEFT / copy-RIGHT (was copy-left / gold-photo-right).
  On desktop the hero image and the copy block (logo → "HOW IT WORKS?") are
  vertically **centered relative to each other**; the hero **fills the column
  height** (`align-self: stretch`, sharp corners, `object-fit: cover` — no dead
  space). The streak/badge cards pin to the cabinet bottom with a fixed **24px**
  gap (`.cabinetContent { gap: 24px }` in the ≥1024px block).
- **New assets** (`public/figma/editorial/`): `hero-collabs.png` (388×695 green
  halftone, desktop) + `hero-collabs-mobile.png` (356×195, mobile), served via a
  `<picture>`. The gold photo (`sneaker-hero-gold.png`) and its photo-credit are
  no longer used.
- **Flat logo** `logo-5for5.png` replaces the animated `ScoreboardLogo` in the
  cabinet AND in the `GamesNav` top bar on dark surfaces (was
  `complex-5for5-horizontal.png`). `ScoreboardLogo.tsx` is now unused (left in
  place for a focused cleanup later).
- **Mobile** rebuilt to Figma 326:7107: a clean hero image (no logo/theme
  overlay), with the eyebrow + title + subtitle sitting BELOW it.
- **Played card** (`AlreadyPlayedCard`, inline variant only): added the dim
  `TODAY · DONE` eyebrow and a `Go to Complex.com →` link; dropped the inline
  "View results". The `/play` full-screen replay-lock (`screen` variant) is
  unchanged.

**Score-card verdict colors (Figma 326:7197):** the Results score number now
grades on **4 tiers** — 5/5 `#00FF85` · 4/5 `#00C46A` · 3–2/5 `#FF9500` · 1–0/5
`#FF453A` (was a 3-bucket win/close/loss scheme). See AGENTS.md → "Score-card
verdict colors". New dev knob: **`/play?skip=results&score=N`** (0–5) seeds the
synth score so each tier is reviewable (matches the `?skip=` / `?as=` conventions).

**Deploy:** repo pushed to **`github.com/daniiyalali/complex-quiz`** (private),
deploys to **Vercel** (native Next.js — the `force-dynamic` pages and the `/c`
dynamic OG unfurl work as-is, no source changes). A `.gitignore` was added
(excludes `node_modules`, `.next`, `.localnode`, `*.zip`, `next-env.d.ts`,
`.claude/settings.local.json`). The push credential is stored in the macOS
Keychain, so `git push` is seamless going forward.

---

This is the design + craft record for the prototype. For backend wiring, note
that **all mock data + domain types live in `lib/`** — that directory is the
contract surface to swap for real APIs, and the backend engineer can map it
straight from the code.

**Environment note (2026-06-22):** the dev machine had **no system Node.js**
(nothing on `PATH`; no nvm/volta/fnm/brew). To run the prototype, a standalone
**Node v22.14.0** (darwin-arm64) was vendored into `./.localnode/` and put on
`PATH` (`export PATH="$PWD/.localnode/bin:$PATH"`), then `npm install` +
`npm run dev`. App verified serving on `http://localhost:3000` (`/`, `/home`,
`/play` → 200). `./.localnode/` is just a local runtime (~176 MB), not an app
dependency — delete it once Node is installed system-wide. Also flagged for the
owner: there is **no `.gitignore`**, so a future `git init` here would commit
~1 GB of `node_modules`/`.next`/`.localnode`. No files were deleted or
optimized this session (per owner's call to leave the folder untouched).

**What's live now (all committed):**
- **Palette = white-primary + signal colors** (Zack direction, 2026-06-11 —
  this supersedes the magenta/yellow notes deeper in this file). In
  `app/globals.css :root`: `--accent #FFFFFF` (primary chrome — buttons,
  headings, active states, logo, today-focus); signals only → `--correct` green
  `#00FF85`, `--warn`/`--streak` orange `#FF9500`, `--wrong` red `#FF453A`.
  `--cq-pink` in `app/themes.css` is now `#00FF85` (no longer magenta).
- The **count-up timer** (`data-warn`/`data-hot` states), **Results/Reveal**
  correct-wrong tiles, corner **PixelBlast LED accents**, near-opaque option
  cards, and the **`HomeBackdrop`** field are all committed and live
  (commits `aa583b0`, `5f67d3e` — Jun 11–12). Treat the prose further down as
  design rationale/history, not pending work — where it cites old hex values
  (`#F772FF`, `#FFD000`), the live tokens above win.

**Cleanup pass (2026-06-13):** dead code was removed with **zero UI change**
(green `npm run build`, deletion-only diff — ~4,700 deletions): 26 unimported
legacy files (receipt/pixel layouts, superseded streak modules
`StreakModule`/`MissionRing`/`WeeklyTracker`, `StreakCelebration`, `LoginPrompt`,
`Nav`/`Receipt`/`Stamp`/`PrintLine`, the `streak-wireframes` page, the unmounted
`ThemeBackground`), 77 unreachable `:global(html[data-theme="1"])` CSS rules (the
app hardcodes `data-theme="3"` and mounts no `ThemeProvider`, so they could never
match), and 13 unused CSS tokens. **Two dormant items were intentionally left in
place** (removing them means editing live render logic): the `Theme.tsx`
multi-theme scaffold — `useTheme()` always returns `"3"` since no provider is
mounted — and a now-unreachable non-theme-3 branch in `Results.tsx` after its
`if (theme === "3")` return. Both are safe for the team to delete in a focused
follow-up.

**🔶 OPEN DESIGN DECISION — home backdrop intensity:** current impl = "show
through the experience" (softened mask, ~0.15 opacity). The product council
advised keeping it HEAVILY de-tuned so it never twins the BADGE UNLOCKED moment.
Options floated: (A) subtle frame only, (B) show-through [current], (C) bold
full-bleed. Not a blocker for merge — a visual-polish call for whenever it's
revisited.

**Reference:** original pre-feedback build (magenta) at
`https://cq-quiz-original.vercel.app` (= `b48a9db`); its 6 screens × mobile/
desktop are in Figma `NnjUJURqXpus2jiFPn4u1v` ("Complex-Quiz", captured
2026-06-10).

---

## Run it

```bash
npm install
npm run dev          # localhost:3000
```

**Any browser refresh** (normal or hard) resets state to a first-time player — zero streak, zero badges. State only persists across full-page route navigations within a session (`navigation.type === "navigate"`); a reload (`"reload"`) wipes `localStorage`. See `lib/user-state.ts` load effect.

## Routes

| Route | What it shows |
|---|---|
| `/` | Home cabinet + leaderboard |
| `/play` | Full quiz flow: countdown → 5 questions → reveal → badge → results |
| `/play?skip=question` | Skip countdown, go straight to question 1 |
| `/play?skip=reveal` | Synth answers, jump to cinematic reveal |
| `/play?skip=results` | Synth answers, jump to results scorecard |
| `/play?skip=badge-unlock` | Skip to badge popup with FIRST PLAY fallback |
| `/play?skip=celebration` | (legacy) StreakCelebration screen — removed from flow but still reachable for QA |

## Ground rules (override defaults; never violate)

- **Letter-spacing is `0` or negative anywhere in the app.** Never positive. (See `MEMORY.md → feedback_letter_spacing`.)
- **Dark mode only.** No white surfaces.
- **CQ accent is exactly `#F772FF`.** Not `#FF00FF`, not `#CC00FF`.
- **Doto** font for timer + score numbers only. Inter / system for everything else.
- **Frosted Question card stays:** `rgba(8, 4, 14, 0.82)` + `backdrop-filter: blur(18px)`.
- **Pixel border animation on the Question card stays boxy.** No springs.
- **Square colons** on the timer: `border-radius: 0`, `width: 0.12em`, `height: 0.12em`.
- **No fixed px** for font-size; use `clamp()`. Use `rem` for layout spacing, `em` for component-internal sizing.

## v3 design system (canonical tokens)

Defined in `app/globals.css` under `:root`. Use the variables — never hard-code these hex values.

```css
/* Color stack — three levels of depth */
--bg:         #000000;                        /* Level 0: base canvas */
--surface:    #1C1C1E;                        /* Level 1: cards */
--surface-2:  #2C2C2E;                        /* Level 2: chips */
--chip:       #3A3A3C;                        /* Level 3: pill bg */
--border:     rgba(84, 84, 88, 0.45);
--divider:    rgba(84, 84, 88, 0.25);

/* Typography */
--text:       #FFFFFF;
--text-2:     rgba(235, 235, 245, 0.60);
--text-3:     rgba(235, 235, 245, 0.30);

/* Semantic */
--accent:     #F772FF;
--correct:    #30D158;
--wrong:      #FF453A;

/* Apple spring system */
--spring-clean:  cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* drawers, nav */
--spring-soft:   cubic-bezier(0.34, 1.20, 0.64, 1);     /* swipe-dismiss */
--spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);     /* score, badge */
--spring-snap:   cubic-bezier(0.34, 1.90, 0.64, 1);     /* tap, chip select */
--ease-dismiss:  cubic-bezier(0.4, 0, 1, 1);            /* exits */

/* Durations */
--dur-snap:    200ms;
--dur-fast:    280ms;
--dur-normal:  360ms;
--dur-slow:    420ms;

/* Corner radii */
--radius-chip:    8px;
--radius-btn:    10px;
--radius-card-sm: 12px;
--radius-card:   16px;
--radius-sheet:  20px;
```

Never use `linear`, `ease`, `ease-in`, or `ease-in-out` for interactive UI. Spring tokens only. Exit animations use `--ease-dismiss`.

## File map (active surfaces only)

```
app/
  layout.tsx              — Inter + Doto fonts, theme-3 attr, globals
  globals.css             — :root tokens (v3)
  page.tsx                — renders EditorialLayout (home)
  play/page.tsx           — quiz state machine: countdown → question → reveal → badge → results

components/
  layouts/EditorialLayout.tsx     — home cabinet + leaderboard side rail
  quiz/
    Countdown.tsx                 — 3·2·1·GO over solid black
    Question.tsx                  — frosted dark card, Doto timer, magenta bar-fill answers
    Reveal.tsx                    — cinematic answer-by-answer + score/time/rank
    BadgeUnlockedPopup.tsx        — post-quiz badge moment (v3 8-step sequence target)
    Results.tsx                   — scorecard + leaderboard rail
    HowItWorksPopup.tsx           — 4-step stepper drawer
    LoginPrompt.tsx, ClaimConfirm.tsx — gated post-quiz claim flow
  streak/
    StreakDrawer.tsx              — streak hero + weekly grid + badge grid (mobile sheet / desktop modal)
    StreakHero.tsx, WeeklyCard.tsx, PixelIcons.tsx — shared streak sub-pieces (drawer + ProfilePanel)
  results/
    LeaderboardPanel.tsx          — already dark; do not touch per spec
    ProfilePanel.tsx              — profile rail variant
  badges/
    BadgeTrophyGrid.tsx           — ⭐ SINGLE SOURCE OF TRUTH for the badge grid. Rendered
                                    identically by ProfilePanel AND StreakDrawer "all badges".
                                    Do NOT re-fork a per-screen grid — edit here only.
    BadgeProgressRing.tsx         — ring + icon (size/iconSize props); used by BadgeTrophyGrid
    BadgeIcon.tsx                 — BadgeMark (auto-uniform PNG fill measurement) + SVG fallbacks
  ui/
    Stepper.tsx, BottomSheet.tsx, corner-frame-animated-button.tsx, pixel-trail.tsx, gooey-filter.tsx

lib/
  user-state.ts          — UserState + useUserState() localStorage hook + hard-reload reset
  quiz-data.ts           — QUIZ_DATA, BADGE_OPTIONS, prefs, synthAnswers
  today.ts               — TODAY.dateAllCaps, TODAY.titleAllCaps
  streak-data.ts         — streak constants
```

## State model

`lib/user-state.ts` holds `UserState` in localStorage under `cq:user-state:v2-firsttime`. Default = brand-new player (`userStreak: 0`, `userBadgeCount: 0`, no plays). `useUserState()` exposes `[state, update, reset]`. A keydown listener catches hard-reload shortcuts and sets a sessionStorage flag; next mount sees the flag and wipes localStorage.

Quiz commit logic in `app/play/page.tsx → commitPlay()`: increments streak, sets `todayPlayed`, picks a milestone badge if applicable, falls back to `FIRST PLAY` when no streak milestone is hit. Badge count only increments on milestones or a true first play.

## v3 implementation status

| Phase | Status | Notes |
|---|---|---|
| 1. Tokens (`:root` v3 block) | ✅ | All v3 spring/duration/color/radius tokens in `app/globals.css`. Legacy aliases forward to v3 tokens. |
| 2. Color migration | ✅ | Reveal, Results, StreakDrawer, WeeklyCard, StreakHero, ProfilePanel `.streakCard`, Question option states all on Apple stack via `var(--*)` tokens. Frosted Question card untouched per spec. |
| 3. Surface layering | ✅ | Reveal wraps score/time/rank in `#1C1C1E` `.statsCard`. Results main card `#1C1C1E` with `#2C2C2E` stat chips. StreakDrawer panel `#1C1C1E` with `--radius-sheet`. Section headers drop to `#000`. |
| 4. Spring motion swap | ✅ | All `cubic-bezier(...)` literals across active CSS replaced with `var(--spring-*)` tokens. Legacy `--ease-apple-*` aliases forward to v3 spring tokens. |
| 5. Cinematic Reveal sequencing | ✅ | JS phases retimed: 400ms / 110ms stagger / 180ms / 600ms / 380ms / 280ms (CTA). Score count-up 650ms. CTA fades in via `ctaVisible` state. |
| 6. Badge reveal moment | ✅ | `BadgeSparks.tsx` Canvas particle module + `BadgeUnlockedPopup` `useReducer` 8-step orchestration. **Plus**: 3D rotation video (`first-play-3d.webm`/`.mp4`, 600px, ~600KB each), rotating magenta gradient ring (conic-gradient + mask), isolator disk, badge shrunk to 75% of stage for breathing room. Reduced-motion fallback renders all steps immediately. |
| 6b. WebGL backdrops (trial → prod) | ✅ | `LightRays.tsx` + `PixelBlast.tsx` ported from React Bits to TypeScript. Three.js postprocessing's `EffectComposer` dropped (peer-dep drift); pure shader path only. Production wired with `<BadgeUnlockedPopup backdrop="pixels" />` in `app/play/page.tsx`. Preview at `/preview/badge-rays` (toggle: None / Rays / Pixels). Diagnostic at `/preview/pixel-test`. |
| 7. Apple interactions | ✅ | `[data-apple-press]` global scale 0.97 + `--spring-snap`. Question `.opt:active` scale 0.97. StreakDrawer dismiss threshold = 40% of panel height. Page transitions deferred — current state machine is conditional renders, not separate routes. |
| 8. Code hygiene + dead code | ⬜ | Final phase — delete unused legacy components, prune theme-1/theme-2 CSS blocks, remove `--ink/--paper/--gold` legacy palette, rewrite README. |

## Open issues at session end (2026-05-29 PM)

- **Mobile Results dim** — ✅ FIXED (2026-05-29). Root cause was the iOS Safari `backdrop-filter` ghost bug, not the `body.overflow` lock (its cleanup was correct). `BadgeUnlockedPopup`'s `.backdrop` uses `backdrop-filter: blur(...)`; removing that portal node in a single frame left a stale rasterized blur layer painted over Results until a recomposite (devtools resize) cleared it. Fix: `BadgeUnlockedPopup` now dismisses via a `closing` state — backdrop opacity fades to 0 **and** `backdrop-filter` is dropped to `none` while the node is still mounted, then `onContinue` unmounts ~280ms later. So Safari repaints the de-blurred region before the node leaves the DOM. All three dismiss paths (button, backdrop tap, Esc/Enter) route through `requestClose()`; reduced-motion users get the same opacity-only fade (no vestibular motion). **Needs a real iOS Safari device confirm** — fix is sound by mechanism but was not verified on hardware this session.
- **Badge grid unified (parallel-fork RESOLVED)** — ✅ FIXED (2026-05-29). The drawer "all badges" view and the ProfilePanel badge grid were two separate render paths (drawer used raw `<img>` + a hardcoded `scale(1.45)` locked hack; profile used `BadgeProgressRing`), with *different* earned-logic — so they never matched. Extracted **`components/badges/BadgeTrophyGrid.tsx`** as the single source of truth, now rendered identically by both. **Badge canon:** `BadgeProgressRing size=100 iconSize=80`, grid `repeat(3,1fr)` gap `26px 16px` (100px rings need that column gap or they nearly touch at 3-up on 390px). Earned set + in-progress arcs driven by `earnedBadgeKey="perfect"` + `streakDays=12` defaults (matches the prototype profile prefs). **Edit the grid here only — do not re-fork per screen.**
- **Streak section consistency** — ✅ (2026-05-29). `StreakHero` flame+number now centers (`grid-template-columns: auto auto`, was `auto 1fr` which left-pinned it) — shared, so drawer + profile match. ProfilePanel `.streakCard` made transparent (was `var(--surface)` wrapping `WeeklyCard`'s `var(--surface-2)` = "double gray shade"); now the hero sits on the panel bg and WeeklyCard carries the single surface, like the drawer. ProfilePanel `.idRow` got a magenta radial glow behind the avatar + name (rounded, accent border).
- **`feedback_parallel_implementations.md`** memory entry still applies as a general rule, but the specific StreakDrawer-vs-ProfilePanel badge fork it warned about is now closed by `BadgeTrophyGrid`.
- **ProfilePanel dead CSS** — unused `.grid/.tile/.ringWrap/.tileName/.tileCriteria/.tiers/.tierChip/.tileEarn` were removed from `ProfilePanel.module.css` (moved to `BadgeTrophyGrid.module.css`). Remaining white-hex `.toggleOn .toggleDot` refs are still inside the unused privacy toggle — confirm before Phase 8 deletion.
- **StreakDrawer summary row** still uses the compact `BadgeChip` (`BadgeMark`, size 44 desktop / 56 mobile, no ring) — intentional mini-preview, not the trophy grid. `ALL_BADGES` local list now only feeds `SUMMARY_BADGES` + the "X of 11" count.

## Files added in v3

- `components/quiz/BadgeSparks.tsx` — Canvas pixel-spark particle system
- `components/badges/BadgeTrophyGrid.tsx` + `.module.css` — shared badge grid (single source of truth for ProfilePanel + StreakDrawer all-badges)
- `HANDOFF.md` — this document

## Files rewritten in v3

- `components/quiz/BadgeUnlockedPopup.tsx` + `.module.css` — full 8-step orchestration per Section 6
- `app/globals.css` — v3 token block prepended; legacy aliases forwarded

## Known deviations from v3 doc

- **Badge entrance opacity timing**: v3 says opacity fades over first 55ms of a 560ms transform. CSS doesn't support per-property duration cleanly on a single transition. Implemented as two parallel transitions: `opacity 55ms var(--spring-clean), transform 560ms var(--spring-bounce)`. Honors the intent.
- **Page transitions (v3 §11)**: deferred. The quiz flow is a single-component state machine, not router-based screens. If we ever split into separate `/play/question`, `/play/reveal`, `/play/results` routes, the `translateX` push/pop becomes applicable.

## Legacy still in tree (Phase 8 cleanup targets)

- `components/Nav.tsx`, `Receipt.tsx`, `Stamp.tsx`, `PrintLine.tsx`, `Theme.tsx`, `ThemeBackground.tsx` — receipts-theme leftovers (some still imported by `Results.tsx` for `useTheme`, so check before delete)
- `components/layouts/ReceiptLayout.tsx`, `PixelLayout.tsx` — unused layouts
- `components/streak/MissionRing.tsx`, `WeeklyTracker.tsx`, `StreakModule.tsx` — superseded by current StreakDrawer + WeeklyCard
- `components/quiz/StreakCelebration.tsx` — removed from active flow; dev-skip route `/play?skip=celebration` still references it
- `components/ui/background-boxes.tsx`, `gooey-filter.tsx`, `pixel-trail.tsx`, `animated-circular-progress-bar.tsx` — most are demo/decoration; verify usage before delete
- `app/streak-wireframes/page.tsx` — early wireframe experiment
- Theme-1 and theme-2 blocks across `*.module.css` files — only theme-3 is active; thousands of lines of dead CSS
- Legacy `--ink/--paper/--gold/--red-stamp/--fs-*/--max-receipt` token group in `globals.css`

## What v3 explicitly says NOT to touch

- Frosted Question card surface + backdrop-blur
- Pixel border animation (must stay boxy)
- Doto-only-on-numerics rule
- Letter-spacing zero rule
- Right-side leaderboard panel (already dark)

## Spec source

`CQ_Apple_Dark_System_v3.docx` — Anusha's master spec, May 2026. This file paraphrases it; the docx is authoritative if there's a conflict.

---

# SESSION ADDENDUM — 2026-06-10 (Zach's design backlog: nav, auth, share/challenge)

Working through the 5 designs Zach flagged. State at end of session: **tsc clean, `/`, `/play`, `/home` all 200, dev server runs.** No leftover preview/temp states.

## Done this session

1. **Complex Playground nav (`GamesNav`)** — `components/landing/GamesNav.tsx` + `.module.css`. White wrapper bar at top of the landing: `← COMPLEX.COM` left + centered `COMPLEX·PLAYGROUND` lockup (`public/figma/complex-playground.svg`, from `~/Desktop/quiz assets/`). Logo ~46px desktop / 34px mobile. NOT the main Complex site nav (intentional).
2. **Mobile nav rebuilt** — the 5/5 floating pill (`Nav` in `LandingPage.tsx`) now collapses on ≤767px to `5/5 + theme toggle + hamburger`; hamburger opens a `.navSheet` dropdown (links + auth buttons). Desktop unchanged. New `ThemeSwitch` helper extracted.
3. **AuthModal wired everywhere** — every gated trigger (nav Sign in / Create account desktop+sheet, hero "Sign in to save your score", leaderboard "Sign in to compete", community CTAs) opens `AuthModal` via an `AuthCtx` context in `LandingPage.tsx`. On auth, visitor → "returning". AuthModal corners sharpened to 0; scrim now `rgba(0,0,0,0.72)` + blur(10px).
4. **Share Card + Challenge (`ShareCardModal`)** — NEW `components/share/ShareCardModal.tsx` + `.module.css`. Spotify-style dark sheet with a **3D tilt card** (NEW `components/ui/tilt-card.tsx` = 21st.dev `3d-card-effect` ported to CSS-Modules idiom, no Tailwind). Destinations (WhatsApp/X/Stories/Messages) are **monochrome white icons on stroked rings** (no brand color, per Anusha). "Copy link" writes WhatsApp-ready text `Play 5x5 quiz on Complex\n<link>` + toast. `variant="challenge"` vs `"share"`.
   - Wired via `ShareCtx` in `LandingPage.tsx` (PlayedSummary, Community, ShareCta) AND in **`components/quiz/Results.tsx`** (theme-3 SHARE SCORE / CHALLENGE A FRIEND buttons, gated by `isGated`).
   - **Card is badge-centric**: if `earnedBadge` present → glowing sunburst badge centerpiece ("BADGE UNLOCKED" + name + earn rate); else → score hero + "YOUR BADGES" row of `prevBadges` (`BadgeMark`s). `ShareData` type carries `earnedBadge?` + `prevBadges?`.
   - Scrim heavy: `rgba(0,0,0,0.82)` + blur(12px) so the popup is the clear focus.
5. **Em-dash sweep** — removed em/en dashes from user-facing copy across components/app/lib (periods, commas, " · " separators). Code comments left as-is.

## Done this session (cont.)

6. **GUEST vs LOGIN required flow (#5) — DONE.** `DEFAULT_PREFS.loggedIn` in `app/play/page.tsx` is now `false` (guest by default). `prefs` is stateful (`useState`), so auth flips `loggedIn → true` and unlocks Results **in place**. Every gated action routes through a single `AuthModal` (mirroring LandingPage's `AuthCtx` pattern): an `openAuth({headline,sub})` opener + one `<AuthModal>` instance.
   - **Gating policy.** FREE for guests: playing the quiz (countdown → questions → reveal → badge-unlock moment), viewing the leaderboard, answer review, difficulty sentiment vote. REQUIRES ACCOUNT (→ AuthModal): keeping the streak, claiming leaderboard placement, sharing / challenging, keeping the earned badge, email reminder opt-in. This matches the `isGated = !prefs.loggedIn && !claimed` checks already in `Results.tsx` — they just never fired before because `loggedIn` was hardcoded `true`. **`Results.tsx` was NOT changed**; it already routes gated taps through its `onTriggerLogin` prop, which the play page now points at `AuthModal`.
   - **Conversion beat.** On a real completed play, after the BADGE UNLOCKED moment we land on Results and auto-open `AuthModal` once with **rank-aware copy** (`gatedAuthCopy(prefs)` — #1 / podium / Top N / Top N% / save-your-result tiers, condensed from the old LoginPrompt). Dismissible; any gated tap re-opens it. Dev-skip routes (`?skip=results`) land on gated Results with **no** auto-modal (clean for QA).
   - **`ClaimConfirm` repurposed** as the post-auth "You're in / Result saved" beat (`handleAuthed` → `setClaiming(true)`).
   - **`components/quiz/LoginPrompt.tsx` is now orphaned** (was the old standalone rank-aware claim screen; superseded by AuthModal + `gatedAuthCopy`). Left in tree as a Phase-8 cleanup target, not deleted.
   - tsc clean; `/`, `/play`, `/play?skip=results`, `/play?skip=reveal`, `/home` all 200.

7. **UNIFIED VISITOR-STATE MODEL (guest / member / returning) — DONE.** Single persisted source of truth: added `loggedIn: boolean` to `UserState` (`lib/user-state.ts`), plus `visitorPhase(u)` (`guest | member-ready | member-played`) and `readPhaseOverride()` (parses `?as=guest|member|played`). Every surface derives phase from persisted `loggedIn × todayPlayed`.
   - **Decisions (user-confirmed):** one coherent session (shared persisted login); **no daily lock for guests** (the "one shot / come back tomorrow" lock is member-only); member-played CTAs = Share/Challenge + Go to Complex.com + View leaderboard; guest profile = **locked teaser** (blurred behind a sign-in overlay).
   - **`app/play/page.tsx`:** `handleAuthed` now `updateUser({loggedIn:true})` (persisted). `effectivePrefs = {...prefs, loggedIn: user.loggedIn}` feeds `Results`/`gatedAuthCopy` (Results unchanged). **Replay guard:** logged-in member who already played → render-time `isReplayLock` → full-screen `AlreadyPlayedCard`; guests exempt (can replay); `?skip=` QA shortcuts bypass. `handlePlayAgain` bounces members to the lock via `forceLock`.
   - **`components/layouts/EditorialLayout.tsx` (cabinet):** derives `phase`. MEMBER-PLAYED → START replaced by inline `AlreadyPlayedCard` (Share→ShareCardModal, Challenge→ShareCardModal, View leaderboard→scrolls `.sidebar` aside). GUEST → free-play START + new `.signInSave` ghost CTA + streak/next-badge strip buttons open AuthModal instead of the drawer. Added local `AuthModal` + `ShareCardModal` + `shareData`. `handleCountdownDone` full-nav left as-is.
   - **`components/results/ProfilePanel.tsx`:** reads `user.loggedIn` internally (no prop change at its 4 call sites). GUEST → `.scroll` gets `.blurred` + a `.lockOverlay` ("Start your profile" + Sign in) over it; own `AuthModal`. `LockIcon` added.
   - **`components/landing/LandingPage.tsx`:** now reads `useUserState`. `visitor` syncs from `visitorPhase(user)` via an effect (deps `loggedIn,todayPlayed,stateParam`); explicit `?state=` still wins (Figma capture). `onAuthed` + `StateSwitcher` (`setVisitorState`) write persisted state, so the switcher drives every surface (flip to "Played today", navigate to `/`).
   - **`LeaderboardPanel.tsx` / `LeaderboardEmpty.tsx`:** `youGhost` "Sign in to compete" now also shows when `!user.loggedIn`; their `AuthModal`s persist login via `onAuthed`.
   - **NEW shared file:** `components/quiz/AlreadyPlayedCard.tsx` (+ `.module.css`) — "You already played today / Come back tomorrow" + 3 CTAs; `variant="screen"` (play lock) vs `"inline"` (cabinet).
   - **Demo:** reload always = guest (shared hook wipes on reload). To reach member/played without playing: landing StateSwitcher (persists across full nav), or `?as=member|played` on `/` and `/play`. tsc clean; `/`, `/?as=guest|member|played`, `/home`, `/play`, `/play?as=*`, `/play?skip=results` all 200.

8. **STREAK DRAWER reworked per Zach's feedback — DONE.** (`components/streak/`)
   - **Removed:** the "Play your first quiz / Play today" CTA (`playCta`, + its `onPlayClick` prop and the cabinet's pass-through), the "PERFECT WEEK = BONUS" label, the "DAY 1 — START YOUR STREAK / X of 7 days" nudge footer (both from `WeeklyCard`, shared with ProfilePanel), and "STREAK PASS".
   - **Streak model → Strava-style monthly calendar.** NEW `components/streak/MonthlyStreakCard.tsx` (+ `.module.css`): Mon–Sun week rows, **compact spaced dots** (clamp 30–38px, not full-width tiles), flame pill carrying the streak, "N days played this month". Demo month fixed to **June 2026, today = the 10th**; played days = the current streak ending today. Dates use explicit `new Date(y,m,d)` (never `new Date()`) so SSR/client match. The whole drawer (hero + calendar + streak badges + progress) now fits with **no scroll**.
     - **Gamified traffic-light colors** (system semantics): done = green `--correct` (✓), today = yellow `#FFD60A` (fill if played, ring if not), missed (past + not played) = red `--wrong` (✕), future = neutral faint. NOTE: a brand-new member (streak 0) therefore shows past days as red ✕ — accurate to the rule but reads as a "wall of red"; consider scoping "missed" to since-join / active-streak if it feels punishing.
     - Replaces `WeeklyCard` **in the drawer only**; ProfilePanel still uses the cleaned 7-day `WeeklyCard` (FOLLOW-UP: unify if the monthly direction is approved).
   - **Badges → streak-only.** Drawer summary now shows `STREAK_BADGES` (7/30/100/365-day) under a "STREAK BADGES" header + "SEE ALL →" (→ full `BadgeTrophyGrid`). 7-day progress bar kept.
   - **Drawer panel made scrollable on desktop** (`overflow-y: auto`, height `min(760px, 90vh)`) — the taller calendar was being clipped by the old `overflow: hidden` / 720px cap.
   - **Fixed a real hydration bug:** `StreakDrawer` rendered its portal root even when closed → SSR/client mismatch + Next dev error overlay on every `/` load. Added a `mounted` gate (`if (!mounted) return null`) so first client render matches the server.
   - **NEW dev affordance:** `/?drawer=summary|all` opens the drawer on load (for QA/screenshots), matching `?as=` / `?skip=`.
   - Verified via headless-Chrome screenshots (member + member-played); tsc clean, `/`, `/?as=member|played`, `/?...&drawer=summary` all 200.

9. **Green/red SIGNAL LANGUAGE unified (Zach refs: LiveScore match-timeline) — DONE.** One discipline across surfaces: same `--correct` (green) / `--wrong` (red), same crisp pixel glyphs, contrast rule **black glyph on green / white on red**.
   - Added reusable `PixelCross` to `components/streak/PixelIcons.tsx` (red ✕ counterpart to `PixelCheck`).
   - `MonthlyStreakCard`: missed days now render `PixelCross` (white) instead of a text "✕".
   - `Reveal` per-Q segs (theme-3): de-blanded from washed `--correct-bg`/`--wrong-bg` 10% tints → **solid saturated** `--correct`/`--wrong` fills (matches the calendar dots); seg number black-on-green / white-on-red.
   - `Results` answer-review left unchanged — it was already the img1 model (`--surface` rows, 3px colored bar + verdict icon, thin dividers, no full-row fills).

10. **Leaderboard podium duplicate-"02" — FIXED.** `LeaderboardPanel` podium map keyed the ghost branch by `key={idx}` (1/0/2) but the real branch by `key={r.rank}`; in the **sparse** ("1-2 played") state the real rank-2 card and the idx-2 ghost both got `key=2` → React key collision → toggling board states left a stale real "02" card beside the ghosts. Fixed by keying both branches with the unique slot `idx`. Also added a `?board=empty|sparse|full` dev param to `LeaderboardPanel` (initial boardView) for QA, matching `?as=`/`?skip=`/`?drawer=`.

11. **Cabinet streak strip reverted to symmetric icon+count — DONE.** The BADGES column had been (wrongly) left as a `BadgeProgressRing`; restored to mirror STREAK per the original design: `badge-emoji.svg` icon + `×{userBadgeCount}` + "BADGES" label, left-aligned. Removed the now-dead `nextStreakBadge`/`STREAK_MILES`/`BadgeProgressRing` import from `EditorialLayout`. **Recolored `public/figma/editorial/badge-emoji.svg` from `#F772FF` (pink) → `#CEFF00`** (accent/"earned"; only used by this strip). Note: a disabled `{false && ...}` duplicate strip still sits at ~line 164 (pre-existing dead code).

12. **Mobile leaderboard peek no longer dims the cabinet — DONE.** `BottomSheet` scrim used to ramp linearly across the whole drag range (`[0, peekOffset, closedOffset] → [0.7, 0, 0]`), so the cabinet showed a dark cover before the sheet settled at peek. Now (peek-full mode) the scrim is **0 across the entire peek + lower-expand range** and only fades in (max **0.55**) over the final 35% approach to full — cabinet reads full-brightness on landing, leaderboard peek visible from the start. Modal mode unchanged (0.7 dim when open).

13. **Profile pass (Zach feedback + HipHopIQ ref) — DONE.** Two surfaces:
    - **`ProfilePanel` restructured HipHopIQ-style:** removed the StreakHero+WeeklyCard streak block + the one-line "87 total plays"; added a 3-up **stat-card bento** (Current Streak w/ fire `lucide Flame`, Quizzes Played [demo 87], Best Streak = `userBestStreak`) + a **Quiz History table** (DATE/SCORE/TIME/RANK demo rows, perfect 5/5 days in orange + fire) + kept the **badge grid** ("Your Badges") and guest lock. Stats chosen by user (no "points" system natively). `WeeklyCard` now orphaned (drawer uses MonthlyStreakCard; profile no longer uses it).
    - **Leaderboard player popup (`LeaderboardPanel`):** rank/score/time now labeled **TODAY** (it's the daily board); ⚡ → **fire** (`lucide Flame`); added a **badge row** (`BadgeMark` × 3, synthetic) so you can see a player's badges. Resolves Zach's 3 popup points.
    - **Dev params added:** `?rail=profile` (Results initial rail) + `?popup=1` (LeaderboardPanel opens a sample player popup) for QA/screenshots.
    - **Order + history cap:** badges sit **above** the quiz history (so the long list never buries them); history is capped to a **7-row preview** (`HISTORY_PREVIEW`) with a **"Show all N" / "Show less"** toggle (`showAllHistory`). Order: stat cards → Your Badges → Quiz History (collapsible) → privacy.
    - **Quiz History rule (codified):** PLAYED ATTEMPTS ONLY, newest first; **missed days are omitted** (never "no attempt" rows) — the `MonthlyStreakCard` is what surfaces missed days (red). Date gaps are normal (demo skips Jun 3). Real-data contract: `attempts.filter(a => a.played).sort(desc)`; consider capping the full "Show all" reveal to ~last 30 when real history lands.
    - **This supersedes the old "unify ProfilePanel streak view" follow-up** — the profile is now its own HipHopIQ-style screen, intentionally distinct from the cabinet streak drawer. tsc clean.

14. **QA pass — DONE.** Audited all visitor states/flows; fixed: (a) `/home#figmacapture` hydration (StateSwitcher now mounted-gated, `LandingPage.tsx`); (b) `BadgeUnlockedPopup` `new Date()` → fixed demo date (hydration-safe); (c) `MonthlyStreakCard` "red wall" — brand-new users (no history) no longer see past days as red ✕ (`hasHistory` gate; red only once established); (d) `BadgeTrophyGrid` `earnedBadgeKey` guarded with `?? null`; (e) removed the dead `{false && …}` duplicate streak strip in `EditorialLayout`; (f earlier) leaderboard podium duplicate-key fix. **Left intentional (called out, not bugs for a demo):** dev tools (StateSwitcher, board chip, `?as/?board/?drawer/?rail/?popup/?skip`, "Replay (dev)") — actively used for review; reset-on-reload persistence; category/archive cards → cabinet (valid dest, no per-category quiz). **Noted follow-ups:** focus traps on AuthModal/ShareCardModal; orphaned files (LoginPrompt, WeeklyCard, StreakCelebration, MissionRing, StreakModule) + dead CSS; quiz-history virtualization for real data.

15. **Design UAT — accent retired, palette = white + semantic — DONE.** Killed the lime accent (`--accent #CEFF00 → #FFFFFF` in `globals.css`) and swept every literal lime → white across **22 dark-experience files + `badge-emoji.svg`**. Chrome (buttons, headings, labels, tabs, borders, progress, leaderboard) is now **white**; meaning is carried by the semantic palette only — **green** `--correct` (correct/done), **red** `--wrong` (wrong/missed), **yellow** `#FFD60A` (today), **orange** `--streak`/`#ff7a1a` (streak/fire; added the orange streak pill in `MonthlyStreakCard`). Collectible badge artwork keeps its own varied colors (badge identity, not accent). The **light landing (`/home`) was already neutral black/white** and was excluded. **New squarish logo** (`public/figma/5for5-logo.svg`, self-contained COMPLEX/5·5/SNEAKER QUIZ badge) replaced the rectangular LED "5 F O R 5" cells in `ScoreboardLogo`. tsc clean; `/`, `/home`, `/play` all 200.

16. **SIGNAL-GREEN HUD repalette — DONE.** Per stakeholder feedback ("more gaming-signals green, fewer colors; remove pink + volt") and a research-backed UI/UX direction. Collapsed to **green + red + white + black**. New tokens in `globals.css :root`: `--signal #00FF85` (hero), `--signal-deep #00C46A` (fills), `--signal-glow`. **Unified:** `--accent`, `--correct`, `--streak` all → `var(--signal)` (positive/active/now/streak all one green); `--warn → #FFFFFF` (urgency via pulse, not amber), `--warn-hot → --wrong`; `--wrong #FF453A` unchanged (sole danger). **Retired entirely:** Volt lime `#CEFF00`, pink `#F772FF`, yellow `#FFD60A`, orange `#FF9500`/`#ff7a1a` — swept across all CSS/TSX/SVG (logo `#22C55E`→signal, crown.svg, flame.svg, badge-emoji gem, `--cq-pink`, pink icon SVGs, orphan components, landing LED). **Calendar** (`MonthlyStreakCard`): today no longer yellow — distinguished by green **ring + glow** (treatment, not hue); done = `--signal-deep` fill, missed = red. **Signal motifs already live:** green corner-bracket START (HUD reticle), green glow on today, green LED Doto numerics, green status labels.
    - **RESIDUAL (can't fix in code):** two **collectible badge PNGs** (`public/figma/badges/streak-7.png`, `speed-demon.png`) are still pink/magenta artwork — raster, not recolorable. Need re-exported art (recommended: streak badges → green/metallic tiers, special → jewel/purple, apex → signal green). All other surfaces are pink-free.
    - **FOLLOW-UP (designer's "add signals" spec, not yet built):** 5-LED-pip score row (Results/share), corner-brackets on the selected quiz answer (`Question.tsx`), zero-padded mono readouts (`05/05`, `#003`), a single scanline ceremony on badge-unlock. Foundation (green signal language) is in place. tsc clean; `/`, `/home`, `/play` all 200.

17. **Palette corrected to brand direction (Zack 2026-06-11) — DONE.** Supersedes item 16's "all-green." Final rule: **WHITE = primary accent** (buttons, headings, chrome, active states, leaderboard accents, today-focus); **green/orange/red = SIGNALS ONLY** (go / caution / stop). Tokens: `--accent #FFFFFF`; `--correct = --signal #00FF85` (green "go" = correct/done); `--wrong #FF453A` (red "stop"); `--warn #FF9500` + `--streak #FF9500` (orange = caution/fire/energy). Fixes this pass: (a) leftover lime **`#DBFF33`** button-hover (8 files) → off-white `#E6E6E6` (the "SEE RESULTS" lime-on-hover bug); (b) **fire/streak → orange** (flame.svg, PixelFlame/BigPixelFlame, profile Current-Streak icon, quiz-history perfect `5/5`+🔥, leaderboard popup streak, streak pill) per "make the score orange"; (c) calendar **today → white** ring+glow (done=green, missed=red); (d) badge gem → white. Logo "5·5" left green pending Mark's logo direction (Friday). tsc clean.

18. **SPLIT-FLAP LOGO (Mark's scoreboard direction, 2026-06-06 Slack video) — DONE (2026-06-11).** `ScoreboardLogo` now overlays a live, code-animated split-flap plate on the badge's bottom band (no new asset; the baked "SNEAKER QUIZ" plate is permanently covered). The flap rotateX-flips QUIZ (white plate / black Anton) ↔ `TODAY.category` (red plate `#C2231F` sampled from Mark's mock, white Anton) — hold 2.4s / 3.4s, 680ms `--spring-soft` settle, black housing visible mid-flip, reduced-motion = static QUIZ. Geometry derived from the SVG viewBox (flap = top 79.6%, height 19.85%, inside the 5.76-unit border); flap text sizes via container query (`12.5cqw`, px fallback). Mark's 10s reference video analyzed frame-by-frame from `~/Downloads/gemini_generated_video_73F46B15.MP4`.

19. **PODIUM → 21st.dev "first-place-leaderboard" card anatomy (Anusha, 2026-06-11) — DONE.** Both podiums (EditorialLayout desktop sidebar + mobile sheet, and Results `LeaderboardPanel`) restyled per nayan_radadiya6's component: avatar overlapping a **green-stroked card** (rgba(0,255,133,.38/.65-gold) + green tint bg + gold glow), **green names** (`--correct`), **yellow crown riding the #1 avatar** (pixel `crown.svg` recolored `#00FF85→#FFD60A` on home; lucide `Crown` filled yellow in LeaderboardPanel), **yellow rank chips** on avatars, **red avatar outline** (rgba(255,69,58,.9) — the red hint), and a slim **green score bar** (correct/5). EditorialLayout's two duplicated inline podiums deduped into a file-local `PodiumSlot` component. LeaderboardPanel ghost slots restyled to the same card anatomy (dashed). Mobile `peekHeight` 216→312 to keep full top-3 cards visible in peek. Retired classes: `podiumRank(_*)`, `podiumAvatar{Sm,Xs,Gold}`, `podiumScoreBox*`, `podiumScoreLabel`, `nameGold`, `ped_*`, `pedKicker`, `ghostPed`.
    - **NOTE (pre-existing, NOT from this change):** at 390px headless-Chrome window the whole app (incl. `/play`) lays out ~500px wide — global artifact/issue, verify on a real device; podium grid itself fits a true 390px viewport.

20. **OTHER-USER FULL PROFILE from the Results leaderboard — DONE (2026-06-11).** The mini-popup is gone; clicking any list row OR podium card in `LeaderboardPanel` now swaps the rail to the full `ProfilePanel` in **player mode**, with a **← back button** in the header returning to the board.
    - `ProfilePanel` gained optional `player` (`PlayerProfile`: name/avatar/rank/correct/time) + `onBack` props. Player mode: never guest-locked (public view), no edit affordances, no privacy row, kicker "Badges" (not "Your Badges"), identity line shows `RANK #N TODAY · score · time` (the old popup's info). Own-profile mode is unchanged at all 4 call sites.
    - Player data is **synthesized deterministically from rank** (`synthPlayer` — streak formula `((rank*3)%30)+2` matches the old popup; best/played/history seeded the same way, no `Date.now`/randomness, SSR-safe). History row 1 = "Today" with the player's actual board result; badge grid earns from the synth streak via the normal `BadgeTrophyGrid` rules + "perfect" only if today was 5/5.
    - Podium slots became real `<button>`s (`.podiumColBtn` reset + green hover stroke + focus ring). `?popup=1` dev param now opens a sample player profile. Popup JSX/state/CSS deleted (`popup*` classes, `POPUP_BADGES`, `BadgeMark` import).
    - Note: `LeaderboardPanel` → `ProfilePanel` import is one-way (no cycle). EditorialLayout home rankings list is NOT clickable (unchanged — Results-screen scope only).

21. **Results polish (Anusha, 2026-06-11):** (a) player-profile header is now a small `← LEADERBOARD` back button (no big "PROFILE" title in player mode; own-profile header unchanged). (b) Scorecard kicker got breathing room: `TODAY · ICONIC COLLABS · MAY 21`. (c) **Auto sign-in modal on Results landing REMOVED** (supersedes item 6's "conversion beat" — it interfered with the results moment). `gatedAuthCopy` + `onTriggerLogin` remain: auth is asked at point of intent only (share / challenge / claim / profile-lock taps).

22. **SHARE CARD REDESIGN + INSTANT CHALLENGE FLOW (planned + approved, 2026-06-11) — DONE.**
    - **Challenge = no modal.** Every "Challenge a friend" trigger (Results [still login-gated], LandingPage ×3 call sites, EditorialLayout AlreadyPlayedCard, play-page replay-lock AlreadyPlayedCard) now instant-copies a Wordle-style dare + link and confirms via the NEW shared `components/ui/CopyToast.tsx` ("Challenge link copied — send it"). Copy/text builders centralized in NEW **`lib/share.ts`** (`copyText`, `challengeLink`, `buildChallengeText` [score tease when post-play], `buildShareText`). `ShareCardModal` is **share-only** (`variant` prop removed at all 4 sites).
    - **Challenge link = `/c`** (NEW `app/c/page.tsx` + `app/c/opengraph-image.tsx`). The route's OG/Twitter meta + a generated 1200×630 ImageResponse (black + green LED dot grid + COMPLEX/5FOR5 lockup + "YOU'VE BEEN CHALLENGED") make the unfurl carry the dare. In-app, `/c` renders `<EditorialLayout challenged />` → green pulsing "YOU'VE BEEN CHALLENGED" pill above the cabinet logo. NOTE: `runtime="edge"` on the OG route did NOT hot-reload under the Turbopack dev server (renders were byte-identical across edits) — left on the default Node runtime, where ImageResponse works and HMR is fine.
    - **Card rebuilt as a holographic LED artifact** (`ShareCardModal.tsx/.module.css`): (a) signature LED dot-field INSIDE the card — static green CSS dots on open, lazy-upgrades to `PixelBlast` (green #00FF85, de-tuned, masked radially, 0.3 opacity) after 420ms, HomeBackdrop pattern; (b) **Magic UI shine-border port** — animated green→white gradient masked to a 1.5px ring via `mask-composite: exclude`, 9s loop, reduced-motion = static green ring; (c) **holographic foil glare** — `tilt-card.tsx` now writes normalized pointer pos to `--tilt-mx/--tilt-my` on the container; `.holoSheen` (mix-blend screen) rides them; (d) score hero now LED-green Doto w/ glow, squares = solid green/red signal language, kicker "COMPLEX · 5 FOR 5".
    - **Dev param:** `?share=1` on `/play?skip=results` opens the share sheet (QA), joining `?as/?board/?drawer/?rail/?popup/?skip`.

23. **PERSISTENT NAV + SITE FOOTER across the quiz experience (Anusha, 2026-06-11) — DONE.**
    - **GamesNav `dark` variant** (`components/landing/GamesNav.tsx/.module.css`): black bar, white `← COMPLEX.COM`, lockup inverted via `filter: invert(1)`, `z-index: 290` (above quiz screens' fixed layers, below modals at 300+), logo → `/` in dark mode. Mounted persistently on `/` + `/c` (EditorialLayout) and all `/play` screens incl. the replay lock. Light variant on `/home` unchanged.
    - **`components/landing/SiteFooter.tsx/.module.css`** — SMPLX Design System footer, Mode=Dark (Figma `1Op9CRCbOrgAt4yzR2yGWe` node 465-3008; desktop 465-39204, mobile 465-39203). Assets downloaded to `public/figma/footer/` (white wordmark, 7 social SVGs, a11y glyph). Real complex.com links; demo newsletter input ("GET NOTIFIED" → "YOU'RE IN"). Mounted on EditorialLayout (desktop; hidden <1024 — mobile home is the viewport-locked peek-sheet screen, nav carries the way back) and `/play` (all sizes).
    - **⚠ ROOT-CAUSE FIX:** `app/themes.css:6` had `html[data-theme="3"] [data-layout="editorial"] { display: flex !important; }` (legacy row flex). Adding the footer sibling collapsed the home grid to ~400px (footer became a row flex item). Fixed by adding `flex-direction: column` there. ALSO: desktop home was viewport-locked (`height: 100vh; overflow: hidden`) — now `min-height: 100vh` with `.grid { height: calc(100vh - 88px) }` so the app frame still fills the viewport but the document scrolls to the footer. Mobile `.grid` height gained a `- 60px` term + `.page` mobile `padding: 60px 8px 0` (clears the fixed bar). Results theme-3 `.shell` got `+56px` top padding.
    - **CopyToast hydration bug fixed** — `typeof document` SSR branch → `mounted` gate (same fix as StreakDrawer, item 8).
    - **`/home` is ARCHIVED IN PLACE** per Anusha: the light pre-quiz landing stays reachable at `/home` but nothing in the live dark experience links to it (only its own light GamesNav logo). Don't extend it; the dark cabinet at `/` is the home.
    - **Pink trophy fix:** the CHALLENGE A FRIEND hover applied a legacy magenta `hue-rotate(266deg)` filter chain to `icon-trophy.svg` — removed (icon stays white). Swept the last lime survivors `#A6D400` → `#E6E6E6` (badgeView/btnOutline hovers) and the leaderboard YOU-bar gradient.

24. **FOOTER REGRESSION FIXES + DARK AUTH MODAL (Anusha bug report, 2026-06-11 PM) — DONE.** Item 23's footer shipped broken in 4 ways; all root-caused (full retro now in `AGENTS.md → Debugging lessons`):
    - **Giant stretched social icons** — Figma MCP SVGs have no intrinsic size (`width="100%" preserveAspectRatio="none" overflow="visible"`); in an `<img>` with %-CSS they fell back to the 300×150 default replaced size. Fixed: all 9 `public/figma/footer/*.svg` sanitized to explicit viewBox-derived width/height (attrs stripped) + `.socialIcon img` sized in px.
    - **Footer bleeding through quiz screens / badge moment** — it was mounted globally under the fixed-screen state machine, visible through translucent scrims. Fixed: on `/play` the footer renders **on results only** (`{screen === "results" && <SiteFooter />}`); question/reveal/badge are footer-free. Home + `/c` keep it.
    - **"Solid background gone" on results** — Results `.shell` has `z-index: 100` + a fixed sneaker-photo `::before` that painted over the z-1 footer. Fixed: `.footer` → `z-index: 110`.
    - **Mobile home footer** — final placement (Anusha's call, agreed): the footer lives at the **end of the leaderboard sheet's scroll** (after rankings #4–10, `.sheetFooterBleed` bleeds past sheetInner padding). The sheet is mobile's real content surface, so "end of board = end of page". The mobile cabinet is back to the clean viewport-locked app screen (`height: 100dvh; overflow: hidden`); `.footerBleed` (document-flow footer) is desktop-only again.
    - **Leaderboard stats clipping (mobile sheet)** — `.lbStats` fixed `height: 67px` + `overflow: hidden` clipped the Doto numerals. Fixed: `min-height: 67px`, no overflow clip.
    - **AuthModal is now DARK** (`AuthModal.module.css` rewritten): `#0e0e10` shell + hairline border (matches ShareCardModal), outlined provider buttons, white primary CTA ("white = accent"), Apple icon → `currentColor`. Supersedes "only login/signup stays white".
    - Mobile horizontal overflow re-checked with an element-walk probe at 390px: **zero offenders, scrollWidth = viewport** — the "~500px wide" renders were a headless-Chrome artifact, not a layout bug.

25. **GAMING-SIGNALS PASS, all screens (CEO directive via Anusha, 2026-06-11) — DONE.** Codified ramp: **green = go/correct/earned · yellow = now/in-progress · orange = streak/fire · red = stop/wrong/missed.** White stays chrome.
    - **Home cabinet:** cursor pixel-trail → signal green; START button → new `gradient="signal"` preset on CornerFrameAnimatedButton (desktop: green fill + black label sweeps in on hover; mobile ≤767px: solid green/black at rest, brackets hidden); streak/badges **pip hover `#1A0218` (the reported pink shade) → neutral gray** + distinct deeper-gray `:active`; strip hover 0.06→0.08 + pressed 0.14 bg.
    - **Countdown:** 3·2·1 white, **GO lands in signal green** with glow (`data-go`).
    - **Quiz screen:** timer is a traffic light — **green at rest → orange ≥10s → red ≥20s** (thresholds were already 10/20; base color was white, now green w/ glow); LED dot field (CSS `.ledField` + `LedBackdrop` WebGL) white → **green**.
    - **Badge unlock:** DATE chip removed (streak only, per Anusha); streak number → **orange** (was green).
    - **Results:** score hero wears its verdict — `data-grade`: **green ≥4, orange =3, red ≤2** with matching glow. (Per-question segs, answer-review bars already green/red; streak flame already orange.)
    - **Streak drawer / badges:** monthly calendar **today → yellow** ring/halo (was white; done=green, missed=red unchanged); badge progress rings — **in-progress arc → yellow** (was white), **earned → signal green** (was muted #3FBF7F); drawer 7-day progress bar → yellow.
    - NOTE: Results screen has no LED dot field to recolor (Anusha mused about one) — if wanted later, mount `LedBackdrop color="#00FF85"` behind the theme-3 shell.

26. **EVENING POLISH ROUND (Anusha, 2026-06-11 PM) — DONE.**
    - **Legibility:** question-screen date/theme header now sits on a blurred dark plate (`rgba(0,0,0,0.55)` + blur 14px).
    - **Results compaction:** score hero ≤64px, TIME tile → compact chip, tighter pills/dividers — answer review went 2 → 4 visible rows at ~930px.
    - **AlreadyPlayedCard:** centered; desktop CTAs = full-width primary + paired secondaries (View leaderboard kept).
    - **Streak drawer redesign:** smaller hero (flame 56/num 48), bigger badge medallions (64/72), tighter desktop modal (600×660).
    - **Share card:** real 5for5 scoreboard logo replaces the text kicker.
    - **PINK FULLY RETIRED (for real this time):** strip hover `#200020`, Results scrollbar `rgba(247,114,255,…)`, badge-unlock glow `rgba(247,114,255,…)` → neutral/white. Grep for `247,114,255|#200020|#1A0218|f772ff` now returns nothing.
    - **HOW IT WORKS recolored to signals:** visuals' pink shell `#1A0014` → green-tinted near-black + green stroke; timer LED green; weekly done=green/today=yellow; podium winner gold ring + green name; Stepper active=yellow / complete=green w/ **black** pixel checks; weekly ticks black-on-green; hiw avatars crisp white strokes (#1 stays gold = winner signal). NEW dev param `?hiw=1`.
    - **APPLE DARK-MODE ELEVATION (standing rule, now in AGENTS.md):** all overlays lightened off the black canvas — StreakDrawer/AuthModal/ShareCardModal/HowItWorksPopup shells → `var(--surface)` #1C1C1E, interior cards (monthly calendar, hiw rows) → `var(--surface-2)`, CopyToast aligned. (The drawer had been made pure black earlier today and vanished into the page — reverted to elevation.)
    - **Signal discipline enforced on chrome:** global `*:focus-visible` outline green → **white** (focus is chrome, not a "go" signal).

27. **TYPE RAMP UNIFIED (Anusha, 2026-06-11 PM; researched against Apple HIG + Airbnb) — DONE.** Rule now in `AGENTS.md → Type ramp`: hierarchy by size+weight, never case; titles = 22/600/-0.01em sentence case; caps only for 10–11px eyebrows; brand mark outranks all UI headings. Applied: "Streak & badges" + "All badges" + "See all →" (drawer), "How it works?" heading, **Leaderboard rail titles de-shouted** (was clamp up to 40px/64px/800 caps — the biggest text on the page — now 22/600 sentence in LeaderboardPanel, ProfilePanel, EditorialLayout sidebar `.lbTitle` + mobile `.sheetTitle` 20/600, "← Leaderboard" back btn), AuthModal 24→22, ShareCardModal 700→600, ProfilePanel "Your badges"/"Quiz history". Eyebrows (TOP 3 · TODAY, RANKINGS, STREAK BADGES, ANSWER REVIEW) intentionally stay caps.

28. **Played-state cabinet fixes (Anusha, 2026-06-11 PM) — DONE.** (a) `.photoBox` was flex-compressing into a cropped strip when the played state packed more content into the viewport-locked cabinet — now `flex-shrink: 0` (ratio 920/340 NEVER crops) + a `.cabinetPlayed` variant that scales the photo down **proportionally** (`min(42vw, 600px)`). (b) "You already played today." de-heroed: clamp(1.6–2.2rem)/800 → clamp(1.25–1.5rem)/700; sub trimmed. NOTE: Anusha's message cut off at "Today's chart needs to be…" — follow up on what change she wanted there.

29. **STRAVA PERFECT-WEEK RAIL + PROFILE CALENDAR + MOBILE CABINET FIX (Anusha, 2026-06-11 PM) — DONE.**
    - **MonthlyStreakCard** now renders week rows with an 8th rail column (Strava pattern): **perfect week (7/7 played) = gold check w/ glow**, week containing today = dashed open ring, otherwise faint ring; footer appends "· N perfect weeks". Verified: `?as=played` shows Jun 1–7 gold.
    - **Profile gets the streak section back:** `MonthlyStreakCard user={gridUser}` between stat cards and badges in ProfilePanel — works for other-player profiles too (synth user).
    - **Mobile cabinet un-broken** (the rigid `flex-shrink: 0` photo from item 28 squeezed logo/START/strip on mobile): mobile `.photoBox` now `flex: 1 1 0; min/max-height 96–240px; aspect-ratio 920/340; width: auto` — the photo absorbs height shortage **proportionally** (same band ratio as desktop, never crops, never squeezes siblings). Mobile rhythm retuned: logo clamp 46vw/230px, tighter date/START margins. Removed the superseded duplicate mobile photoBox rule.
    - **LeaderboardPanel railHead** → flex row: dev chips (Full / 1-2 played / Empty) sit right of the title, not wrapped beneath it.

30. **EDITORIAL SPLIT CABINET (Anusha's mock, 2026-06-11 night) — DONE.** Home cabinet rebuilt to the approved layout: **desktop** = left-aligned copy column (logo → green "DAILY QUIZ · date" eyebrow → big left "ICONIC COLLABS" → sub → solid green **START QUIZ →** → HOW IT WORKS) beside a full-height **gold AM97 hero photo** (`public/figma/editorial/sneaker-hero-gold.png`, from Anusha's Desktop) with editorial photo credit; below, **3 game cards** replace the old strip: CURRENT STREAK (flame, guest sign-in nudge → auth), BADGE COLLECTION (count of 11, View collection → drawer all-badges), NEXT BADGE TO UNLOCK (BadgeProgressRing streak-7, yellow progress bar, x/7). **Mobile** = hero-first stack: photo (flexes, ratio-safe) → logo → eyebrow → left title → **horizontal checklist** (5 QUESTIONS · 1 MINUTE · EARN TODAY'S BADGE, lucide icons) → green START QUIZ → compact streak/badges strip; budget cuts to fit the locked 100dvh frame: themeSub + signInSave + howItWorks hidden on mobile (checklist carries the rules; strip streak cell routes guests to auth). Deviations from mock (per signal discipline): no magenta Speed Demon icon (real ring art, grayscale-until-earned + yellow arc), white CTA instead of gold. Old `.photoBox/.dateLine/.startBtn`(corner-frame) markup removed from home; CornerFrameAnimatedButton now unused here (still used elsewhere? check before deleting). `?as=played` state keeps AlreadyPlayedCard in the copy column.

31. **Cabinet follow-ups (Anusha, 2026-06-11 night) — DONE.** (a) **NEXT BADGE TO UNLOCK card is gated to logged-in users** (`phase !== "guest"`); guests see 2 cards (streak w/ sign-in nudge + collection) filling the row via `auto-fit`. (b) **Mobile hero now matches the reference exactly**: the photo owns the section (min 250px, flexes), with a top+bottom dark gradient shade; **logo overlaid top-center on the photo**, green DAILY DROP + date top-left, TODAY'S THEME + big title riding the bottom gradient; the copy column below is just checklist → START QUIZ → strip. Copy-column logo/eyebrow/theme are hidden <1024 (they live on the hero); photo credit hidden on mobile.

32. **Checklist REMOVED + played-state column fixed (Anusha, 2026-06-11 night) — DONE.** (a) The mobile expectations row (5 QUESTIONS · 1 MINUTE · EARN TODAY'S BADGE + TODAY'S BADGE preview) is **deleted entirely** per user call — markup, CSS, and its imports; mobile shows the one-line sub instead. (b) **AlreadyPlayedCard inline variant**: left-aligned (matches the editorial column), headline demoted to a 1.15rem status line ("You already played today." must not compete with the theme hero), CTAs are now **compact horizontal** buttons (auto width, wrap); the full-screen `variant="screen"` (play replay-lock) keeps its centered stacked layout.

33. **QUESTION SCREEN v2 (Anusha's mocks, 2026-06-11 night) — DONE.** Complete rebuild of `Question.tsx` (theme-3): full-bleed **gold AM97 hero** (same image as home) under a top/bottom legibility shade; **QUESTION N OF 5** (N green) + 5-segment progress bar (done/current green); centered **LED stopwatch** (label "YOUR TIME" above on mobile, below on desktop; traffic-light escalation intact); question text lower-left (Inter 800, max 26ch); answers as **letter-chip rows** (A–D in green-stroked squares; selected = green-filled chip + green-tinted row) — 1-col mobile, 2×2 desktop. Frosted card, LED dot field, theme-label plate, and old `question-bg.png` layer all retired (CSS overridden via the appended v2 block; legacy rules left dead in the file — Phase-8 cleanup). Keyboard A–D/1–4 + remount-on-question focus fix preserved.

34. **Question v2 legibility + de-green (Anusha, 2026-06-11 night) — DONE.** (a) **Mobile text-over-image fixed**: `.qHeroShade` gradient now ramps to **solid `#000` from 70%** (was a translucent 0.88 floor), so the bottom-anchored question text + answers always sit on solid black, never the bright midsole. (b) **Answer chips de-greened** (green read as "the correct answer"): `.optKey` border/selected state → neutral white (white chip + black letter when selected), was signal green. (c) **Deleted the dead legacy theme-3 `.options/.opt/.optLetter/.optText` block** (lines ~392–499) — its `background:transparent !important` + `border-top !important` divider rules were bleeding through the v2 layout as faint row dividers. v2 block at file end now solely owns the answer styling.

35. **Question hero → contained blended band (Anusha, 2026-06-11 night) — DONE.** Replaced the full-bleed cropped backdrop with an **in-flow image band** between the timer and the question: `object-fit: contain` (full shoe always visible, never cropped) + a `mask-image` linear-gradient fading the **top & bottom edges into black** so it blends rather than sitting as a hard-cropped backdrop. Band `flex: 1 1 0` so it absorbs leftover vertical space and the layout always fits. Shell is now solid `#000` (no shade gradient needed — question + answers sit on real black). Same treatment desktop + mobile. `.qHero/.qHeroShade` (absolute backdrop) replaced by `.qHeroBand`; `.qLayout` no longer absolute.

36. **Batch polish (Anusha, 2026-06-11 late) — DONE.** (1) GamesNav lockup shrunk (logo 46→38 desktop / 34→30 mobile; bar height kept at 56/52 so all `calc(56px…)` offsets stay valid). (2) Question text bigger on mobile: `.qText` floor 22→25px (`clamp(25px, 3vw, 34px)`). (3) **Desktop question = side-by-side** (was top/bottom): theme-3 `.qLayout` becomes a 2-col grid via `grid-template-areas` — left column stacks head→timer(left-aligned)→question→1-col answers, right column is the full-height shoe band spanning all rows. Mobile keeps the flat stacked flex layout (grid-area names are inert under flex). (4) **AuthModal z-index 300→460** — it was opening *under* the mobile `BottomSheet` (z 310), so "Sign in" from the profile sheet appeared to do nothing; now topmost (above BottomSheet 310 + StreakDrawer 400).

37. **Played-card declutter + desktop question full-bleed (Anusha, 2026-06-11 late) — DONE.** (a) **AlreadyPlayedCard inline** (cabinet): headline 1.15→1rem, sub →0.8rem, buttons smaller (0.5rem/0.85rem pad, 0.78rem), **View leaderboard removed** on the inline variant (board's already on the page; kept on `variant="screen"` replay-lock) — fixes the cramped/breaking mobile played state. (b) **Desktop question screen** rebuilt from the boxed grid to **full-bleed**: `.qHeroBand` is `position:absolute` covering the right 58%, `object-fit:cover`, with a horizontal `mask-image` fading its left edge to transparent so it dissolves into the black left column (blends behind the timer). `.qLayout` is a left-aligned, vertically-centered flex column; content (header, timer, YOUR TIME, question, answers) constrained to `min(540px,46vw)`, all left-aligned. Mobile unchanged (contained band).

38. **Results overflow clip — ROOT-CAUSE FIXED (Anusha, 2026-06-11 late) — DONE.** The answer review's last row (Q5) was clipped on ≥1024×≥880 viewports. Cause: `@media (min-width:1024px) and (min-height:880px)` forced `.shell { height:100dvh; overflow:hidden }` with `.inner { height:100%; overflow-y:visible }` — content taller than the viewport overflowed and was clipped, with NOTHING scrolling. The earlier "compaction" fix only shrank content to fit one load (symptom, not cause). **Fix:** removed the height-lock entirely — the results shell now always flows (`min-height:100dvh; overflow:visible`, document scrolls), `.inner` is `height:auto`, and the leaderboard rail is `position:sticky` (bounded widget, scrolls internally) so it stays in view while the variable-length scorecard scrolls. New permanent rule in `AGENTS.md → "Variable-length content NEVER goes in a clipped, viewport-locked box"`.

39. **Results bento height-matched (Anusha, 2026-06-11 late) — DONE.** Per request, the left scorecard `.inner` is now the **same height as the leaderboard rail** on desktop (`height: calc(100dvh - 88px)`, `position: sticky; top: 72px`, `align-self: start`) with **`overflow-y: auto`** — a longer answer review scrolls *inside the column*, bottoms of both columns align. This is the SAFE viewport-height column (real internal scroll, never `overflow: hidden` — distinct from the item-38 clip bug). Mobile unchanged (single-column document flow).

40. **SHARE CARD → verdict card, 5 states (Anusha's mock, 2026-06-11 late) — DONE.** Rebuilt the `ShareCardModal` card body to the reference: COMPLEX·5 FOR 5 / SNEAKER QUIZ lockup (top-left, HTML/CSS), date + theme top-right (theme in accent), sparkle, **verdict headline** (Anton), subtitle, divider, big LED score (Doto, accent + glow), two stat cards (COMPLETED IN {s} · NEW PERSONAL BEST · clock icon; DAILY RANK #{rank} · OF {of} PLAYERS · TOP {pct}% pill · bars icon), and a **BADGES UNLOCKED** 3-up row (BadgeMark + name + criteria). Kept the tilt + shine + lazy LED PixelBlast (user: "keep all effects"); accent drives PixelBlast color + shine + dots via `--card-accent`.
    - **NEW `lib/verdict.ts`** = single source of truth: `scoreVerdict(score)` → {grade,label,subtitle,accent} for **5/5 FLAWLESS RUN (green) · 4/5 SHARP (dim green) · 3/5 IN THE GAME (white) · 2/5 OFF TODAY (amber) · 0–1/5 AIRBALL (red)**, and `cardBadges()` (5/5 = all 3 performance badges; 4/5 = ON FIRE if streak>0; 3/5 = ON FIRE if milestone; 2/5 = none; 0–1/5 = none + `AIRBALL_BADGE_LINE` "Play again tomorrow to keep your streak."). Because every surface opens this one modal, the copy is identical everywhere automatically.
    - `ShareData` gained optional `timeSec?`/`personalBest?` (both derive from existing fields, so **no caller changes needed**). Dev param **`?cardscore=0..5`** on the share modal previews any state (e.g. `/play?skip=results&share=1&cardscore=2`). Verified all 5 states desktop + mobile.
    - **Refinements (same session):** headline font Anton → **Inter 800** (user call); top-left logo → horizontal **`5for5-horizontal.png`** lockup (`.cardLogo`, 46px; was the square `5for5-logo.svg`); **AIRBALL "Play again tomorrow…" line removed** — shareable card, no re-engagement nudge (badgeless states omit the badges block). `AIRBALL_BADGE_LINE`/`.airballLine` dead/removed.
    - **BUG FIXED:** the card always showed 0/5 — the `?cardscore` dev param used `Number(null) === 0`, which passed the `>=0 && <=total` guard whenever the param was absent, forcing score 0. Now guards `param === null` first (→ NaN → falls back to real `data.score`). Verified the real share path shows the actual score (4/5 SHARP demo).
    - **Polish:** sparkle removed; `.holoSheen` glare tint now `color-mix(var(--card-accent))` (follows verdict accent — amber/red/green — instead of hardcoded green); `.cardLogo` 46→38px.

41. **Results actions: side-by-side + sign-in CTA (Anusha, 2026-06-12) — DONE.** Results theme-3 `.eButtonsRow` → 2-col (SHARE SCORE + CHALLENGE A FRIEND side by side; was stacked) — pulls the answer review up. Added a **prominent score-aware sign-in CTA** (`.eSignInCta`, white filled, full-width, above the buttons, **gated-only**): "SIGN IN TO SAVE YOUR SCORE" when `correctCount >= 4`, else "SIGN IN TO SAVE YOUR STREAK". When gated, SHARE is outline (sign-in is the sole primary); when logged in, no sign-in CTA and SHARE returns to filled. Calls `onTriggerLogin`.

## Pending / next (Zack meeting 2026-06-11)

- **Results dynamic sign-in messaging** by score: good score → "Save your score / Don't lose your score"; bad score → "Save your streak". (replaces the static gated prompt)
- **Profile quiz history capped at 30 days** (currently 14 demo rows + Show all).
- ~~**Other-user profile**~~ — ✅ DONE 2026-06-11, see item 20.
- ~~**Streak page perfect-week column**~~ — ✅ DONE 2026-06-11, see item 29.
- **Quiz timer:** shift color at 10s (orange) and 20s (red) — current thresholds are 30s/45s; retune + recolor.
- **Friday:** nav + landing wireframes → full mockup, incorporate Mark's logo; add standard Complex header/footer to the quiz page (no separate landing hub for MVP).
- **AI quiz-image generation** process (Flora team) using Zack's topic list.

## Earlier follow-ups

1. **Re-export the 2 pink badge PNGs** (streak-7, speed-demon) to the green/jewel collectible ramp — the only remaining pink in the app (raster artwork).
2. **(resolved) ~~Pre-existing hydration warning on `/home` in capture mode~~** — fixed in item 14 (StateSwitcher mounted-gated).
2. **(resolved) ~~Unify ProfilePanel streak view~~** — profile is now an intentional HipHopIQ-style screen, distinct from the cabinet streak drawer.
3. **Accent ground-rule above is stale** — the "CQ accent is exactly `#F772FF`" / `#FFD000` line near the top no longer holds; accent is now white, meaning lives in green/red/yellow/orange. (Left the historical note for context.)
4. **Noted QA follow-ups** (not blocking): modal focus traps; delete orphaned files + dead CSS; gate dev tools for a real (non-preview) launch; virtualize quiz history for real data.
2. **`backdrop-filter` blur does NOT composite over the dark quiz** (its WebGL/filter layers break it) — that's why scrims rely on a heavy dark dim (0.82 share / 0.72 auth) rather than blur. If true blur is required over the quiz, needs a different approach (e.g. snapshot/overlay).
3. **Share card surfaces**: wired on landing + Results theme-3 only. Not yet on the dark home (`EditorialLayout`) sidebar/mobile-sheet share entry points if any.
4. **`app/streak-wireframes/page.tsx`** still has ~25 em dashes in its `title`/`sub`/`label` props — left intentionally (internal design-spec scaffold, not shipping UI). Clean if desired.

## Key files added this session
- `components/share/ShareCardModal.tsx` + `.module.css`
- `components/ui/tilt-card.tsx` (CardContainer/CardBody/CardItem, reduced-motion safe)
- `components/landing/GamesNav.tsx` + `.module.css`
- `public/figma/complex-playground.svg`
