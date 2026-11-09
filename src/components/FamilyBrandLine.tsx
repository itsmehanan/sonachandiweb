import React from 'react';
import { getSettings, StoreSettings } from '../data/store';

interface FamilyBrandLineProps {
  settings?: StoreSettings;
  /** When true, uses compact single-line styling with Noto Naskh Arabic to preserve exact header heights */
  isHeader?: boolean;
  /** 'light' for light backgrounds (antique gold #B8923A), 'dark' for dark backgrounds (rich gold #C9A54B) */
  variant?: 'light' | 'dark';
  className?: string;
}

export const FamilyBrandLine: React.FC<FamilyBrandLineProps> = ({
  settings,
  isHeader = false,
  variant = 'light',
  className = '',
}) => {
  const currentSettings = settings || getSettings();
  const en = currentSettings.familyLineEn !== undefined ? currentSettings.familyLineEn : 'Imtiyaz & Sons';
  const ur = currentSettings.familyLineUr !== undefined ? currentSettings.familyLineUr : 'امتیاز اینڈ سنز';

  const trimmedEn = en?.trim();
  const trimmedUr = ur?.trim();

  // Hide the line when both are empty
  if (!trimmedEn && !trimmedUr) return null;

  const textColor = variant === 'dark' ? 'text-[#C9A54B]' : 'text-[#B8923A]';

  if (isHeader) {
    return (
      <div
        className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] leading-none font-medium ${textColor} ${className}`}
      >
        {trimmedEn && (
          <span className="tracking-[0.16em] uppercase font-sans font-medium whitespace-nowrap">
            {trimmedEn}
          </span>
        )}
        {trimmedEn && trimmedUr && (
          <span className="opacity-40 select-none text-[8px]" aria-hidden="true">
            •
          </span>
        )}
        {trimmedUr && (
          <span
            lang="ur"
            dir="rtl"
            style={{ fontFamily: "'Noto Naskh Arabic', serif" }}
            className="text-[10px] sm:text-[11px] leading-none font-normal"
          >
            {trimmedUr}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${textColor} ${className}`}
    >
      {trimmedEn && (
        <span className="tracking-[0.16em] uppercase font-sans font-medium text-[11px] sm:text-xs">
          {trimmedEn}
        </span>
      )}
      {trimmedEn && trimmedUr && (
        <span className="opacity-40 select-none text-[9px]" aria-hidden="true">
          •
        </span>
      )}
      {trimmedUr && (
        <span
          lang="ur"
          dir="rtl"
          style={{ fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: 1.8 }}
          className="text-xs sm:text-sm font-normal inline-block pt-0.5"
        >
          {trimmedUr}
        </span>
      )}
    </div>
  );
};
