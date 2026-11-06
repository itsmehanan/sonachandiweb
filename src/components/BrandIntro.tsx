import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface BrandIntroProps {
  onComplete: () => void;
  forceShow?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  aspect: number;
  baseColor: string;
  highlightColor: string;
  angle: number;
  angularSpeed: number;
  tiltAngle: number;
  tiltSpeed: number;
  shimmerOffset: number;
  opacity: number;
  initialRadius: number;
  initialAngle: number;
  targetRingAngle: number;
  targetRingRadiusOffset: number;
  isBurstParticle: boolean;
  burstDone: boolean;
}

export const BrandIntro: React.FC<BrandIntroProps> = ({ onComplete, forceShow = false }) => {
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [contentVisible, setContentVisible] = useState<boolean>(false);
  const [headlineVisible, setHeadlineVisible] = useState<boolean>(false);
  const [buttonVisible, setButtonVisible] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Check prefers-reduced-motion on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setIsReducedMotion(true);
      }
    }
  }, []);

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sc_intro_played', 'true');
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    onComplete();
  };

  // Canvas particle animation sequence
  useEffect(() => {
    if (isReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 768;
    // Cap particles at about 600 on mobile as requested
    const particleCount = isMobile ? 550 : 850;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Warm gold palette (#C9A54B to #E8CF8A)
    const goldPalette = [
      { base: '#C9A54B', hl: '#FFF0B8' },
      { base: '#D4AF37', hl: '#FFFAA0' },
      { base: '#DFBF66', hl: '#FFF6D6' },
      { base: '#E8CF8A', hl: '#FFFFFF' },
      { base: '#B89230', hl: '#F5DE98' },
      { base: '#AA8022', hl: '#E8CF8A' },
    ];

    // Compute ring center & dimensions
    const getRingMetrics = () => {
      const cx = width * 0.5;
      // Position ring slightly above center on mobile/desktop to leave room for brand presentation below
      const cy = isMobile ? height * 0.28 : height * 0.32;
      const radiusX = Math.min(width, height) * (isMobile ? 0.20 : 0.16);
      const radiusY = radiusX * 0.48; // perspective foreshortening
      const ringThickness = radiusX * 0.24;
      return { cx, cy, radiusX, radiusY, ringThickness };
    };

    // Initialize particles
    const particles: Particle[] = [];
    const maxDiagonal = Math.hypot(width, height) * 0.65;

    for (let i = 0; i < particleCount; i++) {
      const paletteChoice = goldPalette[i % goldPalette.length];
      const initialAngle = Math.random() * Math.PI * 2;
      // Scatter mostly at the edges (radius between 40% and 100% of screen diagonal)
      const initialRadius =
        Math.min(width, height) * 0.45 + Math.random() * (maxDiagonal - Math.min(width, height) * 0.35);

      const ringTargetAngle = Math.random() * Math.PI * 2;
      const ringJitter = (Math.random() - 0.5) * 12;

      // ~25% of particles will burst outward in Phase 3
      const isBurstParticle = Math.random() < 0.28;

      particles.push({
        x: width * 0.5 + Math.cos(initialAngle) * initialRadius,
        y: height * 0.3 + Math.sin(initialAngle) * initialRadius,
        vx: 0,
        vy: 0,
        size: Math.random() * 4.5 + 2.0, // 2px to 6.5px varied sizes
        aspect: Math.random() * 0.6 + 0.7,
        baseColor: paletteChoice.base,
        highlightColor: paletteChoice.hl,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.08,
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: Math.random() * 0.05 + 0.02,
        shimmerOffset: Math.random() * Math.PI * 2,
        opacity: 0,
        initialRadius,
        initialAngle,
        targetRingAngle: ringTargetAngle,
        targetRingRadiusOffset: ringJitter,
        isBurstParticle,
        burstDone: false,
      });
    }

    const startTime = performance.now();
    let ringAlpha = 0;

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000; // in seconds

      // Background: Warm cream #F7F1E6 with delicate central vignette
      ctx.fillStyle = '#F7F1E6';
      ctx.fillRect(0, 0, width, height);

      // Subtle warm glow behind ring center
      const { cx, cy, radiusX, radiusY, ringThickness } = getRingMetrics();
      const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, radiusX * 2.5);
      glow.addColorStop(0, 'rgba(253, 245, 225, 0.7)');
      glow.addColorStop(0.5, 'rgba(247, 241, 230, 0.4)');
      glow.addColorStop(1, 'rgba(247, 241, 230, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Trigger UI elements fade in at timeline milestones
      if (elapsed > 3.6 && !contentVisible) setContentVisible(true);
      if (elapsed > 4.2 && !headlineVisible) setHeadlineVisible(true);
      if (elapsed > 4.8 && !buttonVisible) setButtonVisible(true);

      // Phase Progress Math:
      // (1) 0.0s - 1.4s: Edge scattered cloud appears & shimmers
      // (2) 1.4s - 3.2s: Inward swirling spiral into ring
      // (3) 3.2s - 4.2s: Highlight sweep + outward flake burst
      // (4) 4.2s - 6.0s+: Ring settles & floats, logo and buttons visible

      const floatY = elapsed > 3.2 ? Math.sin((elapsed - 3.2) * 2.2) * 5 : 0;
      const floatTilt = elapsed > 3.2 ? Math.sin((elapsed - 3.2) * 1.5) * 0.04 : 0;
      const activeCy = cy + floatY;

      // Update & Render Ring
      if (elapsed > 2.2) {
        ringAlpha = Math.min(1, ringAlpha + 0.035);
      }

      if (ringAlpha > 0.01) {
        ctx.save();
        ctx.translate(cx, activeCy);
        ctx.rotate(-0.18 + floatTilt); // elegant subcontinental perspective tilt

        // Outer Ellipse and Inner Cutout
        ctx.save();
        ctx.globalAlpha = ringAlpha;

        // Base 3D Torus Ring Gradient
        const ringGrad = ctx.createLinearGradient(
          -radiusX,
          -radiusY,
          radiusX,
          radiusY
        );
        ringGrad.addColorStop(0.0, '#AA8022');
        ringGrad.addColorStop(0.2, '#E8CF8A');
        ringGrad.addColorStop(0.35, '#FFFFFF');
        ringGrad.addColorStop(0.5, '#C9A54B');
        ringGrad.addColorStop(0.7, '#8E6E24');
        ringGrad.addColorStop(0.85, '#E8CF8A');
        ringGrad.addColorStop(1.0, '#B18D35');

        // Draw Solid Gold Ring
        ctx.beginPath();
        // Outer edge
        ctx.ellipse(0, 0, radiusX + ringThickness * 0.5, radiusY + ringThickness * 0.5, 0, 0, Math.PI * 2);
        // Inner cutout (counter-clockwise)
        ctx.ellipse(0, 0, radiusX - ringThickness * 0.5, radiusY - ringThickness * 0.5, 0, Math.PI * 2, 0, true);
        ctx.fillStyle = ringGrad;
        ctx.fill();

        // Soft outer shadow/glow
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(201, 165, 75, 0.4)';
        ctx.stroke();

        // Subtle specular highlight sweeping around the perimeter
        if (elapsed > 3.0) {
          const sweepProgress = (elapsed - 3.0) * 1.8;
          const sweepAngle = (sweepProgress % (Math.PI * 2));
          const hx = Math.cos(sweepAngle) * radiusX;
          const hy = Math.sin(sweepAngle) * radiusY;

          const sweepGlow = ctx.createRadialGradient(hx, hy, 1, hx, hy, ringThickness * 2.2);
          sweepGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          sweepGlow.addColorStop(0.3, 'rgba(255, 240, 180, 0.8)');
          sweepGlow.addColorStop(0.7, 'rgba(201, 165, 75, 0.2)');
          sweepGlow.addColorStop(1, 'rgba(201, 165, 75, 0)');

          ctx.beginPath();
          ctx.arc(hx, hy, ringThickness * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = sweepGlow;
          ctx.fill();
        }

        ctx.restore();
        ctx.restore();
      }

      // Update & Render Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Shimmer & tumbling updates
        p.angle += p.angularSpeed;
        p.tiltAngle += p.tiltSpeed;
        const shimmer = 0.65 + 0.35 * Math.sin(elapsed * 7 + p.shimmerOffset);
        const foldScale = Math.abs(Math.cos(p.tiltAngle)); // 3D tumbling effect

        // 2. Trajectory stages:
        if (elapsed < 1.4) {
          // Phase 1: Soft cloud scattered at the edges appearing with shimmer
          p.opacity = Math.min(0.9, p.opacity + 0.04);
          // Slight floating ambient drift
          p.x += Math.cos(p.angle) * 0.4;
          p.y += Math.sin(p.angle) * 0.3;
        } else if (elapsed >= 1.4 && elapsed < 3.2) {
          // Phase 2: Inward swirling spiral into the gold ring
          const tProgress = (elapsed - 1.4) / 1.8; // 0 to 1
          // Smooth quintic easing
          const ease = 1 - Math.pow(1 - tProgress, 3);

          // Spiral rotation around center
          const spiralRotations = (1 - tProgress) * 4.2;
          const currentSpiralAngle = p.targetRingAngle + spiralRotations;

          // Target position on the angled ellipse ring
          const ringRadX = radiusX + p.targetRingRadiusOffset;
          const ringRadY = radiusY + p.targetRingRadiusOffset * 0.5;

          const targetX = cx + Math.cos(currentSpiralAngle) * ringRadX;
          const targetY = activeCy + Math.sin(currentSpiralAngle) * ringRadY;

          // Current distance shrinks inward
          const currentDistance = p.initialRadius * (1 - ease) + Math.hypot(targetX - cx, targetY - activeCy) * ease;
          const curAngle = p.initialAngle * (1 - ease) + currentSpiralAngle * ease;

          p.x = cx + Math.cos(curAngle) * currentDistance;
          p.y = activeCy + Math.sin(curAngle) * (currentDistance * (ringRadY / ringRadX));

          p.opacity = 0.95;
        } else if (elapsed >= 3.2) {
          // Phase 3 & 4: Outward burst and gentle falling
          if (p.isBurstParticle) {
            if (!p.burstDone) {
              // Initiate burst velocity radially outward
              const burstAngle = Math.random() * Math.PI * 2;
              const burstSpeed = Math.random() * 4.5 + 2.0;
              p.vx = Math.cos(burstAngle) * burstSpeed;
              p.vy = Math.sin(burstAngle) * burstSpeed - (Math.random() * 2.0 + 1.0); // upward impulse
              p.burstDone = true;
            }

            // Apply gravity and air resistance (gentle gold leaf flutter)
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96; // drag
            p.vy = p.vy * 0.96 + 0.08; // gravity

            // Flutter sway
            p.x += Math.sin(elapsed * 4 + p.shimmerOffset) * 0.8;

            // Fade slowly as they fall off-screen
            if (p.y > height * 0.8) {
              p.opacity = Math.max(0, p.opacity - 0.015);
            }
          } else {
            // Remaining particles adhere to floating ring with subtle vibration/sparkle
            const targetX = cx + Math.cos(p.targetRingAngle) * (radiusX + p.targetRingRadiusOffset);
            const targetY = activeCy + Math.sin(p.targetRingAngle) * (radiusY + p.targetRingRadiusOffset * 0.5);

            p.x += (targetX - p.x) * 0.2;
            p.y += (targetY - p.y) * 0.2;

            // Merge into ring surface
            p.opacity = Math.max(0.2, 0.85 - (elapsed - 3.2) * 0.25);
          }
        }

        // Draw Gold Foil Flake (irregular polygonal shape with metallic gradient)
        if (p.opacity > 0.02) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.scale(foldScale, 1);
          ctx.globalAlpha = p.opacity * shimmer;

          // Irregular gold leaf flake path
          const w = p.size;
          const h = p.size * p.aspect;

          ctx.beginPath();
          ctx.moveTo(-w * 0.5, -h * 0.4);
          ctx.lineTo(w * 0.4, -h * 0.6);
          ctx.lineTo(w * 0.6, h * 0.3);
          ctx.lineTo(-w * 0.2, h * 0.5);
          ctx.closePath();

          ctx.fillStyle = shimmer > 0.85 ? p.highlightColor : p.baseColor;
          ctx.fill();

          ctx.restore();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isReducedMotion]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Sona & Chandi Gold Collection"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#F7F1E6] overflow-hidden select-none"
    >
      {/* Canvas Layer for Gold Foil Flakes & Ring */}
      {!isReducedMotion ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      ) : (
        /* Reduced Motion Fallback: Clean Static Hero */
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#F7F1E6]">
          <div className="max-w-md w-full aspect-1/1 rounded-2xl overflow-hidden border border-[#C9A54B]/30 shadow-xl bg-white mb-28">
            <img
              src="/assets/aistudio/intro-poster_d8a114e6.jpg"
              alt="Sona & Chandi 24K Gold Ring"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Top Bar: Skip Button (Always accessible, never blocks navigation) */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-end">
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-xs uppercase tracking-widest font-semibold text-[#8E6E24] hover:text-[#1E1B18] bg-white/85 hover:bg-white backdrop-blur-md border border-[#C9A54B]/40 hover:border-[#C9A54B] rounded-full transition-all shadow-xs cursor-pointer"
        >
          Skip Intro
        </button>
      </div>

      {/* Bottom Content: Logo, Headline, and 'Explore Collection' Button */}
      <div className="relative z-20 w-full max-w-2xl mx-auto px-6 pb-12 sm:pb-16 flex flex-col items-center text-center">
        {/* Brand Logo Fade-in */}
        <div
          className={`transition-all duration-1000 ease-out transform ${
            contentVisible || isReducedMotion
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          <img
            src="/assets/aistudio/logo-light.png"
            alt="Sona & Chandi Gold Collection"
            className="h-16 sm:h-20 w-auto object-contain mx-auto mb-4 drop-shadow-xs"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Brand Headline Fade-in */}
        <div
          className={`transition-all duration-1000 delay-150 ease-out transform ${
            headlineVisible || isReducedMotion
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="font-serif text-2xl sm:text-4xl text-[#1E1B18] tracking-tight font-normal mb-2">
            Sona &amp; Chandi Gold Collection
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto font-light leading-relaxed mb-6">
            Handcrafted Pakistani Fine Jewellery · 24K, 22K, 21K, 18K Gold &amp; 925 Sterling Silver
          </p>
        </div>

        {/* Explore Collection Button with Gold Sheen Sweep */}
        <div
          className={`transition-all duration-1000 delay-300 ease-out transform ${
            buttonVisible || isReducedMotion
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <button
            onClick={handleSkip}
            className="gold-sheen px-8 py-3.5 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-medium text-xs sm:text-sm uppercase tracking-wider rounded-lg transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
