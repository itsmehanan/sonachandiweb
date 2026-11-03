import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  Store,
  ShieldCheck,
  Scale,
  Maximize2,
  Info,
  AlertCircle,
  Sparkles,
  Gem,
  Award,
  Layers,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import { Product, getProducts, getSettings } from '../data/store';
import {
  BullionRates,
  calculateProductPrice,
  gramsToTola,
  getWhatsAppProductInquiryUrl,
  ESTIMATE_DISCLAIMER,
  formatPKR,
} from '../lib/pricing';
import { LightboxModal } from '../components/LightboxModal';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppButton } from '../components/WhatsAppButton';

interface ProductDetailPageProps {
  product: Product;
  rates: BullionRates;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenCalculator: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  rates,
  onBack,
  onSelectProduct,
  onAddToCart,
  onOpenCalculator,
}) => {
  const settings = getSettings();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // Pricing math computed strictly via pricing.ts
  const isRateMissing =
    product.metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0;
  const isOutOfStock = (product.stock !== undefined && product.stock <= 0) || !product.inStock;

  const breakdown = calculateProductPrice(product, rates);
  const tolaInfo = gramsToTola(product.weightGrams);

  // Related products in same category or metal
  const relatedProducts = getProducts()
    .filter((p) => p.id !== product.id && (p.category === product.category || p.metal === product.metal))
    .slice(0, 4);

  const handleAddToCart = () => {
    if (isOutOfStock || isRateMissing) return;
    onAddToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleAskOnWhatsApp = () => {
    const note = isRateMissing
      ? `Rate inquiry for ${product.title} (SKU: ${product.sku}). Please provide live bullion quote.`
      : `Inquiry regarding ${product.title} (SKU: ${product.sku}). Please share availability and current live bullion rate confirmation.`;
    const url = getWhatsAppProductInquiryUrl(product, rates, note, settings.whatsappNumber);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentImage =
    product.images && product.images.length > 0
      ? product.images[selectedImageIndex] || product.images[0]
      : null;

  // Build authentic spec list based only on product's actual data
  const specList = [
    {
      icon: <Gem className="w-4 h-4 text-[#C9A54B]" />,
      label: 'Purity & Karat',
      value: product.specs.purity || `${product.karat} Pure`,
      sub: 'Benchmark bullion hallmarking',
    },
    {
      icon: <Scale className="w-4 h-4 text-[#C9A54B]" />,
      label: 'Gross Weight',
      value: `${product.weightGrams}g (~${tolaInfo.formattedTola})`,
      sub: `${tolaInfo.traditional} (1 tola = 11.6638g)`,
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-[#C9A54B]" />,
      label: 'Hallmark Stamp',
      value: product.specs.hallmarkStamp || 'Laser Inscribed',
      sub: 'Laser hallmarked authenticity',
    },
    {
      icon: <Sparkles className="w-4 h-4 text-[#C9A54B]" />,
      label: 'Making Charge Structure',
      value:
        product.makingCharge.type === 'fixed'
          ? `Fixed Fee: ${formatPKR(product.makingCharge.amount)}`
          : `Per Gram: Rs. ${product.makingCharge.amount} / gram`,
      sub: 'Transparent itemized fee; zero wastage surcharges',
    },
    {
      icon: <Clock className="w-4 h-4 text-[#C9A54B]" />,
      label: 'Availability',
      value: product.inStock ? 'In Stock (Ready to Ship)' : 'Made to Order / Reserved',
      sub: product.stock > 0 ? `${product.stock} pieces in stock` : 'Crafted upon confirmation',
    },
    ...(product.specs.craftsmanship
      ? [
          {
            icon: <Award className="w-4 h-4 text-[#C9A54B]" />,
            label: 'Crafting Technique',
            value: product.specs.craftsmanship,
            sub: 'Traditional Pakistani artistry',
          },
        ]
      : []),
    ...(product.specs.dimensionsOrSize
      ? [
          {
            icon: <Layers className="w-4 h-4 text-[#C9A54B]" />,
            label: 'Dimensions / Sizing',
            value: product.specs.dimensionsOrSize,
            sub: 'Adjustable fittings confirmed on WhatsApp',
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      {/* Top Bar: Back Button & Quiet Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#1E1B18] transition-colors cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B]">
          <span>Home</span>
          <span aria-hidden="true">/</span>
          <span className="capitalize">{product.category.replace('_', ' ')}</span>
          <span aria-hidden="true">/</span>
          <span className="font-mono text-[#1E1B18]">{product.sku}</span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Image Gallery with Smooth Thumbnails & Gold Ring */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/5] sm:aspect-square bg-[#F3EFEA]/80 backdrop-blur-xs rounded-2xl overflow-hidden border border-[#E2D8C9] shadow-sm group flex items-center justify-center">
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.title}
                loading="lazy"
                className="w-full h-full object-cover cursor-zoom-in transition-all duration-500 ease-out group-hover:scale-103"
                onClick={() => setLightboxOpen(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-[#C9A54B]/70 p-8 text-center">
                <Sparkles className="w-12 h-12 text-[#C9A54B]" />
                <span className="font-serif text-lg text-[#1E1B18]">Sona &amp; Chandi Gold Collection</span>
                <span className="text-xs text-[#64748B]">Handcrafted Pakistani Fine Jewellery</span>
              </div>
            )}

            {/* Click to Expand Lightbox Trigger */}
            {currentImage && (
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-white text-[#1E1B18] rounded-full shadow-md backdrop-blur-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:outline-none"
                aria-label="Enlarge image in lightbox"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {/* Purity Stamp Pill */}
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-xs rounded-lg border border-[#C9A54B]/40 shadow-xs text-xs font-mono font-semibold text-[#8E6E24]">
              {product.specs.hallmarkStamp}
            </div>
          </div>

          {/* Smooth Thumbnail Selection with Gold Ring */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
              {product.images.map((img, idx) => {
                const isActive = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-24 rounded-xl overflow-hidden transition-all duration-300 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A54B] ${
                      isActive
                        ? 'ring-2 ring-[#C9A54B] ring-offset-2 ring-offset-white border border-[#C9A54B] shadow-md scale-105'
                        : 'border border-[#E2D8C9] opacity-75 hover:opacity-100 hover:border-[#C9A54B]/60'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} angle ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Pricing, Trust Row & Purchase Module */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Karat Metadata */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <span className="font-mono text-[#1E1B18] font-medium">{product.sku}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#8E6E24] uppercase tracking-wider">
                {breakdown.karatLabel} {breakdown.metal}
              </span>
              <span aria-hidden="true">·</span>
              <span>{product.inStock ? 'Ready to Ship' : 'Made to Order'}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal leading-tight">
              {product.title}
            </h1>

            <p className="text-xs sm:text-sm text-[#64748B] font-light leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Estimated Price Card & Transparent Breakdown */}
          <div className="p-5 bg-white/85 backdrop-blur-md border border-[#E2D8C9] rounded-2xl space-y-4 shadow-xs">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8E6E24] block mb-1">
                Calculated Estimate (PKR)
              </span>
              <div className="flex items-baseline gap-3">
                {isRateMissing ? (
                  <span className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded">
                    Rate unavailable
                  </span>
                ) : (
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E1B18] tabular-nums">
                    {breakdown.formattedEstimate}
                  </span>
                )}
                <span className="text-xs text-[#64748B]">
                  (~{tolaInfo.formattedTola})
                </span>
              </div>
            </div>

            {/* Small Trust Row Near Price (Only Real Verified Statements) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2]/90 border border-[#E2D8C9]/80 text-[11px] text-[#4A4036]">
                <Scale className="w-4 h-4 text-[#C9A54B] shrink-0" />
                <span className="font-medium leading-tight">Live Bullion Rate</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2]/90 border border-[#E2D8C9]/80 text-[11px] text-[#4A4036]">
                <Sparkles className="w-4 h-4 text-[#C9A54B] shrink-0" />
                <span className="font-medium leading-tight">WhatsApp Support</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2]/90 border border-[#E2D8C9]/80 text-[11px] text-[#4A4036]">
                <Truck className="w-4 h-4 text-[#C9A54B] shrink-0" />
                <span className="font-medium leading-tight">Delivery &amp; Pickup</span>
              </div>
            </div>

            {/* Transparent Calculation Breakdown */}
            {!isRateMissing && (
              <div className="p-3.5 bg-[#FAF7F2]/90 rounded-xl border border-[#E2D8C9] space-y-2 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Full Gross Weight:</span>
                  <span className="font-mono text-[#1E1B18] font-medium">
                    {product.weightGrams}g ({tolaInfo.traditional})
                  </span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>{breakdown.karatLabel} Rate / Gram:</span>
                  <span className="font-mono text-[#1E1B18] font-medium">
                    {formatPKR(breakdown.perGramRate)}
                  </span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Base Metal Cost:</span>
                  <span className="font-mono text-[#1E1B18]">
                    {formatPKR(breakdown.baseMetalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>
                    Making Charge ({product.makingCharge.type === 'fixed' ? 'Fixed Fee' : `Rs. ${product.makingCharge.amount}/g`}):
                  </span>
                  <span className="font-mono text-[#1E1B18]">
                    {formatPKR(breakdown.makingChargeTotal)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E2D8C9] flex justify-between text-[11px] text-[#8E6E24]">
                  <span>Stone / Wastage Deductions:</span>
                  <span className="font-medium">Rs. 0 (Full weight policy)</span>
                </div>
              </div>
            )}

            {/* MANDATORY EXACT DISCLAIMER LINE */}
            <div className="p-3 bg-[#F7F0DC]/70 border border-[#C9A54B]/40 rounded-xl flex items-start gap-2 text-xs text-[#8E6E24] leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium italic">
                "{ESTIMATE_DISCLAIMER}"
              </p>
            </div>

            {/* Actions: Add to Bag or Ask on WhatsApp (Using unified WhatsAppButton) */}
            {!isOutOfStock && !isRateMissing ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#E2D8C9] rounded-xl bg-[#FAF7F2] p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2.5 py-1 text-sm font-semibold hover:text-[#8E6E24] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-semibold tabular-nums text-[#1E1B18]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-2.5 py-1 text-sm font-semibold hover:text-[#8E6E24] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="btn-inquiry flex-1 min-h-[44px] py-3 px-4 font-semibold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>
                </div>

                {addedToast && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg py-2 px-3 text-center animate-fade-in font-medium">
                    ✓ Added to your inquiry bag. Tap "Bag / Inquiry" to view your list!
                  </p>
                )}

                <WhatsAppButton
                  onClick={handleAskOnWhatsApp}
                  label="Ask on WhatsApp"
                  size="md"
                  fullWidth
                />
              </div>
            ) : (
              /* Out-of-Stock or Missing Rate: Add to Cart disabled, Ask on WhatsApp prominent in green */
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>
                    {isRateMissing
                      ? 'Live bullion rate unavailable for this metal. Inquire on WhatsApp for live quote.'
                      : 'This piece is currently made to order or reserved.'}
                  </span>
                </div>

                <button
                  disabled
                  className="w-full py-3 px-4 bg-[#F3EFEA] text-[#94A3B8] border border-[#E2D8C9] text-xs font-semibold uppercase tracking-wider rounded-xl cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag (Unavailable)</span>
                </button>

                <WhatsAppButton
                  onClick={handleAskOnWhatsApp}
                  label="Ask on WhatsApp"
                  size="lg"
                  fullWidth
                />
              </div>
            )}
          </div>

          {/* Fulfilment Reminder */}
          <div className="p-4 bg-white/85 backdrop-blur-md border border-[#E2D8C9] rounded-xl space-y-2.5 text-xs">
            <h4 className="font-semibold text-[#1E1B18] uppercase tracking-wider text-[11px]">
              Fulfilment Options
            </h4>
            <div className="space-y-2 text-[#64748B]">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#C9A54B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#1E1B18]">Courier Delivery:</span>{' '}
                  {settings.deliveryText || 'Insured transit across Pakistan with tamper-evident security packing.'}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Store className="w-4 h-4 text-[#C9A54B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#1E1B18]">Store Pickup:</span>{' '}
                  {settings.address ? settings.address : 'Contact us on WhatsApp to arrange private showroom appointment.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Redesigned Craftsmanship & Specifications: Animated Two-Column Grid with motion */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Technical Specifications */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            whileHover={{
              y: -6,
              boxShadow: '0 16px 36px -6px rgba(201, 165, 75, 0.28)',
              borderColor: 'rgba(201, 165, 75, 0.75)',
            }}
            className="bg-white/85 backdrop-blur-md border border-[#E2D8C9] rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
          >
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#8E6E24] font-semibold block">
                Official Hallmarking
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal mt-1">
                Technical Specifications
              </h2>
            </div>

            {/* Gold Hairline Divider that draws from left to right */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              style={{ originX: 0 }}
              className="h-0.5 w-full bg-gradient-to-r from-[#C9A54B] via-[#E8CF8A] to-transparent"
            />

            {/* Spec rows sliding in one after another */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {specList.map((spec, index) => (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.07 }}
                  className="p-3.5 rounded-xl bg-[#FAF7F2]/90 border border-[#E2D8C9]/80 flex items-start gap-3 hover:border-[#C9A54B]/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#C9A54B]/30 flex items-center justify-center shrink-0 mt-0.5">
                    {spec.icon}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold block truncate">
                      {spec.label}
                    </span>
                    <p className="font-serif text-base font-semibold text-[#1E1B18] leading-snug">
                      {spec.value}
                    </p>
                    <p className="text-[11px] text-[#64748B] font-light leading-tight">
                      {spec.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Card 2: Craftsmanship & Artisan Heritage */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            whileHover={{
              y: -6,
              boxShadow: '0 16px 36px -6px rgba(201, 165, 75, 0.28)',
              borderColor: 'rgba(201, 165, 75, 0.75)',
            }}
            className="bg-white/85 backdrop-blur-md border border-[#E2D8C9] rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between transition-colors"
          >
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#8E6E24] font-semibold block">
                Artisan Heritage
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal mt-1">
                Craftsmanship &amp; Heritage
              </h2>
            </div>

            {/* Gold Hairline Divider that draws from left to right */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.35 }}
              style={{ originX: 0 }}
              className="h-0.5 w-full bg-gradient-to-r from-[#C9A54B] via-[#E8CF8A] to-transparent"
            />

            <div className="space-y-4 flex-1">
              <p className="text-xs sm:text-sm text-[#64748B] font-light leading-relaxed">
                {product.fullDescription ||
                  'Each ornament in our collection is hand-finished in our Lahore workshops. We uphold strict zero-stone-deduction policies: every milligram is weighed honestly, and every karat ratio is calculated with mathematical precision from the live 24K bullion baseline.'}
              </p>

              {/* 3 Genuine Feature Blocks */}
              <div className="space-y-3 pt-2">
                <motion.div
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.2 }}
                  className="p-3 rounded-xl bg-[#FAF7F2]/90 border border-[#E2D8C9]/80 flex items-start gap-3"
                >
                  <Scale className="w-4 h-4 text-[#C9A54B] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-[#1E1B18] block">Full Gross Weight Policy</span>
                    <p className="text-[11px] text-[#64748B]">Weight is never rounded down or artificially reduced</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.3 }}
                  className="p-3 rounded-xl bg-[#FAF7F2]/90 border border-[#E2D8C9]/80 flex items-start gap-3"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C9A54B] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-[#1E1B18] block">Laser Hallmarked Purity</span>
                    <p className="text-[11px] text-[#64748B]">Official karat purity is laser marked onto every individual piece</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.4 }}
                  className="p-3 rounded-xl bg-[#FAF7F2]/90 border border-[#E2D8C9]/80 flex items-start gap-3"
                >
                  <HeartHandshake className="w-4 h-4 text-[#C9A54B] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-[#1E1B18] block">Direct Consultation</span>
                    <p className="text-[11px] text-[#64748B]">Master jeweller live rate confirmation before order finalization</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Products Showcase */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between pb-3 border-b border-[#E2D8C9]">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#8E6E24] font-semibold">
                Curated Suggestions
              </span>
              <h3 className="font-serif text-2xl text-[#1E1B18] font-normal mt-0.5">
                You May Also Admire
              </h3>
            </div>
            <button
              onClick={onBack}
              className="text-xs font-semibold text-[#8E6E24] hover:text-[#1E1B18] cursor-pointer"
            >
              View Entire Collection
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                rates={rates}
                onSelect={onSelectProduct}
                onAddToCart={(prod) => onAddToCart(prod, 1)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {product.images && product.images.length > 0 && (
        <LightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={product.images}
          currentIndex={selectedImageIndex}
          onSelectIndex={setSelectedImageIndex}
          title={product.title}
        />
      )}
    </div>
  );
};
