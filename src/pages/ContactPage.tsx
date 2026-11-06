import React from 'react';
import {
  Clock,
  MapPin,
  MessageCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { getSettings, getStoreStatus } from '../data/store';
import { ESTIMATE_DISCLAIMER } from '../lib/pricing';
import { WhatsAppButton } from '../components/WhatsAppButton';
import {
  StaggerGrid,
  StaggerItem,
  SectionHeading,
} from '../components/motion/MotionUtils';

export const ContactPage: React.FC = () => {
  const settings = getSettings();
  const storeStatus = getStoreStatus();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-28 space-y-20">
      {/* Header */}
      <SectionHeading
        kicker="Showroom & Inquiries"
        title="Visit Us or Inquire on WhatsApp"
        subtitle="We welcome you for private bridal appointments, bullion bookings, and custom design consultations."
      />

      {/* Showroom Status & Contact Grid */}
      <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Store Hours Card */}
        <StaggerItem>
          <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <Clock className="w-6 h-6" />
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
                <h3 className="font-serif text-xl font-semibold text-[#1A1410]">Showroom Timings</h3>
                <p className="text-xs text-[#5C5046] mt-1">{storeStatus.subtext}</p>
              </div>

              <div className="space-y-2.5 text-xs border-t border-[#E2D8C9] pt-4 text-[#5C5046]">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#1A1410]">Monday – Saturday:</span>
                  <span className="font-mono text-[#1A1410]">9:00 AM – 9:00 PM PKT</span>
                </div>
                <div className="flex justify-between items-center text-rose-800">
                  <span className="font-medium">Sunday:</span>
                  <span>Closed for Family Day</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#7A5A12] font-medium pt-2">
              *Pakistan Standard Time (PKT, UTC+5)
            </div>
          </div>
        </StaggerItem>

        {/* WhatsApp & Direct Inquiries */}
        <StaggerItem>
          <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#E8F8EE] border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
                <MessageCircle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-serif text-xl font-semibold text-[#1A1410]">
                  WhatsApp Sales Desk
                </h3>
                <p className="text-xs text-[#5C5046] mt-1">
                  Live quotes, custom orders &amp; bullion rate confirmations
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <WhatsAppButton
                href={`https://wa.me/${settings.whatsappNumber}`}
                label={`Chat on WhatsApp`}
                fullWidth
                size="lg"
              />

              <div className="p-3 bg-[#F3EAD7]/60 border border-[#E2D8C9] rounded-xl text-xs text-[#5C5046]">
                <span className="font-semibold text-[#1A1410] block">Instant Inquiry Support:</span>
                <span>Available Monday to Saturday during showroom hours.</span>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Showroom Location */}
        <StaggerItem>
          <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                <MapPin className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-serif text-xl font-semibold text-[#1A1410]">Boutique Location</h3>
                <p className="text-xs text-[#7A5A12] font-semibold mt-0.5">Physical Showroom &amp; Order Pickup</p>
              </div>

              <div className="p-3.5 bg-[#F3EAD7]/60 border border-[#E2D8C9] rounded-xl text-xs text-[#1A1410] leading-relaxed">
                {settings.address ? (
                  <p className="font-normal text-[#1A1410] leading-relaxed">
                    {settings.address}
                  </p>
                ) : (
                  <p className="text-[#5C5046] leading-relaxed italic">
                    Contact us on WhatsApp to arrange private appointments and showroom pickup.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <WhatsAppButton
                href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                  'Assalam-o-Alaikum, I would like to book a private showroom appointment.'
                )}`}
                label="Book Appointment"
                size="sm"
                fullWidth
              />
            </div>
          </div>
        </StaggerItem>
      </StaggerGrid>

      {/* Store Policies Section */}
      <div className="space-y-12">
        <SectionHeading
          kicker="Transparent Standards"
          title="Store Policies &amp; Terms"
          subtitle="Transparent policies governing our trade, transit, and pricing"
        />

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Policy 1: Bullion Price Disclaimer */}
          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-3 shadow-sm hover:border-[#B8923A] transition-all">
              <div className="flex items-center gap-2.5 text-[#7A5A12]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-serif text-lg font-semibold text-[#1A1410]">
                  Price Estimate Policy
                </h3>
              </div>
              <p className="text-xs text-[#5C5046] leading-relaxed font-semibold italic">
                "{ESTIMATE_DISCLAIMER}"
              </p>
              <p className="text-xs sm:text-sm text-[#5C5046] leading-relaxed">
                Bullion markets fluctuate continuously. When you tap "Order on WhatsApp", our sales desk confirms the exact
                live market rate per gram before your transaction is formalized.
              </p>
            </div>
          </StaggerItem>

          {/* Policy 2: Purity & Bullion Standards */}
          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-3 shadow-sm hover:border-[#B8923A] transition-all">
              <div className="flex items-center gap-2.5 text-[#7A5A12]">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h3 className="font-serif text-lg font-semibold text-[#1A1410]">
                  Purity &amp; Metal Standards
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#5C5046] leading-relaxed">
                {settings.policies?.hallmarkPolicy ||
                  'Gold and silver jewellery priced from live market rates with exact karat and weight specifications.'}
              </p>
            </div>
          </StaggerItem>

          {/* Policy 3: Return & Exchange */}
          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-3 shadow-sm hover:border-[#B8923A] transition-all">
              <div className="flex items-center gap-2.5 text-[#7A5A12]">
                <RotateCcw className="w-5 h-5 shrink-0" />
                <h3 className="font-serif text-lg font-semibold text-[#1A1410]">
                  Return, Exchange &amp; Buyback
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#5C5046] leading-relaxed">
                {settings.policies?.exchangePolicy ||
                  'Bullion buyback and exchange available at prevailing daily net metal rates.'}
              </p>
            </div>
          </StaggerItem>

          {/* Policy 4: Nationwide Insured Delivery */}
          <StaggerItem>
            <div className="h-full p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-3 shadow-sm hover:border-[#B8923A] transition-all">
              <div className="flex items-center gap-2.5 text-[#7A5A12]">
                <Truck className="w-5 h-5 shrink-0" />
                <h3 className="font-serif text-lg font-semibold text-[#1A1410]">
                  Courier Fulfilment &amp; Security
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#5C5046] leading-relaxed">
                {settings.deliveryText ||
                  'Nationwide insured courier transit with tamper-evident security packing across Pakistan.'}
              </p>
            </div>
          </StaggerItem>
        </StaggerGrid>
      </div>
    </div>
  );
};
