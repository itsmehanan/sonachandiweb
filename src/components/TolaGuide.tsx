import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info, X, Scale, ArrowRightLeft, Check, Sparkles, MapPin } from 'lucide-react';
import { TOLA_IN_GRAMS } from '../lib/pricing';

export const STANDARD_TOLA_GRAMS = TOLA_IN_GRAMS; // 11.6638 grams - Standard Bullion Reference
export const KPK_TOLA_GRAMS = 12.150;             // 12.150 grams - Khyber Pakhtunkhwa Regional Measurement

export type TolaStandardType = 'standard' | 'kpk';

export interface TolaGuideProps {
  /** Visual style for the trigger button */
  triggerVariant?: 'icon' | 'badge' | 'link' | 'chip' | 'outline-button' | 'none';
  /** Custom label (default: "What is a tola?") */
  label?: string;
  /** Color tone */
  tone?: 'light' | 'dark' | 'gold';
  /** Extra CSS classes for trigger */
  className?: string;
  /** Custom icon size in px */
  iconSize?: number;
  /** Custom trigger children */
  children?: React.ReactNode;
  /** Optional controlled state */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const TolaGuide: React.FC<TolaGuideProps> = ({
  triggerVariant = 'icon',
  label = 'What is a tola?',
  tone = 'gold',
  className = '',
  iconSize = 14,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setOpen = (val: boolean) => {
    if (!isControlled) setInternalIsOpen(val);
    onOpenChange?.(val);
  };

  const [converterMode, setConverterMode] = useState<'gramsToTola' | 'tolaToGrams'>('gramsToTola');
  const [standardType, setStandardType] = useState<TolaStandardType>('standard');
  const [inputValue, setInputValue] = useState<string>('11.6638');
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock and focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) focusable[0].focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Active conversion factor based on chosen standard
  const activeTolaFactor = standardType === 'kpk' ? KPK_TOLA_GRAMS : STANDARD_TOLA_GRAMS;

  // Handle standard switch
  const handleSelectStandard = (type: TolaStandardType) => {
    setStandardType(type);
    if (converterMode === 'gramsToTola') {
      if (inputValue === '11.6638' && type === 'kpk') {
        setInputValue('12.150');
      } else if (inputValue === '12.150' && type === 'standard') {
        setInputValue('11.6638');
      }
    }
  };

  // Converter calculations
  const numInput = parseFloat(inputValue) || 0;
  let convertedTolas = 0;
  let convertedGrams = 0;
  let mashaVal = 0;
  let rattiVal = 0;

  if (converterMode === 'gramsToTola') {
    convertedTolas = numInput / activeTolaFactor;
    const wholeTolas = Math.floor(convertedTolas);
    const remMasha = (convertedTolas - wholeTolas) * 12;
    mashaVal = Math.floor(remMasha);
    rattiVal = (remMasha - mashaVal) * 8;
  } else {
    convertedGrams = numInput * activeTolaFactor;
  }

  // Trigger button styling based on tone & variant
  let triggerClasses = '';
  if (triggerVariant === 'icon') {
    if (tone === 'dark') {
      triggerClasses =
        'inline-flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-full text-[#C9A54B] hover:text-white hover:bg-white/10 transition-colors cursor-pointer';
    } else if (tone === 'light') {
      triggerClasses =
        'inline-flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-full text-[#7A5A12] hover:text-[#1A1410] hover:bg-[#F3EAD7] transition-colors cursor-pointer';
    } else {
      triggerClasses =
        'inline-flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-full text-[#B8923A] hover:text-[#7A5A12] hover:bg-[#F3EAD7]/70 transition-colors cursor-pointer';
    }
  } else if (triggerVariant === 'badge') {
    triggerClasses =
      'inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border cursor-pointer transition-all ' +
      (tone === 'dark'
        ? 'bg-[#201A15] border-[#C9A54B]/40 text-[#F1D98B] hover:bg-[#2A221C]'
        : 'bg-[#FBF8F2] border-[#E2D8C9] text-[#7A5A12] hover:border-[#B8923A] hover:bg-white shadow-2xs');
  } else if (triggerVariant === 'chip') {
    triggerClasses =
      'inline-flex items-center gap-1.5 min-h-[28px] px-2 py-1 rounded text-xs font-medium text-[#7A5A12] hover:text-[#1A1410] hover:underline cursor-pointer';
  } else if (triggerVariant === 'outline-button') {
    triggerClasses =
      'w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#B8923A]/40 bg-[#FBF8F2] hover:bg-[#F3EAD7] text-[#7A5A12] hover:text-[#1A1410] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:border-[#B8923A]';
  } else if (triggerVariant === 'none') {
    triggerClasses = 'hidden';
  } else {
    triggerClasses =
      'inline-flex items-center gap-1.5 min-h-[32px] text-xs text-[#7A5A12] hover:text-[#1A1410] underline underline-offset-2 font-medium cursor-pointer transition-colors';
  }

  const modalContent = isOpen && mounted ? (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tola-guide-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div
        ref={modalRef}
        className="relative w-full sm:max-w-[576px] max-h-[90dvh] flex flex-col bg-[#FAF7F2] border border-[#E2D8C9] rounded-t-[24px] sm:rounded-3xl shadow-2xl z-10 text-[#1A1410] overflow-hidden motion-safe:animate-in motion-safe:slide-in-from-bottom motion-safe:duration-300 sm:motion-safe:slide-in-from-bottom-0 sm:motion-safe:zoom-in-95 sm:motion-safe:duration-200"
      >
        {/* Small drag handle bar on mobile phones */}
        <div
          className="w-12 h-1 rounded-full bg-[#B8923A]/40 mx-auto mt-2.5 mb-1 sm:hidden shrink-0"
          aria-hidden="true"
        />

        {/* FIXED HEADER */}
        <div className="shrink-0 bg-gradient-to-r from-[#12100E] via-[#1E1712] to-[#12100E] text-[#FBF8F2] px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between border-b border-[#C9A54B]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A54B] to-[#F1D98B] flex items-center justify-center text-[#1A1410] shadow-xs shrink-0">
              <Scale className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F1D98B]">
                  Tola Guide
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <h2
                id="tola-guide-title"
                className="font-serif text-lg sm:text-2xl font-bold text-white leading-tight"
              >
                What is a Tola?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close tola guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE MIDDLE CONTENT */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Primary Standard Statement (Pakistan & International Reference) */}
          <div className="p-4 rounded-xl bg-white border border-[#B8923A]/40 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#7A5A12] font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#C9A54B]" />
                <span>Standard Tola (Bullion Reference)</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F3EAD7] text-[#7A5A12] border border-[#B8923A]/30">
                Official Benchmark
              </span>
            </div>
            <p className="font-serif text-sm sm:text-base text-[#1A1410] font-medium leading-relaxed">
              Our tola = <strong className="text-[#7A5A12] font-bold">11.6638 grams</strong> (the standard used by the Pakistan bullion market, the same across all provinces including Khyber Pakhtunkhwa, Punjab, Sindh and Balochistan).
            </p>
          </div>

          {/* KPK Regional Tola Informational Section */}
          <div className="p-4 rounded-xl bg-white border border-[#E2D8C9] shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#7A5A12] font-semibold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-[#B8923A]" />
                <span>KPK Regional Tola</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF7F2] text-[#5C5046] border border-[#E2D8C9]">
                Regional Trade Context
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#1A1410] leading-relaxed">
              In Khyber Pakhtunkhwa, a regional tola measurement of <strong className="text-[#7A5A12] font-bold">12.150 grams</strong> is used in some local gold-trading contexts. This differs from the 11.6638-gram standard tola.
            </p>
            <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E2D8C9] text-[11px] text-[#5C5046] leading-relaxed space-y-1">
              <div>
                <strong className="text-[#1A1410]">Standard distinction:</strong> The 11.6638 g tola is the standard reference used in Pakistan and international bullion markets for official daily rates and catalogue estimations. The 12.150 g tola represents a traditional local trading custom in parts of KPK.
              </div>
            </div>
          </div>

          {/* Interactive Dual-Standard Weight Converter */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#F3EAD7]/60 border border-[#E2D8C9] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2D8C9] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A5A12] flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Interactive Weight Converter</span>
              </span>

              {/* Direction Toggle (g -> tola / tola -> g) */}
              <div className="inline-flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E2D8C9] text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setConverterMode('gramsToTola');
                    setInputValue(standardType === 'kpk' ? '12.150' : '11.6638');
                  }}
                  className={`min-h-[44px] sm:min-h-[32px] px-3 py-1.5 rounded cursor-pointer font-medium transition-colors ${
                    converterMode === 'gramsToTola'
                      ? 'bg-[#B8923A] text-white shadow-xs'
                      : 'text-[#5C5046] hover:text-[#1A1410]'
                  }`}
                >
                  g → tola
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConverterMode('tolaToGrams');
                    setInputValue('1');
                  }}
                  className={`min-h-[44px] sm:min-h-[32px] px-3 py-1.5 rounded cursor-pointer font-medium transition-colors ${
                    converterMode === 'tolaToGrams'
                      ? 'bg-[#B8923A] text-white shadow-xs'
                      : 'text-[#5C5046] hover:text-[#1A1410]'
                  }`}
                >
                  tola → g
                </button>
              </div>
            </div>

            {/* Standard Selection Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#5C5046] flex items-center justify-between">
                <span>Select Tola Standard:</span>
                <span className="text-[#7A5A12] font-mono font-bold">
                  Active: {standardType === 'standard' ? '11.6638 g' : '12.150 g'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-[#E2D8C9]">
                <button
                  type="button"
                  onClick={() => handleSelectStandard('standard')}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                    standardType === 'standard'
                      ? 'bg-gradient-to-r from-[#B8923A] to-[#C9A54B] text-white shadow-xs'
                      : 'text-[#5C5046] hover:text-[#1A1410] hover:bg-[#F3EAD7]/50'
                  }`}
                >
                  <span className="leading-tight">Standard Tola</span>
                  <span className="text-[10px] opacity-90 font-mono">11.6638 grams</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStandard('kpk')}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                    standardType === 'kpk'
                      ? 'bg-gradient-to-r from-[#B8923A] to-[#C9A54B] text-white shadow-xs'
                      : 'text-[#5C5046] hover:text-[#1A1410] hover:bg-[#F3EAD7]/50'
                  }`}
                >
                  <span className="leading-tight">KPK Regional Tola</span>
                  <span className="text-[10px] opacity-90 font-mono">12.150 grams</span>
                </button>
              </div>
            </div>

            {/* Clear Selected Standard Indicator */}
            <div className="p-2 rounded-lg bg-white/80 border border-[#E2D8C9] flex items-center justify-between text-xs">
              <span className="text-[#5C5046]">Calculation Basis:</span>
              <span className="font-semibold text-[#7A5A12] font-mono">
                {standardType === 'standard'
                  ? 'Standard Bullion: 1 tola = 11.6638 g'
                  : 'KPK Regional: 1 tola = 12.150 g'}
              </span>
            </div>

            {/* Stacked on mobile, 2 columns on tablet/desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5046]">
                  {converterMode === 'gramsToTola' ? 'Enter Grams (g)' : 'Enter Tola'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-[#E2D8C9] rounded-lg text-base font-mono font-bold text-[#1A1410] outline-none focus:border-[#B8923A]"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-3 text-xs text-[#7A5A12] font-semibold">
                    {converterMode === 'gramsToTola' ? 'g' : 'tola'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5046]">
                  {converterMode === 'gramsToTola'
                    ? standardType === 'kpk'
                      ? 'Calculated KPK Tola'
                      : 'Calculated Standard Tola'
                    : 'Calculated Grams'}
                </label>
                <div className="min-h-[44px] px-3.5 py-2.5 bg-white border border-[#B8923A]/40 rounded-lg text-sm sm:text-base font-mono font-bold text-[#7A5A12] flex items-center justify-between">
                  <span>
                    {converterMode === 'gramsToTola'
                      ? `${convertedTolas.toFixed(4)} tola`
                      : `${convertedGrams.toFixed(4)} g`}
                  </span>
                  <Check className="w-4 h-4 text-[#B8923A] shrink-0" />
                </div>
              </div>
            </div>

            {converterMode === 'gramsToTola' && numInput > 0 && (
              <div className="text-[11px] text-[#5C5046] font-medium pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>
                  Traditional breakdown ({standardType === 'kpk' ? 'KPK base' : '11.6638g base'}):{' '}
                  <strong>
                    {Math.floor(convertedTolas)} tola, {mashaVal} masha, {rattiVal.toFixed(1)} ratti
                  </strong>
                </span>
                <span className="text-[#7A5A12] font-semibold">Zero rounding loss</span>
              </div>
            )}
          </div>

          {/* Clean Regional Comparison Table (wraps properly, never overflows horizontally) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5046]">
              Regional Bullion Standards
            </h3>
            <div className="border border-[#E2D8C9] rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-[#F3EAD7]/50 border-b border-[#E2D8C9] text-[11px] font-semibold text-[#7A5A12] uppercase tracking-wider">
                    <th className="py-2.5 px-3 sm:px-4 w-[65%] sm:w-[70%]">Market / Region</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right w-[35%] sm:w-[30%]">Standard Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D8C9]/70 text-xs">
                  <tr>
                    <td className="py-2.5 px-3 sm:px-4 font-medium text-[#1A1410] break-words whitespace-normal leading-snug">
                      Pakistan (all provinces: KP, Punjab, Sindh, Balochistan)
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-[#7A5A12] text-right whitespace-nowrap">
                      11.6638 g
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 sm:px-4 font-medium text-[#1A1410] break-words whitespace-normal leading-snug">
                      Khyber Pakhtunkhwa (Regional local trade)
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-[#7A5A12] text-right whitespace-nowrap">
                      12.150 g
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 sm:px-4 font-medium text-[#1A1410] break-words whitespace-normal">
                      India, Nepal
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 font-mono text-[#1A1410] text-right whitespace-nowrap">
                      11.6638 g
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 sm:px-4 font-medium text-[#1A1410] break-words whitespace-normal">
                      UAE and Gulf gold markets
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 font-mono text-[#1A1410] text-right whitespace-nowrap">
                      11.6638 g
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 sm:px-4 font-medium text-[#1A1410] break-words whitespace-normal">
                      Bangladesh vori
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 font-mono text-[#1A1410] text-right whitespace-nowrap">
                      about 11.664 g
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Traditional Units Box (rows wrap on narrow screens) */}
          <div className="p-4 rounded-xl bg-white border border-[#E2D8C9] space-y-2.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A5A12]">
              Traditional units
            </h3>
            <ul className="space-y-2 text-xs text-[#4A3F35]">
              <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="text-[#5C5046]">1 tola</span>
                <strong className="font-mono text-[#1A1410]">12 masha (about 0.972 g each)</strong>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="text-[#5C5046]">1 masha</span>
                <strong className="font-mono text-[#1A1410]">8 ratti (about 0.1215 g each)</strong>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="text-[#5C5046]">1 tola</span>
                <strong className="font-mono text-[#1A1410]">0.375 troy ounce</strong>
              </li>
            </ul>
          </div>

          {/* Note on Rounding & Verification */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#B8923A]/40 text-xs text-[#5C5046] leading-relaxed">
            <span className="font-semibold text-[#1A1410] block mb-0.5">Verification Guarantee:</span>
            Some traders round a tola to 10 g or 12 g. We always use 11.6638 g for official quotations and pricing, so you can verify any weight.
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="shrink-0 p-4 sm:p-5 bg-[#F3EAD7]/70 border-t border-[#E2D8C9] flex items-center justify-between gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <span className="text-[11px] text-[#7A5A12] font-semibold truncate">
            Sona Chandi Gold Collection · 11.6638 g
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1A1410] text-white hover:bg-[#7A5A12] text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Custom children trigger or default button */}
      {children ? (
        <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
          {children}
        </span>
      ) : triggerVariant !== 'none' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${triggerClasses} ${className}`}
          title="What is a tola? Official bullion standard guide & converter"
          aria-label="What is a tola? Open bullion weight guide"
        >
          <Info style={{ width: iconSize, height: iconSize }} className="shrink-0 stroke-[2.2]" />
          {triggerVariant !== 'icon' && <span>{label}</span>}
        </button>
      ) : null}

      {/* Render modal into document.body portal */}
      {modalContent && typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
};
