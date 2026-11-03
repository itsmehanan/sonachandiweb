import React from 'react';
import { ShieldCheck, Scale, Award, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { getSettings } from '../data/store';
import { BullionRates } from '../lib/pricing';

interface AboutPageProps {
  rates: BullionRates;
  onNavigateToCatalogue: () => void;
  onOpenCalculator: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  rates,
  onNavigateToCatalogue,
  onOpenCalculator,
}) => {
  const settings = getSettings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16">
      {/* Editorial Story Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8E6E24]">
          Our Heritage &amp; Philosophy
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1B18] font-normal tracking-tight">
          Crafting Legacies in Pure Gold &amp; Silver
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] font-light leading-relaxed">
          Sona &amp; Chandi Gold Collection was established with a singular conviction: fine
          jewellery should embody both transcendent artisan beauty and absolute bullion transparency.
        </p>
      </div>

      {/* Heritage Story Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center bg-white/80 backdrop-blur-md border border-[#E2D8C9] rounded-2xl p-6 sm:p-12 shadow-xs">
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#8E6E24] font-semibold">
              Generational Artistry
            </span>
            <div className="w-12 h-0.5 bg-gradient-to-r from-[#C9A54B] to-transparent mt-1" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1E1B18] font-normal leading-snug">
            Traditional Goldsmithing Heritage
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] font-light leading-relaxed">
            Every bridal choker, hammered kara, and traditional jhumka in our collection is forged
            by generational masters whose lineages have adorned Pakistani bridal culture.
          </p>
          <div className="border-t border-[#C9A54B]/20 pt-4">
            <p className="text-xs sm:text-sm text-[#64748B] font-light leading-relaxed">
              We preserve traditional techniques—from delicate <i>filigree wire lace</i> and <i>kundan jadai</i> to
              modern diamond faceting—ensuring our pieces withstand the test of time while retaining
              their resplendent luster.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap gap-4 text-xs font-medium text-[#1E1B18]">
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E2D8C9]">
              <CheckCircle2 className="w-4 h-4 text-[#C9A54B]" />
              <span>Full Weight Guaranteed</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E2D8C9]">
              <CheckCircle2 className="w-4 h-4 text-[#C9A54B]" />
              <span>Zero Stone Deductions</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E2D8C9]">
              <CheckCircle2 className="w-4 h-4 text-[#C9A54B]" />
              <span>Laser Hallmarked Purity</span>
            </div>
          </div>
        </div>

        {/* Refined Fixed Aspect Image with Offset Frame & Soft Gold Shadow */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none pt-2 sm:pt-4 pb-4 pr-3 sm:pr-4">
          {/* Thin offset gold frame behind it */}
          <div
            className="absolute inset-0 translate-x-2.5 translate-y-2.5 sm:translate-x-3.5 sm:translate-y-3.5 rounded-[26px] border border-[#C9A54B]/40 -z-10 pointer-events-none"
            aria-hidden="true"
          />
          {/* Main frame: 4:3 mobile, 4:5 desktop, rounded-24px */}
          <div className="relative aspect-[4/3] lg:aspect-[4/5] rounded-[24px] overflow-hidden shadow-[0_20px_45px_-12px_rgba(201,165,75,0.22)] border border-[#E2D8C9] bg-[#FAF7F2] group">
            <img
              src="/assets/aistudio/intro-poster_d8a114e6.jpg"
              alt="Artisanal Pakistani gold bridal necklace and traditional kundan jewellery craftsmanship"
              loading="lazy"
              className="w-full h-full object-cover object-[center_28%] transition-transform duration-700 ease-out group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Subtle warm ambient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white text-[11px] font-mono tracking-wider opacity-90 drop-shadow-sm flex items-center justify-between">
              <span>TRADITIONAL KUNDAN &amp; 22K GOLD</span>
              <span>EST. LAHORE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C9A54B]/30 to-transparent my-10" />

      {/* The 4 Transparency Pillars */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider text-[#8E6E24] font-semibold">
            Honest Bullion Standard
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal">
            The Sona &amp; Chandi Transparency Pledge
          </h3>
          <p className="text-xs text-[#64748B] mt-1 font-light">
            How our mathematical pricing protects your precious investment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white/90 backdrop-blur-xs border border-[#E2D8C9] rounded-xl space-y-3 shadow-2xs hover:border-[#C9A54B]/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-semibold text-[#1E1B18]">
              1. 1 tola = 11.6638 Grams
            </h4>
            <div className="w-8 h-px bg-[#C9A54B]/40" />
            <p className="text-xs text-[#64748B] font-light leading-relaxed">
              We operate strictly on international and Pakistani legal standards. We never round down weight or inflate tola conversions.
            </p>
          </div>

          <div className="p-6 bg-white/90 backdrop-blur-xs border border-[#E2D8C9] rounded-xl space-y-3 shadow-2xs hover:border-[#C9A54B]/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-semibold text-[#1E1B18]">
              2. Full Gross Weight
            </h4>
            <div className="w-8 h-px bg-[#C9A54B]/40" />
            <p className="text-xs text-[#64748B] font-light leading-relaxed">
              We never play the industry game of subtracting stone weight only to add hidden wastage or tax fees. What you weigh is what we estimate.
            </p>
          </div>

          <div className="p-6 bg-white/90 backdrop-blur-xs border border-[#E2D8C9] rounded-xl space-y-3 shadow-2xs hover:border-[#C9A54B]/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-semibold text-[#1E1B18]">
              3. Strict Karat Ratios
            </h4>
            <div className="w-8 h-px bg-[#C9A54B]/40" />
            <p className="text-xs text-[#64748B] font-light leading-relaxed">
              Calculated from official 24K rates: 22K is exactly 22/24ths, 21K is 21/24ths, and 18K is 18/24ths. Laser stamped on every piece.
            </p>
          </div>

          <div className="p-6 bg-white/90 backdrop-blur-xs border border-[#E2D8C9] rounded-xl space-y-3 shadow-2xs hover:border-[#C9A54B]/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-semibold text-[#1E1B18]">
              4. Honest WhatsApp Quotes
            </h4>
            <div className="w-8 h-px bg-[#C9A54B]/40" />
            <p className="text-xs text-[#64748B] font-light leading-relaxed">
              No misleading instant checkouts. Our team confirms exact live rates with you before any order is finalized or dispatched.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-[#FAF7F2]/80 backdrop-blur-md border border-[#C9A54B]/40 rounded-2xl p-8 sm:p-12 text-center space-y-6">
        <h3 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal">
          Experience Fine Pakistani Gold &amp; Silver
        </h3>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto font-light">
          Browse our ready inventory or test our live bullion calculator for custom ornaments.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onNavigateToCatalogue}
            className="gold-sheen w-full sm:w-auto px-8 py-3.5 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-medium text-xs sm:text-sm uppercase tracking-wider rounded-lg transition-all shadow-md cursor-pointer"
          >
            Browse Catalogue
          </button>
          <button
            onClick={onOpenCalculator}
            className="btn-inquiry w-full sm:w-auto px-6 py-3.5 font-semibold text-xs sm:text-sm uppercase tracking-wider rounded-lg transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden"
          >
            Open Rate Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
