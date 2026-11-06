import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  MapPin,
  Scale,
  RefreshCw,
  ChevronDown,
  ArrowUp,
  ShieldCheck,
  Truck,
  Sparkles,
} from 'lucide-react';
import { getSettings, getStoreStatus } from '../data/store';
import { BullionRates, formatPKR } from '../lib/pricing';
import { WhatsAppButton } from './WhatsAppButton';

interface FooterProps {
  rates: BullionRates;
  onNavigate: (view: string, filter?: string) => void;
  onOpenCalculator: () => void;
  onReplayIntro: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  rates,
  onNavigate,
  onOpenCalculator,
  onReplayIntro,
}) => {
  const settings = getSettings();
  const storeStatus = getStoreStatus();

  // Scroll tracking for fade-in of back-to-top button
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Canvas for faint animated gold dust at 30% opacity
  const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = dustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      alpha: number;
      phase: number;
    }> = [];

    const count = window.innerWidth < 768 ? 20 : 45;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.6,
        vy: -(Math.random() * 0.25 + 0.1),
        vx: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        p.phase += 0.02;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.fillStyle = `rgba(201, 165, 75, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mobile accordion state
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    shop: false,
    info: false,
    contact: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-b from-[#12100E] to-[#1E1712] text-[#E2D8C9] border-t border-[#C9A54B]/35 pt-14 pb-12 overflow-hidden">
      {/* Faint animated gold dust at 30% opacity */}
      <canvas
        ref={dustCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30 -z-0"
        aria-hidden="true"
      />

      {/* Top Hairline accent */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#B8923A]/80 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-8 space-y-12">
        {/* Top Band: "Order on WhatsApp", Green Button & Live Store Status Badge */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-10 border-b border-[#292420]">
          <div className="space-y-3 max-w-md">
            <img
              src="/assets/aistudio/logo-dark.png"
              alt="Sona & Chandi Gold Collection"
              className="h-16 w-auto object-contain drop-shadow-sm"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs text-[#A89F91] leading-relaxed font-light">
              Karat and silver purity are stated per product (24K, 22K, 21K, 18K gold and 925
              sterling silver). Gold and silver jewellery priced from live rates with transparent daily bullion
              calculations.
            </p>
          </div>

          {/* Top Band Action: WhatsApp Button & Open/Closed Live Status Badge */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[#18130F]/90 border border-[#C9A54B]/35 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Order on WhatsApp
                </span>
                {/* Live Open / Closed badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    storeStatus.isOpen
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-950/80 text-red-300 border-red-500/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      storeStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                    }`}
                  />
                  {storeStatus.isOpen ? 'Open Now' : 'Closed'}
                </span>
              </div>
              <p className="text-[11px] text-[#A89F91] font-light">
                Confirm pieces, reserve bullion rates, or request bespoke designs.
              </p>
            </div>

            <WhatsAppButton
              href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                'Assalam-o-Alaikum, I would like to inquire about jewellery pieces and live bullion rates.'
              )}`}
              label="Order on WhatsApp"
              size="md"
              className="shrink-0"
            />
          </div>
        </div>

        {/* 3 Columns: Shop, Information, Visit & Contact (Desktop Grid / Mobile Smooth Accordions) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pb-10 border-b border-[#292420]">
          {/* Column 1: Shop (Gold, Silver, Rings, Necklaces, Bangles, Earrings, Bridal Sets) */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => toggleSection('shop')}
              className="w-full flex items-center justify-between py-2 text-left md:pointer-events-none md:py-0 border-b border-[#292420] md:border-b-0 cursor-pointer"
            >
              <span className="font-serif text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A54B]" />
                <span>Shop</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#C9A54B] transition-transform duration-300 md:hidden ${
                  openSections.shop ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className={`${openSections.shop ? 'block' : 'hidden'} md:block space-y-3 pt-1 md:pt-0`}>
              <ul className="space-y-2.5 text-xs text-[#A89F91]">
                <li>
                  <button
                    onClick={() => onNavigate('catalogue', 'gold')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Gold (24K, 22K, 21K, 18K)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('catalogue', 'silver')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Silver (925 Solid Sterling)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('catalogue', 'rings')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Rings &amp; Bands
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('catalogue', 'necklaces')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Necklaces &amp; Chains
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('catalogue', 'bangles')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Bangles &amp; Karas
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('catalogue', 'earrings')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Earrings &amp; Jhumkas
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('catalogue', 'bridal_sets')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Bridal Sets &amp; Rani Haars
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 2: Information (About, Contact, Delivery and Pickup, Gold and Silver Purity guide) */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => toggleSection('info')}
              className="w-full flex items-center justify-between py-2 text-left md:pointer-events-none md:py-0 border-b border-[#292420] md:border-b-0 cursor-pointer"
            >
              <span className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                Information
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#C9A54B] transition-transform duration-300 md:hidden ${
                  openSections.info ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className={`${openSections.info ? 'block' : 'hidden'} md:block space-y-3 pt-1 md:pt-0`}>
              <ul className="space-y-2.5 text-xs text-[#A89F91]">
                <li>
                  <button
                    onClick={() => onNavigate('about')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    About Our Jewellery
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('contact')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Contact Showroom Desk
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('contact')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Delivery and Pickup
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('home')}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left"
                  >
                    Gold and Silver Purity Guide
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenCalculator}
                    className="footer-link hover:text-[#C9A54B] cursor-pointer text-left flex items-center gap-1.5 pt-1 text-[#C9A54B]"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Live Bullion Calculator</span>
                  </button>
                </li>
              </ul>

              {/* Delivery and Pickup Note */}
              <div className="pt-2 p-3 rounded-xl bg-[#17130F] border border-[#292420] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                  <Truck className="w-3.5 h-3.5 text-[#C9A54B]" />
                  <span>Delivery &amp; Pickup</span>
                </div>
                <p className="text-[11px] text-[#A89F91] leading-relaxed font-light">
                  {settings.deliveryText
                    ? settings.deliveryText
                    : 'Insured nationwide courier delivery across Pakistan & private showroom collection.'}
                </p>
              </div>
            </div>
          </div>

          {/* Column 3: Visit and Contact (Address and hours from settings; if address is empty show nothing) */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => toggleSection('contact')}
              className="w-full flex items-center justify-between py-2 text-left md:pointer-events-none md:py-0 border-b border-[#292420] md:border-b-0 cursor-pointer"
            >
              <span className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                Visit &amp; Contact
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#C9A54B] transition-transform duration-300 md:hidden ${
                  openSections.contact ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className={`${openSections.contact ? 'block' : 'hidden'} md:block space-y-3 pt-1 md:pt-0`}>
              {/* Store Hours from Settings */}
              <div className="flex items-start gap-2.5 text-xs text-[#A89F91]">
                <Clock className="w-4 h-4 text-[#C9A54B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-white">
                    {settings.storeHoursDescription || 'Mon – Sat: 9:00 AM – 9:00 PM PKT'}
                  </p>
                  {!settings.storeHoursDescription && (
                    <p className="text-[11px] text-[#A89F91]">Sunday: Closed</p>
                  )}
                  <p className="text-[10px] text-[#C9A54B] font-mono">
                    Showroom Time: {storeStatus.currentTimePkt}
                  </p>
                </div>
              </div>

              {/* Showroom Address - IF ADDRESS IS EMPTY, SHOW NOTHING */}
              {settings.address && settings.address.trim() !== '' && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-[#292420] text-xs">
                  <MapPin className="w-4 h-4 text-[#C9A54B] shrink-0 mt-0.5" />
                  <p className="text-[#D4CDC3] leading-relaxed font-light">
                    {settings.address}
                  </p>
                </div>
              )}

              {/* Benchmark 24K Rate Indicator */}
              <div className="pt-2 border-t border-[#292420] text-[11px] text-[#A89F91] flex items-center justify-between">
                <span>Official 24K Benchmark:</span>
                <span className="font-mono text-white font-medium">
                  {rates.gold24KPerTola > 0
                    ? `${formatPKR(rates.gold24KPerTola)} / tola`
                    : 'Rate unavailable'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Confirmation Notice Line */}
        <div className="py-3 px-4 rounded-xl bg-[#17130F] border border-[#C9A54B]/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 text-xs text-[#E2D8C9]">
            <ShieldCheck className="w-4 h-4 text-[#C9A54B] shrink-0" />
            <span className="font-medium">
              No online payments. Orders are confirmed on WhatsApp.
            </span>
          </div>

          {/* Gold Back-to-Top Button that fades in after scrolling */}
          <button
            onClick={scrollToTop}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#C9A54B]/50 bg-[#241B14] hover:bg-[#C9A54B]/20 text-[#C9A54B] hover:text-[#E8CF8A] text-xs font-medium transition-all duration-300 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:outline-none ${
              showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
            }`}
            aria-label="Back to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to Top</span>
          </button>
        </div>

        {/* Bottom Bar: Copyright & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A8174]">
          <p>© {new Date().getFullYear()} Sona &amp; Chandi Gold Collection. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('about')}
              className="footer-link hover:text-white transition-colors cursor-pointer"
            >
              About Us
            </button>
            <span aria-hidden="true" className="text-[#3A332C]">·</span>
            <button
              onClick={() => onNavigate('contact')}
              className="footer-link hover:text-white transition-colors cursor-pointer"
            >
              Store Policies
            </button>
            <span aria-hidden="true" className="text-[#3A332C]">·</span>
            <button
              onClick={onReplayIntro}
              className="footer-link hover:text-[#C9A54B] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Replay Intro</span>
            </button>
            <span aria-hidden="true" className="text-[#3A332C]">·</span>
            <button
              onClick={() => onNavigate('admin')}
              className="footer-link hover:text-[#C9A54B] transition-colors cursor-pointer"
            >
              Staff Portal (/admin)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
