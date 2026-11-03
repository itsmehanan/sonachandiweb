import React from 'react';
import { Calculator } from 'lucide-react';
import { BullionRates, formatPKR, getGoldPerGramForKarat } from '../lib/pricing';
import { getStoreStatus } from '../data/store';

interface LiveRateStripProps {
  rates: BullionRates;
  onOpenCalculator: () => void;
}

export const LiveRateStrip: React.FC<LiveRateStripProps> = ({ rates, onOpenCalculator }) => {
  const storeStatus = getStoreStatus();
  const hasGoldRate = rates.gold24KPerTola > 0;
  const hasSilverRate = rates.silverRate > 0;
  const gold22KGram = hasGoldRate ? getGoldPerGramForKarat('22K', rates.gold24KPerTola) : 0;

  return (
    <div className="bg-[#FAF7F2]/90 backdrop-blur-xs border-b border-[#E2D8C9] text-xs py-2 px-4 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Left: Bullion Rates Ticker */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-[#1E1B18]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[#8E6E24] uppercase tracking-wider font-semibold text-[11px]">
              24K Gold / Tola:
            </span>
            <span className="font-mono font-bold text-[#1E1B18]">
              {hasGoldRate ? formatPKR(rates.gold24KPerTola) : 'Rate unavailable'}
            </span>
          </div>

          <span className="text-[#CBD5E1] hidden sm:inline" aria-hidden="true">
            ·
          </span>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[#8E6E24] uppercase tracking-wider font-semibold text-[11px]">
              22K / Gram:
            </span>
            <span className="font-mono text-[#1E1B18]">
              {hasGoldRate ? formatPKR(gold22KGram) : 'Rate unavailable'}
            </span>
          </div>

          <span className="text-[#CBD5E1] hidden sm:inline" aria-hidden="true">
            ·
          </span>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[#64748B] uppercase tracking-wider font-semibold text-[11px]">
              Silver ({rates.silverUnit === 'per_tola' ? 'Tola' : 'Gram'}):
            </span>
            <span className="font-mono text-[#1E1B18]">
              {hasSilverRate ? formatPKR(rates.silverRate) : 'Rate unavailable'}
            </span>
          </div>

          {rates.lastUpdated ? (
            <>
              <span className="text-[#CBD5E1] hidden lg:inline" aria-hidden="true">
                ·
              </span>
              <span className="text-[11px] text-[#64748B] hidden lg:inline">
                {rates.lastUpdated}
              </span>
            </>
          ) : null}
        </div>

        {/* Right: Store Hours Status + Calculator trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Store Hours Indicator */}
          <div
            className="flex items-center gap-1.5 text-[11px] text-[#64748B] bg-white border border-[#E2D8C9] px-2.5 py-0.5 rounded-full"
            title={`${storeStatus.statusLabel} - ${storeStatus.subtext}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                storeStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-[#1E1B18]">{storeStatus.statusLabel}</span>
            <span className="hidden sm:inline text-[#94A3B8]">({storeStatus.currentTimePkt})</span>
          </div>

          {/* Quick Rate Calculator Trigger */}
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#8E6E24] hover:text-[#1E1B18] bg-white hover:bg-[#FAF7F2] border border-[#C9A54B]/40 hover:border-[#C9A54B] rounded transition-all shadow-2xs cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Rate Calculator</span>
          </button>
        </div>
      </div>
    </div>
  );
};
