import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Product, getSettings } from '../data/store';
import {
  BullionRates,
  calculateProductPrice,
  getWhatsAppProductInquiryUrl,
} from '../lib/pricing';
import { WhatsAppButton } from './WhatsAppButton';

interface ProductCardProps {
  product: Product;
  rates: BullionRates;
  onSelect: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

function isProductNew(product: Product): boolean {
  const pAny = product as any;
  if (pAny.createdAt) {
    try {
      const date =
        typeof pAny.createdAt.toDate === 'function'
          ? pAny.createdAt.toDate()
          : new Date(pAny.createdAt);
      if (!isNaN(date.getTime())) {
        const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 14;
      }
    } catch {
      // Fallback
    }
  }
  return Boolean(pAny.isNew);
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  rates,
  onSelect,
}) => {
  const settings = getSettings();
  const [imageLoaded, setImageLoaded] = useState(false);

  const breakdown = calculateProductPrice(product, rates);
  const isOutOfStock = product.stock <= 0 || !product.inStock;
  const isNew = isProductNew(product);

  const hasSecondImage = product.images && product.images.length > 1;
  const primaryImage = product.images && product.images[0] ? product.images[0] : '';
  const secondaryImage = hasSecondImage ? product.images[1] : '';

  const metalLabel = product.metal === 'gold' ? `${product.karat} Gold` : '925 Silver';
  const categoryLabel = product.category.replace('_', ' ');

  const whatsappInquiryUrl = getWhatsAppProductInquiryUrl(
    product,
    rates,
    'Hello, I noticed this piece is currently out of stock or made to order. Please share availability, ordering timeline, or pricing.',
    settings.whatsappNumber
  );

  return (
    <article
      onClick={() => onSelect(product)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(product);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.title}`}
      className="group bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-6px_rgba(201,165,75,0.22)] hover:border-[#C9A54B]/60 focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:outline-hidden"
    >
      {/* 4:5 Product Image on Solid Ivory with Skeleton Loader */}
      <div className="relative aspect-4/5 w-full bg-[#FAF7F2] overflow-hidden flex items-center justify-center">
        {/* Skeleton Shimmer */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#EFE9DF] animate-pulse" />
        )}

        {primaryImage ? (
          <>
            {/* Primary Image */}
            <img
              src={primaryImage}
              alt={product.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-500 ease-out ${
                hasSecondImage
                  ? 'group-hover:opacity-0 group-hover:scale-105'
                  : 'group-hover:scale-105'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              referrerPolicy="no-referrer"
            />

            {/* Second Image on Hover (if available) */}
            {hasSecondImage && (
              <img
                src={secondaryImage}
                alt={`${product.title} alternate angle`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-[#C9A54B]/80 p-4">
            <Sparkles className="w-8 h-8 text-[#C9A54B]" />
            <span className="text-[10px] font-serif text-[#8E6E24] tracking-widest uppercase font-semibold">
              Sona &amp; Chandi
            </span>
          </div>
        )}

        {/* Badges: Top-Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 text-[10px] font-medium text-[#64748B] bg-[#FAF7F2]/95 border border-[#E2D8C9] rounded-md shadow-2xs">
              Out of stock
            </span>
          ) : isNew ? (
            <span className="px-2 py-0.5 text-[10px] font-bold text-[#1E1B18] bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] rounded-md shadow-xs uppercase tracking-wider">
              New
            </span>
          ) : product.featured ? (
            <span className="px-2 py-0.5 text-[10px] font-semibold text-[#8E6E24] bg-white/95 border border-[#C9A54B]/40 rounded-md shadow-2xs">
              Featured
            </span>
          ) : null}
        </div>

        {/* Slide-Up "View details" Bar on Hover */}
        <div className="absolute bottom-0 inset-x-0 bg-[#1E1B18]/85 backdrop-blur-xs py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#E8CF8A] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none z-10">
          <span>View details</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#E8CF8A]" />
        </div>
      </div>

      {/* Minimal Product Info */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-[#FAF7F2]">
        <div>
          {/* Small Caps Category */}
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8E6E24] block leading-tight">
            {categoryLabel}
          </span>

          {/* Product Name */}
          <h3 className="font-serif text-sm sm:text-base font-semibold text-[#1E1B18] line-clamp-1 mt-1 group-hover:text-[#8E6E24] transition-colors">
            {product.title}
          </h3>

          {/* Spec Subtitle: "22K Gold | 10.5 g" */}
          <p className="text-xs text-[#64748B] mt-0.5 font-light">
            {metalLabel} | {product.weightGrams} g
          </p>
        </div>

        {/* Estimated Price in Large Serif */}
        <div className="mt-3 pt-2.5 border-t border-[#E2D8C9]/70">
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-base sm:text-lg lg:text-xl font-bold text-[#1E1B18] tracking-tight">
              Est. {breakdown.formattedEstimate}
            </span>
          </div>

          {/* Out of Stock: Small green WhatsAppButton */}
          {isOutOfStock && (
            <div
              className="mt-2.5"
              onClick={(e) => e.stopPropagation()}
            >
              <WhatsAppButton
                href={whatsappInquiryUrl}
                label="Ask on WhatsApp"
                size="sm"
                fullWidth
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
