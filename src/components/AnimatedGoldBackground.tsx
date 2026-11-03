import React, { useEffect, useRef } from 'react';

interface StrandPoint {
  x: number;
  y: number;
}

interface SilkThread {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  angle: number;
  angleSpeed: number;
  history: StrandPoint[];
  maxHistory: number;
  width: number;
  color: string;
  alpha: number;
  phase: number;
}

interface DustSpeck {
  x: number;
  y: number;
  radius: number;
  vy: number;
  vx: number;
  baseAlpha: number;
  shimmerSpeed: number;
  shimmerOffset: number;
  color: string;
}

export const AnimatedGoldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // In reduced motion mode, render static soft gold-silver gradient, no animation
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isTabVisible = !document.hidden;
    let lastFrameTime = performance.now();

    const isMobile = () => window.innerWidth < 768;
    const getThreadCount = () => (isMobile() ? 40 : 90);
    const getDustCount = () => (isMobile() ? 25 : 60);

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Warm gold & cool liquid silver palette
    const goldSilverPalette = [
      { color: 'rgba(201, 165, 75, ', isGold: true },   // Signature Antique Gold
      { color: 'rgba(232, 207, 138, ', isGold: true },  // Radiant Pale Gold
      { color: 'rgba(212, 175, 55, ', isGold: true },   // 24K Pure Gold
      { color: 'rgba(245, 230, 180, ', isGold: true },  // Champagne Shimmer
      { color: 'rgba(226, 232, 240, ', isGold: false }, // Pure Sterling Silver
      { color: 'rgba(203, 213, 225, ', isGold: false }, // Platinum Tint
      { color: 'rgba(148, 163, 184, ', isGold: false }, // Soft Oxidised Silver
    ];

    let threads: SilkThread[] = [];
    let specks: DustSpeck[] = [];

    const initSimulation = () => {
      const threadCount = getThreadCount();
      threads = [];

      for (let i = 0; i < threadCount; i++) {
        const pal = goldSilverPalette[Math.floor(Math.random() * goldSilverPalette.length)];
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        const maxPoints = Math.floor(Math.random() * 12) + 12;

        threads.push({
          x: startX,
          y: startY,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(Math.random() * 0.4 + 0.15),
          speed: Math.random() * 0.7 + 0.35,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: (Math.random() - 0.5) * 0.02,
          history: Array.from({ length: maxPoints }, () => ({ x: startX, y: startY })),
          maxHistory: maxPoints,
          width: Math.random() * 1.1 + 0.5,
          color: pal.color,
          alpha: Math.random() * 0.35 + 0.25,
          phase: Math.random() * Math.PI * 2,
        });
      }

      const dustCount = getDustCount();
      specks = [];
      for (let i = 0; i < dustCount; i++) {
        const pal = goldSilverPalette[Math.floor(Math.random() * goldSilverPalette.length)];
        specks.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.6,
          vy: -(Math.random() * 0.22 + 0.08),
          vx: (Math.random() - 0.5) * 0.15,
          baseAlpha: Math.random() * 0.5 + 0.25,
          shimmerSpeed: Math.random() * 0.03 + 0.015,
          shimmerOffset: Math.random() * Math.PI * 2,
          color: pal.color,
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initSimulation();
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    initSimulation();

    window.addEventListener('resize', handleResize);

    // Pause when tab is hidden
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastFrameTime = performance.now();
        animId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let time = 0;

    const render = (currentTime: number) => {
      if (!isTabVisible) return;

      // Frame rate capping: on mobile cap near 30 fps (~33ms per frame)
      const mobile = isMobile();
      const elapsed = currentTime - lastFrameTime;
      if (mobile && elapsed < 32) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = currentTime;

      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw flowing silk wires through fluid trigonometric flow field
      for (let i = 0; i < threads.length; i++) {
        const t = threads[i];

        // Trigonometric flow field angle
        const flowAngle =
          Math.sin(t.x * 0.0018 + time * 0.3) * 1.8 +
          Math.cos(t.y * 0.0015 + time * 0.2) * 1.4;

        t.angle += (flowAngle - t.angle) * 0.05 + t.angleSpeed;

        t.x += Math.cos(t.angle) * t.speed;
        t.y += (Math.sin(t.angle) * 0.5 - 0.7) * t.speed;

        // Wrap around boundaries
        if (t.x < -60) t.x = width + 60;
        if (t.x > width + 60) t.x = -60;
        if (t.y < -60) t.y = height + 60;
        if (t.y > height + 60) t.y = -60;

        // Shift history tail
        t.history.unshift({ x: t.x, y: t.y });
        if (t.history.length > t.maxHistory) {
          t.history.pop();
        }

        // Draw flowing thread as smooth spline
        if (t.history.length > 2) {
          const currentAlpha = t.alpha * (0.7 + 0.3 * Math.sin(time * 2 + t.phase));
          ctx.beginPath();
          ctx.moveTo(t.history[0].x, t.history[0].y);

          for (let j = 1; j < t.history.length - 1; j++) {
            const xc = (t.history[j].x + t.history[j + 1].x) / 2;
            const yc = (t.history[j].y + t.history[j + 1].y) / 2;
            ctx.quadraticCurveTo(t.history[j].x, t.history[j].y, xc, yc);
          }

          ctx.strokeStyle = `${t.color}${currentAlpha})`;
          ctx.lineWidth = t.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Subtle glowing head
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.width * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `${t.color}${currentAlpha * 1.2})`;
          ctx.fill();
        }
      }

      // 2. Draw tiny glowing gold dust specks
      for (let i = 0; i < specks.length; i++) {
        const s = specks[i];
        s.y += s.vy;
        s.x += s.vx + Math.sin(time + s.shimmerOffset) * 0.15;
        s.shimmerOffset += s.shimmerSpeed;

        if (s.y < -10) s.y = height + 10;
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(s.shimmerOffset));
        ctx.fillStyle = `${s.color}${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        opacity: 'var(--bg-anim-opacity, 0.5)',
      }}
      aria-hidden="true"
    >
      {/* Fallback soft ambient radial glow */}
      <div className="absolute inset-0 bg-radial-[at_top_right] from-[#F7F0DC]/40 via-transparent to-[#E2D8C9]/25" />
      {/* Canvas for dynamic flowing gold & silver silk threads */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
