import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Sparkles, Scale, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Product,
  getFeaturedProducts,
  getSettings,
  getProducts,
  getShowcaseTiles,
  optimizeCloudinaryShowcase,
  ShowcaseTile,
} from '../data/store';
import { BullionRates } from '../lib/pricing';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppButton } from '../components/WhatsAppButton';
import {
  Reveal,
  StaggerGrid,
  StaggerItem,
  SectionHeading,
  HeroHeadlineReveal,
} from '../components/motion/MotionUtils';

interface CuratedShowcaseCardProps {
  tile: ShowcaseTile;
  products: Product[];
  onNavigate: (target: string) => void;
}

const CuratedShowcaseCard: React.FC<CuratedShowcaseCardProps> = ({ tile, products, onNavigate }) => {
  const [imageError, setImageError] = useState(false);

  // Compute resolved image url (priority: tile.imageUrl, else newest active product, else placeholder)
  const resolvedImageUrl = useMemo(() => {
    if (tile.imageUrl && tile.imageUrl.trim()) {
      return optimizeCloudinaryShowcase(tile.imageUrl.trim());
    }
    const target = tile.target;
    let matching: Product | undefined;
    if (target === 'silver') {
      matching = products
        .filter((p) => p.inStock && p.metal === 'silver' && p.images && p.images.length > 0)
        .sort((a, b) => b.id.localeCompare(a.id))[0];
    } else {
      matching = products
        .filter((p) => p.inStock && p.category === target && p.images && p.images.length > 0)
        .sort((a, b) => b.id.localeCompare(a.id))[0];
      if (!matching) {
        matching = products
          .filter((p) => p.category === target && p.images && p.images.length > 0)
          .sort((a, b) => b.id.localeCompare(a.id))[0];
      }
    }
    if (matching && matching.images && matching.images[0]) {
      return optimizeCloudinaryShowcase(matching.images[0]);
    }
    return '';
  }, [tile.imageUrl, tile.target, products]);

  // Reset imageError state whenever the image URL changes
  useEffect(() => {
    setImageError(false);
  }, [resolvedImageUrl]);

  const showPlaceholder = !resolvedImageUrl || imageError;

  return (
    <button
      onClick={() => onNavigate(tile.target)}
      className="group text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B8923A] focus-visible:ring-offset-2 w-full h-full"
    >
      <div className="bg-white/85 backdrop-blur-xs rounded-2xl p-3.5 sm:p-4 flex flex-col h-full space-y-3 border border-[#E2D8C9] shadow-2xs transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_32px_-6px_rgba(184,146,58,0.22)] group-hover:border-[#B8923A]">
        <div className="relative aspect-4/5 w-full rounded-xl overflow-hidden bg-[#FBF8F2] border border-[#E2D8C9]/70 flex items-center justify-center">
          {!showPlaceholder ? (
            <>
              <img
                src={resolvedImageUrl}
                alt={tile.title}
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FBF8F2] via-[#F3EAD7] to-[#E9DCBF] p-4 flex flex-col items-center justify-center text-center gap-2 group-hover:scale-105 transition-transform duration-500">
              <Sparkles className="w-7 h-7 text-[#B8923A] stroke-[1.25]" />
              <span className="font-serif text-xs font-semibold text-[#7A5A12] leading-tight">
                {tile.title}
              </span>
              <span className="text-[9px] uppercase tracking-[0.14em] text-[#6E6259]">
                Sona &amp; Chandi
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <h4 className="font-serif text-base font-medium text-[#1A1410] group-hover:text-[#7A5A12] transition-colors leading-tight">
            {tile.title}
          </h4>
          <p className="text-xs text-[#6E6259] mt-1 font-light line-clamp-1">{tile.subtitle}</p>
        </div>
      </div>
    </button>
  );
};

interface HomePageProps {
  rates: BullionRates;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onNavigateToCatalogue: (filter?: string) => void;
  onOpenCalculator: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  rates,
  onSelectProduct,
  onAddToCart,
  onNavigateToCatalogue,
  onOpenCalculator,
}) => {
  const featured = getFeaturedProducts();
  const settings = getSettings();
  const allProducts = getProducts();

  const showcaseTiles = useMemo(() => {
    const tiles =
      settings.showcaseTiles && settings.showcaseTiles.length > 0
        ? settings.showcaseTiles
        : getShowcaseTiles();
    return tiles
      .filter((t) => t.visible !== false)
      .sort((a, b) => a.order - b.order);
  }, [settings.showcaseTiles]);

  return (
    <div className="w-full overflow-x-clip">
      {/* 1. HERO SECTION (Ivory Background #FBF8F2) */}
      <section className="relative overflow-hidden bg-[#FBF8F2] border-b border-[#E2D8C9]/60">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column: Typography & Intent */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <Reveal delay={0}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/90 border border-[#B8923A]/40 rounded-full text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5A12] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#B8923A]" />
                  <span>Pakistan’s Trusted Bullion &amp; Fine Jewellery</span>
                </div>
              </Reveal>

              <HeroHeadlineReveal
                text="Timeless Gold & Silver,"
                highlightText="Crafted for Generations."
              />

              <Reveal delay={0.2}>
                <p className="text-base text-[#4A3F35] font-light max-w-xl mx-auto lg:mx-0 leading-[1.65]">
                  Pakistani bridal chokers, 22K karas, and solid 925 sterling
                  silver. Transparent bullion pricing calculated directly from live market rates.
                </p>
              </Reveal>

              {/* Action Buttons: Primary Gold Gradient & Secondary Gold Outline */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <button
                  type="button"
                  onClick={() => onNavigateToCatalogue()}
                  className="btn-primary-gold w-full sm:w-auto"
                >
                  <span>Explore All Jewellery</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
                <button
                  type="button"
                  onClick={onOpenCalculator}
                  className="btn-secondary-outline w-full sm:w-auto"
                >
                  <Scale className="w-4 h-4 mr-1 text-[#B8923A]" />
                  <span>Check Today’s Rate</span>
                </button>
              </motion.div>

              {/* Clean Trust Indicators */}
              <Reveal delay={0.45}>
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-medium text-[#4A3F35]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B8923A]" />
                    <span>Priced from Live Rates</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B8923A]" />
                    <span>Full Weight Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B8923A]" />
                    <span>Insured Nationwide Delivery</span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right Column: Hero Visual Asset with Soft Clip-Mask and Slow Zoom */}
            <div className="lg:col-span-5">
              <Reveal direction="left" delay={0.15}>
                <div className="relative mx-auto max-w-md lg:max-w-none aspect-4/3 sm:aspect-1/1 rounded-2xl overflow-hidden shadow-2xl border border-[#B8923A]/30 bg-white group">
                  <motion.img
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    src="/assets/aistudio/intro-poster_d8a114e6.jpg"
                    alt="Pure 24K and 22K Gold Jewellery"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                    <span className="text-xs uppercase tracking-[0.14em] text-[#F1D98B] font-semibold">
                      Signature Heirloom
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-normal mt-1 leading-snug">
                      22K &amp; 24K Purity Masterpieces
                    </h3>
                    <p className="text-xs text-white/80 mt-1 font-light leading-relaxed">
                      Every piece weighed in grams and tolas with zero stone deductions.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CURATED COLLECTIONS (Champagne Background #F3EAD7) */}
      <section className="bg-[#F3EAD7] border-b border-[#E2D8C9]/60">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-28">
          <SectionHeading
            kicker="Curated Collections"
            title="Collections For Every Occasion"
            subtitle="Select a category to browse authentic weights, karats, and jewellery designs."
          />

          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {showcaseTiles.map((tile) => (
              <StaggerItem key={tile.id}>
                <CuratedShowcaseCard
                  tile={tile}
                  products={allProducts}
                  onNavigate={onNavigateToCatalogue}
                />
              </StaggerItem>
            ))}
          </StaggerGrid>

          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigateToCatalogue()}
              className="btn-secondary-outline"
            >
              <span>Explore All Categories</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE BRIDAL & FINE PIECES (Ivory Background #FBF8F2) */}
      {featured.length > 0 && (
        <section className="bg-[#FBF8F2] border-b border-[#E2D8C9]/60">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-28">
            <SectionHeading
              kicker="Signature Pieces"
              title="Bridal &amp; Fine Jewellery"
              subtitle="Hand-finished masterworks with transparent bullion rate estimates calculated from live market rates."
            />

            <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard
                    product={product}
                    rates={rates}
                    onSelect={onSelectProduct}
                    onAddToCart={onAddToCart}
                  />
                </StaggerItem>
              ))}
            </StaggerGrid>

            <div className="mt-12 text-center">
              <button
                onClick={() => onNavigateToCatalogue()}
                className="btn-secondary-outline"
              >
                <span>Browse Full Collection ({featured.length} pieces)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. THE BULLION PURITY STANDARD (Champagne Background #F3EAD7) */}
      <section className="bg-[#F3EAD7] border-b border-[#E2D8C9]/60">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-28">
          <SectionHeading
            kicker="The Bullion Standard"
            title="Understanding Gold &amp; Silver Purity"
            subtitle="Gold and silver jewellery priced from live rates. Every estimate derives transparently from the 24K per tola benchmark rate."
          />

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* 24K */}
            <StaggerItem>
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-6 h-full flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#B8923A] transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif tabular-nums text-xs font-bold tracking-wide text-[#7A5A12]">
                      24K · 99.9% Purity
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#B8923A]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Pure Bullion</h4>
                  <p className="text-xs text-[#4A3F35] font-light leading-relaxed">
                    Raw investment gold bar and tola coin standard. Used as the benchmark baseline for all bullion calculations.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2D8C9]/60 text-[11px] font-semibold text-[#7A5A12]">
                  Benchmark Standard
                </div>
              </div>
            </StaggerItem>

            {/* 22K */}
            <StaggerItem>
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-6 h-full flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#B8923A] transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif tabular-nums text-xs font-bold tracking-wide text-[#7A5A12]">
                      22K · 91.6% Purity
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#B8923A]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Royal Bridal Gold</h4>
                  <p className="text-xs text-[#4A3F35] font-light leading-relaxed">
                    The traditional gold standard for bridal chokers, bangles, and family heirlooms (91.6% pure gold).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2D8C9]/60 text-[11px] font-semibold text-[#7A5A12]">
                  Bridal Favourite
                </div>
              </div>
            </StaggerItem>

            {/* 21K */}
            <StaggerItem>
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-6 h-full flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#B8923A] transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif tabular-nums text-xs font-bold tracking-wide text-[#7A5A12]">
                      21K · 87.5% Purity
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#B8923A]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Traditional Festive</h4>
                  <p className="text-xs text-[#4A3F35] font-light leading-relaxed">
                    Ideal balance of radiant warmth and tensile resilience for intricate jhumkas and chandeliers (87.5% pure gold).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2D8C9]/60 text-[11px] font-semibold text-[#7A5A12]">
                  Intricate Wirework
                </div>
              </div>
            </StaggerItem>

            {/* 18K */}
            <StaggerItem>
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-6 h-full flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#B8923A] transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif tabular-nums text-xs font-bold tracking-wide text-[#7A5A12]">
                      18K · 75.0% Purity
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#B8923A]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Contemporary Fine</h4>
                  <p className="text-xs text-[#4A3F35] font-light leading-relaxed">
                    Hardened alloy ideal for stone-set rings, delicate bracelets, and modern fine jewellery (75.0% pure gold).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2D8C9]/60 text-[11px] font-semibold text-[#7A5A12]">
                  Modern &amp; Resilient
                </div>
              </div>
            </StaggerItem>

            {/* 925 Sterling */}
            <StaggerItem>
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-6 h-full flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#A8ADB3] transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif tabular-nums text-xs font-bold tracking-wide text-[#4A3F35]">
                      925 · 92.5% Purity
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#A8ADB3]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Chandi Collection</h4>
                  <p className="text-xs text-[#4A3F35] font-light leading-relaxed">
                    Solid 92.5% pure silver with antique oxidised and mirror-polished options for daily and festive elegance.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2D8C9]/60 text-[11px] font-semibold text-[#4A3F35]">
                  Sterling Silver
                </div>
              </div>
            </StaggerItem>
          </StaggerGrid>
        </div>
      </section>

      {/* 5. WHATSAPP DIRECT CONSULTATION (Ivory Background #FBF8F2) */}
      <section className="bg-[#FBF8F2]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-28">
          <Reveal>
            <div className="bg-white/85 backdrop-blur-xs border border-[#B8923A]/40 rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
              <div className="space-y-3 text-center md:text-left">
                <span className="text-xs uppercase tracking-[0.14em] font-semibold text-[#7A5A12] block">
                  Bespoke Goldsmithing Desk
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1410] font-medium [text-wrap:balance]">
                  Prefer Direct Personal Consultation?
                </h3>
                <p className="text-sm text-[#4A3F35] max-w-xl font-light leading-relaxed">
                  Chat directly with our team on WhatsApp. Send photos of custom designs,
                  ask about live tola rates, or reserve ready pieces.
                </p>
              </div>
              <WhatsAppButton
                href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                  'Assalam-o-Alaikum, I am inquiring about jewellery pieces from Sona & Chandi Gold Collection.'
                )}`}
                label="Chat on WhatsApp"
                size="lg"
                className="shrink-0"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
