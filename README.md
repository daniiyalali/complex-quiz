# CQ Daily Sneaker Quiz — "5 for 5"

Front-end prototype for **Complex Daily**, a once-a-day, 5-question sneaker
trivia game. Next.js, client-only, all data currently mocked in `lib/`.
Visual system: **CQ Apple Dark v3**.

## Start here — which doc do I read?

| If you want to… | Read |
|---|---|
| Understand the design system, visual decisions & current state | [`HANDOFF.md`](./HANDOFF.md) |
| Know the standing design directives + UI debugging rules | [`AGENTS.md`](./AGENTS.md) |

**Backend wiring:** all mock data + domain types live in `lib/` (see Layout
below) — that directory is the contract surface to swap for real APIs.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (typechecks + compiles every CSS module)
```

> **Node toolchain note (2026-06-22):** this machine had **no system Node.js**
> (nothing on `PATH`, no nvm/volta/fnm/brew). To run without a global install, a
> standalone **Node v22.14.0** (darwin-arm64) was vendored into `./.localnode/`.
> Put it on `PATH` for any `node`/`npm` command:
> ```bash
> export PATH="$PWD/.localnode/bin:$PATH"   # run from the project root first
> ```
> `./.localnode/` is ~176 MB of binaries — delete it once Node is installed
> system-wide. It is *not* a dependency of the app, just the local runtime.

## Deploy

Source lives at **`github.com/daniiyalali/complex-quiz`** (private) and deploys
to **Vercel** — the native target for Next.js 16. Import the repo at
`vercel.com/new`; it auto-detects the framework (build `next build`, no config
needed). The `force-dynamic` pages and the `/c` dynamic OG-image unfurl
(`next/og`) work as-is on Vercel — do **not** statically export them.

## Key routes

- `/` — home cabinet + leaderboard
- `/home` — "5 for 5" landing
- `/play` — the quiz flow (countdown → 5 questions → reveal → badge → results)
- `/c` — challenge deep-link
- `/preview/*` — dev-only component previews (strip before prod)

**Dev query params** (QA shortcuts): `/play?skip=question|reveal|results|badge-unlock`
jumps into a flow stage · `/play?skip=results&score=N` (N = 0–5) seeds the synth
score to review each Results verdict-color tier · `/?as=guest|member|played`
seeds the home visitor state.

## Layout

```
app/        routes + globals.css (v3 design tokens)
components/  UI — quiz/, results/, streak/, badges/, landing/, layouts/, ui/
lib/         ★ all mock data + domain types — this is the backend contract surface
hooks/       shared hooks
public/      assets
```
