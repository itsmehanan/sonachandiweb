import React from 'react';
import { MessageCircle, Shield, Clock, MapPin, Sparkles, Scale, RefreshCw } from 'lucide-react';
import { getSettings, getStoreStatus } from '../data/store';
import { BullionRates, formatPKR } from '../lib/pricing';

interface FooterProps {
  rates: BullionRates;
  onNavigate: (view: string, filter?: string) => void;
  onOpenCalculator: () => void;
  onReplayIntro: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  rates,
  onNavigate,
  onOpenCalculator,
  onReplayIntro,
}) => {
  const settings = getSettings();
  const storeStatus = getStoreStatus();

  return (
    <footer className="bg-[#12100E] text-[#E2D8C9] border-t border-[#292420] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#292420]">
          {/* Column 1: Brand & Logo (Gold & White logo on dark background) */}
          <div className="space-y-4">
            <img
              src="/public/assets/aistudio/logo-dark_226850da.png"
              alt="Sona & Chandi Gold Collection"
              className="h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs text-[#A89F91] leading-relaxed font-light">
              Fine Pakistani jewellery, artisanal bridal wear, and transparent bullion trading.
              Purity certified in 24K, 22K, 21K, 18K gold and 925 sterling silver.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#12100E] bg-[#C9A54B] hover:bg-[#D8B74E] rounded-md transition-all shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: +92 310 9412332</span>
              </a>
            </div>
          </div>

          {/* Column 2: Collections & Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-[#A89F91]">
              <li>
                <button
                  onClick={() => onNavigate('catalogue', 'bridal_sets')}
                  className="hover:text-[#C9A54B] transition-colors"
                >
                  Bridal Choker &amp; Rani Haar Sets
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalogue', 'bangles')}
                  className="hover:text-[#C9A54B] transition-colors"
                >
                  22K Embossed Kara &amp; Bangles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalogue', 'earrings')}
                  className="hover:text-[#C9A54B] transition-colors"
                >
                  Traditional Kundan &amp; Polki Jhumkas
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalogue', 'rings')}
                  className="hover:text-[#C9A54B] transition-colors"
                >
                  Solitaire Bands &amp; Signet Rings
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalogue', 'silver')}
                  className="hover:text-[#C9A54B] transition-colors"
                >
                  925 Solid Sterling Silver Collection
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Showroom Hours & Sarafa Rate */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Showroom Hours &amp; Rates
            </h4>
            <div className="space-y-2 text-xs text-[#A89F91]">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#C9A54B] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Mon – Sat: 9:00 AM – 9:00 PM PKT</p>
                  <p className="text-[#A89F91]">Sunday: Closed</p>
                  <p className="text-[11px] text-[#C9A54B] mt-0.5">
                    Currently: {storeStatus.statusLabel} ({storeStatus.currentTimePkt})
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#292420]">
                <p className="text-[11px] text-[#A89F91]">
                  Current 24K: <span className="font-mono text-white font-medium">{formatPKR(rates.gold24KPerTola)} / tola</span>
                </p>
                <button
                  onClick={onOpenCalculator}
                  className="mt-1 text-xs text-[#C9A54B] hover:underline flex items-center gap-1"
                >
                  <Scale className="w-3 h-3" />
                  <span>Open Bullion Rate Calculator</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 4: Marked Placeholders & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Boutique Location
            </h4>
            <div className="text-xs text-[#A89F91] space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C9A54B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-[#C9A54B] font-semibold uppercase tracking-wider">
                    Storefront Address (Placeholder):
                  </p>
                  <p className="font-light text-[#D4CDC3] leading-relaxed">
                    {settings.addressPlaceholder}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('contact')}
                  className="text-xs text-[#C9A54B] hover:text-[#D8B74E] underline"
                >
                  View Showroom Pickup Branches &amp; Policies
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A8174]">
          <p>© {new Date().getFullYear()} Sona &amp; Chandi Gold Collection. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('about')}
              className="hover:text-white transition-colors"
            >
              Hallmarking Guarantee
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => onNavigate('contact')}
              className="hover:text-white transition-colors"
            >
              Store Policies
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={onReplayIntro}
              className="hover:text-[#C9A54B] transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Replay Intro</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => onNavigate('admin')}
              className="hover:text-[#C9A54B] transition-colors"
            >
              Staff Portal (/admin)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
