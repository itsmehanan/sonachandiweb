import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Plus, Minus, ChevronDown, Check, Info } from 'lucide-react';
import {
  BullionRates,
  getGoldPerGramForKarat,
  getSilverPerGram,
  formatPKR,
  GoldKarat,
  TOLA_IN_GRAMS,
  ESTIMATE_DISCLAIMER,
  WHATSAPP_NUMBER,
} from '../lib/pricing';
import { getSettings } from '../data/store';
import { WhatsAppButton } from './WhatsAppButton';

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: BullionRates;
}

/**
 * Animated count-up hook for smooth numeric transitions (400ms).
 * Automatically respects prefers-reduced-motion.
 */
function useCountUp(target: number, duration: number = 400): number {
  const [current, setCurrent] = useState(target);
  const startRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setCurrent(target);
      startRef.current = target;
      return;
    }

    const start = startRef.current;
    const diff = target - start;
    if (diff === 0) return;

    let animId: number;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(start + diff * ease);
      setCurrent(val);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        startRef.current = target;
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return current;
}

export const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({
  isOpen,
  onClose,
  rates,
}) => {
  const [metal, setMetal] = useState<'gold' | 'silver'>('gold');
  const [goldKarat, setGoldKarat] = useState<GoldKarat>('22K');
  const [weightUnit, setWeightUnit] = useState<'grams' | 'tola'>('grams');
  const [weight, setWeight] = useState<number>(10);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus trap, Escape key listener, and restore focus on close
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        if (
          previouslyFocusedElementRef.current &&
          typeof previouslyFocusedElementRef.current.focus === 'function'
        ) {
          previouslyFocusedElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Weight conversion and validation
  const safeWeight = isNaN(weight) || weight <= 0 ? 0 : weight;
  const weightInGrams =
    weightUnit === 'grams' ? safeWeight : safeWeight * TOLA_IN_GRAMS;
  const isValidWeight = safeWeight > 0 && weightInGrams <= 1000;

  // Pricing math using pricing.ts functions
  const isRateMissing =
    metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0;

  const perGramRate = !isRateMissing
    ? metal === 'gold'
      ? getGoldPerGramForKarat(goldKarat, rates.gold24KPerTola)
      : getSilverPerGram(rates.silverRate, rates.silverUnit)
    : 0;

  // Metal value only = weight x today's per-gram rate (NO making charges)
  const targetMetalValue =
    isValidWeight && !isRateMissing ? Math.round(weightInGrams * perGramRate) : 0;
  const animatedMetalValue = useCountUp(targetMetalValue, 400);

  // Stepper handlers
  const handleDecrement = () => {
    if (weightUnit === 'grams') {
      setWeight((prev) => Math.max(1, Math.round((prev - 1) * 10) / 10));
    } else {
      setWeight((prev) => Math.max(0.5, Math.round((prev - 0.5) * 100) / 100));
    }
  };

  const handleIncrement = () => {
    if (weightUnit === 'grams') {
      setWeight((prev) => Math.min(1000, Math.round((prev + 1) * 10) / 10));
    } else {
      setWeight((prev) => Math.min(85.7, Math.round((prev + 0.5) * 100) / 100));
    }
  };

  // WhatsApp prefilled message
  const settings = getSettings();
  const whatsappPhone = settings.whatsappNumber || WHATSAPP_NUMBER;
  const weightLabel =
    weightUnit === 'tola'
      ? `${safeWeight} tola (~${weightInGrams.toFixed(2)} g)`
      : `${safeWeight} g`;
  const metalLabel = metal === 'gold' ? `${goldKarat} gold` : 'silver';

  const whatsappMessage = isRateMissing
    ? `Hello, I would like to inquire about today's price for ${weightLabel} of ${metalLabel}.`
    : `Hello, I would like a price for ${weightLabel} of ${metalLabel}. Estimated metal value: ${formatPKR(
        targetMetalValue
      )}.`;
  const whatsappHref = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  // Quick Chips
  const quickChips: { label: string; unit: 'tola' | 'grams'; val: number }[] = [
    { label: '1 tola', unit: 'tola', val: 1 },
    { label: '2 tola', unit: 'tola', val: 2 },
    { label: '5 g', unit: 'grams', val: 5 },
    { label: '10 g', unit: 'grams', val: 10 },
    { label: '20 g', unit: 'grams', val: 20 },
  ];

  // Gold purity pill definitions
  const goldPurities: { karat: GoldKarat; percent: string }[] = [
    { karat: '24K', percent: '99.9%' },
    { karat: '22K', percent: '91.6%' },
    { karat: '21K', percent: '87.5%' },
    { karat: '18K', percent: '75.0%' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="price-estimator-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-[#FAF7F2] border-t sm:border border-[#E2D8C9] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-[#1E1B18] max-h-[92vh] flex flex-col my-0 sm:my-auto"
          >
            {/* Mobile Grab Bar */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <span className="w-12 h-1 rounded-full bg-[#D6C7B2]" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E2D8C9] bg-white/80 backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FAF7F2] to-[#F3EFEA] border border-[#C9A54B]/40 flex items-center justify-center text-[#8E6E24] shadow-2xs">
                  <Sparkles className="w-5 h-5 text-[#C9A54B]" />
                </div>
                <div>
                  <h2
                    id="price-estimator-title"
                    className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#1E1B18]"
                  >
                    Price Estimator
                  </h2>
                  <p className="text-xs text-[#64748B] font-light">
                    See the estimated value of gold or silver by weight
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] p-2 text-[#64748B] hover:text-[#1E1B18] rounded-full hover:bg-[#F3EFEA] transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] outline-hidden"
                aria-label="Close price estimator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* STEP 1: Select Metal (Two Large Selectable Cards) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E6E24] mb-2.5">
                  1. Select Metal
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Gold Card */}
                  <button
                    type="button"
                    onClick={() => setMetal('gold')}
                    className={`relative p-4 rounded-xl text-left transition-all duration-200 cursor-pointer min-h-[76px] flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#C9A54B] outline-hidden ${
                      metal === 'gold'
                        ? 'border-2 border-[#C9A54B] bg-gradient-to-b from-[#FFFDF9] to-[#FBF6EC] shadow-md shadow-[#C9A54B]/15 ring-2 ring-[#C9A54B]/20'
                        : 'border border-[#E2D8C9] bg-white hover:border-[#C9A54B]/50 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8CF8A] to-[#C9A54B] flex items-center justify-center shadow-xs">
                        <span className="font-serif text-xs font-bold text-white">Au</span>
                      </span>
                      {metal === 'gold' && (
                        <span className="w-5 h-5 rounded-full bg-[#C9A54B] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="font-serif text-base font-bold text-[#1E1B18] block leading-tight">
                        Gold (Sona)
                      </span>
                      <span className="text-[11px] text-[#8E6E24] font-medium block">
                        24K, 22K, 21K, 18K
                      </span>
                    </div>
                  </button>

                  {/* Silver Card */}
                  <button
                    type="button"
                    onClick={() => setMetal('silver')}
                    className={`relative p-4 rounded-xl text-left transition-all duration-200 cursor-pointer min-h-[76px] flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#C9A54B] outline-hidden ${
                      metal === 'silver'
                        ? 'border-2 border-[#C9A54B] bg-gradient-to-b from-[#FFFDF9] to-[#F5F6F8] shadow-md shadow-[#C9A54B]/15 ring-2 ring-[#C9A54B]/20'
                        : 'border border-[#E2D8C9] bg-white hover:border-[#C9A54B]/50 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] flex items-center justify-center shadow-xs">
                        <span className="font-serif text-xs font-bold text-[#1E293B]">Ag</span>
                      </span>
                      {metal === 'silver' && (
                        <span className="w-5 h-5 rounded-full bg-[#C9A54B] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="font-serif text-base font-bold text-[#1E1B18] block leading-tight">
                        Silver (Chandi)
                      </span>
                      <span className="text-[11px] text-[#64748B] font-medium block">
                        925 Pure Sterling Silver
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* STEP 2: Gold Purity Pills (Gold only) */}
              {metal === 'gold' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E6E24] mb-2.5">
                    2. Select Gold Purity
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {goldPurities.map(({ karat, percent }) => {
                      const isSelected = goldKarat === karat;
                      return (
                        <button
                          key={karat}
                          type="button"
                          onClick={() => setGoldKarat(karat)}
                          className={`py-2.5 px-2 rounded-xl text-center transition-all cursor-pointer min-h-[50px] flex flex-col items-center justify-center focus-visible:ring-2 focus-visible:ring-[#C9A54B] outline-hidden ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] text-[#1E1B18] font-bold shadow-xs border border-transparent'
                              : 'bg-white text-[#475569] border border-[#E2D8C9] hover:border-[#C9A54B]/60 hover:text-[#1E1B18]'
                          }`}
                        >
                          <span className="text-sm font-bold leading-none">{karat}</span>
                          <span
                            className={`text-[10px] mt-1 ${
                              isSelected ? 'text-[#3E2F13] font-semibold' : 'text-[#94A3B8]'
                            }`}
                          >
                            {percent}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Weight with Grams | Tola toggle & steppers */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#8E6E24]">
                    {metal === 'gold' ? '3. Enter Weight' : '2. Enter Weight'}
                  </label>

                  {/* Grams | Tola Toggle */}
                  <div className="flex items-center p-0.5 bg-[#EAE3D6] rounded-lg border border-[#DCD1BF]">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('grams')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        weightUnit === 'grams'
                          ? 'bg-white text-[#8E6E24] shadow-2xs'
                          : 'text-[#64748B] hover:text-[#1E1B18]'
                      }`}
                    >
                      Grams
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('tola')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        weightUnit === 'tola'
                          ? 'bg-white text-[#8E6E24] shadow-2xs'
                          : 'text-[#64748B] hover:text-[#1E1B18]'
                      }`}
                    >
                      Tola
                    </button>
                  </div>
                </div>

                {/* Stepper + Input Box */}
                <div className="bg-white border border-[#E2D8C9] rounded-2xl p-2.5 flex items-center justify-between shadow-2xs focus-within:border-[#C9A54B] transition-colors">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    aria-label="Decrease weight"
                    className="w-12 h-12 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFEA] active:scale-95 text-[#1E1B18] flex items-center justify-center transition-all cursor-pointer border border-[#E2D8C9] focus-visible:ring-2 focus-visible:ring-[#C9A54B] outline-hidden shrink-0"
                  >
                    <Minus className="w-5 h-5 text-[#8E6E24]" />
                  </button>

                  <div className="flex-1 text-center px-2">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <input
                        type="number"
                        min="0.1"
                        max={weightUnit === 'grams' ? 1000 : 85.7}
                        step={weightUnit === 'grams' ? '0.1' : '0.05'}
                        value={weight === 0 ? '' : weight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setWeight(isNaN(val) ? 0 : val);
                        }}
                        className="font-serif text-3xl sm:text-4xl font-bold text-[#1E1B18] text-center w-36 bg-transparent outline-none p-0"
                        placeholder="0"
                      />
                      <span className="text-sm font-semibold text-[#8E6E24] uppercase tracking-wide">
                        {weightUnit === 'grams' ? 'g' : 'tola'}
                      </span>
                    </div>

                    {/* Equivalent in other unit */}
                    <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                      {weightUnit === 'grams' ? (
                        <span>
                          ~ {(safeWeight / TOLA_IN_GRAMS).toFixed(3)} tola (1 tola = 11.66g)
                        </span>
                      ) : (
                        <span>
                          ~ {(safeWeight * TOLA_IN_GRAMS).toFixed(2)} grams
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleIncrement}
                    aria-label="Increase weight"
                    className="w-12 h-12 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFEA] active:scale-95 text-[#1E1B18] flex items-center justify-center transition-all cursor-pointer border border-[#E2D8C9] focus-visible:ring-2 focus-visible:ring-[#C9A54B] outline-hidden shrink-0"
                  >
                    <Plus className="w-5 h-5 text-[#8E6E24]" />
                  </button>
                </div>

                {/* Validation message if weight exceeds sensible max */}
                {weightInGrams > 1000 && (
                  <p className="text-xs text-rose-600 mt-1.5 font-medium">
                    Maximum calculated weight is 1,000 grams. For larger bullion bulk orders, please contact us directly.
                  </p>
                )}

                {/* Quick Chips */}
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-semibold shrink-0">
                    Quick:
                  </span>
                  {quickChips.map((chip) => {
                    const isSelected =
                      weightUnit === chip.unit && Math.abs(safeWeight - chip.val) < 0.001;
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          setWeightUnit(chip.unit);
                          setWeight(chip.val);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer min-h-[36px] focus-visible:ring-2 focus-visible:ring-[#C9A54B] outline-hidden ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] text-[#1E1B18] shadow-xs'
                            : 'bg-white text-[#475569] border border-[#E2D8C9] hover:border-[#C9A54B] hover:text-[#1E1B18]'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RESULT CARD: Subtle Gold Glow + Big Serif Number */}
              <div className="relative rounded-2xl p-5 sm:p-6 border border-[#C9A54B]/40 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6ED] to-[#F5EEDB] shadow-md shadow-[#C9A54B]/10 overflow-hidden">
                {/* Soft ambient background glow */}
                <div
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#E8CF8A]/25 blur-2xl pointer-events-none"
                  aria-hidden="true"
                />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8E6E24]">
                      Estimated metal value
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B] font-medium">
                      <Sparkles className="w-3 h-3 text-[#C9A54B]" />
                      Live Sarafa Rate
                    </span>
                  </div>

                  {/* Big Animated Number or Rate Missing Notice */}
                  {isRateMissing ? (
                    <div className="py-2 text-left">
                      <p className="font-serif text-lg font-semibold text-[#8E6E24]">
                        Rates are being updated. Please ask us on WhatsApp.
                      </p>
                    </div>
                  ) : !isValidWeight ? (
                    <div className="py-2 text-left">
                      <p className="font-serif text-xl text-[#94A3B8]">
                        Enter a valid weight above
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#8E6E24] tabular-nums">
                        {formatPKR(animatedMetalValue)}
                      </div>
                      <p className="text-xs text-[#64748B] mt-1.5 font-light">
                        Today’s {metal === 'gold' ? goldKarat : 'silver'} rate:{' '}
                        <span className="font-mono font-semibold text-[#1E1B18]">
                          {formatPKR(Math.round(perGramRate))}
                        </span>{' '}
                        per gram
                      </p>
                    </div>
                  )}

                  {/* Last updated indicator if available */}
                  {rates.lastUpdated && (
                    <p className="text-[10px] text-[#94A3B8] font-light pt-1 border-t border-[#C9A54B]/20">
                      Market rate updated: {rates.lastUpdated}
                    </p>
                  )}
                </div>
              </div>

              {/* Design Note & WhatsApp Action */}
              <div className="space-y-3">
                <div className="p-3.5 bg-white/80 border border-[#E2D8C9] rounded-xl text-xs text-[#64748B] leading-relaxed">
                  <span className="font-semibold text-[#1E1B18]">Note: </span>
                  Making charges depend on the design. Ask us on WhatsApp for the exact price.
                </div>

                <WhatsAppButton
                  href={whatsappHref}
                  label="Ask Us on WhatsApp for Exact Price"
                  size="md"
                  fullWidth
                />
              </div>

              {/* Collapsed "How is this calculated?" Accordion */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#8E6E24] hover:text-[#1E1B18] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] rounded outline-hidden"
                >
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#C9A54B]" />
                    <span>How is this calculated?</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#C9A54B] transition-transform duration-200 ${
                      showExplanation ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-3.5 bg-white/90 border border-[#E2D8C9] rounded-xl text-xs text-[#64748B] space-y-2 leading-relaxed"
                  >
                    <p className="font-semibold text-[#1E1B18]">
                      Weight × today’s per-gram rate for the chosen purity.
                    </p>
                    <p>
                      Today’s 24K bullion rate per tola is divided by 11.6638 grams (1 tola) to determine the pure gram rate, then adjusted for karat purity (e.g., 22K is 22/24 parts pure). Your weight is then multiplied by this rate.
                    </p>
                    <p className="text-[11px] text-[#8E6E24] font-medium">
                      This calculation estimates metal value only. Making charges and design craftsmanship will be confirmed directly on WhatsApp based on your selected piece.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-[#94A3B8] italic leading-tight text-center">
                *{ESTIMATE_DISCLAIMER}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
