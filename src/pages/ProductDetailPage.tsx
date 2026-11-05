import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  Store,
  Scale,
  Maximize2,
  Sparkles,
  ChevronDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
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

function getPurityWithPercentage(karat: string, metal: string): string {
  if (metal === 'silver' || karat === '925_sterling' || karat === '925') {
    return '925 Sterling Silver (92.5% Pure)';
  }
  switch (karat) {
    case '24K':
      return '24K Solid Gold (99.9% Pure)';
    case '22K':
      return '22K Fine Jewellery (91.6% Pure)';
    case '21K':
      return '21K Traditional Gold (87.5% Pure)';
    case '18K':
      return '18K Contemporary Gold (75.0% Pure)';
    default:
      return `${karat} Gold`;
  }
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

  // Tabs under gallery
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'pricing' | 'delivery'>('desc');
  // Mobile accordion states
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    desc: true,
    specs: false,
    pricing: false,
    delivery: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const mainCtaRef = useRef<HTMLDivElement | null>(null);
  const [isPastCta, setIsPastCta] = useState(false);

  // Reset image index when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  // Mobile sticky bottom bar visibility observer
  useEffect(() => {
    const ctaEl = mainCtaRef.current;
    if (!ctaEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPastCta(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(ctaEl);
    return () => observer.disconnect();
  }, []);

  const isRateMissing =
    product.metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0;
  const isOutOfStock = (product.stock !== undefined && product.stock <= 0) || !product.inStock;

  const breakdown = calculateProductPrice(product, rates);
  const tolaInfo = gramsToTola(product.weightGrams);

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImageIndex] || images[0] || null;

  const metalLabel = product.metal === 'gold' ? `${product.karat} Gold` : '925 Silver';
  const categoryLabel = product.category.replace('_', ' ');

  // Related products: 4 cards from same category (exclude current product)
  const relatedProducts = useMemo(() => {
    const all = getProducts().filter((p) => p.id !== product.id);
    const sameCat = all.filter((p) => p.category === product.category);
    const otherCat = all.filter((p) => p.category !== product.category);
    return [...sameCat, ...otherCat].slice(0, 4);
  }, [product.id, product.category]);

  const handleAddToCart = () => {
    if (isOutOfStock || isRateMissing) return;
    onAddToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  // WhatsApp order inquiry url
  const orderOnWhatsAppMessage = `Hello Sona & Chandi Gold Collection, I would like to order:
• Piece: ${product.title}
• SKU: ${product.sku}
• Metal & Purity: ${metalLabel}
• Weight: ${product.weightGrams}g (~${tolaInfo.formattedTola})
• Quantity: ${quantity}
• Estimated Total: ${breakdown.formattedEstimate}

Please confirm today's live rate and availability.`;

  const orderOnWhatsAppUrl = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        orderOnWhatsAppMessage
      )}`
    : undefined;

  const handleOpenPricingTab = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab('pricing');
    setOpenAccordions((prev) => ({ ...prev, pricing: true }));
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      {/* Toast Notice when item added to bag */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 sm:right-8 z-50 bg-[#1E1B18] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#C9A54B]/40"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold block">{product.title}</span>
              <span className="text-[#C9A54B]">Added {quantity} item(s) to bag</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar: Quiet Back Button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#1E1B18] transition-colors cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#C9A54B]" />
          <span>Back to Catalogue</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B]">
          <span className="cursor-pointer hover:text-[#8E6E24]" onClick={onBack}>
            Home
          </span>
          <span aria-hidden="true" className="text-[#C9A54B]/50">/</span>
          <span className="cursor-pointer hover:text-[#8E6E24] capitalize" onClick={onBack}>
            {product.metal === 'gold' ? 'Gold' : 'Silver'}
          </span>
          <span aria-hidden="true" className="text-[#C9A54B]/50">/</span>
          <span className="capitalize">{categoryLabel}</span>
          <span aria-hidden="true" className="text-[#C9A54B]/50">/</span>
          <span className="font-mono text-[#1E1B18] font-semibold">{product.sku}</span>
        </div>
      </div>

      {/* 1. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Gallery (Vertical Thumbnails on Desktop, Horizontal on Mobile) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col-reverse md:flex-row gap-3.5 items-start">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[520px] w-full md:w-20 shrink-0 pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-square w-16 sm:w-18 md:w-full rounded-xl overflow-hidden bg-[#FAF7F2] transition-all cursor-pointer shrink-0 ${
                      selectedImageIndex === idx
                        ? 'ring-2 ring-[#C9A54B] ring-offset-2 border border-[#C9A54B]'
                        : 'border border-[#E2D8C9] hover:border-[#C9A54B]/60 opacity-80 hover:opacity-100'
                    }`}
                    aria-label={`Select product image ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} angle ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Large Main Image with Hover Zoom and Lightbox Trigger */}
            <div className="relative aspect-4/5 w-full bg-[#FAF7F2] rounded-2xl overflow-hidden border border-[#E2D8C9] shadow-xs group flex items-center justify-center">
              {currentImage ? (
                <>
                  <img
                    src={currentImage}
                    alt={product.title}
                    loading="eager"
                    className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 ease-out group-hover:scale-105"
                    onClick={() => setLightboxOpen(true)}
                    referrerPolicy="no-referrer"
                  />
                  {/* Lightbox Trigger Icon */}
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="absolute top-3.5 right-3.5 p-2 bg-white/90 hover:bg-white text-[#1E1B18] rounded-xl shadow-xs border border-[#E2D8C9] transition-all cursor-pointer opacity-80 hover:opacity-100"
                    aria-label="View full screen image"
                  >
                    <Maximize2 className="w-4 h-4 text-[#8E6E24]" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-[#C9A54B]/70 p-6">
                  <Sparkles className="w-10 h-10 text-[#C9A54B]" />
                  <span className="font-serif text-sm font-semibold tracking-wider uppercase text-[#8E6E24]">
                    Sona &amp; Chandi
                  </span>
                </div>
              )}

              {/* Badges on Main Image */}
              <div className="absolute top-3.5 left-3.5 flex flex-col gap-1 items-start">
                {isOutOfStock ? (
                  <span className="px-2.5 py-1 text-xs font-medium text-[#64748B] bg-[#FAF7F2]/95 border border-[#E2D8C9] rounded-md shadow-2xs">
                    Out of Stock
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold text-[#1E1B18] bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] rounded-md shadow-xs uppercase tracking-wider">
                    {metalLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Product Details, Pricing & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            {/* Category (Small Caps) */}
            <span className="text-[11px] uppercase tracking-widest font-semibold text-[#8E6E24] block">
              {categoryLabel}
            </span>

            {/* Product Name (Cormorant Garamond) */}
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1B18] font-normal leading-tight tracking-tight">
              {product.title}
            </h1>

            {/* SKU & Spec Line */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#64748B]">
              <span className="font-mono font-medium text-[#1E1B18] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E2D8C9]">
                SKU: {product.sku}
              </span>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <span className="font-medium text-[#8E6E24]">
                {metalLabel} | {product.weightGrams} g
              </span>
            </div>

            {/* Availability Badge */}
            <div className="pt-2">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EAE3D6] text-[#64748B] border border-[#E2D8C9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                  <span>Out of stock · Made to order</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>In Stock Ready to Ship</span>
                </span>
              )}
            </div>
          </div>

          {/* Price Block: "Estimated price Rs. X" with inline "How is this calculated?" */}
          <div className="p-5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl space-y-3 shadow-xs">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8E6E24] block">
              Calculated Metal &amp; Making Value
            </span>

            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="text-xs uppercase text-[#64748B] font-medium">Estimated price:</span>
              {isRateMissing ? (
                <span className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded">
                  Rate unavailable
                </span>
              ) : (
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E1B18] tabular-nums tracking-tight">
                  {breakdown.formattedEstimate}
                </span>
              )}
              <span className="text-xs text-[#8E6E24] font-medium">
                (~{tolaInfo.formattedTola})
              </span>
            </div>

            {/* Inline "How is this calculated?" link */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <a
                href="#price-breakdown"
                onClick={handleOpenPricingTab}
                className="text-[#8E6E24] hover:text-[#1E1B18] font-semibold underline underline-offset-4 cursor-pointer transition-colors"
              >
                How is this calculated?
              </a>
              <span className="text-[11px] text-[#64748B]">Updated from live rates</span>
            </div>
          </div>

          {/* Action Zone: Quantity Stepper, Add to Bag & Order on WhatsApp */}
          <div ref={mainCtaRef} className="space-y-4">
            {/* Quantity Stepper */}
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#64748B] font-medium">Quantity:</span>
                <div className="flex items-center bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3.5 py-2 text-sm font-semibold text-[#1E1B18] hover:bg-[#F3EFEA] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-xs font-mono font-bold text-[#1E1B18]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3.5 py-2 text-sm font-semibold text-[#1E1B18] hover:bg-[#F3EFEA] cursor-pointer transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Side by Side Buttons: Gold Add to Bag & Green WhatsAppButton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isRateMissing}
                className={`min-h-[48px] px-5 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all ${
                  isOutOfStock || isRateMissing
                    ? 'bg-[#EAE3D6] text-[#94A3B8] cursor-not-allowed border border-[#E2D8C9]'
                    : 'bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] hover:brightness-105 active:scale-[0.98] cursor-pointer'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Made to Order' : 'Add to Bag'}</span>
              </button>

              {orderOnWhatsAppUrl && (
                <WhatsAppButton
                  href={orderOnWhatsAppUrl}
                  label="Order on WhatsApp"
                  size="md"
                  fullWidth
                />
              )}
            </div>

            {/* Mandatory Disclaimer */}
            <p className="text-xs text-[#64748B] leading-relaxed pt-1">
              {ESTIMATE_DISCLAIMER}
            </p>

            {/* Small Trust Row with ONLY True Verified Statements */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2D8C9] text-[11px] text-[#4A4036]">
                <Scale className="w-4 h-4 text-[#C9A54B] shrink-0" />
                <span className="font-medium leading-tight">Transparent live-rate pricing</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2D8C9] text-[11px] text-[#4A4036]">
                <Sparkles className="w-4 h-4 text-[#C9A54B] shrink-0" />
                <span className="font-medium leading-tight">Confirmed on WhatsApp</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2D8C9] text-[11px] text-[#4A4036]">
                <Truck className="w-4 h-4 text-[#C9A54B] shrink-0" />
                <span className="font-medium leading-tight">Store pickup or courier</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabs Under the Gallery (Desktop Tabs with Sliding Underline, Mobile Accordions) */}
      <div ref={tabsRef} id="product-tabs" className="pt-8 border-t border-[#E2D8C9] space-y-6">
        {/* Desktop Tab Headers with Sliding Gold Underline */}
        <div className="hidden md:flex items-center gap-8 border-b border-[#E2D8C9] text-sm">
          {[
            { id: 'desc', label: 'Description' },
            { id: 'specs', label: 'Specifications' },
            { id: 'pricing', label: 'Price Breakdown' },
            { id: 'delivery', label: 'Delivery & Pickup' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative py-3.5 font-medium transition-colors cursor-pointer outline-hidden ${
                  isSelected ? 'text-[#8E6E24] font-semibold' : 'text-[#64748B] hover:text-[#1E1B18]'
                }`}
              >
                <span>{tab.label}</span>
                {isSelected && (
                  <motion.span
                    layoutId="productTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#C9A54B] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Tab Panels (Cross-Fading) */}
        <div className="hidden md:block">
          <AnimatePresence mode="wait">
            {/* Tab 1: Description */}
            {activeTab === 'desc' && (
              <motion.div
                key="desc"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs"
              >
                <h3 className="font-serif text-xl font-bold text-[#1E1B18]">
                  About This Fine Ornament
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-line font-light">
                  {product.fullDescription || product.shortDescription ||
                    'Each ornament in our collection is hand-finished in our Lahore workshops with careful attention to traditional Pakistani craftsmanship. We uphold strict zero-stone-deduction policies: every milligram is weighed honestly, and every karat ratio is calculated with mathematical precision from the live 24K bullion baseline.'}
                </p>
                {product.specs.craftsmanship && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8E6E24] block mb-1">
                      Artisan Craftsmanship
                    </span>
                    <p className="text-sm text-[#64748B]">
                      {product.specs.craftsmanship}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 2: Specifications */}
            {activeTab === 'specs' && (
              <motion.div
                key="specs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs"
              >
                <h3 className="font-serif text-xl font-bold text-[#1E1B18]">
                  Technical Specifications
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">Product SKU:</span>
                    <span className="font-mono font-bold text-[#1E1B18]">{product.sku}</span>
                  </div>

                  <div className="p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">Metal Type:</span>
                    <span className="font-semibold text-[#1E1B18] capitalize">
                      {product.metal === 'gold' ? 'Solid Gold (Sona)' : 'Solid Sterling Silver (Chandi)'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">Purity &amp; Karat:</span>
                    <span className="font-semibold text-[#8E6E24]">
                      {getPurityWithPercentage(product.karat, product.metal)}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">Full Gross Weight:</span>
                    <span className="font-mono font-bold text-[#1E1B18]">
                      {product.weightGrams}g ({tolaInfo.traditional})
                    </span>
                  </div>

                  <div className="p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">Making Charge:</span>
                    <span className="font-mono font-semibold text-[#1E1B18]">
                      {product.makingCharge.type === 'per_gram'
                        ? `Rs. ${formatPKR(product.makingCharge.amount)} / g`
                        : `Rs. ${formatPKR(product.makingCharge.amount)} fixed per piece`}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">Category:</span>
                    <span className="font-semibold text-[#1E1B18] capitalize">
                      {categoryLabel}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl flex justify-between items-center">
                    <span className="text-[#64748B]">Availability:</span>
                    <span className={product.inStock ? 'font-semibold text-emerald-700' : 'text-[#64748B]'}>
                      {product.inStock ? 'In Stock (Ready for Dispatch)' : 'Made to Order / Reserved'}
                    </span>
                  </div>

                  {product.specs.hallmarkStamp && (
                    <div className="p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl flex justify-between items-center">
                      <span className="text-[#64748B]">Hallmark Stamp:</span>
                      <span className="font-semibold text-[#1E1B18]">
                        {product.specs.hallmarkStamp}
                      </span>
                    </div>
                  )}

                  {product.specs.craftsmanship && (
                    <div className="sm:col-span-2 p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl flex justify-between items-center">
                      <span className="text-[#64748B]">Craftsmanship:</span>
                      <span className="font-medium text-[#1E1B18]">
                        {product.specs.craftsmanship}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab 3: Price Breakdown */}
            {activeTab === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs"
              >
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1E1B18]">
                    Transparent Price Calculation
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Calculated live using today's bullion market baseline. No arbitrary markups or hidden fees.
                  </p>
                </div>

                <div className="space-y-3 text-xs bg-white/80 p-5 rounded-xl border border-[#E2D8C9]">
                  {/* Metal Value formula */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2D8C9] gap-1">
                    <div>
                      <span className="font-semibold text-[#1E1B18] block">
                        Metal Value (Weight × Today's Per-Gram Rate)
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {product.weightGrams}g × {formatPKR(breakdown.perGramRate)}/g ({breakdown.karatLabel})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#1E1B18]">
                      {formatPKR(breakdown.baseMetalPrice)}
                    </span>
                  </div>

                  {/* Making Charge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2D8C9] gap-1">
                    <div>
                      <span className="font-semibold text-[#1E1B18] block">
                        Making &amp; Crafting Charge ({breakdown.makingChargeType === 'per_gram' ? 'Per Gram' : 'Fixed'})
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {breakdown.makingChargeType === 'per_gram'
                          ? `${product.weightGrams}g × ${formatPKR(product.makingCharge.amount)}/g`
                          : 'Standard artisan bench fee'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#1E1B18]">
                      {formatPKR(breakdown.makingChargeTotal)}
                    </span>
                  </div>

                  {/* Total Estimated Price */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="font-serif font-bold text-base text-[#1E1B18] block">
                        Total Estimated Price:
                      </span>
                      <span className="text-[11px] text-[#8E6E24]">
                        Matches price displayed above
                      </span>
                    </div>
                    <span className="font-serif text-2xl font-bold text-[#8E6E24] tabular-nums">
                      {breakdown.formattedEstimate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span>Formula: Metal Value + Making Charge</span>
                  {onOpenCalculator && (
                    <button
                      type="button"
                      onClick={onOpenCalculator}
                      className="text-[#8E6E24] hover:text-[#1E1B18] font-semibold underline underline-offset-4 cursor-pointer"
                    >
                      Open Bullion Price Estimator
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab 4: Delivery and Pickup */}
            {activeTab === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs"
              >
                <h3 className="font-serif text-xl font-bold text-[#1E1B18]">
                  Delivery &amp; Showroom Pickup
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Courier Transit */}
                  <div className="p-4 bg-white/80 border border-[#E2D8C9] rounded-xl space-y-2">
                    <span className="font-semibold text-sm text-[#1E1B18] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#C9A54B]" />
                      <span>Insured Courier Delivery</span>
                    </span>
                    <p className="text-[#64748B] leading-relaxed">
                      {settings.deliveryText ||
                        'Secure, fully insured transit across Pakistan in tamper-evident sealed packaging. Dispatch details and tracking confirmed via WhatsApp.'}
                    </p>
                  </div>

                  {/* Showroom Pickup */}
                  <div className="p-4 bg-white/80 border border-[#E2D8C9] rounded-xl space-y-2">
                    <span className="font-semibold text-sm text-[#1E1B18] flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#C9A54B]" />
                      <span>Showroom Pickup</span>
                    </span>
                    <p className="text-[#64748B] leading-relaxed">
                      {settings.address
                        ? `${settings.address}. ${settings.storeHoursDescription || ''}`
                        : 'Contact us on WhatsApp for showroom appointments and private viewing timings.'}
                    </p>
                  </div>
                </div>

                {/* WhatsApp Help */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white/50 border border-[#E2D8C9] rounded-xl text-xs">
                  <span className="text-[#64748B]">
                    Have a special delivery request or need urgent dispatch for a wedding?
                  </span>
                  {orderOnWhatsAppUrl && (
                    <WhatsAppButton
                      href={orderOnWhatsAppUrl}
                      label="Contact us on WhatsApp"
                      size="sm"
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Accordions (Shown on Small Screens Only) */}
        <div className="md:hidden space-y-3">
          {/* Accordion 1: Description */}
          <div className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('desc')}
              className="w-full p-4 flex items-center justify-between text-left text-sm font-bold text-[#1E1B18] cursor-pointer"
            >
              <span>Description</span>
              <ChevronDown
                className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
                  openAccordions.desc ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openAccordions.desc && (
              <div className="p-4 pt-1 text-xs text-[#475569] leading-relaxed border-t border-[#E2D8C9]/60">
                {product.fullDescription || product.shortDescription ||
                  'Each ornament in our collection is hand-finished in our Lahore workshops with careful attention to traditional Pakistani craftsmanship.'}
                {product.specs.craftsmanship && (
                  <p className="mt-2 text-[#8E6E24] font-medium">
                    {product.specs.craftsmanship}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Accordion 2: Specifications */}
          <div className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('specs')}
              className="w-full p-4 flex items-center justify-between text-left text-sm font-bold text-[#1E1B18] cursor-pointer"
            >
              <span>Specifications</span>
              <ChevronDown
                className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
                  openAccordions.specs ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openAccordions.specs && (
              <div className="p-4 pt-2 text-xs space-y-2 border-t border-[#E2D8C9]/60">
                <div className="flex justify-between py-1 border-b border-[#E2D8C9]/40">
                  <span className="text-[#64748B]">SKU:</span>
                  <span className="font-mono font-bold text-[#1E1B18]">{product.sku}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2D8C9]/40">
                  <span className="text-[#64748B]">Metal:</span>
                  <span className="font-semibold text-[#1E1B18] capitalize">{product.metal}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2D8C9]/40">
                  <span className="text-[#64748B]">Purity:</span>
                  <span className="font-semibold text-[#8E6E24]">
                    {getPurityWithPercentage(product.karat, product.metal)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2D8C9]/40">
                  <span className="text-[#64748B]">Gross Weight:</span>
                  <span className="font-mono font-bold text-[#1E1B18]">
                    {product.weightGrams}g ({tolaInfo.traditional})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2D8C9]/40">
                  <span className="text-[#64748B]">Making Charge:</span>
                  <span className="font-mono text-[#1E1B18]">
                    {product.makingCharge.type === 'per_gram'
                      ? `Rs. ${formatPKR(product.makingCharge.amount)}/g`
                      : `Rs. ${formatPKR(product.makingCharge.amount)} fixed`}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Availability:</span>
                  <span className={product.inStock ? 'font-semibold text-emerald-700' : 'text-[#64748B]'}>
                    {product.inStock ? 'In Stock' : 'Made to Order'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 3: Price Breakdown */}
          <div className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('pricing')}
              className="w-full p-4 flex items-center justify-between text-left text-sm font-bold text-[#1E1B18] cursor-pointer"
            >
              <span>Price Breakdown</span>
              <ChevronDown
                className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
                  openAccordions.pricing ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openAccordions.pricing && (
              <div className="p-4 pt-2 text-xs space-y-2.5 border-t border-[#E2D8C9]/60">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Metal Value ({product.weightGrams}g):</span>
                  <span className="font-mono font-bold text-[#1E1B18]">
                    {formatPKR(breakdown.baseMetalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Making Charge:</span>
                  <span className="font-mono font-bold text-[#1E1B18]">
                    {formatPKR(breakdown.makingChargeTotal)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E2D8C9] font-bold text-sm">
                  <span>Estimated Total:</span>
                  <span className="font-serif text-base text-[#8E6E24]">
                    {breakdown.formattedEstimate}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 4: Delivery and Pickup */}
          <div className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('delivery')}
              className="w-full p-4 flex items-center justify-between text-left text-sm font-bold text-[#1E1B18] cursor-pointer"
            >
              <span>Delivery &amp; Pickup</span>
              <ChevronDown
                className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
                  openAccordions.delivery ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openAccordions.delivery && (
              <div className="p-4 pt-2 text-xs space-y-3 border-t border-[#E2D8C9]/60">
                <p className="text-[#64748B]">
                  {settings.deliveryText ||
                    'Insured transit across Pakistan with tamper-evident security packing.'}
                </p>
                <p className="text-[#64748B]">
                  {settings.address
                    ? `${settings.address}. ${settings.storeHoursDescription || ''}`
                    : 'Showroom pickup available by appointment.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. "You May Also Like" Row of 4 Cards */}
      <section className="pt-8 border-t border-[#E2D8C9] space-y-6">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#8E6E24] font-semibold block">
            Curated Complements
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal mt-1">
            You May Also Like
          </h2>
        </div>

        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
        ) : (
          <p className="text-xs text-[#64748B]">Explore our full jewellery catalogue for more handcrafted pieces.</p>
        )}
      </section>

      {/* 4. Mobile Sticky Bottom Bar (Appears after scrolling past main CTA) */}
      {isPastCta && (
        <div className="fixed bottom-0 inset-x-0 bg-[#FAF7F2]/96 backdrop-blur-md border-t border-[#C9A54B]/30 p-3 sm:hidden z-30 flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-bottom duration-200">
          <div className="min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-[#64748B] block truncate font-medium">
              {product.title}
            </span>
            <span className="font-serif text-base font-bold text-[#1E1B18] tabular-nums">
              {breakdown.formattedEstimate}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOutOfStock ? (
              <WhatsAppButton
                href={orderOnWhatsAppUrl}
                label="Inquire"
                size="sm"
              />
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isRateMissing}
                className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Bag</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        currentIndex={selectedImageIndex}
        onSelectIndex={setSelectedImageIndex}
        title={product.title}
      />
    </div>
  );
};
