import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Sparkles,
  Scale,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  MessageCircle,
  MapPin,
  Mail,
  ChevronDown,
  ShoppingBag,
  HelpCircle,
  Gem,
  Award,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Product,
  getFeaturedProducts,
  getSettings,
  getProducts,
  getShowcaseTiles,
  getStoreStatus,
  subscribeToStore,
  optimizeCloudinaryShowcase,
  ShowcaseTile,
  StoreSettings,
} from '../data/store';
import {
  BullionRates,
  getGoldPerGramForKarat,
  getSilverPerGram,
  formatPKR,
} from '../lib/pricing';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { TolaGuide } from '../components/TolaGuide';
import { SocialLinks } from '../components/SocialLinks';
import { FamilyBrandLine } from '../components/FamilyBrandLine';
import { AnimatedGoldBackground } from '../components/AnimatedGoldBackground';
import {
  Reveal,
  StaggerGrid,
  StaggerItem,
  SectionHeading,
} from '../components/motion/MotionUtils';

interface HomePageProps {
  rates: BullionRates;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onNavigateToCatalogue: (filter?: string) => void;
  onOpenCalculator: () => void;
}

interface CuratedTileProps {
  tile: ShowcaseTile;
  products: Product[];
  onNavigate: (target: string) => void;
  isLarge?: boolean;
}

const CuratedTileCard: React.FC<CuratedTileProps> = ({
  tile,
  products,
  onNavigate,
  isLarge = false,
}) => {
  const [imageError, setImageError] = useState(false);

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

  useEffect(() => {
    setImageError(false);
  }, [resolvedImageUrl]);

  const showPlaceholder = !resolvedImageUrl || imageError;

  return (
    <button
      onClick={() => onNavigate(tile.target)}
      className={`group text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B8923A] focus-visible:ring-offset-2 w-full h-full ${
        isLarge ? 'md:row-span-2' : ''
      }`}
    >
      <div
        className={`bg-white/85 backdrop-blur-xs rounded-2xl p-3.5 sm:p-5 flex flex-col h-full space-y-3 border border-[#E2D8C9] shadow-2xs transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_36px_-6px_rgba(184,146,58,0.25)] group-hover:border-[#B8923A] ${
          isLarge ? 'justify-between min-h-[340px] sm:min-h-[440px]' : 'min-h-[240px]'
        }`}
      >
        <div
          className={`relative w-full rounded-xl overflow-hidden bg-[#FBF8F2] border border-[#E2D8C9]/70 flex items-center justify-center ${
            isLarge ? 'aspect-4/5 md:aspect-4/5 flex-1' : 'aspect-4/5'
          }`}
        >
          {!showPlaceholder ? (
            <>
              <img
                src={resolvedImageUrl}
                alt={tile.title}
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FBF8F2] via-[#F3EAD7] to-[#E9DCBF] p-4 flex flex-col items-center justify-center text-center gap-2 group-hover:scale-105 transition-transform duration-500">
              <Sparkles className="w-8 h-8 text-[#B8923A] stroke-[1.25]" />
              <span className="font-serif text-sm font-semibold text-[#7A5A12] leading-tight">
                {tile.title}
              </span>
              <span className="text-[9px] uppercase tracking-[0.14em] text-[#6E6259]">
                Sona Chandi
              </span>
            </div>
          )}
          {isLarge && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1A1410]/85 text-[#F1D98B] backdrop-blur-xs border border-[#C9A54B]/40">
              Featured Suite
            </span>
          )}
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between">
            <h4
              className={`font-serif text-[#1A1410] group-hover:text-[#7A5A12] transition-colors leading-tight font-medium ${
                isLarge ? 'text-lg sm:text-2xl' : 'text-base sm:text-lg'
              }`}
            >
              {tile.title}
            </h4>
            <ArrowRight className="w-4 h-4 text-[#B8923A] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0" />
          </div>
          <p className="text-xs text-[#6E6259] mt-1 font-light line-clamp-1">{tile.subtitle}</p>
        </div>
      </div>
    </button>
  );
};

export const HomePage: React.FC<HomePageProps> = ({
  rates,
  onSelectProduct,
  onAddToCart,
  onNavigateToCatalogue,
  onOpenCalculator,
}) => {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [settings, setSettings] = useState<StoreSettings>(() => getSettings());
  const [showcaseTiles, setShowcaseTiles] = useState<ShowcaseTile[]>(() => getShowcaseTiles());
  const [storeStatus, setStoreStatus] = useState(() => getStoreStatus());
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setProducts(getProducts());
      setSettings(getSettings());
      setShowcaseTiles(getShowcaseTiles());
      setStoreStatus(getStoreStatus());
    });
    return unsubscribe;
  }, []);

  // 8 newest active products
  const newestProducts = useMemo(() => {
    return products
      .filter((p) => p.inStock)
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 8);
  }, [products]);

  // Featured signature pieces
  const signatureProducts = useMemo(() => {
    const feat = getFeaturedProducts();
    return feat.length > 0 ? feat : products.slice(0, 4);
  }, [products]);

  // Visible tiles sorted by order
  const visibleTiles = useMemo(() => {
    return showcaseTiles
      .filter((t) => t.visible !== false)
      .sort((a, b) => a.order - b.order);
  }, [showcaseTiles]);

  // Hero image resolution (prioritize showcase tile image, then about image, then workspace poster)
  const heroImageUrl = useMemo(() => {
    const tileWithImage = showcaseTiles.find((t) => t.imageUrl && t.imageUrl.trim());
    if (tileWithImage?.imageUrl) return optimizeCloudinaryShowcase(tileWithImage.imageUrl);
    if (settings.aboutPageImageUrl) return optimizeCloudinaryShowcase(settings.aboutPageImageUrl);
    return '/assets/aistudio/intro-poster_d8a114e6.jpg';
  }, [showcaseTiles, settings.aboutPageImageUrl]);

  // Per-gram live rates derived strictly from pricing rules
  const rate24kGram = getGoldPerGramForKarat('24K', rates.gold24KPerTola);
  const rate22kGram = getGoldPerGramForKarat('22K', rates.gold24KPerTola);
  const rate21kGram = getGoldPerGramForKarat('21K', rates.gold24KPerTola);
  const rate18kGram = getGoldPerGramForKarat('18K', rates.gold24KPerTola);
  const rateSilverPerGram = getSilverPerGram(rates.silverRate, rates.silverUnit);

  // Live stats from actual database
  const activeCount = useMemo(() => products.filter((p) => p.inStock).length, [products]);
  const categoriesCount = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return set.size || 6;
  }, [products]);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const faqList = [
    {
      q: 'How is the price calculated for each jewellery piece?',
      a: "Every jewellery estimate derives mathematically from today's live 24K bullion benchmark divided by 11.6638 grams (1 tola), adjusted for the exact karat purity (22K is 22/24 parts pure), multiplied by the full gross weight, plus the transparent making charge. We never deduct stone weight, and we never add wastage or sales surcharges.",
    },
    {
      q: 'Is the storefront estimate final?',
      a: 'The storefront estimate reflects the prevailing live market rate. When you tap "Order on WhatsApp", our sales desk locks in the exact live bullion rate of that very moment with you before your booking is finalized.',
    },
    {
      q: 'How do I place an order or custom request?',
      a: "Add items to your bag and tap 'Proceed to WhatsApp' or tap 'Order on WhatsApp' on any piece. A pre-filled inquiry with exact SKU, gross weight, and today's rate calculation is automatically sent to our master goldsmiths.",
    },
    {
      q: 'Do you offer courier delivery or showroom pickup?',
      a: 'We offer fully insured nationwide courier delivery in tamper-evident security packing across Pakistan, as well as private showroom pickup during operating hours.',
    },
    {
      q: 'What is a tola in Pakistani bullion trading?',
      a: 'Our tola equals exactly 11.6638 grams (the legal standard recognized across Khyber Pakhtunkhwa, Punjab, Sindh, and Balochistan). We never round a tola down to 10g or 12g, ensuring your investment retains every milligram of value.',
      hasTolaGuide: true,
    },
  ];

  return (
    <div className="min-h-screen text-[#1A1410] overflow-x-hidden">
      {/* 1. HERO SECTION (Split Layout) - Ivory #FBF8F2 */}
      <section className="relative bg-[#FBF8F2] overflow-hidden border-b border-[#E2D8C9]/80 py-16 sm:py-24 lg:py-28">
        {/* Subtle Silk Thread and Gold Dust Background Canvas */}
        <div className="absolute inset-0 pointer-events-none opacity-35 z-0" aria-hidden="true">
          <AnimatedGoldBackground />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Typography, Subtitle, CTA buttons, Open/Closed Badge */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-7">
              {/* Family Line & Kicker */}
              <div className="inline-flex flex-col items-center lg:items-start space-y-1">
                <FamilyBrandLine settings={settings} />
                <div className="flex items-center gap-2 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8923A]" />
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#7A5A12]">
                    Pakistani Fine Jewellery · Bullion Benchmark
                  </span>
                </div>
              </div>

              {/* Large Playfair Headline */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#1A1410] font-normal tracking-tight leading-[1.12] [text-wrap:balance]">
                Gold and silver jewellery, priced from today’s rates.
              </h1>

              {/* One-Line Subtitle */}
              <p className="text-base sm:text-lg text-[#5C5046] font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Calculated transparently from 24K bullion benchmarks with verified gross weights and honest per-gram making charges.
              </p>

              {/* Action Buttons: Gold "Explore Collection" & Green "Order on WhatsApp" */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateToCatalogue()}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] hover:brightness-105 active:scale-[0.98] text-[#1A1410] font-semibold text-xs sm:text-sm tracking-wide uppercase transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer text-center"
                >
                  Explore Collection
                </button>

                {settings.whatsappNumber ? (
                  <WhatsAppButton
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      'Assalam-o-Alaikum, I am visiting Sona Chandi Gold Collection and would like to inquire about today’s jewellery pieces.'
                    )}`}
                    label="Order on WhatsApp"
                    size="lg"
                    className="w-full sm:w-auto"
                  />
                ) : null}
              </div>

              {/* Small Open / Closed Badge */}
              <div className="flex items-center justify-center lg:justify-start gap-2 pt-1 text-xs text-[#5C5046]">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                    storeStatus.isOpen
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      storeStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span>{storeStatus.isOpen ? 'Showroom Open Now' : 'Showroom Closed'}</span>
                </span>
                <span className="text-[#8A8174]">·</span>
                <span className="text-[11px] text-[#6E6259]">
                  {settings.storeHoursDescription || 'Mon – Sat: 9:00 AM – 9:00 PM PKT'}
                </span>
              </div>
            </div>

            {/* Right Column: Tall Arch-Shaped Image Frame with Floating Bobbing Cards */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-[340px] sm:max-w-[400px]">
                {/* Arch Frame with Soft Glow */}
                <div className="relative aspect-3/4 rounded-t-[140px] sm:rounded-t-[200px] rounded-b-3xl overflow-hidden border-2 border-[#B8923A]/45 shadow-[0_24px_60px_-15px_rgba(184,146,58,0.28)] bg-[#1A1410] ring-1 ring-[#F1D98B]/30 ring-inset">
                  <motion.img
                    src={heroImageUrl}
                    alt="Sona Chandi Heirloom Fine Jewellery"
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating Card 1: Live Rate Card with Bob animation */}
                <motion.div
                  className="absolute -top-4 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md border border-[#E2D8C9] p-3.5 sm:p-4 rounded-2xl shadow-lg shadow-[#B8923A]/10 text-left max-w-[220px]"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          y: [0, -7, 0],
                        }
                  }
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#7A5A12]">
                      Live Bullion Rate
                    </span>
                    <TolaGuide triggerVariant="icon" tone="gold" iconSize={12} />
                  </div>
                  <div className="font-serif text-sm sm:text-base font-bold text-[#1A1410] mt-0.5">
                    {rates.gold24KPerTola > 0
                      ? `24K: ${formatPKR(rates.gold24KPerTola)}`
                      : 'Live Rate Available'}
                  </div>
                  <span className="text-[10px] text-[#6E6259] block">per tola (11.6638g standard)</span>
                </motion.div>

                {/* Floating Card 2: WhatsApp Card with Bob animation */}
                <motion.div
                  className="absolute -bottom-4 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md border border-[#25D366]/40 p-3 sm:p-3.5 rounded-2xl shadow-lg shadow-emerald-500/10 text-left flex items-center gap-2.5 max-w-[210px]"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          y: [0, 7, 0],
                        }
                  }
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#E8F8EE] flex items-center justify-center shrink-0 text-[#25D366]">
                    <MessageCircle className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#1A1410] block leading-tight">
                      Order on WhatsApp
                    </span>
                    <span className="text-[10px] text-[#5C5046] block">Confirmed in minutes</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP (True Selling Points) - Champagne #F3EAD7 */}
      <section className="bg-[#F3EAD7] border-b border-[#E2D8C9]/80 py-5 sm:py-6">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/80 border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12] shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif text-xs sm:text-sm font-semibold text-[#1A1410] block leading-tight">
                  Live Rates Daily
                </span>
                <span className="text-[11px] text-[#5C5046]">Gold &amp; silver bullion</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/80 border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12] shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif text-xs sm:text-sm font-semibold text-[#1A1410] block leading-tight">
                  Transparent Making
                </span>
                <span className="text-[11px] text-[#5C5046]">Per gram or fixed charge</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/80 border border-[#B8923A]/30 flex items-center justify-center text-[#25D366] shrink-0">
                <MessageCircle className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="font-serif text-xs sm:text-sm font-semibold text-[#1A1410] block leading-tight">
                  WhatsApp Direct
                </span>
                <span className="text-[11px] text-[#5C5046]">Instant price lock &amp; booking</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/80 border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12] shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif text-xs sm:text-sm font-semibold text-[#1A1410] block leading-tight">
                  Transit or Pickup
                </span>
                <span className="text-[11px] text-[#5C5046]">Insured courier or showroom</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CURATED COLLECTIONS (Editorial Tile Layout) - Ivory #FBF8F2 */}
      <section className="bg-[#FBF8F2] border-b border-[#E2D8C9]/70 py-16 sm:py-28">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-12">
          <SectionHeading
            kicker="Curated Collections"
            title="Explore Fine Gold &amp; Silver Suites"
            subtitle="Explore our handcrafted bridal sets, everyday gold rings, antique balis, and hallmark silver jewellery."
          />

          {visibleTiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* First tile rendered larger on desktop */}
              {visibleTiles.map((tile, idx) => (
                <CuratedTileCard
                  key={tile.id}
                  tile={tile}
                  products={products}
                  onNavigate={(target) => onNavigateToCatalogue(target)}
                  isLarge={idx === 0}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[#7A5A12] bg-[#F3EAD7]/50 rounded-2xl border border-[#E2D8C9]">
              Collections are being curated.
            </div>
          )}
        </div>
      </section>

      {/* 4A. NEW ARRIVALS (8 newest products) - Champagne #F3EAD7 */}
      {newestProducts.length > 0 && (
        <section className="bg-[#F3EAD7] border-b border-[#E2D8C9]/70 py-16 sm:py-28">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8923A]" />
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#7A5A12]">
                    Fresh From the Workshop
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl text-[#1A1410] font-normal mt-1">
                  New Arrivals
                </h2>
                <p className="text-xs sm:text-sm text-[#5C5046] mt-1 font-light">
                  Freshly weighed and calibrated pieces added to our catalog.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToCatalogue()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A5A12] hover:text-[#1A1410] uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>View all new pieces</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {newestProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  rates={rates}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4B. SIGNATURE PIECES (Featured Creations) - Ivory #FBF8F2 */}
      {signatureProducts.length > 0 && (
        <section className="bg-[#FBF8F2] border-b border-[#E2D8C9]/70 py-16 sm:py-28">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C9A54B]" />
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#7A5A12]">
                    Heirloom Craftsmanship
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl text-[#1A1410] font-normal mt-1">
                  Signature Creations
                </h2>
                <p className="text-xs sm:text-sm text-[#5C5046] mt-1 font-light">
                  Royal 22K bridal ornaments and solid sterling silver masterworks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToCatalogue()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A5A12] hover:text-[#1A1410] uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>Explore full collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {signatureProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  rates={rates}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. TODAY'S RATES BAND - Dark Espresso #12100E */}
      <section className="bg-gradient-to-b from-[#12100E] via-[#1A1410] to-[#12100E] text-[#FBF8F2] py-14 sm:py-20 border-b border-[#C9A54B]/35">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2D241C] pb-6">
            <div>
              <div className="flex items-center gap-2 text-[#C9A54B]">
                <Scale className="w-4 h-4" />
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">
                  Transparent Bullion Market
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal text-white mt-1">
                Today’s Live Bullion Benchmarks
              </h2>
              <p className="text-xs text-[#A89F91] mt-1 font-light">
                {rates.lastUpdated ? rates.lastUpdated : 'Calibrated with daily bullion market rates'} · All provincial Pakistani markets
              </p>
            </div>

            <div className="flex items-center gap-3">
              <TolaGuide triggerVariant="badge" label="What is a tola?" tone="dark" />
              <button
                type="button"
                onClick={onOpenCalculator}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] hover:brightness-105 active:scale-95 text-[#1A1410] text-xs font-semibold uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Open Price Estimator
              </button>
            </div>
          </div>

          {/* Rates Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <div className="p-4 rounded-xl bg-[#1F1914] border border-[#C9A54B]/30 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#F1D98B]">
                24K Pure Gold
              </span>
              <div className="font-mono text-base sm:text-xl font-bold text-white tabular-nums">
                {rate24kGram > 0 ? `Rs. ${formatPKR(Math.round(rate24kGram))}` : 'Rate Loading'}
              </div>
              <span className="text-[10px] text-[#A89F91] block">per gram (99.9% pure)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#1F1914] border border-[#C9A54B]/30 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#F1D98B]">
                22K Bridal Gold
              </span>
              <div className="font-mono text-base sm:text-xl font-bold text-white tabular-nums">
                {rate22kGram > 0 ? `Rs. ${formatPKR(Math.round(rate22kGram))}` : 'Rate Loading'}
              </div>
              <span className="text-[10px] text-[#A89F91] block">per gram (91.6% pure)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#1F1914] border border-[#C9A54B]/30 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#F1D98B]">
                21K Traditional
              </span>
              <div className="font-mono text-base sm:text-xl font-bold text-white tabular-nums">
                {rate21kGram > 0 ? `Rs. ${formatPKR(Math.round(rate21kGram))}` : 'Rate Loading'}
              </div>
              <span className="text-[10px] text-[#A89F91] block">per gram (87.5% pure)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#1F1914] border border-[#C9A54B]/30 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#F1D98B]">
                18K Contemporary
              </span>
              <div className="font-mono text-base sm:text-xl font-bold text-white tabular-nums">
                {rate18kGram > 0 ? `Rs. ${formatPKR(Math.round(rate18kGram))}` : 'Rate Loading'}
              </div>
              <span className="text-[10px] text-[#A89F91] block">per gram (75.0% pure)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#1F1914] border border-[#C9A54B]/30 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A8ADB3]">
                925 Sterling Silver
              </span>
              <div className="font-mono text-base sm:text-xl font-bold text-white tabular-nums">
                {rateSilverPerGram > 0
                  ? `Rs. ${formatPKR(Math.round(rateSilverPerGram))}`
                  : 'Rate Loading'}
              </div>
              <span className="text-[10px] text-[#A89F91] block">
                per gram ({rates.silverRate > 0 ? `Rs. ${formatPKR(rates.silverRate)} / tola` : 'Live bullion'})
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS (Three Steps) - Champagne #F3EAD7 */}
      <section className="bg-[#F3EAD7] border-b border-[#E2D8C9]/80 py-16 sm:py-28">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-14">
          <SectionHeading
            kicker="Effortless Ordering"
            title="How Sona Chandi Works"
            subtitle="Transparent live-rate purchases direct from our artisan showroom with zero complexity."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className="font-serif text-3xl font-bold text-[#C9A54B]/40">01</span>
                </div>
                <h3 className="font-serif text-xl font-medium text-[#1A1410]">Choose your pieces</h3>
                <p className="text-xs sm:text-sm text-[#5C5046] font-light leading-relaxed">
                  Browse our ready catalogue or use the Bullion Calculator to explore custom weights in grams and tolas.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-[#7A5A12]">
                Verified weights &amp; specs
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#E8F8EE] border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
                    <MessageCircle className="w-6 h-6 fill-current" />
                  </div>
                  <span className="font-serif text-3xl font-bold text-[#C9A54B]/40">02</span>
                </div>
                <h3 className="font-serif text-xl font-medium text-[#1A1410]">Send your bag on WhatsApp</h3>
                <p className="text-xs sm:text-sm text-[#5C5046] font-light leading-relaxed">
                  One tap forwards your bag items with exact SKUs, karat purities, and current estimates directly to our sales team.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-[#25D366]">
                Instant pre-formatted message
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 sm:p-8 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-4 shadow-sm hover:border-[#B8923A] transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="font-serif text-3xl font-bold text-[#C9A54B]/40">03</span>
                </div>
                <h3 className="font-serif text-xl font-medium text-[#1A1410]">We confirm the final price</h3>
                <p className="text-xs sm:text-sm text-[#5C5046] font-light leading-relaxed">
                  Our team confirms today's precise live rate, sets your delivery or pickup timeline, and processes your order safely.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-[#7A5A12]">
                Guaranteed transparency
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. STATS ROW (From Live Data) - Ivory #FBF8F2 */}
      <section className="bg-[#FBF8F2] border-b border-[#E2D8C9]/80 py-12 sm:py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-2xl bg-white border border-[#E2D8C9] shadow-2xs space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#7A5A12] tabular-nums">
                {activeCount > 0 ? activeCount : 'Catalog'}
              </div>
              <h4 className="font-serif text-base font-semibold text-[#1A1410]">
                Active Jewellery Pieces
              </h4>
              <p className="text-xs text-[#6E6259] font-light">
                Ready in stock across bridal, rings, necklaces, and bangles
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E2D8C9] shadow-2xs space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#7A5A12] tabular-nums">
                {categoriesCount}
              </div>
              <h4 className="font-serif text-base font-semibold text-[#1A1410]">
                Curated Ornament Categories
              </h4>
              <p className="text-xs text-[#6E6259] font-light">
                Gold bridal sets, bangles, necklaces, earrings, and solid 925 silver
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E2D8C9] shadow-2xs space-y-1">
              <div className="font-serif text-xl sm:text-2xl font-bold text-[#7A5A12] truncate">
                {storeStatus.isOpen ? 'Open Now' : 'Showroom Desk'}
              </div>
              <h4 className="font-serif text-base font-semibold text-[#1A1410]">
                Operating Schedule
              </h4>
              <p className="text-xs text-[#6E6259] font-light">
                {settings.storeHoursDescription || 'Monday to Saturday: 9:00 AM – 9:00 PM PKT'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PURITY SECTION & FAQ ACCORDION - Champagne #F3EAD7 */}
      <section className="bg-[#F3EAD7] border-b border-[#E2D8C9]/80 py-16 sm:py-28">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-16">
          {/* Purity Standard Cards */}
          <div className="space-y-10">
            <div className="flex flex-col items-center">
              <SectionHeading
                kicker="The Bullion Standard"
                title="Understanding Gold &amp; Silver Purity"
                subtitle="Every price estimate derives transparently from daily bullion market benchmarks."
              />
              <div className="-mt-6 mb-2">
                <TolaGuide triggerVariant="badge" label="What is a tola?" tone="light" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
              {/* 24K */}
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#B8923A] transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-bold text-[#7A5A12]">
                      24K · 99.9% Purity
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#B8923A]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Pure Bullion</h4>
                  <p className="text-xs text-[#5C5046] font-light leading-relaxed">
                    Raw investment bar and coin standard. Baseline for all pricing formulas.
                  </p>
                  <TolaGuide triggerVariant="chip" label="1 tola = 11.6638g" tone="gold" />
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#E2D8C9] text-[10px] font-semibold text-[#7A5A12]">
                  Benchmark Standard
                </div>
              </div>

              {/* 22K */}
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#B8923A] transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-bold text-[#7A5A12]">
                      22K · 91.6% Purity
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#B8923A]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Royal Bridal</h4>
                  <p className="text-xs text-[#5C5046] font-light leading-relaxed">
                    The time-honoured standard for Pakistani bridal sets, bangles, and heirloom necklaces.
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#E2D8C9] text-[10px] font-semibold text-[#7A5A12]">
                  Bridal Favourite
                </div>
              </div>

              {/* 21K */}
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#B8923A] transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-bold text-[#7A5A12]">
                      21K · 87.5% Purity
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#B8923A]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Traditional</h4>
                  <p className="text-xs text-[#5C5046] font-light leading-relaxed">
                    Resilient alloy offering intense warm gold hues for intricate filigree and karas.
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#E2D8C9] text-[10px] font-semibold text-[#7A5A12]">
                  Festive Durability
                </div>
              </div>

              {/* 18K */}
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#B8923A] transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-bold text-[#7A5A12]">
                      18K · 75.0% Purity
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#B8923A]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Contemporary</h4>
                  <p className="text-xs text-[#5C5046] font-light leading-relaxed">
                    Modern lightweight gold balancing structure with refined luxury.
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#E2D8C9] text-[10px] font-semibold text-[#7A5A12]">
                  Modern Elegance
                </div>
              </div>

              {/* Chandi */}
              <div className="bg-white/85 backdrop-blur-xs rounded-2xl border border-[#E2D8C9] p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:-translate-y-1 hover:border-[#B8923A] transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-bold text-[#5C5046]">
                      925 Sterling
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#A8ADB3]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#1A1410]">Chandi Silver</h4>
                  <p className="text-xs text-[#5C5046] font-light leading-relaxed">
                    Solid 92.5% silver with antique oxidised and mirror-polished finishes.
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#E2D8C9] text-[10px] font-semibold text-[#5C5046]">
                  Sterling Silver
                </div>
              </div>
            </div>
          </div>

          {/* Truthful FAQ Accordion */}
          <div className="max-w-3xl mx-auto space-y-6 pt-4">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A5A12]">
                Honest Answers
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#1A1410]">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-3">
              {faqList.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-[#E2D8C9] rounded-2xl bg-white/90 overflow-hidden shadow-2xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B8923A]"
                      aria-expanded={isOpen}
                    >
                      <span className="font-serif text-sm sm:text-base font-semibold text-[#1A1410]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#7A5A12] transition-transform duration-300 shrink-0 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-[#5C5046] leading-relaxed border-t border-[#E2D8C9]/60 pt-3 space-y-3">
                        <p>{item.a}</p>
                        {item.hasTolaGuide && (
                          <div className="pt-1">
                            <TolaGuide triggerVariant="badge" label="Open Tola Guide" tone="light" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 9. VISIT AND FOLLOW & FINAL WHATSAPP CTA - Ivory #FBF8F2 */}
      <section className="bg-[#FBF8F2] py-16 sm:py-28">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-12">
          {/* Showroom & Digital Connect Card */}
          <div className="p-8 sm:p-12 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-3xl shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Boutique Location */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#7A5A12]">
                  <MapPin className="w-5 h-5 shrink-0" />
                  <h4 className="font-serif text-base sm:text-lg font-semibold text-[#1A1410]">
                    Showroom Boutique
                  </h4>
                </div>
                {settings.address && settings.address.trim() !== '' ? (
                  <p className="text-xs sm:text-sm text-[#5C5046] font-light leading-relaxed">
                    {settings.address}
                  </p>
                ) : (
                  <p className="text-xs text-[#5C5046] font-light italic">
                    Private bridal appointments and showroom pickups arranged directly on WhatsApp.
                  </p>
                )}
              </div>

              {/* Showroom Hours & Badge */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#7A5A12]">
                  <Clock className="w-5 h-5 shrink-0" />
                  <h4 className="font-serif text-base sm:text-lg font-semibold text-[#1A1410]">
                    Operating Hours
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-[#5C5046] font-light">
                  {settings.storeHoursDescription || 'Monday – Saturday: 9:00 AM – 9:00 PM PKT'}
                </p>
                <div className="pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      storeStatus.isOpen
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        storeStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span>{storeStatus.isOpen ? 'Open Now' : 'Closed'}</span>
                  </span>
                </div>
              </div>

              {/* Digital Inquiries & Social */}
              <div className="space-y-3">
                <h4 className="font-serif text-base sm:text-lg font-semibold text-[#1A1410]">
                  Official Contact Lines
                </h4>

                {settings.contactEmail && settings.contactEmail.trim() !== '' && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-4 h-4 text-[#7A5A12] shrink-0" />
                    <a
                      href={`mailto:${settings.contactEmail.trim()}`}
                      className="text-[#5C5046] hover:text-[#7A5A12] underline underline-offset-2"
                    >
                      {settings.contactEmail.trim()}
                    </a>
                  </div>
                )}

                <div className="pt-1">
                  <SocialLinks socialHandles={settings.socialHandles} variant="gold" size="md" />
                </div>
              </div>
            </div>

            {/* Final Big WhatsApp Banner */}
            <div className="pt-8 border-t border-[#E2D8C9] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A12] block">
                  Artisan Goldsmith Desk
                </span>
                <h3 className="font-serif text-xl sm:text-3xl text-[#1A1410] font-normal [text-wrap:balance]">
                  Have a question or custom design?
                </h3>
                <p className="text-xs sm:text-sm text-[#5C5046] font-light max-w-xl">
                  Chat directly with our master goldsmiths. Send design photos, check live rates, or reserve catalogue pieces in minutes.
                </p>
              </div>

              {settings.whatsappNumber ? (
                <WhatsAppButton
                  href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    'Assalam-o-Alaikum, I would like to inquire about fine jewellery pieces from Sona Chandi Gold Collection.'
                  )}`}
                  label="Chat on WhatsApp"
                  size="lg"
                  className="shrink-0"
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
