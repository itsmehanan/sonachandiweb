import React, { useState } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  MessageCircle,
  Truck,
  Store,
  ShieldCheck,
  Scale,
  Maximize2,
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Product, getProducts } from '../data/store';
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
    const url = getWhatsAppProductInquiryUrl(product, rates, note);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#1E1B18] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </button>

        {/* Quiet breadcrumb metadata */}
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
        {/* Left Column: Gallery with Lightbox (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 sm:aspect-1/1 bg-[#F3EFEA] rounded-2xl overflow-hidden border border-[#E2D8C9] shadow-xs group">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-102"
              onClick={() => setLightboxOpen(true)}
              referrerPolicy="no-referrer"
            />

            {/* Click to Expand Overlay */}
            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-white text-[#1E1B18] rounded-full shadow-md backdrop-blur-xs transition-all"
              aria-label="Enlarge image in lightbox"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Purity stamp badge */}
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-xs rounded-md border border-[#E2D8C9] shadow-xs text-xs font-mono font-medium text-[#1E1B18]">
              {product.specs.hallmarkStamp}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-[#C9A54B] shadow-xs scale-102'
                      : 'border-[#E2D8C9] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & SKU */}
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
          <div className="p-5 bg-white border border-[#E2D8C9] rounded-2xl space-y-4 shadow-xs">
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

            {/* Transparent Calculation Breakdown */}
            {!isRateMissing && (
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E2D8C9] space-y-2 text-xs">
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
                    Making Charge ({product.makingCharge.type === 'fixed' ? 'Fixed' : `Rs. ${product.makingCharge.amount}/g`}):
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
            <div className="p-3 bg-[#F7F0DC]/50 border border-[#C9A54B]/40 rounded-xl flex items-start gap-2 text-xs text-[#8E6E24] leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium italic">
                "{ESTIMATE_DISCLAIMER}"
              </p>
            </div>

            {/* Actions: Add to Bag or Ask on WhatsApp */}
            {!isOutOfStock && !isRateMissing ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#E2D8C9] rounded-lg bg-[#FAF7F2] p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2.5 py-1 text-sm font-semibold hover:text-[#8E6E24]"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-semibold tabular-nums text-[#1E1B18]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-2.5 py-1 text-sm font-semibold hover:text-[#8E6E24]"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="gold-sheen flex-1 py-3 px-4 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-medium text-xs sm:text-sm uppercase tracking-wider rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>
                </div>

                {addedToast && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md py-1.5 px-3 text-center animate-fade-in font-medium">
                    ✓ Added to your bag. Tap "Bag / Inquiry" above to review!
                  </p>
                )}

                <button
                  onClick={handleAskOnWhatsApp}
                  className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF7F2] text-[#8E6E24] border border-[#C9A54B]/50 hover:border-[#C9A54B] text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Instant WhatsApp Inquiry</span>
                </button>
              </div>
            ) : (
              /* Out-of-Stock: Add to Cart is disabled and replaced by "Ask on WhatsApp" */
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>This piece is currently made to order or reserved.</span>
                </div>

                <button
                  disabled
                  className="w-full py-3 px-4 bg-[#F3EFEA] text-[#94A3B8] border border-[#E2D8C9] text-xs font-semibold uppercase tracking-wider rounded-lg cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag (Unavailable)</span>
                </button>

                <button
                  onClick={handleAskOnWhatsApp}
                  className="gold-sheen w-full py-3.5 px-4 bg-[#C9A54B] hover:bg-[#B18D35] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ask on WhatsApp</span>
                </button>
              </div>
            )}
          </div>

          {/* Fulfilment Reminder */}
          <div className="p-4 bg-white border border-[#E2D8C9] rounded-xl space-y-3 text-xs">
            <h4 className="font-semibold text-[#1E1B18] uppercase tracking-wider text-[11px]">
              Fulfilment Options
            </h4>
            <div className="space-y-2 text-[#64748B]">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#8E6E24] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#1E1B18]">Courier Delivery:</span> Insured
                  doorstep delivery across Karachi, Lahore, Islamabad &amp; nationwide with sealed tamper-evident packaging.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Store className="w-4 h-4 text-[#8E6E24] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#1E1B18]">Store Pickup:</span> Collect in person
                  at our showroom in Liberty Market, Lahore or Sarafa Bazaar, Karachi.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Craftsmanship */}
      <section className="bg-white border border-[#E2D8C9] rounded-2xl p-6 sm:p-10 space-y-6">
        <h3 className="font-serif text-2xl text-[#1E1B18] font-normal">
          Craftsmanship &amp; Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm">
          <div className="space-y-3">
            <h4 className="font-semibold text-[#8E6E24] uppercase tracking-wider text-xs">
              Artisan Notes
            </h4>
            <p className="text-[#64748B] font-light leading-relaxed">
              {product.fullDescription}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-[#8E6E24] uppercase tracking-wider text-xs mb-3">
              Technical Details
            </h4>
            <div className="divide-y divide-[#F3EFEA] border border-[#E2D8C9] rounded-xl overflow-hidden">
              <div className="flex justify-between py-2.5 px-4 bg-[#FAF7F2]">
                <span className="text-[#64748B]">SKU Code:</span>
                <span className="font-mono font-medium text-[#1E1B18]">{product.sku}</span>
              </div>
              <div className="flex justify-between py-2.5 px-4 bg-white">
                <span className="text-[#64748B]">Gross Weight:</span>
                <span className="font-mono font-medium text-[#1E1B18]">
                  {product.weightGrams} grams (~{tolaInfo.formattedTola})
                </span>
              </div>
              <div className="flex justify-between py-2.5 px-4 bg-[#FAF7F2]">
                <span className="text-[#64748B]">Purity &amp; Karat:</span>
                <span className="font-medium text-[#1E1B18]">{product.specs.purity}</span>
              </div>
              <div className="flex justify-between py-2.5 px-4 bg-white">
                <span className="text-[#64748B]">Hallmark Guarantee:</span>
                <span className="font-medium text-[#1E1B18]">{product.specs.hallmarkStamp}</span>
              </div>
              <div className="flex justify-between py-2.5 px-4 bg-[#FAF7F2]">
                <span className="text-[#64748B]">Crafting Technique:</span>
                <span className="font-medium text-[#1E1B18]">{product.specs.craftsmanship}</span>
              </div>
              {product.specs.dimensionsOrSize && (
                <div className="flex justify-between py-2.5 px-4 bg-white">
                  <span className="text-[#64748B]">Sizing / Dimensions:</span>
                  <span className="font-medium text-[#1E1B18]">{product.specs.dimensionsOrSize}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between pb-3 border-b border-[#E2D8C9]">
            <h3 className="font-serif text-2xl text-[#1E1B18] font-normal">
              You May Also Admire
            </h3>
            <button
              onClick={onBack}
              className="text-xs font-semibold text-[#8E6E24] hover:text-[#1E1B18]"
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
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={product.images}
        currentIndex={selectedImageIndex}
        onSelectIndex={setSelectedImageIndex}
        title={product.title}
      />
    </div>
  );
};
