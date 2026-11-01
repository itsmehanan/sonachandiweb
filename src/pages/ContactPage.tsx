import React from 'react';
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Building,
} from 'lucide-react';
import { getSettings, getStoreStatus } from '../data/store';
import { ESTIMATE_DISCLAIMER } from '../lib/pricing';

export const ContactPage: React.FC = () => {
  const settings = getSettings();
  const storeStatus = getStoreStatus();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8E6E24]">
          Showroom &amp; Inquiries
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1B18] font-normal tracking-tight">
          Visit Us or Inquire on WhatsApp
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] font-light leading-relaxed">
          We welcome you for private bridal appointments, bullion bookings, and custom design consultations.
        </p>
      </div>

      {/* Showroom Status & Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Store Hours Card */}
        <div className="p-6 bg-white border border-[#E2D8C9] rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
              <Clock className="w-5 h-5" />
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                storeStatus.isOpen
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  storeStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{storeStatus.statusLabel}</span>
            </span>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-[#1E1B18]">Showroom Timings</h3>
            <p className="text-xs text-[#64748B] mt-1">{storeStatus.subtext}</p>
          </div>

          <div className="space-y-2 text-xs border-t border-[#F3EFEA] pt-3 text-[#64748B]">
            <div className="flex justify-between">
              <span className="font-medium text-[#1E1B18]">Monday – Saturday:</span>
              <span className="font-mono">9:00 AM – 9:00 PM PKT</span>
            </div>
            <div className="flex justify-between text-rose-700">
              <span className="font-medium">Sunday:</span>
              <span>Closed for Family Day</span>
            </div>
            <div className="pt-2 text-[11px] text-[#8E6E24] font-light">
              *Pakistan Standard Time (PKT, UTC+5)
            </div>
          </div>
        </div>

        {/* WhatsApp & Direct Orders */}
        <div className="p-6 bg-white border border-[#E2D8C9] rounded-2xl space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-emerald-600">
            <MessageCircle className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-[#1E1B18]">
              WhatsApp Direct Sales Desk
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Live quotes, custom orders &amp; bullion rate confirmations
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gold-sheen w-full py-3 px-4 bg-[#C9A54B] hover:bg-[#B18D35] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open WhatsApp: +92 310 9412332</span>
            </a>

            <div className="p-2.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-xs text-[#64748B]">
              <span className="font-semibold text-[#1E1B18] block">Telephone Desk (Placeholder):</span>
              <span className="font-mono">{settings.phonePlaceholder}</span>
            </div>
          </div>
        </div>

        {/* Flagship Showroom Location */}
        <div className="p-6 bg-white border border-[#E2D8C9] rounded-2xl space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#C9A54B]/30 flex items-center justify-center text-[#8E6E24]">
            <MapPin className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-[#1E1B18]">Flagship Showroom</h3>
            <p className="text-xs text-[#8E6E24] font-medium mt-0.5">Lahore Gold Souk</p>
          </div>

          <div className="p-3 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-xs text-[#64748B] space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E6E24] block">
              Marked Placeholder Address:
            </span>
            <p className="font-light text-[#1E1B18] leading-relaxed">
              {settings.addressPlaceholder}
            </p>
          </div>

          <p className="text-[11px] text-[#64748B] italic">
            *Valet parking and private security escorts provided for bridal viewing.
          </p>
        </div>
      </div>

      {/* Pickup Showrooms in Other Cities */}
      <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 sm:p-10 space-y-6">
        <div>
          <h2 className="font-serif text-2xl text-[#1E1B18] font-normal">
            Store Pickup Showroom Branches
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-light">
            When ordering through WhatsApp, you may select any of our verified partner branches for in-person inspection and pickup
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {settings.pickupBranches.map((branch) => (
            <div
              key={branch.name}
              className="p-5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl space-y-2"
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#8E6E24]" />
                <h4 className="font-serif text-base font-semibold text-[#1E1B18]">
                  {branch.name}
                </h4>
              </div>
              <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#8E6E24]">
                {branch.city}
              </span>
              <p className="text-xs text-[#64748B] font-light leading-relaxed">
                {branch.addressPlaceholder}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Store Policies Section */}
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal">
            Official Store Policies &amp; Terms
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-light">
            Clearly marked placeholder policies governing our trade, transit, and pricing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Policy 1: Bullion Price Disclaimer */}
          <div className="p-6 bg-white border border-[#E2D8C9] rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-[#8E6E24]">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Price Estimate Policy
              </h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              "{ESTIMATE_DISCLAIMER}"
            </p>
            <p className="text-xs text-[#64748B] leading-relaxed font-light">
              Bullion markets fluctuate continuously. Our website rates reflect prevailing Lahore &amp; Karachi
              Sarafa Association benchmarks. When you click "Order on WhatsApp", our sales team confirms the exact
              live market rate per gram before your transaction is formalized.
            </p>
          </div>

          {/* Policy 2: Hallmark Guarantee */}
          <div className="p-6 bg-white border border-[#E2D8C9] rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-[#8E6E24]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Hallmark &amp; Purity Standards
              </h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed font-light">
              {settings.policies.hallmarkPolicy}
            </p>
          </div>

          {/* Policy 3: Return & Exchange */}
          <div className="p-6 bg-white border border-[#E2D8C9] rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-[#8E6E24]">
              <RotateCcw className="w-5 h-5" />
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Return, Exchange &amp; Buyback
              </h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed font-light">
              {settings.policies.exchangePolicy}
            </p>
          </div>

          {/* Policy 4: Nationwide Insured Delivery */}
          <div className="p-6 bg-white border border-[#E2D8C9] rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-[#8E6E24]">
              <Truck className="w-5 h-5" />
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Courier Fulfilment &amp; Security
              </h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed font-light">
              {settings.policies.shippingPolicy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
