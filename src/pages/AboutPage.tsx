import React, { useState } from 'react';
import { ShieldCheck, Scale, Award, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { getSettings } from '../data/store';
import { BullionRates } from '../lib/pricing';
import {
  Reveal,
  StaggerGrid,
  StaggerItem,
  SectionHeading,
} from '../components/motion/MotionUtils';

interface AboutPageProps {
  rates: BullionRates;
  onNavigateToCatalogue: () => void;
  onOpenCalculator: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  rates: _rates,
  onNavigateToCatalogue,
  onOpenCalculator,
}) => {
  const settings = getSettings();
  const [aboutImageError, setAboutImageError] = useState(false);

  const displayAboutImage =
    !aboutImageError && settings.aboutPageImageUrl
      ? settings.aboutPageImageUrl
      : '/assets/aistudio/intro-poster_d8a114e6.jpg';

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-28 space-y-20">
      {/* Editorial Story Header */}
      <SectionHeading
        kicker="Our Heritage & Philosophy"
        title="Crafting Legacies in Pure Gold & Silver"
        subtitle="Fine jewellery embodying transcendent artisan beauty and absolute bullion transparency."
      />

      {/* Heritage Story Split */}
      <Reveal direction="up" delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl p-6 sm:p-12 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="label-kicker block text-[#7A5A12]">
                Generational Artistry
              </span>
              <div className="w-12 h-0.5 bg-gradient-to-r from-[#B8923A] to-transparent mt-1" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1A1410] font-normal leading-snug [text-wrap:balance]">
              Traditional Goldsmithing Heritage
            </h2>
            <p className="text-sm sm:text-base text-[#5C5046] font-normal leading-relaxed">
              Every bridal choker, hammered kara, and traditional jhumka in our collection is forged
              by generational masters whose lineages have adorned Pakistani bridal culture for decades.
            </p>
            <div className="border-t border-[#B8923A]/20 pt-4">
              <p className="text-sm sm:text-base text-[#5C5046] font-normal leading-relaxed">
                We preserve authentic techniques—from delicate filigree wire lace and kundan jadai to
                modern diamond faceting—ensuring each heirloom withstands generations while retaining
                its pristine luster.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-3 text-xs font-medium text-[#1A1410]">
              <div className="flex items-center gap-2 bg-[#F3EAD7]/60 px-3.5 py-2 rounded-full border border-[#E2D8C9]">
                <CheckCircle2 className="w-4 h-4 text-[#7A5A12]" />
                <span>Full Weight Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 bg-[#F3EAD7]/60 px-3.5 py-2 rounded-full border border-[#E2D8C9]">
                <CheckCircle2 className="w-4 h-4 text-[#7A5A12]" />
                <span>Zero Stone Deductions</span>
              </div>
              <div className="flex items-center gap-2 bg-[#F3EAD7]/60 px-3.5 py-2 rounded-full border border-[#E2D8C9]">
                <CheckCircle2 className="w-4 h-4 text-[#7A5A12]" />
                <span>Laser Hallmarked Purity</span>
              </div>
            </div>
          </div>

          {/* Refined Fixed Aspect Image with Offset Frame */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none pt-2 sm:pt-4 pb-4 pr-3 sm:pr-4">
            <div
              className="absolute inset-0 translate-x-2.5 translate-y-2.5 sm:translate-x-3.5 sm:translate-y-3.5 rounded-[26px] border border-[#B8923A]/40 -z-10 pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative aspect-[4/3] lg:aspect-[4/5] rounded-[24px] overflow-hidden shadow-[0_20px_45px_-12px_rgba(184,146,58,0.22)] border border-[#E2D8C9] bg-[#F3EAD7] group">
              <img
                src={displayAboutImage}
                alt="Artisanal Pakistani gold bridal necklace and traditional kundan jewellery craftsmanship"
                loading="lazy"
                onError={() => setAboutImageError(true)}
                className="w-full h-full object-cover object-[center_28%] transition-transform duration-700 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70 pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-[11px] font-mono tracking-wider opacity-90 drop-shadow-sm flex items-center justify-between">
                <span>TRADITIONAL KUNDAN &amp; 22K GOLD</span>
                <span>EST. LAHORE</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* The 4 Transparency Pillars */}
      <div className="space-y-12">
        <SectionHeading
          kicker="Honest Bullion Standard"
          title="The Sona &amp; Chandi Transparency Pledge"
          subtitle="How our mathematical pricing protects your precious investment"
        />

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#1A1410]">
                1. 1 tola = 11.6638 Grams
              </h3>
              <div className="w-8 h-px bg-[#B8923A]/40" />
              <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                We operate strictly on international and Pakistani legal standards. We never round down weight or inflate tola conversions.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#1A1410]">
                2. Full Gross Weight
              </h3>
              <div className="w-8 h-px bg-[#B8923A]/40" />
              <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                We never play the industry game of subtracting stone weight only to add hidden wastage or tax fees. What you weigh is what we estimate.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#1A1410]">
                3. Strict Karat Ratios
              </h3>
              <div className="w-8 h-px bg-[#B8923A]/40" />
              <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                Calculated from official 24K rates: 22K is exactly 22/24ths, 21K is 21/24ths, and 18K is 18/24ths. Laser stamped on every piece.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#1A1410]">
                4. Honest WhatsApp Quotes
              </h3>
              <div className="w-8 h-px bg-[#B8923A]/40" />
              <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                No misleading instant checkouts. Our team confirms exact live rates with you before any order is finalized or dispatched.
              </p>
            </div>
          </StaggerItem>
        </StaggerGrid>
      </div>

      {/* CTA Box */}
      <Reveal direction="up" delay={0.2}>
        <div className="bg-[#F3EAD7] border border-[#B8923A]/40 rounded-2xl p-8 sm:p-14 text-center space-y-6 shadow-sm">
          <span className="label-kicker block text-[#7A5A12]">Experience Excellence</span>
          <h2 className="font-serif text-2xl sm:text-4xl text-[#1A1410] font-normal [text-wrap:balance]">
            Experience Fine Pakistani Gold &amp; Silver
          </h2>
          <p className="text-sm sm:text-base text-[#5C5046] max-w-lg mx-auto font-normal leading-relaxed">
            Browse our ready inventory or test our live bullion calculator for custom ornaments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onNavigateToCatalogue}
              className="btn-primary-gold rounded-full w-full sm:w-auto px-8 py-3.5 font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              Browse Catalogue
            </button>
            <button
              onClick={onOpenCalculator}
              className="btn-secondary-outline rounded-full w-full sm:w-auto px-8 py-3.5 font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              Open Rate Calculator
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
};
