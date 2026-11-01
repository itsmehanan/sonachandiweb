import React, { useState } from 'react';
import { X, Calculator, Sparkles, Scale, Info } from 'lucide-react';
import {
  BullionRates,
  get24KGoldPerGram,
  getGoldPerGramForKarat,
  getSilverPerGram,
  gramsToTola,
  formatPKR,
  GoldKarat,
  ESTIMATE_DISCLAIMER,
} from '../lib/pricing';

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: BullionRates;
}

export const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({
  isOpen,
  onClose,
  rates,
}) => {
  const [metal, setMetal] = useState<'gold' | 'silver'>('gold');
  const [goldKarat, setGoldKarat] = useState<GoldKarat>('22K');
  const [weightGrams, setWeightGrams] = useState<number>(10);
  const [makingType, setMakingType] = useState<'per_gram' | 'fixed'>('per_gram');
  const [makingAmount, setMakingAmount] = useState<number>(1200);

  if (!isOpen) return null;

  // Perform price calculation strictly using pricing.ts functions
  const perGramMetal =
    metal === 'gold'
      ? getGoldPerGramForKarat(goldKarat, rates.gold24KPerTola)
      : getSilverPerGram(rates.silverRate, rates.silverUnit);

  const baseMetal = (weightGrams || 0) * perGramMetal;
  const makingTotal =
    makingType === 'fixed'
      ? Number(makingAmount) || 0
      : (Number(makingAmount) || 0) * (weightGrams || 0);

  const grandTotal = Math.round(baseMetal + makingTotal);
  const tolaInfo = gramsToTola(weightGrams || 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calc-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-[#FAF7F2] border border-[#E2D8C9] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden text-[#1E1B18]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2D8C9] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#C9A54B]">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 id="calc-modal-title" className="font-serif text-lg font-semibold text-[#1E1B18]">
                Bullion Rate &amp; Price Calculator
              </h2>
              <p className="text-xs text-[#64748B]">Live Sarafa Association market formulas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#1E1B18] rounded-md transition-colors"
            aria-label="Close calculator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Metal Switch */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Select Metal
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F3EFEA] rounded-lg">
              <button
                type="button"
                onClick={() => setMetal('gold')}
                className={`py-2 text-xs font-semibold rounded-md transition-all ${
                  metal === 'gold'
                    ? 'bg-white text-[#8E6E24] shadow-xs border border-[#C9A54B]/30'
                    : 'text-[#64748B] hover:text-[#1E1B18]'
                }`}
              >
                Gold (Sona)
              </button>
              <button
                type="button"
                onClick={() => setMetal('silver')}
                className={`py-2 text-xs font-semibold rounded-md transition-all ${
                  metal === 'silver'
                    ? 'bg-white text-[#475569] shadow-xs border border-slate-300'
                    : 'text-[#64748B] hover:text-[#1E1B18]'
                }`}
              >
                Silver (Chandi)
              </button>
            </div>
          </div>

          {/* Karat Selection (if gold) */}
          {metal === 'gold' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
                Gold Karat Purity
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['24K', '22K', '21K', '18K'] as GoldKarat[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setGoldKarat(k)}
                    className={`py-2 text-xs font-medium rounded-md border transition-all ${
                      goldKarat === k
                        ? 'bg-[#C9A54B] text-white border-[#B18D35] shadow-xs font-semibold'
                        : 'bg-white text-[#1E1B18] border-[#E2D8C9] hover:border-[#C9A54B]'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weight Input (Grams) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Gross Weight (Grams)
              </label>
              <span className="text-xs text-[#8E6E24] font-medium">
                ~ {tolaInfo.formattedTola} ({tolaInfo.traditional})
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={weightGrams || ''}
                onChange={(e) => setWeightGrams(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white border border-[#E2D8C9] focus:border-[#C9A54B] rounded-lg text-sm text-[#1E1B18] outline-none"
                placeholder="e.g. 11.66"
              />
              <span className="absolute right-4 top-2.5 text-xs text-[#64748B] font-medium">
                grams
              </span>
            </div>
          </div>

          {/* Making Charge */}
          <div className="p-4 bg-white border border-[#E2D8C9] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1E1B18]">Making Charge</label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMakingType('per_gram');
                    setMakingAmount(1200);
                  }}
                  className={`px-2 py-1 rounded transition-colors ${
                    makingType === 'per_gram'
                      ? 'bg-[#FAF7F2] text-[#8E6E24] font-semibold border border-[#C9A54B]/30'
                      : 'text-[#64748B]'
                  }`}
                >
                  Per Gram
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMakingType('fixed');
                    setMakingAmount(5000);
                  }}
                  className={`px-2 py-1 rounded transition-colors ${
                    makingType === 'fixed'
                      ? 'bg-[#FAF7F2] text-[#8E6E24] font-semibold border border-[#C9A54B]/30'
                      : 'text-[#64748B]'
                  }`}
                >
                  Fixed Amount
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-[#64748B]">Rs.</span>
              <input
                type="number"
                min="0"
                step="50"
                value={makingAmount || ''}
                onChange={(e) => setMakingAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-16 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-xs text-[#1E1B18] outline-none"
              />
              <span className="absolute right-3 top-2 text-xs text-[#64748B]">
                {makingType === 'per_gram' ? '/ gram' : 'total'}
              </span>
            </div>
          </div>

          {/* Breakdown Results */}
          <div className="p-4 bg-[#F7F0DC]/40 border border-[#C9A54B]/30 rounded-lg space-y-2">
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>Current Per Gram Rate:</span>
              <span className="font-mono text-[#1E1B18] font-medium">
                {formatPKR(perGramMetal)} / g
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>Base Metal Price ({weightGrams}g):</span>
              <span className="font-mono text-[#1E1B18] font-medium">
                {formatPKR(baseMetal)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>Making Charge ({makingType === 'per_gram' ? `${makingAmount}/g` : 'Fixed'}):</span>
              <span className="font-mono text-[#1E1B18] font-medium">
                {formatPKR(makingTotal)}
              </span>
            </div>
            <div className="pt-2 border-t border-[#C9A54B]/30 flex justify-between items-baseline">
              <span className="text-xs uppercase font-bold text-[#8E6E24] tracking-wider">
                Estimated Total:
              </span>
              <span className="font-serif text-xl font-bold text-[#1E1B18]">
                {formatPKR(grandTotal)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#64748B] italic leading-tight">
            *{ESTIMATE_DISCLAIMER}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E2D8C9] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#C9A54B] hover:bg-[#B18D35] rounded-md transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
