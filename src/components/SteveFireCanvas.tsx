"use client";

import { useEffect, useRef } from "react";

export default function SteveFireCanvas({ size = 64 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    // Particle structures following Steve Gardner's PixiJS Fire algorithm
    interface FireBlob {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
      isCutout?: boolean;
    }

    interface EmberParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }

    let fireBlobs: FireBlob[] = [];
    let embers: EmberParticle[] = [];

    const colors = ["#E23B00", "#FE8200", "#FBE416", "#FDFDB4"];
    const emberColors = ["#FE9C00", "#FEA600", "#E27100"];

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const baseY = height * 0.45;

    const spawnFireBlob = () => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const maxLife = 30 + Math.random() * 22;
      fireBlobs.push({
        x: centerX + (Math.random() * (width * 0.28) - width * 0.14),
        y: baseY,
        vx: (Math.random() * 0.6 - 0.3),
        vy: -(1.6 + Math.random() * 1.5),
        size: width * 0.48 + Math.random() * (width * 0.2),
        color,
        life: 0,
        maxLife,
      });

      // Spawn cutout mask to carve shape dynamically on outer edges
      if (Math.random() > 0.38) {
        const side = Math.random() > 0.5 ? 1 : -1;
        fireBlobs.push({
          x: centerX + side * (width * 0.34 + Math.random() * (width * 0.12)),
          y: baseY - 5,
          vx: side * (0.4 + Math.random() * 0.5),
          vy: -(1.4 + Math.random() * 1.2),
          size: width * 0.32 + Math.random() * (width * 0.1),
          color: "#000000",
          life: 0,
          maxLife: 22 + Math.random() * 14,
          isCutout: true
        });
      }

      // Spawn rising embers
      if (Math.random() > 0.35) {
        embers.push({
          x: centerX + (Math.random() * (width * 0.5) - width * 0.25),
          y: baseY - 10,
          vx: (Math.random() * 1.4 - 0.7),
          vy: -(2.2 + Math.random() * 2.2),
          size: 1.8 + Math.random() * 2.2,
          color: emberColors[Math.floor(Math.random() * emberColors.length)],
          alpha: 1
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Maintain particle density
      if (fireBlobs.length < 80) {
        spawnFireBlob();
        spawnFireBlob();
      }

      // 1. Ambient Radial Glow
      ctx.globalCompositeOperation = "source-over";
      const glowGrad = ctx.createRadialGradient(centerX, baseY, 0, centerX, baseY, width * 0.75);
      glowGrad.addColorStop(0, "rgba(254, 130, 0, 0.55)");
      glowGrad.addColorStop(1, "rgba(226, 59, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, baseY, width * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // 2. Render Additive Glowing Flame Blobs
      ctx.globalCompositeOperation = "screen";
      for (let i = fireBlobs.length - 1; i >= 0; i--) {
        const p = fireBlobs[i];
        if (p.isCutout) continue;

        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const progress = p.life / p.maxLife;
        const currentSize = p.size * (1 - progress * 0.6);
        const alpha = 0.85 * (1 - progress);

        if (p.life >= p.maxLife || currentSize <= 0) {
          fireBlobs.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.arc(p.x, p.y, Math.max(0.1, currentSize), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Render Subtractive Cutouts (carving organic flame shapes)
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      for (let i = fireBlobs.length - 1; i >= 0; i--) {
        const p = fireBlobs[i];
        if (!p.isCutout) continue;

        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const progress = p.life / p.maxLife;
        const currentSize = p.size * (1 + progress * 0.4);

        if (p.life >= p.maxLife) {
          fireBlobs.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.arc(p.x, p.y, Math.max(0.1, currentSize), 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Render Floating Embers
      ctx.globalCompositeOperation = "source-over";
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx + (Math.random() * 0.4 - 0.2);
        e.y += e.vy;
        e.alpha -= 0.02;

        if (e.alpha <= 0 || e.y < 0) {
          embers.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.fillStyle = e.color;
        ctx.globalAlpha = Math.max(0, e.alpha);
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size]);

  const canvasWidth = size;
  const canvasHeight = Math.round(size * 2.0);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px`, pointerEvents: "none", display: "block" }}
    />
  );
}
