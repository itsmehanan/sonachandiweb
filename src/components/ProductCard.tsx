import React from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { Product, getSettings } from '../data/store';
import {
  BullionRates,
  calculateProductPrice,
  gramsToTola,
  getWhatsAppProductInquiryUrl,
} from '../lib/pricing';
import { WhatsAppButton } from './WhatsAppButton';

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
  const settings = getSettings();
  // Check if rate is missing/unavailable for this metal
  const isRateMissing =
    product.metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0;

  const breakdown = calculateProductPrice(product, rates);
  const tolaInfo = gramsToTola(product.weightGrams);

  const isOutOfStock = product.stock <= 0 || !product.inStock;

  const handleAskOnWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const note = isRateMissing
      ? 'Please quote the current live bullion rate for this piece on WhatsApp.'
      : 'I noticed this item is currently made to order or reserved. Please share production time.';
    const url = getWhatsAppProductInquiryUrl(product, rates, note, settings.whatsappNumber);
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
      className="group bg-white/95 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_-6px_rgba(201,165,75,0.22)] hover:border-[#C9A54B]/60 focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:outline-none"
    >
      {/* Product Image: strict 4:5 aspect ratio with gentle hover zoom */}
      <div className="relative aspect-[4/5] w-full bg-[#F3EFEA] overflow-hidden flex items-center justify-center">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-[#C9A54B]/70 p-4">
            <Sparkles className="w-8 h-8 text-[#C9A54B]" />
            <span className="text-[11px] font-serif text-[#8E6E24] tracking-wider uppercase font-semibold">
              Sona &amp; Chandi
            </span>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isOutOfStock ? (
            /* Muted out-of-stock badge */
            <span className="px-2.5 py-1 text-[11px] font-medium text-[#64748B] bg-white/95 backdrop-blur-xs border border-[#E2D8C9] rounded-md shadow-2xs">
              Made to Order
            </span>
          ) : product.featured ? (
            <span className="px-2.5 py-1 text-[11px] font-semibold text-[#1E1B18] bg-white/95 backdrop-blur-xs border border-[#E2D8C9] rounded-md shadow-2xs">
              Featured
            </span>
          ) : null}
        </div>

        {/* Karat purity clearly styled watermark */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 text-xs font-mono font-semibold text-[#8E6E24] bg-white/95 backdrop-blur-xs rounded-lg border border-[#C9A54B]/40 shadow-xs tracking-wider">
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
              <span className="text-[10px] uppercase tracking-wider text-[#64748B] block font-medium">
                Estimated Price
              </span>
              {isRateMissing ? (
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  Rate unavailable
                </span>
              ) : (
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#1E1B18] tabular-nums tracking-tight">
                  {breakdown.formattedEstimate}
                </span>
              )}
            </div>
            <span className="text-xs text-[#8E6E24] font-medium">
              ~{tolaInfo.formattedTola}
            </span>
          </div>

          {/* Action button: Rate unavailable or Out of stock means Add to Cart is disabled and Ask on WhatsApp is shown in green */}
          {isRateMissing || isOutOfStock ? (
            <WhatsAppButton
              onClick={handleAskOnWhatsApp}
              label="Ask on WhatsApp"
              size="sm"
              fullWidth
            />
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn-inquiry w-full min-h-[44px] py-2.5 px-3 text-xs font-semibold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Bag</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
