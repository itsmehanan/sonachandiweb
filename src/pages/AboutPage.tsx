import React, { useState, useMemo } from 'react';
import {
  Scale,
  ShieldCheck,
  Award,
  HeartHandshake,
  Sparkles,
  MapPin,
  Clock,
  Mail,
  Truck,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { getSettings } from '../data/store';
import { BullionRates, WHATSAPP_NUMBER } from '../lib/pricing';
import {
  Reveal,
  StaggerGrid,
  StaggerItem,
  SectionHeading,
} from '../components/motion/MotionUtils';
import { FamilyBrandLine } from '../components/FamilyBrandLine';
import { TolaGuide } from '../components/TolaGuide';
import { SocialLinks } from '../components/SocialLinks';
import { WhatsAppButton } from '../components/WhatsAppButton';

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
  const [image1Error, setImage1Error] = useState(false);
  const [image2Error, setImage2Error] = useState(false);

  // Live Karachi time open/closed check (Pakistan timezone Asia/Karachi)
  const isStoreOpenNow = useMemo(() => {
    try {
      const karachiDate = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
      );
      const day = karachiDate.getDay(); // 0 is Sunday
      const hour = karachiDate.getHours();
      return day !== 0 && hour >= 9 && hour < 21;
    } catch {
      return true;
    }
  }, []);

  const hasStory = Boolean(settings.aboutPageStory && settings.aboutPageStory.trim());
  const hasEstYear = Boolean(settings.establishedYear && settings.establishedYear.trim());
  const cleanEstYear = settings.establishedYear
    ? settings.establishedYear.trim().replace(/^est\.?\s*/i, '')
    : '';

  const hasImage1 = Boolean(settings.aboutPageImageUrl && settings.aboutPageImageUrl.trim());
  const hasImage2 = Boolean(settings.aboutPageImageUrl2 && settings.aboutPageImageUrl2.trim());

  const hasAddress = Boolean(settings.address && settings.address.trim());
  const hasHours = Boolean(settings.storeHoursDescription && settings.storeHoursDescription.trim());
  const hasEmail = Boolean(settings.contactEmail && settings.contactEmail.trim());
  const hasPhone = Boolean(settings.phone && settings.phone.trim());
  const hasSocials = Boolean(
    settings.socialHandles &&
      Object.values(settings.socialHandles).some(
        (val) => typeof val === 'string' && val.trim().length > 0
      )
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-28 space-y-20 sm:space-y-28">
      {/* 1. HERO BANNER */}
      <Reveal direction="down">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          {/* Optional Established Badge (only shown when admin fills establishedYear) */}
          {hasEstYear && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F3EAD7] border border-[#B8923A]/40 text-[#7A5A12] text-xs font-semibold uppercase tracking-widest shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#B8923A]" />
              <span>Est. {cleanEstYear}</span>
            </div>
          )}

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#1A1410] font-bold tracking-tight [text-wrap:balance]">
            About Sona Chandi
          </h1>

          {/* Bilingual Family Line */}
          <FamilyBrandLine
            settings={settings}
            className="justify-center text-sm sm:text-base text-[#7A5A12]"
          />

          {/* Thin Gold Ornament */}
          <div className="w-20 sm:w-28 h-0.5 bg-gradient-to-r from-transparent via-[#B8923A] to-transparent mx-auto mt-4" />

          <p className="text-sm sm:text-base text-[#5C5046] max-w-xl mx-auto leading-relaxed pt-2">
            Gold and silver jewellery priced mathematically from official bullion market rates.
          </p>
        </div>
      </Reveal>

      {/* 2. STORY SECTION (Two columns on desktop, hidden if aboutPageStory is empty) */}
      {hasStory && (
        <Reveal direction="up" delay={0.1}>
          <div className="bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-3xl p-6 sm:p-12 lg:p-14 shadow-sm space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Story Text */}
              <div className="lg:col-span-6 xl:col-span-7 space-y-6">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5A12] block">
                    Our Heritage &amp; Philosophy
                  </span>
                  <h2 className="font-serif text-2xl sm:text-4xl text-[#1A1410] font-bold leading-tight">
                    The Story Behind Every Piece
                  </h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-[#B8923A] to-transparent" />
                </div>

                <div className="text-sm sm:text-base text-[#5C5046] font-normal leading-relaxed whitespace-pre-line space-y-4">
                  {settings.aboutPageStory}
                </div>

                <div className="pt-2 flex flex-wrap gap-2.5 text-xs font-medium text-[#1A1410]">
                  <div className="flex items-center gap-2 bg-[#F3EAD7]/60 px-3.5 py-2 rounded-full border border-[#E2D8C9]">
                    <Scale className="w-3.5 h-3.5 text-[#7A5A12]" />
                    <span>Full Weight Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#F3EAD7]/60 px-3.5 py-2 rounded-full border border-[#E2D8C9]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7A5A12]" />
                    <span>Zero Hidden Wastage</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#F3EAD7]/60 px-3.5 py-2 rounded-full border border-[#E2D8C9]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#7A5A12]" />
                    <span>Live Bullion Pricing</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Arch-shaped Image Frame with Gold Offset Frame */}
              <div className="lg:col-span-6 xl:col-span-5">
                <div
                  className={`grid ${
                    hasImage1 && hasImage2 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6' : 'grid-cols-1'
                  }`}
                >
                  {/* Primary Portrait Arch */}
                  <div className="relative mx-auto w-full max-w-sm pt-3 pb-4 pr-3">
                    <div
                      className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-[120px] rounded-b-[20px] border border-[#B8923A]/40 -z-10 pointer-events-none"
                      aria-hidden="true"
                    />
                    <div className="relative aspect-[4/5] rounded-t-[120px] rounded-b-[20px] overflow-hidden border border-[#E2D8C9] bg-gradient-to-br from-[#FAF7F2] to-[#EFE7D8] shadow-[0_20px_45px_-12px_rgba(184,146,58,0.22)] group flex items-center justify-center">
                      {hasImage1 && !image1Error ? (
                        <img
                          src={settings.aboutPageImageUrl}
                          alt="Sona Chandi Showroom"
                          loading="lazy"
                          onError={() => setImage1Error(true)}
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#FBF8F2] via-[#F3EAD7] to-[#E8DCBF]">
                          <div className="w-14 h-14 rounded-full bg-white/80 border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12] shadow-xs mb-3">
                            <Sparkles className="w-7 h-7" />
                          </div>
                          <span className="font-serif text-lg text-[#1A1410] font-semibold">
                            Sona Chandi
                          </span>
                          <span className="text-[11px] text-[#7A5A12] mt-0.5 tracking-wider uppercase">
                            Gold Collection
                          </span>
                          <FamilyBrandLine settings={settings} className="justify-center mt-2" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Second Story Image (aboutPageImageUrl2) */}
                  {hasImage2 && (
                    <div className="relative mx-auto w-full max-w-sm pt-3 pb-4 pr-3">
                      <div
                        className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-[120px] rounded-b-[20px] border border-[#B8923A]/40 -z-10 pointer-events-none"
                        aria-hidden="true"
                      />
                      <div className="relative aspect-[4/5] rounded-t-[120px] rounded-b-[20px] overflow-hidden border border-[#E2D8C9] bg-gradient-to-br from-[#FAF7F2] to-[#EFE7D8] shadow-[0_20px_45px_-12px_rgba(184,146,58,0.22)] group flex items-center justify-center">
                        {!image2Error ? (
                          <img
                            src={settings.aboutPageImageUrl2}
                            alt="Sona Chandi Jewellery Workshop"
                            loading="lazy"
                            onError={() => setImage2Error(true)}
                            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#FBF8F2] via-[#F3EAD7] to-[#E8DCBF]">
                            <Sparkles className="w-7 h-7 text-[#7A5A12]" />
                            <span className="font-serif text-base text-[#1A1410] font-medium mt-2">
                              Fine Bullion Artistry
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* 3. HOW WE PRICE VISUAL (3 Connected Cards: Weight x Today's Rate + Making Charge = Estimated Price) */}
      <div className="space-y-8">
        <SectionHeading
          kicker="Mathematical Integrity"
          title="How We Price Every Piece"
          subtitle="Three transparent factors determine every quote. No arbitrary markups."
        />

        <Reveal direction="up" delay={0.15}>
          <div className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            {/* Connected Formula Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 relative items-stretch">
              {/* Card 1: Gross Weight */}
              <div className="p-6 rounded-2xl bg-white border border-[#E2D8C9] shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#B8923A] transition-colors">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5A12]">
                      Step 1 · Weight
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#1A1410]">Gross Weight</h3>
                  </div>
                  <p className="text-xs text-[#5C5046] leading-relaxed">
                    Measured in precise grams. We never subtract stone weight only to charge arbitrary wastage fees.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2D8C9]/80 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#7A5A12]">grams (g)</span>
                  <TolaGuide triggerVariant="badge" label="1 tola = 11.6638 g" tone="light" />
                </div>
              </div>

              {/* Card 2: Today's Live Rate */}
              <div className="p-6 rounded-2xl bg-white border border-[#E2D8C9] shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#B8923A] transition-colors">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5A12]">
                      Step 2 · Multiply By
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#1A1410]">Today's Live Rate</h3>
                  </div>
                  <p className="text-xs text-[#5C5046] leading-relaxed">
                    Derived from today's official 24K per-tola benchmark ÷ 11.6638 g, adjusted for the exact karat (22K = 22/24).
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2D8C9]/80 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#7A5A12]">
                    {rates.gold24KPerTola > 0 ? `Live: Rs. ${rates.gold24KPerTola.toLocaleString()}/tola` : 'Official Market Rate'}
                  </span>
                  <button
                    onClick={onOpenCalculator}
                    className="text-[11px] text-[#7A5A12] hover:text-[#1A1410] font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    View rates
                  </button>
                </div>
              </div>

              {/* Card 3: Making Charge */}
              <div className="p-6 rounded-2xl bg-white border border-[#E2D8C9] shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#B8923A] transition-colors">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                    <Percent className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5A12]">
                      Step 3 · Add
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#1A1410]">Making Charge</h3>
                  </div>
                  <p className="text-xs text-[#5C5046] leading-relaxed">
                    A stated making charge (fixed per piece or per gram) for polishing and setting. No surprise sales levies.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2D8C9]/80 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#7A5A12]">Stated upfront</span>
                  <span className="text-[11px] text-[#5C5046]">No hidden wastage</span>
                </div>
              </div>
            </div>

            {/* Formula Result Banner & Short Plain Explanation */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#12100E] via-[#1E1712] to-[#12100E] text-[#FBF8F2] border border-[#C9A54B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F1D98B]">
                  Mathematical Rule
                </span>
                <p className="font-serif text-base sm:text-lg text-white font-medium">
                  Weight (g) × Today&apos;s Per-Gram Rate + Making Charge = Estimated Price
                </p>
                <p className="text-xs text-[#EAE2D5] max-w-2xl font-light">
                  Every jewellery estimate derives from pure bullion weight and live market rates. When you book via WhatsApp, our sales desk locks in that exact live rate with you.
                </p>
              </div>

              <button
                onClick={onOpenCalculator}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] text-[#1A1410] font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-md shrink-0 self-start sm:self-auto"
              >
                Test Rate Calculator
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* 4. VALUES SECTION (Three Cards with True Wording) */}
      <div className="space-y-8">
        <SectionHeading
          kicker="Our Core Principles"
          title="What We Stand For"
          subtitle="Simple, honest business practices that protect your investment."
        />

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A1410]">Transparent Pricing</h3>
                <div className="w-8 h-px bg-[#B8923A]/40" />
                <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                  Every price is calculated from live bullion rates per gram, with full weight accountability and zero hidden wastage or unexpected surcharges.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E2D8C9]/70 text-xs text-[#7A5A12] font-semibold">
                Live bullion standard
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A1410]">Confirmed on WhatsApp</h3>
                <div className="w-8 h-px bg-[#B8923A]/40" />
                <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                  No impersonal checkouts. Our sales desk re-verifies current bullion rates and locks in your order personally with live video or photo confirmation.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E2D8C9]/70 text-xs text-[#7A5A12] font-semibold">
                Direct personal consultation
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A1410]">Courier or Store Pickup</h3>
                <div className="w-8 h-px bg-[#B8923A]/40" />
                <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                  Choose fully insured nationwide delivery with tamper-evident security packing, or collect in person directly from our physical showroom.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E2D8C9]/70 text-xs text-[#7A5A12] font-semibold">
                Insured transit or pickup
              </div>
            </div>
          </StaggerItem>
        </StaggerGrid>
      </div>

      {/* 5. THE 4 TRANSPARENCY PILLARS (Equal-height cards with redesigned 1 tola = 11.6638 g card) */}
      <div className="space-y-8">
        <SectionHeading
          kicker="Bullion Standards"
          title="The Sona Chandi Transparency Pledge"
          subtitle="How our mathematical pricing protects your precious investment"
        />

        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: 1 tola = 11.6638 g (Redesigned with full-width soft gold outline button) */}
          <StaggerItem>
            <div className="h-full p-6 sm:p-7 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl shadow-sm hover:border-[#B8923A] transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#1A1410] whitespace-nowrap">
                  1 tola = 11.6638 g
                </h3>
                <div className="w-8 h-px bg-[#B8923A]/40" />
                <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                  We operate strictly on international and Pakistani legal bullion standards (11.6638 g). We never round down weight or inflate conversions.
                </p>
                <p className="text-[11px] text-[#7A5A12] font-medium leading-normal pt-0.5">
                  Regional note: In Khyber Pakhtunkhwa, a local trade measurement of 12.150 g is also recognized.
                </p>
              </div>

              {/* Full-width soft gold outline button with info icon */}
              <div className="pt-2">
                <TolaGuide
                  triggerVariant="outline-button"
                  label="Open Tola Guide"
                  tone="gold"
                />
              </div>
            </div>
          </StaggerItem>

          {/* Pillar 2: Full Gross Weight */}
          <StaggerItem>
            <div className="h-full p-6 sm:p-7 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl shadow-sm hover:border-[#B8923A] transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#1A1410] whitespace-nowrap">
                  Full Gross Weight
                </h3>
                <div className="w-8 h-px bg-[#B8923A]/40" />
                <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                  We never play the industry game of subtracting stone weight only to add hidden wastage or tax fees. What you weigh is what we estimate.
                </p>
              </div>

              <div className="pt-2">
                <div className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E2D8C9] bg-[#FAF7F2] text-[#5C5046] text-xs sm:text-sm font-medium flex items-center justify-center text-center">
                  Zero stone deduction tricks
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Pillar 3: Strict Karat Ratios */}
          <StaggerItem>
            <div className="h-full p-6 sm:p-7 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl shadow-sm hover:border-[#B8923A] transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#1A1410] whitespace-nowrap">
                  Strict Karat Ratios
                </h3>
                <div className="w-8 h-px bg-[#B8923A]/40" />
                <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                  Calculated strictly from 24K bullion without arbitrary markups: 22K is 22/24ths, 21K is 21/24ths, and 18K is 18/24ths.
                </p>
              </div>

              <div className="pt-2">
                <div className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E2D8C9] bg-[#FAF7F2] text-[#5C5046] text-xs sm:text-sm font-medium flex items-center justify-center text-center">
                  24K / 22K / 21K / 18K
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Pillar 4: Honest WhatsApp Quotes */}
          <StaggerItem>
            <div className="h-full p-6 sm:p-7 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl shadow-sm hover:border-[#B8923A] transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#1A1410] whitespace-nowrap">
                  Honest WhatsApp Quotes
                </h3>
                <div className="w-8 h-px bg-[#B8923A]/40" />
                <p className="text-sm text-[#5C5046] font-normal leading-relaxed">
                  No misleading instant checkouts. Our team confirms exact live rates with you before any order is finalized or dispatched.
                </p>
              </div>

              <div className="pt-2">
                <div className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E2D8C9] bg-[#FAF7F2] text-[#5C5046] text-xs sm:text-sm font-medium flex items-center justify-center text-center">
                  Verified rate lock
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerGrid>
      </div>

      {/* 6. VISIT US SECTION (Only show blocks that have data) */}
      <Reveal direction="up" delay={0.2}>
        <div className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-3xl p-6 sm:p-12 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2D8C9] pb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5A12] block">
                Showroom &amp; Consultation
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl text-[#1A1410] font-bold mt-1">
                Visit or Contact Us
              </h2>
            </div>

            {/* Live Open / Closed Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2D8C9] shadow-2xs self-start sm:self-auto">
              <span
                className={`w-2 h-2 rounded-full ${
                  isStoreOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-semibold text-[#1A1410]">
                {isStoreOpenNow ? 'Showroom Open Now' : 'Showroom Closed Now'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Showroom Address (hidden if empty) */}
            {hasAddress && (
              <div className="p-5 rounded-2xl bg-white border border-[#E2D8C9] shadow-2xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-[#1A1410]">Showroom Location</h3>
                <p className="text-xs text-[#5C5046] leading-relaxed">{settings.address}</p>
              </div>
            )}

            {/* Store Hours (hidden if empty) */}
            {hasHours && (
              <div className="p-5 rounded-2xl bg-white border border-[#E2D8C9] shadow-2xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-[#1A1410]">Visiting Hours</h3>
                <p className="text-xs text-[#5C5046] leading-relaxed">
                  {settings.storeHoursDescription}
                </p>
              </div>
            )}

            {/* Contact Email (hidden if empty) */}
            {hasEmail && (
              <div className="p-5 rounded-2xl bg-white border border-[#E2D8C9] shadow-2xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-[#1A1410]">Email Consultation</h3>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-xs text-[#7A5A12] hover:text-[#1A1410] font-medium underline underline-offset-2 break-all block"
                >
                  {settings.contactEmail}
                </a>
              </div>
            )}
          </div>

          {/* WhatsApp Direct Action & Social Links */}
          <div className="pt-4 border-t border-[#E2D8C9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#1A1410] block">
                Have questions about custom orders or live rates?
              </span>
              <p className="text-xs text-[#5C5046]">
                Our jewellery specialists respond directly on WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <WhatsAppButton
                href={`https://wa.me/${(settings.whatsappNumber || WHATSAPP_NUMBER).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  'Assalam-o-Alaikum Sona Chandi, I would like to learn more about your jewellery collection and live bullion rates.'
                )}`}
                label="Chat on WhatsApp"
                size="md"
              />

              {hasSocials && (
                <div className="pl-2 border-l border-[#E2D8C9]">
                  <SocialLinks socialHandles={settings.socialHandles} variant="gold" size="md" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* 7. CTA BANNER */}
      <Reveal direction="up" delay={0.25}>
        <div className="bg-[#F3EAD7] border border-[#B8923A]/40 rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5A12] block">
            Explore Our Ornaments
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl text-[#1A1410] font-normal [text-wrap:balance]">
            Discover Fine Pakistani Gold &amp; Silver
          </h2>
          <p className="text-sm sm:text-base text-[#5C5046] max-w-lg mx-auto font-normal leading-relaxed">
            Browse our ready catalogue of bangles, bridal sets, and rings, or calculate custom ornament rates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onNavigateToCatalogue}
              className="btn-primary-gold rounded-full w-full sm:w-auto px-8 py-3.5 font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Browse Catalogue</span>
              <ArrowRight className="w-4 h-4" />
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
