import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Scale, CheckCircle2, ChevronRight, Gem, Crown, Shield } from 'lucide-react';
import { Product, getFeaturedProducts, getSettings } from '../data/store';
import { BullionRates, formatPKR } from '../lib/pricing';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppButton } from '../components/WhatsAppButton';

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
  const [purityRevealed, setPurityRevealed] = useState(false);
  const purityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setPurityRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPurityRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (purityRef.current) {
      observer.observe(purityRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Editorial Luxury Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-transparent via-[#FAF7F2]/60 to-transparent border-b border-[#E2D8C9]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Typography & Intent */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#C9A54B]/40 rounded-full text-xs font-semibold uppercase tracking-wider text-[#8E6E24] shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pakistan’s Trusted Bullion &amp; Fine Jewellery</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#1E1B18] font-normal tracking-tight leading-[1.15] text-balance">
                Timeless Gold &amp; Silver, <br />
                <span className="italic font-serif text-[#8E6E24]">
                  Crafted for Generations.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#64748B] font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Handcrafted Pakistani bridal chokers, engraved 22K karas, and solid 925 sterling
                silver. Transparent bullion pricing updated with real-time bullion benchmark rates.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => onNavigateToCatalogue()}
                  className="gold-sheen w-full sm:w-auto px-8 py-3.5 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-medium text-sm tracking-wide rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore All Jewellery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenCalculator}
                  className="btn-inquiry w-full sm:w-auto px-6 py-3.5 font-semibold text-sm tracking-wide rounded-lg flex items-center justify-center gap-2 shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden"
                >
                  <Scale className="w-4 h-4" />
                  <span>Check Today’s Rate</span>
                </button>
              </div>

              {/* Clean Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A54B]" />
                  <span>100% Laser Hallmarked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A54B]" />
                  <span>Full Weight Guaranteed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A54B]" />
                  <span>Insured Nationwide Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none aspect-4/3 sm:aspect-1/1 rounded-2xl overflow-hidden shadow-2xl border border-[#C9A54B]/30 bg-white">
                <img
                  src="/assets/aistudio/intro-poster_d8a114e6.jpg"
                  alt="Pure 24K and 22K Gold Jewellery"
                  className="w-full h-full object-cover scale-102 hover:scale-100 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs uppercase tracking-widest text-[#EEDFA9] font-medium">
                    Signature Heirloom
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal mt-1">
                    22K &amp; 24K Purity Masterpieces
                  </h3>
                  <p className="text-xs text-white/80 mt-1 font-light">
                    Every piece weighed in grams and tolas with zero stone deductions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Quick Route */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-3 border-b border-[#E2D8C9]">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal">
              Curated Collections
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Select a category to browse weights and designs
            </p>
          </div>
          <button
            onClick={() => onNavigateToCatalogue()}
            className="text-xs font-semibold text-[#8E6E24] hover:text-[#1E1B18] flex items-center gap-1 mt-2 sm:mt-0 cursor-pointer"
          >
            <span>View All Catalogue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
          {[
            {
              label: 'Bridal Sets',
              filter: 'bridal_sets',
              sub: 'Chokers & Haars',
              img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
            },
            {
              label: 'Bangles & Karas',
              filter: 'bangles',
              sub: '22K Embossed',
              img: 'https://images.unsplash.com/photo-1611591475152-4735d387bd34?auto=format&fit=crop&w=600&q=80',
            },
            {
              label: 'Jhumkas & Balis',
              filter: 'earrings',
              sub: '21K Kundan',
              img: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
            },
            {
              label: 'Necklaces',
              filter: 'necklaces',
              sub: 'Haars & Chains',
              img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80',
            },
            {
              label: 'Gold Rings',
              filter: 'rings',
              sub: 'Solitaire & Bands',
              img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
            },
            {
              label: '925 Silver',
              filter: 'silver',
              sub: 'Pure Sterling',
              img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
            },
          ].map((cat) => (
            <button
              key={cat.label}
              onClick={() => onNavigateToCatalogue(cat.filter)}
              className="curated-card-wrapper group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2"
            >
              <div className="bg-white/95 backdrop-blur-xs rounded-[17px] p-3 sm:p-3.5 flex flex-col h-full space-y-2.5">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E2D8C9]/60">
                  <img
                    src={cat.img}
                    alt={cat.label}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div>
                  <h4 className="font-serif text-sm sm:text-base font-semibold text-[#1E1B18] group-hover:text-[#8E6E24] transition-colors leading-tight">
                    {cat.label}
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{cat.sub}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Jewellery Showcase */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-3 border-b border-[#E2D8C9]">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal">
                Signature Bridal &amp; Fine Pieces
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Hand-finished designs with real-time bullion rate estimates
              </p>
            </div>
            <button
              onClick={() => onNavigateToCatalogue()}
              className="text-xs font-semibold text-[#8E6E24] hover:text-[#1E1B18] flex items-center gap-1 mt-2 sm:mt-0 cursor-pointer"
            >
              <span>Browse Full Collection ({featured.length} featured)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                rates={rates}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* Karat Purity Guide & Bullion Transparency */}
      <section ref={purityRef} className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white/90 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-widest text-[#8E6E24] font-semibold">
              The Bullion Purity Standard
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] mt-2 font-normal">
              Understanding Gold &amp; Silver Purity
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2 font-light leading-relaxed">
              We uphold strict hallmarking standards across all metals. Prices are calculated
              transparently from the 24K per tola benchmark rate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            {/* 24K */}
            <div
              className={`purity-card p-5 bg-[#FAF7F2] rounded-xl border border-[#E2D8C9] space-y-2.5 transition-all duration-700 ease-out ${
                purityRevealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              } delay-75`}
            >
              <div className="flex items-center justify-between">
                <span className="karat-shimmer font-mono text-xs sm:text-[13px] font-bold tracking-wide">
                  24K (99.9% Purity)
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A54B]" />
              </div>
              <h4 className="font-serif text-base sm:text-lg font-semibold text-[#1E1B18]">Pure Bullion</h4>
              <p className="text-xs text-[#64748B] font-light leading-relaxed">
                Raw investment gold bar and tola coin standard. Used as the benchmark baseline for all bullion calculations.
              </p>
            </div>

            {/* 22K */}
            <div
              className={`purity-card p-5 bg-[#FAF7F2] rounded-xl border border-[#E2D8C9] space-y-2.5 transition-all duration-700 ease-out ${
                purityRevealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              } delay-150`}
            >
              <div className="flex items-center justify-between">
                <span className="karat-shimmer font-mono text-xs sm:text-[13px] font-bold tracking-wide">
                  22K (91.6% Purity)
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A54B]" />
              </div>
              <h4 className="font-serif text-base sm:text-lg font-semibold text-[#1E1B18]">Royal Bridal Gold</h4>
              <p className="text-xs text-[#64748B] font-light leading-relaxed">
                The Pakistani gold standard for bridal chokers, bangles, and family heirlooms (916 hallmark).
              </p>
            </div>

            {/* 21K */}
            <div
              className={`purity-card p-5 bg-[#FAF7F2] rounded-xl border border-[#E2D8C9] space-y-2.5 transition-all duration-700 ease-out ${
                purityRevealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              } delay-200`}
            >
              <div className="flex items-center justify-between">
                <span className="karat-shimmer font-mono text-xs sm:text-[13px] font-bold tracking-wide">
                  21K (87.5% Purity)
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A54B]" />
              </div>
              <h4 className="font-serif text-base sm:text-lg font-semibold text-[#1E1B18]">Traditional Festive</h4>
              <p className="text-xs text-[#64748B] font-light leading-relaxed">
                Ideal balance of radiant warmth and tensile resilience for intricate jhumkas and chandeliers (875 hallmark).
              </p>
            </div>

            {/* 18K */}
            <div
              className={`purity-card p-5 bg-[#FAF7F2] rounded-xl border border-[#E2D8C9] space-y-2.5 transition-all duration-700 ease-out ${
                purityRevealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              } delay-300`}
            >
              <div className="flex items-center justify-between">
                <span className="karat-shimmer font-mono text-xs sm:text-[13px] font-bold tracking-wide">
                  18K (75.0% Purity)
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A54B]" />
              </div>
              <h4 className="font-serif text-base sm:text-lg font-semibold text-[#1E1B18]">Diamond &amp; Contemporary</h4>
              <p className="text-xs text-[#64748B] font-light leading-relaxed">
                Hardened alloy ideal for stone-set rings, delicate bracelets, and modern fine jewellery (750 hallmark).
              </p>
            </div>

            {/* 925 */}
            <div
              className={`purity-card p-5 bg-[#FAF7F2] rounded-xl border border-[#E2D8C9] space-y-2.5 transition-all duration-700 ease-out ${
                purityRevealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              } delay-500`}
            >
              <div className="flex items-center justify-between">
                <span className="karat-shimmer-silver font-mono text-xs sm:text-[13px] font-bold tracking-wide">
                  925 Sterling Silver
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              </div>
              <h4 className="font-serif text-base sm:text-lg font-semibold text-[#1E1B18]">Chandi Collection</h4>
              <p className="text-xs text-[#64748B] font-light leading-relaxed">
                Solid 92.5% pure silver with antique oxidised and mirror-polished options for daily and festive elegance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Ordering Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF7F2]/80 backdrop-blur-md border border-[#C9A54B]/40 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-serif text-2xl text-[#1E1B18] font-normal">
              Prefer Direct Personal Consultation?
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-xl font-light">
              Chat directly with our master goldsmiths on WhatsApp. Send photos of custom designs,
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
      </section>
    </div>
  );
};
