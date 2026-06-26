"use client";

/**
 * Diagnostic / isolation route.
 *
 * URL: /preview/pixel-test
 *
 * Renders PixelBlast as a fullscreen background with NO popup, NO portal,
 * NO stacking-context complications — just the WebGL canvas filling the
 * viewport. If you see the magenta pixel pattern here, the component works
 * and any issues on `/preview/badge-rays` are integration-level. If you
 * see a pure black screen here, the component itself is failing to render
 * (check browser console for WebGL/shader errors).
 */

import { PixelBlast } from "@/components/quiz/PixelBlast";

export default function PixelTestPage() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
      }}
    >
      <PixelBlast
        variant="circle"
        color="#00FF85"
        pixelSize={6}
        patternScale={3}
        patternDensity={1.2}
        pixelSizeJitter={0.5}
        enableRipples
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid={false}
        speed={0.6}
        edgeFade={0.25}
        transparent
      />

      {/* Status overlay so you can confirm the page is loaded */}
      <div
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 9999,
          color: "#fff",
          background: "rgba(0, 0, 0, 0.6)",
          padding: "8px 14px",
          borderRadius: 8,
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0,
          textTransform: "uppercase",
        }}
      >
        Pixel Test · Fullscreen
      </div>
    </div>
  );
}
