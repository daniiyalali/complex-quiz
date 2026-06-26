// Mobile audit harness — emulates iPhone 14 Pro Max (430×932 @3x) so we see
// the TRUE small-viewport render (headless --window-size clamps to 500px; this
// uses CDP device metrics via Playwright, which does not). Usage:
//   node scripts/shoot-mobile.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "/tmp/cq-mobile";
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE || "http://localhost:3000";
// Two heights: 932 = full-screen iPhone 14 Pro Max; 730 ≈ usable height once
// Safari's URL bar + bottom toolbar are showing (the state the user hits).
const VH = Number(process.env.VH || 932);
const IPHONE = {
  viewport: { width: 430, height: VH },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
};

const tap = async (page, text) => {
  const el = page.getByText(text, { exact: false }).first();
  await el.click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(900);
};

// [label, path, extra async steps(page)]
const SHOTS = [
  ["home", "/", null],
  ["question", "/play?skip=question", null],
  ["results", "/play?skip=results", null],
  ["results-share", "/play?skip=results&share=1", null],
  ["results-lb-open", "/play?skip=results", (p) => tap(p, "VIEW LEADERBOARD")],
  ["results-profile-open", "/play?skip=results", (p) => tap(p, "VIEW PROFILE")],
];

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-gl=swiftshader"],
});
const ctx = await browser.newContext(IPHONE);
const page = await ctx.newPage();

for (const [label, path, steps] of SHOTS) {
  await page.goto(BASE + path, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1400);
  if (steps) await steps(page);
  // viewport-clipped (what the user actually sees) + full page (overflow check)
  await page.screenshot({ path: `${OUT}/${label}.png` });
  await page
    .screenshot({ path: `${OUT}/${label}-full.png`, fullPage: true })
    .catch(() => {});
  // report the document vs viewport height + any element overflowing right edge
  const metrics = await page.evaluate(() => {
    const de = document.documentElement;
    const over = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > window.innerWidth + 1)
        over.push(
          (el.className?.toString?.() || el.tagName).slice(0, 40) +
            ` right=${Math.round(r.right)}`,
        );
    });
    return {
      innerW: window.innerWidth,
      innerH: window.innerHeight,
      scrollH: de.scrollHeight,
      overflowRight: [...new Set(over)].slice(0, 8),
    };
  });
  console.log(label, JSON.stringify(metrics));
}

await browser.close();
console.log("DONE → " + OUT);
