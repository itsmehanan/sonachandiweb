import React, { useState, useEffect, useRef } from 'react';
import { Info, X, Scale, ArrowRightLeft, Check, Sparkles } from 'lucide-react';
import { TOLA_IN_GRAMS } from '../lib/pricing';

export interface TolaGuideProps {
  /** Visual style for the trigger button */
  triggerVariant?: 'icon' | 'badge' | 'link' | 'chip';
  /** Custom label (default: "What is a tola?") */
  label?: string;
  /** Color tone */
  tone?: 'light' | 'dark' | 'gold';
  /** Extra CSS classes */
  className?: string;
  /** Custom icon size in px */
  iconSize?: number;
}

export const TolaGuide: React.FC<TolaGuideProps> = ({
  triggerVariant = 'icon',
  label = 'What is a tola?',
  tone = 'gold',
  className = '',
  iconSize = 14,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [converterMode, setConverterMode] = useState<'gramsToTola' | 'tolaToGrams'>('gramsToTola');
  const [inputValue, setInputValue] = useState<string>('11.6638');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management and body scroll lock
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
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
        if (e.key === 'Escape') setIsOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Converter calculations
  const numInput = parseFloat(inputValue) || 0;
  let convertedTolas = 0;
  let convertedGrams = 0;
  let mashaVal = 0;
  let rattiVal = 0;

  if (converterMode === 'gramsToTola') {
    convertedTolas = numInput / TOLA_IN_GRAMS;
    const wholeTolas = Math.floor(convertedTolas);
    const remMasha = (convertedTolas - wholeTolas) * 12;
    mashaVal = Math.floor(remMasha);
    rattiVal = (remMasha - mashaVal) * 8;
  } else {
    convertedGrams = numInput * TOLA_IN_GRAMS;
  }

  // Trigger button styling based on tone & variant
  let triggerClasses = '';
  if (triggerVariant === 'icon') {
    if (tone === 'dark') {
      triggerClasses =
        'inline-flex items-center justify-center p-1 rounded-full text-[#C9A54B] hover:text-white hover:bg-white/10 transition-colors cursor-pointer';
    } else if (tone === 'light') {
      triggerClasses =
        'inline-flex items-center justify-center p-1 rounded-full text-[#7A5A12] hover:text-[#1A1410] hover:bg-[#F3EAD7] transition-colors cursor-pointer';
    } else {
      triggerClasses =
        'inline-flex items-center justify-center p-1 rounded-full text-[#B8923A] hover:text-[#7A5A12] hover:bg-[#F3EAD7]/70 transition-colors cursor-pointer';
    }
  } else if (triggerVariant === 'badge') {
    triggerClasses =
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border cursor-pointer transition-all ' +
      (tone === 'dark'
        ? 'bg-[#201A15] border-[#C9A54B]/40 text-[#F1D98B] hover:bg-[#2A221C]'
        : 'bg-[#FBF8F2] border-[#E2D8C9] text-[#7A5A12] hover:border-[#B8923A] hover:bg-white shadow-2xs');
  } else if (triggerVariant === 'chip') {
    triggerClasses =
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-[#7A5A12] hover:text-[#1A1410] hover:underline cursor-pointer';
  } else {
    triggerClasses =
      'inline-flex items-center gap-1 text-xs text-[#7A5A12] hover:text-[#1A1410] underline underline-offset-2 font-medium cursor-pointer transition-colors';
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${triggerClasses} ${className}`}
        title="What is a tola? Official bullion standard guide & converter"
        aria-label="What is a tola? Open bullion weight guide"
      >
        <Info style={{ width: iconSize, height: iconSize }} className="shrink-0 stroke-[2.2]" />
        {triggerVariant !== 'icon' && <span>{label}</span>}
      </button>

      {/* Accessible Modal Popover */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tola-guide-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            ref={modalRef}
            className="relative w-full max-w-xl bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-[#1A1410] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#12100E] via-[#1E1712] to-[#12100E] text-[#FBF8F2] p-5 sm:p-6 flex items-start justify-between border-b border-[#C9A54B]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A54B] to-[#F1D98B] flex items-center justify-center text-[#1A1410] shadow-xs">
                  <Scale className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F1D98B]">
                      Official Bullion Standard
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h2 id="tola-guide-title" className="font-serif text-xl sm:text-2xl font-bold text-white">
                    What is a Tola?
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close tola guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Primary Standard Statement */}
              <div className="p-4 rounded-xl bg-white border border-[#B8923A]/40 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-[#7A5A12] font-semibold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#C9A54B]" />
                  <span>The Benchmark Rule</span>
                </div>
                <p className="font-serif text-base sm:text-lg text-[#1A1410] font-medium leading-snug">
                  Our tola = <strong className="text-[#7A5A12] font-bold">11.6638 grams</strong> (the standard used by the Pakistan bullion market, the same across all provinces including Khyber Pakhtunkhwa, Punjab, Sindh and Balochistan).
                </p>
              </div>

              {/* Live Tola & Gram Converter */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F3EAD7]/60 border border-[#E2D8C9] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7A5A12] flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Weight Converter (11.6638 g standard)
                  </span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E2D8C9] text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setConverterMode('gramsToTola');
                        setInputValue('11.6638');
                      }}
                      className={`px-2 py-1 rounded cursor-pointer font-medium transition-colors ${
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
                      className={`px-2 py-1 rounded cursor-pointer font-medium transition-colors ${
                        converterMode === 'tolaToGrams'
                          ? 'bg-[#B8923A] text-white shadow-xs'
                          : 'text-[#5C5046] hover:text-[#1A1410]'
                      }`}
                    >
                      tola → g
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5046]">
                      {converterMode === 'gramsToTola' ? 'Enter Grams (g)' : 'Enter Tola'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E2D8C9] rounded-lg text-sm font-mono font-bold text-[#1A1410] outline-none focus:border-[#B8923A]"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-[#7A5A12] font-semibold">
                        {converterMode === 'gramsToTola' ? 'g' : 'tola'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5046]">
                      {converterMode === 'gramsToTola' ? 'Calculated Tola' : 'Calculated Grams'}
                    </label>
                    <div className="px-3.5 py-2.5 bg-white border border-[#B8923A]/40 rounded-lg text-sm font-mono font-bold text-[#7A5A12] flex items-center justify-between">
                      <span>
                        {converterMode === 'gramsToTola'
                          ? `${convertedTolas.toFixed(4)} tola`
                          : `${convertedGrams.toFixed(4)} g`}
                      </span>
                      <Check className="w-4 h-4 text-[#B8923A]" />
                    </div>
                  </div>
                </div>

                {converterMode === 'gramsToTola' && numInput > 0 && (
                  <div className="text-[11px] text-[#5C5046] font-medium pt-1 flex items-center justify-between">
                    <span>
                      Traditional breakdown: <strong>{Math.floor(convertedTolas)} tola, {mashaVal} masha, {rattiVal.toFixed(1)} ratti</strong>
                    </span>
                    <span className="text-[#7A5A12]">Zero rounding loss</span>
                  </div>
                )}
              </div>

              {/* Clean Comparison Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5046]">
                  Regional Bullion Standards
                </h3>
                <div className="border border-[#E2D8C9] rounded-xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F3EAD7]/50 border-b border-[#E2D8C9] text-[11px] font-semibold text-[#7A5A12] uppercase tracking-wider">
                        <th className="py-2.5 px-4">Market / Region</th>
                        <th className="py-2.5 px-4 text-right">Standard Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2D8C9]/70 text-xs">
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#1A1410]">
                          Pakistan (all provinces: KP, Punjab, Sindh, Balochistan)
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#7A5A12] text-right">
                          11.6638 g
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#1A1410]">India, Nepal</td>
                        <td className="py-2.5 px-4 font-mono text-[#1A1410] text-right">11.6638 g</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#1A1410]">
                          UAE and Gulf gold markets
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#1A1410] text-right">11.6638 g</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#1A1410]">Bangladesh vori</td>
                        <td className="py-2.5 px-4 font-mono text-[#1A1410] text-right">about 11.664 g</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Traditional Units Box */}
              <div className="p-4 rounded-xl bg-white border border-[#E2D8C9] space-y-2.5 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A5A12]">
                  Traditional units
                </h3>
                <ul className="space-y-1.5 text-xs text-[#4A3F35] font-light">
                  <li className="flex items-center justify-between">
                    <span>1 tola</span>
                    <strong className="font-mono text-[#1A1410]">12 masha (about 0.972 g each)</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>1 masha</span>
                    <strong className="font-mono text-[#1A1410]">8 ratti (about 0.1215 g each)</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>1 tola</span>
                    <strong className="font-mono text-[#1A1410]">0.375 troy ounce</strong>
                  </li>
                </ul>
              </div>

              {/* Note on Rounding & Verification */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#B8923A]/40 text-xs text-[#5C5046] leading-relaxed">
                <span className="font-semibold text-[#1A1410] block mb-0.5">Verification Guarantee:</span>
                Some traders round a tola to 10 g or 12 g. We always use 11.6638 g, so you can verify any weight.
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#F3EAD7]/50 border-t border-[#E2D8C9] flex items-center justify-between">
              <span className="text-[11px] text-[#7A5A12] font-semibold">
                Sona Chandi Gold Collection · Transparent Live Pricing
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#1A1410] text-white hover:bg-[#7A5A12] text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
