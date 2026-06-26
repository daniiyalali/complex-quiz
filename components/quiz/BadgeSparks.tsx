"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  color: string;
}

interface BadgeSparksProps {
  /** Center of the badge in the Canvas's local coordinate space */
  originX: number;
  originY: number;
  /** Non-zero timestamp — changes each time a burst should fire (36 particles) */
  burst1Key: number;
  /** Non-zero timestamp — changes each time a landing burst should fire (20 particles) */
  burst2Key: number;
}

function makeParticles(
  cx: number,
  cy: number,
  count: number,
): Particle[] {
  const particles: Particle[] = [];
  const colors = ["#FFFFFF", "rgba(255,255,255,0.88)"];

  for (let i = 0; i < count; i++) {
    const isHorizontal = Math.random() < 0.65;
    let angle: number;
    if (isHorizontal) {
      // Bias left or right — narrow cone ±35° around horizontal axis
      const side = Math.random() < 0.5 ? 0 : Math.PI;
      angle = side + (Math.random() - 0.5) * (Math.PI * 0.39);
    } else {
      // Full radial scatter for the remaining 35%
      angle = Math.random() * Math.PI * 2;
    }

    const speed = 1.8 + Math.random() * 3.4; // 1.8–5.2
    const radius = 20 + Math.random() * 22;   // 20–42px initial offset

    particles.push({
      x: cx + Math.cos(angle) * radius * 0.3,
      y: cy + Math.sin(angle) * radius * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() < 0.5 ? 3 : 2,
      life: 0.78 + Math.random() * 0.22, // 0.78–1.0
      decay: 0.017 + Math.random() * 0.017, // 0.017–0.034
      color: colors[i % 2],
    });
  }
  return particles;
}

export function BadgeSparks({
  originX,
  originY,
  burst1Key,
  burst2Key,
}: BadgeSparksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  // Initial burst — 36 particles
  useEffect(() => {
    if (burst1Key === 0) return;
    particlesRef.current = [
      ...particlesRef.current,
      ...makeParticles(originX, originY, 36),
    ];
  }, [burst1Key, originX, originY]);

  // Landing burst — 20 particles
  useEffect(() => {
    if (burst2Key === 0) return;
    particlesRef.current = [
      ...particlesRef.current,
      ...makeParticles(originX, originY, 20),
    ];
  }, [burst2Key, originX, originY]);

  // Animation loop — runs once on mount, persists for the lifetime of the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Disable anti-aliasing — crisp integer pixels only
      ctx.imageSmoothingEnabled = false;

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        if (p.life <= 0) continue;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        // Math.round keeps squares pixel-crisp
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);

        // Update
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.935;
        p.vy *= 0.935;
        p.life -= p.decay;

        if (p.life > 0) alive.push(p);
      }

      ctx.globalAlpha = 1;
      particlesRef.current = alive;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400,
        height: 400,
        pointerEvents: "none",
        zIndex: 10,
      }}
      aria-hidden
    />
  );
}
