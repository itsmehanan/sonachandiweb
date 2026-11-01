import React from 'react';
import { ShoppingBag, MessageCircle, AlertCircle } from 'lucide-react';
import { Product } from '../data/store';
import {
  BullionRates,
  calculateProductPrice,
  gramsToTola,
  getWhatsAppProductInquiryUrl,
} from '../lib/pricing';

interface ProductCardProps {
  product: Product;
  rates: BullionRates;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  rates,
  onSelect,
  onAddToCart,
}) => {
  // Check if rate is missing/unavailable for this metal
  const isRateMissing =
    product.metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0;

  const breakdown = calculateProductPrice(product, rates);
  const tolaInfo = gramsToTola(product.weightGrams);

  const isOutOfStock = product.stock <= 0 || !product.inStock;

  const handleAskOnWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const note = isRateMissing
      ? 'Please quote the current live rate for this piece on WhatsApp.'
      : 'I noticed this item is currently made to order or reserved. Please share production time.';
    const url = getWhatsAppProductInquiryUrl(product, rates, note);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRateMissing || isOutOfStock) return;
    onAddToCart(product);
  };

  return (
    <article
      onClick={() => onSelect(product)}
      className="group bg-white border border-[#E2D8C9] rounded-xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#C9A54B]/50"
    >
      {/* Product Image */}
      <div className="relative aspect-4/3 w-full bg-[#F3EFEA] overflow-hidden">
        <img
          src={product.images[0] || '/src/assets/images/jewel_gold_bridal_necklace_1793522998312.jpg'}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Quiet status badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isOutOfStock && (
            <span className="px-2 py-0.5 text-[11px] font-semibold text-[#8E6E24] bg-white/95 backdrop-blur-xs rounded shadow-xs">
              Made to Order
            </span>
          )}
          {product.featured && !isOutOfStock && (
            <span className="px-2 py-0.5 text-[11px] font-semibold text-[#1E1B18] bg-white/90 backdrop-blur-xs rounded shadow-xs">
              Featured
            </span>
          )}
        </div>

        {/* Karat purity watermark */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-[10px] font-mono font-medium text-[#1E1B18] bg-white/90 backdrop-blur-xs rounded border border-[#E2D8C9]">
          {breakdown.karatLabel} {breakdown.metal === 'gold' ? 'AU' : 'AG'}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1.5 font-light">
            <span className="capitalize">{product.category.replace('_', ' ')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#1E1B18]">{product.sku}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#8E6E24]">{product.weightGrams}g</span>
          </div>

          <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1E1B18] line-clamp-2 leading-snug group-hover:text-[#8E6E24] transition-colors">
            {product.title}
          </h3>

          <p className="text-xs text-[#64748B] line-clamp-2 mt-1.5 font-light leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-[#F3EFEA]">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">
                Estimated Price
              </span>
              {isRateMissing ? (
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  Rate unavailable
                </span>
              ) : (
                <span className="font-serif text-lg sm:text-xl font-bold text-[#1E1B18] tabular-nums">
                  {breakdown.formattedEstimate}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#8E6E24] font-medium">
              ~{tolaInfo.formattedTola}
            </span>
          </div>

          {/* Action button: Rate unavailable or Out of stock means Add to Cart is disabled and Ask on WhatsApp is shown */}
          {isRateMissing || isOutOfStock ? (
            <button
              type="button"
              onClick={handleAskOnWhatsApp}
              className="w-full py-2.5 px-3 bg-white hover:bg-[#FAF7F2] text-[#8E6E24] border border-[#C9A54B] text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask on WhatsApp</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="gold-sheen w-full py-2.5 px-3 bg-[#FAF7F2] hover:bg-[#C9A54B] text-[#8E6E24] hover:text-white border border-[#C9A54B]/40 hover:border-[#C9A54B] text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Bag</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
