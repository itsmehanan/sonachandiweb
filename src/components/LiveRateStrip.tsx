import React from 'react';
import { Sparkles } from 'lucide-react';
import { BullionRates, formatPKR } from '../lib/pricing';
import { getSettings, getStoreStatus } from '../data/store';
import { TolaGuide } from './TolaGuide';

import { useNumberCountUp } from './motion/MotionUtils';

interface LiveRateStripProps {
  rates: BullionRates;
  onOpenCalculator: () => void;
}

export const LiveRateStrip: React.FC<LiveRateStripProps> = ({ rates, onOpenCalculator }) => {
  const settings = getSettings();
  const storeStatus = getStoreStatus();
  const animated24kRate = useNumberCountUp(rates.gold24KPerTola, 600);

  const hasWhatsapp = Boolean(settings.whatsappNumber && settings.whatsappNumber.trim());
  const hasHours = Boolean(settings.storeHoursDescription && settings.storeHoursDescription.trim());

  // Build items array so dividers only appear between visible pieces
  const leftItems: React.ReactNode[] = [];

  if (hasWhatsapp) {
    leftItems.push(
      <span key="whatsapp" className="inline-flex items-center gap-1">
        <span className="text-[#A89F91]">Order on WhatsApp:</span>{' '}
        <a
          href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#F1D98B] hover:text-white transition-colors font-medium underline-offset-2 hover:underline"
        >
          {settings.whatsappNumber}
        </a>
      </span>
    );
  }

  if (hasHours) {
    leftItems.push(
      <span key="hours" className="text-[#D6CBB8]">
        {settings.storeHoursDescription}
      </span>
    );
  }

  // Open / Closed badge calculated from hours
  leftItems.push(
    <span
      key="status-badge"
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#201A15] border border-[#C9A54B]/30"
      title={storeStatus.subtext}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          storeStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
        }`}
        aria-hidden="true"
      />
      <span className={storeStatus.isOpen ? 'text-emerald-300' : 'text-amber-200'}>
        {storeStatus.isOpen ? 'Open now' : 'Closed'}
      </span>
    </span>
  );

  return (
    <div className="bg-[#12100E] border-b border-[#29221B] text-[#C9A54B] text-[11px] sm:text-xs py-1.5 px-4 select-none transition-colors">
      <div className="max-w-[1280px] mx-auto px-0 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4">
        {/* Left: WhatsApp, Hours, and Open/Closed status */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1">
          {leftItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="text-[#3E342B] select-none" aria-hidden="true">
                  |
                </span>
              )}
              {item}
            </React.Fragment>
          ))}
        </div>

        {/* Right: Live Rates Trigger opening Price Estimator */}
        <div className="shrink-0 flex items-center">
          <button
            type="button"
            onClick={onOpenCalculator}
            className="inline-flex items-center gap-1.5 text-[#F1D98B] hover:text-white transition-colors cursor-pointer group focus-visible:ring-1 focus-visible:ring-[#C9A54B] outline-hidden rounded px-2 py-0.5"
            title="Open Price Estimator & Live Bullion Rates"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A54B] group-hover:scale-110 transition-transform" />
            <span className="font-medium underline-offset-2 group-hover:underline">Live Rates</span>
            {rates.gold24KPerTola > 0 && (
              <span className="font-serif tabular-nums text-[11px] font-bold text-[#F1D98B]/90 hidden md:inline ml-1">
                (24K: {formatPKR(animated24kRate)}/tola)
              </span>
            )}
          </button>
          <TolaGuide triggerVariant="badge" label="What is a tola?" tone="dark" className="ml-2 hidden sm:inline-flex" />
          <TolaGuide triggerVariant="icon" tone="dark" className="inline-flex sm:hidden ml-1" />
        </div>
      </div>
    </div>
  );
};
