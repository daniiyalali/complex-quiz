/* Pure-CSS pixel icons for the cabinet pips + drawer.
   PixelCheck below is the canonical "tick" we use in the weekly grid — same
   shape language as the answer-correct affordance, just rendered crisp-edges
   via SVG rects so it scales without aliasing. */

type CheckProps = {
  size?: number;
  color?: string;
  className?: string;
};

/* BigPixelFlame — clean solid pixel-art flame for the drawer hero.
   The Figma flame.svg is an outline-style asset that looks "busy" when blown up;
   this one is a single filled silhouette so the hero number stays the main event. */
export function BigPixelFlame({
  size = 96,
  color = "#FF9500",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  // 16-row flame silhouette: pointed tip up top with a left-leaning wisp,
  // belly widening to the right, rounded (not pointed) base. Reads as fire.
  const ROWS = [
    ".....X....",
    "....XX....",
    "....X.....",
    "...XX.....",
    "...XXX....",
    "..XXXX....",
    "..XXXXX...",
    ".XXXXXX...",
    ".XXXXXXX..",
    "XXXXXXXX..",
    "XXXXXXXXX.",
    "XXXXXXXXXX",
    "XXXXXXXXXX",
    ".XXXXXXXX.",
    "..XXXXXX..",
    "...XXXX...",
  ];
  const cols = ROWS[0].length;
  const rows = ROWS.length;
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={size}
      height={(size * rows) / cols}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      {ROWS.flatMap((row, y) =>
        Array.from(row).map((c, x) =>
          c === "X" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />
          ) : null,
        ),
      )}
    </svg>
  );
}

export function PixelCheck({ size = 16, color = "#fff", className }: CheckProps) {
  // 8x8 pixel-art checkmark. Two-pixel-thick diagonal up-then-down-up
  // path so it reads at small sizes and stays crisp at 28+.
  const pixels: [number, number][] = [
    [0, 4], [0, 5],
    [1, 5], [1, 6],
    [2, 6], [2, 7],
    [3, 5], [3, 6],
    [4, 4], [4, 5],
    [5, 3], [5, 4],
    [6, 2], [6, 3],
    [7, 1], [7, 2],
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      {pixels.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />
      ))}
    </svg>
  );
}


export function PixelCross({ size = 16, color = "#fff", className }: CheckProps) {
  // 8x8 pixel-art ✕ — the red "missed/wrong" counterpart to PixelCheck, same
  // crisp-edges rect language so the two read as one signal set.
  const raw: [number, number][] = [
    [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6],
    [2, 1], [3, 2], [4, 3], [5, 4], [6, 5],
    [6, 1], [5, 2], [4, 3], [3, 4], [2, 5], [1, 6],
    [5, 1], [4, 2], [3, 3], [2, 4], [1, 5],
  ];
  const seen = new Set<string>();
  const pixels = raw.filter(([x, y]) => {
    const k = `${x}-${y}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      {pixels.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />
      ))}
    </svg>
  );
}

type FlameProps = {
  size?: number;
  color?: string;
  className?: string;
  pulse?: boolean;
};

export function PixelFlame({ size = 22, color = "#FF9500", className, pulse }: FlameProps) {
  const bodyW = size * 0.7;
  const bodyH = size * 0.6;
  const tipW = size * 0.4;
  const tipH = size * 0.55;
  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        transformOrigin: "center",
        animation: pulse ? "cqFlamePulse 2s ease-in-out infinite" : undefined,
      }}
      aria-hidden
    >
      <span style={{
        position: "absolute",
        bottom: 0,
        left: (size - bodyW) / 2,
        width: bodyW,
        height: bodyH,
        borderRadius: "15%",
        background: color,
      }} />
      <span style={{
        position: "absolute",
        top: 0,
        left: (size - tipW) / 2,
        width: tipW,
        height: tipH,
        borderRadius: "20%",
        background: color,
      }} />
      <style jsx>{`
        @keyframes cqFlamePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          span { animation: none !important; }
        }
      `}</style>
    </span>
  );
}

type BadgeProps = {
  size?: number;
  color?: string;
  highlightColor?: string;
  className?: string;
};

export function PixelBadge({ size = 22, color = "#26B8BD", highlightColor = "#99EAED", className }: BadgeProps) {
  const scale = size / 22;
  const v = { w: 16 * scale, h: 22 * scale };
  const h = { w: 22 * scale, h: 16 * scale };
  const hl = 6 * scale;
  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-block", width: size, height: size, flexShrink: 0 }}
      aria-hidden
    >
      <span style={{
        position: "absolute",
        top: (size - v.h) / 2,
        left: (size - v.w) / 2,
        width: v.w,
        height: v.h,
        background: color,
      }} />
      <span style={{
        position: "absolute",
        top: (size - h.h) / 2,
        left: (size - h.w) / 2,
        width: h.w,
        height: h.h,
        background: color,
      }} />
      <span style={{
        position: "absolute",
        top: 4 * scale,
        left: 4 * scale,
        width: hl,
        height: hl,
        background: highlightColor,
      }} />
    </span>
  );
}
