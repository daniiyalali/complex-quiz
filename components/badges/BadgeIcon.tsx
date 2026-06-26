"use client";

import { useEffect, useState } from "react";

/**
 * Pixel-art badge icon set — used in the pixel theme.
 * Reference: chunky octagonal coins / scalloped seals with iconography.
 * Each icon is inline SVG at viewBox 0 0 32 32 with shape-rendering: crispEdges
 * so it renders with hard pixel edges at any size.
 */

export type BadgeIconKind =
  | "first-play"
  | "founding-player"
  | "streak-7"
  | "streak-30"
  | "streak-100"
  | "streak-365"
  | "perfect-score"
  | "speed-demon"
  | "back-to-back"
  | "podium-finisher"
  | "daily-crown";

/* Zach's tier ladder. The five achievement families ship as a full set
   (base colorful + Bronze/Silver/Gold/Legendary — no Platinum) under
   /figma/badges/tiers/{family}-{tier}.png. */
export type BadgeTier =
  | "base"
  | "bronze"
  | "silver"
  | "gold"
  | "legendary";

const TIERED_FAMILIES = new Set<BadgeIconKind>([
  "perfect-score",
  "speed-demon",
  "back-to-back",
  "podium-finisher",
  "daily-crown",
]);

/* When a tiered family is shown without an explicit tier (e.g. the home
   achievements list, the share card), fall back to the prototype player's
   showcase tier so the metal reads consistently across every surface. Mirrors
   `currentTier` in lib/quiz-data BADGES. */
const DEFAULT_TIER: Partial<Record<BadgeIconKind, BadgeTier>> = {
  "perfect-score": "gold",
  "speed-demon": "silver",
  "back-to-back": "bronze",
  "podium-finisher": "gold",
  "daily-crown": "legendary",
};

function resolveBadgeSrc(icon: BadgeIconKind, tier?: BadgeTier): string {
  if (TIERED_FAMILIES.has(icon)) {
    const t = tier ?? DEFAULT_TIER[icon] ?? "base";
    return `/figma/badges/tiers/${icon}-${t}.png`;
  }
  // Progression badges (first-play, founding-player, streak-7/30/100/365) are
  // each their own flat asset — no reuse, no overlay.
  return `/figma/badges/${icon}.png`;
}

const OCT = "10,2 22,2 24,4 26,4 28,6 28,8 30,10 30,22 28,24 28,26 26,28 24,28 22,30 10,30 8,28 6,28 4,26 4,24 2,22 2,10 4,8 4,6 6,4 8,4";

const SCALLOP =
  "16,1 18,3 21,2 22,4 25,3 26,6 29,6 29,9 31,11 30,14 31,17 29,19 30,22 28,24 27,27 25,28 23,30 20,29 18,31 16,30 14,31 12,29 9,30 7,28 6,26 4,25 3,22 1,21 2,18 1,15 3,13 2,10 4,9 4,7 7,6 8,4 11,3 13,2 14,3";

type IconColor = {
  base: string;
  light: string;
  dark: string;
  glyph?: string;
};

const COLORS: Record<string, IconColor> = {
  green:   { base: "#7DEA3F", light: "#9DF65C", dark: "#54B524", glyph: "#FFFFFF" },
  blue:    { base: "#5BC5FF", light: "#84D5FF", dark: "#2992D8", glyph: "#FFFFFF" },
  magenta: { base: "#E84CDC", light: "#F274E5", dark: "#A82BA0", glyph: "#FFFFFF" },
  orange:  { base: "#FF7A1F", light: "#FF9A4A", dark: "#C75300", glyph: "#FFFFFF" },
  yellow:  { base: "#F0C742", light: "#F6D770", dark: "#B49019", glyph: "#5A4408" },
};

function PixelShape({
  shape,
  color,
}: {
  shape: string;
  color: IconColor;
}) {
  return (
    <>
      {/* shadow / dark edge */}
      <polygon points={shape} fill={color.dark} transform="translate(0.5 0.5)" />
      {/* main body */}
      <polygon points={shape} fill={color.base} />
      {/* highlight */}
      <polygon points={shape} fill="none" stroke={color.light} strokeWidth="0.6" strokeLinejoin="miter" transform="translate(-0.4 -0.4)" />
    </>
  );
}

/* ─── Glyphs ─── */

function FlameGlyph({ fill = "#FFFFFF", cx = 16, cy = 17 }: { fill?: string; cx?: number; cy?: number }) {
  // chunky pixel flame
  const tx = cx - 16;
  const ty = cy - 17;
  return (
    <g transform={`translate(${tx} ${ty})`} fill={fill}>
      <rect x="15" y="6"  width="2" height="2" />
      <rect x="14" y="8"  width="4" height="2" />
      <rect x="13" y="10" width="6" height="2" />
      <rect x="12" y="12" width="3" height="2" />
      <rect x="17" y="12" width="3" height="2" />
      <rect x="11" y="14" width="3" height="3" />
      <rect x="18" y="14" width="3" height="3" />
      <rect x="14" y="14" width="4" height="2" />
      <rect x="11" y="17" width="10" height="2" />
      <rect x="12" y="19" width="8" height="2" />
      <rect x="13" y="21" width="6" height="2" />
      <rect x="14" y="23" width="4" height="1" />
    </g>
  );
}

function CrownGlyph({ fill = "#FFFFFF" }: { fill?: string }) {
  return (
    <g fill={fill}>
      {/* crown body */}
      <rect x="9"  y="12" width="2" height="2" />
      <rect x="15" y="10" width="2" height="2" />
      <rect x="21" y="12" width="2" height="2" />
      {/* crown band */}
      <rect x="8"  y="14" width="16" height="6" />
      {/* peaks down */}
      <rect x="10" y="14" width="2" height="2" fill="none" />
      <rect x="10" y="14" width="2" height="2" />
      <rect x="14" y="14" width="4" height="2" />
      <rect x="20" y="14" width="2" height="2" />
      {/* base */}
      <rect x="8" y="20" width="16" height="2" />
      <rect x="7" y="22" width="18" height="2" />
      {/* jewels */}
      <rect x="11" y="16" width="2" height="2" fill="#FF00A8" />
      <rect x="15" y="16" width="2" height="2" fill="#00FFFF" />
      <rect x="19" y="16" width="2" height="2" fill="#FFCC00" />
    </g>
  );
}

function BoltGlyph({ fill = "#FFFFFF" }: { fill?: string }) {
  return (
    <g fill={fill}>
      <rect x="17" y="11" width="2" height="3" />
      <rect x="15" y="13" width="3" height="2" />
      <rect x="13" y="15" width="4" height="2" />
      <rect x="14" y="17" width="5" height="2" />
      <rect x="15" y="19" width="2" height="3" />
    </g>
  );
}

function StopwatchGlyph({ fill = "#FFFFFF" }: { fill?: string }) {
  return (
    <g fill={fill}>
      {/* button on top */}
      <rect x="15" y="6" width="2" height="2" />
      <rect x="13" y="8" width="6" height="2" />
      {/* clock outer ring */}
      <rect x="11" y="10" width="10" height="2" />
      <rect x="9"  y="12" width="2" height="2" />
      <rect x="21" y="12" width="2" height="2" />
      <rect x="9"  y="14" width="2" height="6" />
      <rect x="21" y="14" width="2" height="6" />
      <rect x="9"  y="20" width="2" height="2" />
      <rect x="21" y="20" width="2" height="2" />
      <rect x="11" y="22" width="10" height="2" />
    </g>
  );
}

function ChainGlyph({ fill = "#FFFFFF" }: { fill?: string }) {
  return (
    <g fill={fill}>
      {/* left link */}
      <rect x="7"  y="11" width="6" height="2" />
      <rect x="7"  y="13" width="2" height="6" />
      <rect x="11" y="13" width="2" height="6" />
      <rect x="7"  y="19" width="6" height="2" />
      {/* right link, overlapping */}
      <rect x="14" y="14" width="6" height="2" />
      <rect x="14" y="16" width="2" height="4" />
      <rect x="18" y="16" width="2" height="4" />
      <rect x="14" y="20" width="6" height="2" />
      {/* hint of overlap */}
      <rect x="13" y="14" width="3" height="2" />
    </g>
  );
}

function PodiumGlyph({ fill = "#FFFFFF" }: { fill?: string }) {
  // 1 in middle (tallest), 2 left, 3 right
  return (
    <g fill={fill}>
      {/* bar 2 */}
      <rect x="6"  y="16" width="6" height="8" />
      {/* bar 1 (tallest, middle) */}
      <rect x="12" y="11" width="8" height="13" />
      {/* bar 3 */}
      <rect x="20" y="18" width="6" height="6" />
      {/* numbers — stylized via small notches */}
      <rect x="14" y="14" width="2" height="2" fill="#5A4408" />
      <rect x="16" y="14" width="2" height="2" fill="#5A4408" />
      <rect x="7"  y="18" width="2" height="2" fill="#5A4408" />
      <rect x="9"  y="18" width="2" height="2" fill="#5A4408" />
      <rect x="21" y="20" width="2" height="2" fill="#5A4408" />
      <rect x="23" y="20" width="2" height="2" fill="#5A4408" />
    </g>
  );
}

function PassGlyph({ fill = "#FFFFFF" }: { fill?: string }) {
  return (
    <g>
      {/* back page (lighter) */}
      <rect x="9"  y="8"  width="14" height="18" fill="#9DF65C" />
      {/* front page */}
      <rect x="7"  y="10" width="14" height="18" fill={fill} />
      {/* globe circle (outer) */}
      <rect x="11" y="13" width="6"  height="6"  fill="#54B524" />
      <rect x="12" y="14" width="4"  height="4"  fill={fill} />
      {/* equator line */}
      <rect x="11" y="15" width="6"  height="1"  fill="#54B524" />
      {/* "PASS" text — chunky letterforms */}
      <rect x="9"  y="21" width="2"  height="2"  fill="#54B524" />
      <rect x="12" y="21" width="2"  height="2"  fill="#54B524" />
      <rect x="15" y="21" width="2"  height="2"  fill="#54B524" />
    </g>
  );
}

function PerfectGlyph({ fill = "#FFFFFF" }: { fill?: string }) {
  return (
    <g fill={fill}>
      {/* "5" */}
      <rect x="8"  y="9"  width="6" height="2" />
      <rect x="8"  y="11" width="2" height="3" />
      <rect x="8"  y="14" width="6" height="2" />
      <rect x="12" y="16" width="2" height="3" />
      <rect x="8"  y="19" width="6" height="2" />
      {/* slash */}
      <rect x="15" y="9"  width="1" height="2" />
      <rect x="15" y="11" width="2" height="2" />
      <rect x="16" y="13" width="2" height="2" />
      <rect x="17" y="15" width="2" height="2" />
      <rect x="18" y="17" width="2" height="2" />
      <rect x="18" y="19" width="2" height="2" />
      {/* "5" */}
      <rect x="20" y="9"  width="5" height="2" />
      <rect x="20" y="11" width="2" height="3" />
      <rect x="20" y="14" width="5" height="2" />
      <rect x="23" y="16" width="2" height="3" />
      <rect x="20" y="19" width="5" height="2" />
    </g>
  );
}

function LaurelGlyph({ fill = "#FFFFFF" }: { fill?: string }) {
  return (
    <g fill={fill}>
      {/* left laurel */}
      <rect x="5"  y="12" width="2" height="2" />
      <rect x="6"  y="14" width="2" height="2" />
      <rect x="7"  y="16" width="2" height="2" />
      <rect x="8"  y="18" width="2" height="2" />
      <rect x="9"  y="20" width="2" height="2" />
      {/* right laurel */}
      <rect x="25" y="12" width="2" height="2" />
      <rect x="24" y="14" width="2" height="2" />
      <rect x="23" y="16" width="2" height="2" />
      <rect x="22" y="18" width="2" height="2" />
      <rect x="21" y="20" width="2" height="2" />
    </g>
  );
}

function NumberGlyph({ digits, fill = "#FFFFFF" }: { digits: string; fill?: string }) {
  // Render small pixel number — only 2-3 digits
  return (
    <g fill={fill} style={{ fontSize: 8, fontWeight: 900 }}>
      <text
        x="16"
        y="26"
        textAnchor="middle"
        fontFamily="'Press Start 2P', 'Courier New', monospace"
        fontSize="6"
        fill={fill}
      >
        {digits}
      </text>
    </g>
  );
}

/* ─── Holographic gradient defs ─── */

function HoloDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFA8D8" />
        <stop offset="33%" stopColor="#A4F0F4" />
        <stop offset="66%" stopColor="#B8B0FF" />
        <stop offset="100%" stopColor="#FFD9A0" />
      </linearGradient>
    </defs>
  );
}

/* ─── Main component ─── */

export function BadgeIcon({
  kind,
  size = 64,
}: {
  kind: BadgeIconKind;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ shapeRendering: "crispEdges", display: "block" }}
    >
      {renderIcon(kind)}
    </svg>
  );
}

function renderIcon(kind: BadgeIconKind) {
  switch (kind) {
    case "first-play":
      return (
        <>
          <PixelShape shape={OCT} color={COLORS.green} />
          <PassGlyph />
        </>
      );
    case "founding-player":
      return (
        <>
          <PixelShape shape={SCALLOP} color={COLORS.blue} />
          {/* mini plaque */}
          <rect x="6" y="11" width="20" height="10" fill="#84D5FF" />
          <rect x="6" y="11" width="20" height="2"  fill="#2992D8" />
          <rect x="6" y="19" width="20" height="2"  fill="#2992D8" />
          <text x="16" y="17.2" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="3.2" fill="#FFFFFF">FOUNDING</text>
          <text x="16" y="20.6" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="3.2" fill="#FFFFFF">PLAYER</text>
        </>
      );
    case "streak-7":
      return (
        <>
          <PixelShape shape={OCT} color={COLORS.magenta} />
          <FlameGlyph />
        </>
      );
    case "streak-30":
      return (
        <>
          {/* circular disc — use polygon approximation */}
          <PixelShape shape={OCT} color={COLORS.orange} />
          <FlameGlyph cx={16} cy={14} />
          <text x="16" y="26" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="5.5" fontWeight="900" fill="#FFFFFF">30</text>
        </>
      );
    case "streak-100":
      return (
        <>
          <PixelShape shape={OCT} color={COLORS.green} />
          <FlameGlyph />
        </>
      );
    case "streak-365":
      return (
        <>
          <HoloDefs id="holo-365" />
          <polygon points={SCALLOP} fill="url(#holo-365)" />
          <polygon points={SCALLOP} fill="none" stroke="#FFFFFF" strokeWidth="0.4" strokeOpacity="0.5" />
          <LaurelGlyph fill="#FFFFFF" />
          <FlameGlyph fill="#B8B0FF" cx={16} cy={17} />
        </>
      );
    case "perfect-score":
      return (
        <>
          <PixelShape shape={OCT} color={COLORS.blue} />
          <PerfectGlyph />
          {/* check */}
          <rect x="14" y="23" width="1" height="2" fill="#FFFFFF" />
          <rect x="15" y="24" width="1" height="2" fill="#FFFFFF" />
          <rect x="16" y="23" width="1" height="2" fill="#FFFFFF" />
          <rect x="17" y="21" width="1" height="2" fill="#FFFFFF" />
        </>
      );
    case "speed-demon":
      return (
        <>
          <PixelShape shape={OCT} color={COLORS.magenta} />
          <StopwatchGlyph />
          <BoltGlyph fill="#FFCC00" />
        </>
      );
    case "back-to-back":
      return (
        <>
          <PixelShape shape={OCT} color={COLORS.green} />
          <ChainGlyph />
        </>
      );
    case "podium-finisher":
      return (
        <>
          <PixelShape shape={OCT} color={COLORS.yellow} />
          <PodiumGlyph />
        </>
      );
    case "daily-crown":
      return (
        <>
          <HoloDefs id="holo-crown" />
          <polygon points={OCT} fill="url(#holo-crown)" />
          <polygon points={OCT} fill="none" stroke="#FFFFFF" strokeWidth="0.4" strokeOpacity="0.5" />
          <CrownGlyph fill="#FFFFFF" />
        </>
      );
  }
}

/* ─── Wrapper: prefer the real chunky pixel-art PNG, fall back to SVG ─── */

/** Which badges have a real high-res PNG asset shipped in /public/figma/badges/. */
const PNG_BADGES = new Set<BadgeIconKind>([
  "first-play",
  "founding-player",
  "streak-7",
  "streak-30",
  "streak-100",
  "streak-365",
  "perfect-score",
  "speed-demon",
  "back-to-back",
  "podium-finisher",
  "daily-crown",
]);

/* ───────────────────────────────────────────────────────────────────────
   Auto-uniform badge sizing.

   Different badge PNGs were exported with different amounts of transparent
   padding around the artwork. To make every badge read at the same visible
   size in the grid, we measure each PNG's actual non-transparent bounding
   box on first render and scale it so the larger artwork dimension fills
   TARGET_FILL of the container. Results are cached module-scope so each
   PNG is measured exactly once per session.
   ─────────────────────────────────────────────────────────────────────── */

const TARGET_FILL = 0.92; // visible artwork fills 92% of the container
const ALPHA_THRESHOLD = 16;
const scaleCache = new Map<string, number>();
const inflight = new Map<string, Promise<number>>();

function measureBadgeScale(src: string): Promise<number> {
  const cached = scaleCache.get(src);
  if (cached !== undefined) return Promise.resolve(cached);
  const pending = inflight.get(src);
  if (pending) return pending;

  const p = new Promise<number>((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(1);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > ALPHA_THRESHOLD) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0) {
          resolve(1);
          return;
        }
        const bboxW = maxX - minX + 1;
        const bboxH = maxY - minY + 1;
        // After object-fit:contain, the LARGER PNG dim fills the container.
        // The artwork's fraction of that larger dim is what we need to invert.
        const largerPngDim = Math.max(canvas.width, canvas.height);
        const largerBBoxDim = Math.max(bboxW, bboxH);
        const currentFill = largerBBoxDim / largerPngDim;
        const scale = TARGET_FILL / currentFill;
        scaleCache.set(src, scale);
        resolve(scale);
      } catch {
        resolve(1); // canvas tainted or other failure — fall back to unscaled
      }
    };
    img.onerror = () => resolve(1);
  });

  inflight.set(src, p);
  p.finally(() => inflight.delete(src));
  return p;
}

function useBadgeScale(src: string): number {
  // Sync read of cache so SSR / first paint uses cached value when warm.
  const initial = scaleCache.get(src) ?? 1;
  const [scale, setScale] = useState<number>(initial);

  useEffect(() => {
    let cancelled = false;
    measureBadgeScale(src).then((s) => {
      if (!cancelled) setScale(s);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return scale;
}

export function BadgeMark({
  icon,
  size = 64,
  tier,
}: {
  icon: BadgeIconKind;
  size?: number;
  /** Metal tier for the achievement families. Defaults to the family's
      showcase tier (DEFAULT_TIER). Ignored by one-time progression badges. */
  tier?: BadgeTier;
  /** legacy prop — no-op now; kept for backwards-compat */
  fallback?: string;
}) {
  // Hooks must run unconditionally — call before any early return.
  const src = resolveBadgeSrc(icon, tier);
  const scale = useBadgeScale(src);

  if (!PNG_BADGES.has(icon)) {
    return <BadgeIcon kind={icon} size={size} />;
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        display: "block",
        imageRendering: "pixelated",
        objectFit: "contain",
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: "center",
        transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    />
  );
}
