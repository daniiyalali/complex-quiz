"use client";

/**
 * Preview / trial route — Badge Reveal Moment with selectable WebGL backdrops.
 *
 * URL: /preview/badge-rays
 *
 * Toggle pills (bottom-right) switch between:
 *   • None    — production backdrop (solid dim, blurred)
 *   • Rays    — volumetric light rays (LightRays.tsx)
 *   • Pixels  — Bayer-dithered pixel blast (PixelBlast.tsx)
 *
 * The toggle + replay button are portal'd to document.body so they share
 * a stacking context with the popup's own portal (z-index 600) and the
 * z-9999 on these controls always wins. If they were rendered inside a
 * positioned wrapper, that wrapper would create its own stacking context
 * and the controls would get trapped under the popup's backdrop blur.
 *
 * Each pick remounts the popup so the orchestration replays from the top.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeUnlockedPopup } from "@/components/quiz/BadgeUnlockedPopup";
import type { BadgeUnlock } from "@/lib/user-state";

const MOCK_BADGE: BadgeUnlock = {
  name: "FIRST PLAY",
  color: "#FFD000",
  description: "You just completed your first complex quiz!",
  iconPath: "/figma/badges/first-play.png",
};

type Backdrop = "none" | "rays" | "pixels";

const OPTIONS: { label: string; value: Backdrop }[] = [
  { label: "None", value: "none" },
  { label: "Rays", value: "rays" },
  { label: "Pixels", value: "pixels" },
];

function PreviewControls({
  backdrop,
  onPick,
  onReplay,
}: {
  backdrop: Backdrop;
  onPick: (b: Backdrop) => void;
  onReplay: () => void;
}) {
  // Portal: SSR-safe gate
  const [body, setBody] = useState<HTMLElement | null>(null);
  useEffect(() => setBody(document.body), []);
  if (!body) return null;

  return createPortal(
    <>
      {/* Bottom-right — backdrop toggle */}
      <div
        style={{
          position: "fixed",
          bottom: "max(20px, env(safe-area-inset-bottom))",
          right: "max(20px, env(safe-area-inset-right))",
          zIndex: 9999,
          display: "inline-flex",
          gap: "6px",
          padding: "6px",
          background: "#1C1C1E",
          border: "0.5px solid rgba(84, 84, 88, 0.45)",
          borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55)",
          fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
        }}
      >
        {OPTIONS.map((opt) => {
          const active = opt.value === backdrop;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPick(opt.value)}
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#000" : "rgba(235, 235, 245, 0.6)",
                border: 0,
                padding: "8px 16px",
                borderRadius: "8px",
                fontFamily: "inherit",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: 0,
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 150ms, color 150ms",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Bottom-left — replay button */}
      <button
        type="button"
        onClick={onReplay}
        style={{
          position: "fixed",
          bottom: "max(20px, env(safe-area-inset-bottom))",
          left: "max(20px, env(safe-area-inset-left))",
          zIndex: 9999,
          background: "#1C1C1E",
          color: "rgba(235, 235, 245, 0.7)",
          border: "0.5px solid rgba(84, 84, 88, 0.45)",
          padding: "10px 18px",
          borderRadius: "10px",
          fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: 0,
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55)",
        }}
      >
        Replay
      </button>
    </>,
    body,
  );
}

export default function BadgeBackdropPreviewPage() {
  const [backdrop, setBackdrop] = useState<Backdrop>("rays");
  // Each pick or replay bumps the mount key so the popup remounts and
  // its orchestration runs again from the top.
  const [mountKey, setMountKey] = useState(0);

  const pick = (value: Backdrop) => {
    setBackdrop(value);
    setMountKey((k) => k + 1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
      }}
    >
      <PreviewControls
        backdrop={backdrop}
        onPick={pick}
        onReplay={() => setMountKey((k) => k + 1)}
      />

      <BadgeUnlockedPopup
        key={mountKey}
        badge={MOCK_BADGE}
        newStreak={1}
        backdrop={backdrop === "none" ? undefined : backdrop}
        onContinue={() => setMountKey((k) => k + 1)}
      />
    </div>
  );
}
