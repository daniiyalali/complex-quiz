<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design system rules (standing user directives)

## Apple dark-mode elevation (2026-06-11, Anusha)
The page canvas is pure black; **surfaces lighten as they rise** (Apple HIG
elevated backgrounds): page `#000` → elevated sheets/modals `var(--surface)`
`#1C1C1E` → cards inside them `var(--surface-2)` `#2C2C2E` → chips `--chip`.
NEVER make an overlay pure black — it disappears into the canvas (this
happened; see HANDOFF item 26). Buttons stay sharp-cornered (house deviation
from Apple's rounded controls).

## Signal color discipline (CEO direction, 2026-06-11)
green = positive/go/correct/earned · yellow = now/in-progress/active ·
orange = streak/fire · red = negative/stop/wrong/missed · white = chrome
(focus rings, borders, primary CTAs). Never use a signal color decoratively
(e.g. no green focus rings, no green strokes on close buttons). Glyph
contrast: black on green/yellow, white on red.

## Type ramp (2026-06-11, Anusha — grounded in Apple HIG + Airbnb practice)
Inter everywhere; hierarchy comes from **size + weight, never case**.
- **Editorial hero** (theme title, score): existing clamp display sizes — the only screaming text allowed; the brand mark outranks all UI headings.
- **Title** (every modal/sheet/panel header): `22px / 600 / -0.01em / sentence case`. "Streak & badges", "Leaderboard", "How it works?" — never ALL CAPS, never bigger than the logo.
- **Mobile sheet title**: `20px / 600 / -0.01em`.
- **Eyebrow** (tiny section labels — the ONLY place caps are allowed): `10–11px / 700 / ls 0 / text-3` ("TOP 3 · TODAY", "ANSWER REVIEW", "STREAK BADGES").
- **CTAs**: uppercase allowed (brand voice), sharp corners.
Doto = numerics only; letter-spacing 0 or negative (house rules unchanged).

# Debugging lessons (hard-won — read before shipping UI changes)

## Figma MCP SVG assets have NO intrinsic size
Assets downloaded from the Figma MCP ship as `<svg width="100%" height="100%" preserveAspectRatio="none" overflow="visible">`. Used in an `<img>`, the browser has no intrinsic dimensions, so `%`-based CSS sizing resolves circularly and falls back to the **300×150 default replaced size** (the "giant stretched icons" bug, 2026-06-11; crown.svg hit the same class of issue earlier).
**Rule:** before using any Figma-MCP SVG, sanitize it — set explicit `width`/`height` from the viewBox, strip `preserveAspectRatio="none"`, `overflow="visible"`, and the inline `style`. And size such `<img>`s in **px, never %**.

## Global mounts need per-surface decisions
The quiz flow is a state machine of **full-viewport `position: fixed` screens with translucent scrims** (countdown, reveal, badge-unlock). Anything mounted in document flow "globally" (nav, footer) is visible *through* those scrims and behind their backdrops. Mount chrome per screen (e.g. footer on results only), not around the whole state machine.

## themes.css has layout-changing `!important` globals
Example: `html[data-theme="3"] [data-layout="editorial"] { display: flex !important; }` silently made the home page root a flex **row** — invisible while it had one in-flow child, catastrophic when a second sibling (footer) was added (the grid collapsed to its min-content width). When adding/removing siblings breaks layout inexplicably, **check the computed `display` of the parent first** — one `console.log(getComputedStyle(el).display)` (dev server forwards browser console to `.next/dev/logs/next-development.log`) beats an hour of CSS-file archaeology, because the offending rule may not live in the module CSS you're editing.

## Verification must cover every surface, full-height, eyes on every region
The footer regression shipped "verified" because verification was top-of-page crops of three surfaces. The bugs were: at the **bottom** of pages, on surfaces **not** screenshotted (badge-unlock, mobile), and **visible in the captured screenshots but unexamined** (the stretched icons were in frame next to "FOLLOW ON" and went unnoticed).
**Rule:** when mounting something on N surfaces, screenshot all N surfaces at full content height (desktop + 390px mobile), and actually inspect every region of each image — especially the part you just added.

## Fixed-height boxes clip text
Don't give text containers fixed `height` + `overflow: hidden` (the 67px `.lbStats` clipped its Doto numerals on mobile). Use `min-height`.

## Headless Chrome clamps the layout viewport to a 500px minimum
`--headless=new`/`--headless=old` with `--window-size=390,…` does NOT render at a 390px CSS viewport — `window.innerWidth` clamps to **500px**, while the `--screenshot` output is still cropped to the 390px window. Net effect: the right ~110px of the 500px layout is cut from the capture, which **looks exactly like a real layout overflow but isn't**. This burned ~10 tool calls chasing a phantom mobile grid clip (the badge trophy grid was fine; the capture was just narrower than the render).
- **Verify before "fixing":** log `window.innerWidth` from the page (via `console.warn` — only warn/error forward to `.next/dev/logs`, not `console.log`) and measure the suspect element's `getBoundingClientRect().right` vs its parent's width. If `right < parentWidth`, there is no overflow — it's the capture window.
- **To reason about true ≤480px phones** (which headless can't render): use the box model directly. `grid-template-columns: repeat(3, 1fr)` with a fixed-width child (e.g. a 100px ring) gives each track a 100px min-content floor, so 3 rings + gaps + container padding must fit the real viewport or the last column clips. Compute it; don't trust the screenshot below 500px.

## Variable-length content NEVER goes in a clipped, viewport-locked box (the recurring "module breaks / last item cut off" bug)
This bit twice on the **Results screen** (answer review Q5 cut off). The trap: a screen locked to `height: 100dvh; overflow: hidden` (often behind a `@media (min-height: …)`), with children at `height: 100%; overflow-y: visible`. The moment content exceeds the viewport — all N list rows, longer wrapping text, a viewport just over the media-query threshold, browser zoom, larger font — the overflow is **clipped and nothing scrolls**. The last rows vanish with no way to reach them.
- **Symptom fix that DOESN'T work (don't repeat it):** shrinking fonts/padding/"compacting" so one content load happens to fit. It clips again on the next longer load. If you catch yourself tuning sizes to make something fit a fixed box, STOP — that's the wrong layer.
- **The rule:** any region holding variable-length content (lists, answer reviews, feeds, anything that grows) must be able to **scroll or grow** — never `overflow: hidden` at a fixed height. Default to **document/section flow** (`min-height: 100dvh; overflow: visible`, the page scrolls). Only lock to `100dvh` when the content is *provably bounded* (e.g. a self-contained widget that scrolls internally, like the leaderboard panel) — and then give that widget its own internal scroll. To keep a bounded sidebar in view next to a long scrolling column, use `position: sticky`, not a viewport height-lock on the parent.
- **Decision check before locking any screen to the viewport:** "Can the content inside ever be taller than the viewport? If yes, where does the overflow scroll?" If there's no scroll answer, don't lock it.
