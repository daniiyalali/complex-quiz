"use client";

/* QA / Figma-capture preview — the leaderboard panel at desktop and mobile
   widths side by side, so one html-to-design capture carries both frames.
   `?mode=light` renders a WHITE-MODE exploration (Figma reference ONLY —
   the overrides below are scoped to this page's `.lbLight` wrapper and do
   not touch the product). The capture script loads only with #figmacapture. */

import { useEffect, useState } from "react";
import { LeaderboardPanel } from "@/components/results/LeaderboardPanel";

const FRAME: React.CSSProperties = {
  background: "#000",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 16,
  overflow: "hidden",
  height: 1040,
  display: "flex",
  flexDirection: "column",
};

const LABEL: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
  margin: "0 0 10px",
};

/* White-mode palette (preview-only): Apple light grays; signals re-tuned for
   contrast on white — green #00A85C (deep #00833F text), red #E02D26,
   gold #F5B400. Scoped under .lbLight via module-class substring selectors. */
const LIGHT_OVERRIDES = `
.lbLight [class*="__panel"] { background:#fff; color:#000; }
.lbLight [class*="__railHead"] { border-bottom-color: rgba(0,0,0,0.10); }
.lbLight [class*="__railTitle"] { color:#000; }
.lbLight [class*="__tabs"] { border-bottom-color: rgba(0,0,0,0.12); }
.lbLight [class*="__tab"] { color: rgba(0,0,0,0.45); }
.lbLight [class*="__tabActive"] { color:#000; border-bottom-color:#000; }
.lbLight [class*="__statsRow"] { background:#F2F2F7; }
.lbLight [class*="__statNum"] { color:#000; }
.lbLight [class*="__statLbl"] { color: rgba(60,60,67,0.6); }
.lbLight [class*="__statCellBordered"] { border-left-color: rgba(60,60,67,0.29); }
.lbLight [class*="__podiumHeader"] { color:#000; }
.lbLight [class*="__podiumCard"] { background: rgba(0,168,92,0.07); border-color: rgba(0,168,92,0.45); }
.lbLight [class*="__cardGold"] { background: rgba(0,168,92,0.12); border-color: rgba(0,168,92,0.75); box-shadow: 0 0 22px rgba(0,168,92,0.12); }
.lbLight [class*="__podiumName"] { color:#00833F; }
.lbLight [class*="__pedScore"] { color:#000; }
.lbLight [class*="__pedTime"] { color: rgba(60,60,67,0.6); }
.lbLight [class*="__crown"] { color:#F5B400; fill:#F5B400; filter: drop-shadow(0 1px 3px rgba(245,180,0,0.4)); }
.lbLight [class*="__rankBadge"] { background:#F5B400; color:#231a00; border-color:#fff; }
.lbLight [class*="__podiumAvatar"] { border-color:#fff; outline-color: rgba(224,45,38,0.9); background:#eee; }
.lbLight [class*="__ghostAvatar"] { border-color: rgba(0,0,0,0.25); background:#fff; color: rgba(0,0,0,0.4); }
.lbLight [class*="__ghostCard"] { border-color: rgba(0,0,0,0.18); background: transparent; }
.lbLight [class*="__ghostName"], .lbLight [class*="__ghostRank"] { color: rgba(0,0,0,0.35); }
.lbLight [class*="__listKicker"] { color:#000; }
.lbLight [class*="__listRow"] { border-bottom-color: rgba(0,0,0,0.08); color:#000; }
.lbLight [class*="__listRow"]:hover { background: rgba(0,0,0,0.04); }
.lbLight [class*="__listRank"] { color: rgba(60,60,67,0.6); }
.lbLight [class*="__listName"] { color:#000; }
.lbLight [class*="__listStats"] { color: rgba(60,60,67,0.6); }
.lbLight [class*="__youGhost"] { border-color: rgba(0,0,0,0.30); color: rgba(0,0,0,0.7); }
.lbLight [class*="__youGhost"]:hover { border-top-color:#000; color:#000; }
`;

export default function LeaderboardPreview() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(new URLSearchParams(window.location.search).get("mode") === "light");
    if (!window.location.hash.includes("figmacapture")) return;
    const s = document.createElement("script");
    s.src = "https://mcp.figma.com/mcp/html-to-design/capture.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  const frame: React.CSSProperties = light
    ? { ...FRAME, background: "#fff", border: "1px solid rgba(0,0,0,0.12)" }
    : FRAME;
  const label: React.CSSProperties = light
    ? { ...LABEL, color: "rgba(0,0,0,0.45)" }
    : LABEL;

  return (
    <main
      className={light ? "lbLight" : undefined}
      style={{
        minHeight: "100vh",
        background: light ? "#ECECF1" : "#0a0a0a",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 48,
        padding: "48px 32px",
      }}
    >
      {light && <style dangerouslySetInnerHTML={{ __html: LIGHT_OVERRIDES }} />}
      <section>
        <p style={label}>Leaderboard · {light ? "Light · " : ""}Desktop rail (520)</p>
        <div style={{ ...frame, width: 520 }}>
          <LeaderboardPanel />
        </div>
      </section>
      <section>
        <p style={label}>Leaderboard · {light ? "Light · " : ""}Mobile (390)</p>
        <div style={{ ...frame, width: 390 }}>
          <LeaderboardPanel />
        </div>
      </section>
    </main>
  );
}
