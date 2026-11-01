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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center bg-white border border-[#E2D8C9] rounded-2xl p-6 sm:p-12 shadow-xs">
        <div className="space-y-5">
          <span className="text-xs uppercase tracking-wider text-[#8E6E24] font-semibold">
            Generational Artistry
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal leading-snug">
            Traditional Goldsmithing Heritage
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] font-light leading-relaxed">
            Every bridal choker, hammered kara, and traditional jhumka in our collection is forged
            by generational masters whose lineages have adorned Pakistani bridal culture.
          </p>
          <p className="text-xs sm:text-sm text-[#64748B] font-light leading-relaxed">
            We preserve traditional techniques—from delicate <i>filigree wire lace</i> and <i>kundan jadai</i> to
            modern diamond faceting—ensuring our pieces withstand the test of time while retaining
            their resplendent luster.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-[#1E1B18]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#C9A54B]" />
              <span>Full Weight Guaranteed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#C9A54B]" />
              <span>Zero Stone Weight Deductions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#C9A54B]" />
              <span>Laser Hallmarked Purity</span>
            </div>
          </div>
        </div>

        <div className="relative aspect-4/3 rounded-xl overflow-hidden shadow-lg border border-[#E2D8C9] bg-[#FAF7F2]">
          <img
            src="/public/assets/aistudio/intro-poster_d8a114e6.jpg"
            alt="Handcrafted Pakistani gold bridal jewellery"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* The 4 Transparency Pillars */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h3 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal">
            The Sona &amp; Chandi Transparency Pledge
          </h3>
          <p className="text-xs text-[#64748B] mt-1 font-light">
            How our mathematical pricing protects your precious investment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-[#E2D8C9] rounded-xl space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-semibold text-[#1E1B18]">
              1. 1 tola = 11.6638 Grams
            </h4>
            <p className="text-xs text-[#64748B] font-light leading-relaxed">
              We operate strictly on international and Pakistani legal standards. We never round down weight or inflate tola conversions.
            </p>
          </div>

          <div className="p-6 bg-white border border-[#E2D8C9] rounded-xl space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-semibold text-[#1E1B18]">
              2. Full Gross Weight
            </h4>
            <p className="text-xs text-[#64748B] font-light leading-relaxed">
              We never play the industry game of subtracting stone weight only to add hidden wastage or tax fees. What you weigh is what we estimate.
            </p>
          </div>

          <div className="p-6 bg-white border border-[#E2D8C9] rounded-xl space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-semibold text-[#1E1B18]">
              3. Strict Karat Ratios
            </h4>
            <p className="text-xs text-[#64748B] font-light leading-relaxed">
              Calculated from official 24K rates: 22K is exactly 22/24ths, 21K is 21/24ths, and 18K is 18/24ths. Laser stamped on every piece.
            </p>
          </div>

          <div className="p-6 bg-white border border-[#E2D8C9] rounded-xl space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-semibold text-[#1E1B18]">
              4. Honest WhatsApp Quotes
            </h4>
            <p className="text-xs text-[#64748B] font-light leading-relaxed">
              No misleading instant checkouts. Our team confirms exact live rates with you before any order is finalized or dispatched.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-[#FAF7F2] border border-[#C9A54B]/40 rounded-2xl p-8 sm:p-12 text-center space-y-6">
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
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#FAF7F2] text-[#8E6E24] border border-[#C9A54B] font-semibold text-xs sm:text-sm uppercase tracking-wider rounded-lg transition-all shadow-2xs cursor-pointer"
          >
            Open Rate Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
