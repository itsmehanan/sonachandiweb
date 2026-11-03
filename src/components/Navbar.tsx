import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Menu, X, Sparkles, Scale } from 'lucide-react';
import { BullionRates, formatPKR } from '../lib/pricing';

interface NavbarProps {
  currentView: string;
  currentMetal?: 'all' | 'gold' | 'silver';
  currentCategory?: string;
  onNavigate: (view: string, filter?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  rates?: BullionRates;
  onOpenCalculator?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentMetal = 'all',
  currentCategory,
  onNavigate,
  cartCount,
  onOpenCart,
  rates,
  onOpenCalculator,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnimatingBag, setIsAnimatingBag] = useState(false);
  const prevCountRef = useRef(cartCount);

  // Shrink header slightly on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger bounce & shine sweep when items are added to bag
  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      setIsAnimatingBag(true);
      const timer = setTimeout(() => setIsAnimatingBag(false), 800);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNav = (view: string, filter?: string) => {
    onNavigate(view, filter);
    setMobileMenuOpen(false);
  };

  const hasGoldRate = rates && rates.gold24KPerTola > 0;
  const hasSilverRate = rates && rates.silverRate > 0;

  const isHomeActive = currentView === 'home';
  const isCatalogueActive =
    currentView === 'catalogue' &&
    currentMetal === 'all' &&
    (!currentCategory || currentCategory === 'all');
  const isGoldActive = currentView === 'catalogue' && currentMetal === 'gold';
  const isSilverActive = currentView === 'catalogue' && currentMetal === 'silver';
  const isAboutActive = currentView === 'about';
  const isContactActive = currentView === 'contact';

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-[#FAF7F2]/85 backdrop-blur-md border-b border-[#C9A54B]/30 transition-all duration-300 ease-out ${
          isScrolled ? 'shadow-xs' : ''
        }`}
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 md:gap-8 transition-all duration-300 ease-out ${
            isScrolled ? 'h-16 sm:h-18' : 'h-20 sm:h-22'
          }`}
        >
          {/* Zone 1: Logo Left */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-left focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded-lg outline-hidden group shrink-0 cursor-pointer"
            aria-label="Sona & Chandi Gold Collection Home"
          >
            <img
              src="/assets/aistudio/logo-light_b9e6ed91.png"
              alt="Sona & Chandi Gold Collection"
              className={`w-auto object-contain transition-all duration-300 ease-out group-hover:scale-102 ${
                isScrolled ? 'h-9 sm:h-10' : 'h-11 sm:h-12'
              }`}
              referrerPolicy="no-referrer"
            />
            <div className="hidden min-[440px]:block">
              <span className="font-serif text-base sm:text-lg font-semibold tracking-tight text-[#1E1B18] block leading-tight">
                Sona &amp; Chandi
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#8E6E24] font-medium block">
                Gold Collection
              </span>
            </div>
          </button>

          {/* Zone 2: Nav Centre with Sliding Gold Underline */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#475569]">
            <button
              onClick={() => handleNav('home')}
              aria-current={isHomeActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isHomeActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
              }`}
            >
              <span>Home</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isHomeActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            <button
              onClick={() => handleNav('catalogue')}
              aria-current={isCatalogueActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isCatalogueActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
              }`}
            >
              <span>Catalogue</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isCatalogueActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            <button
              onClick={() => handleNav('catalogue', 'gold')}
              aria-current={isGoldActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isGoldActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
              }`}
            >
              <span>Gold</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isGoldActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            <button
              onClick={() => handleNav('catalogue', 'silver')}
              aria-current={isSilverActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isSilverActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
              }`}
            >
              <span>Silver</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isSilverActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            <button
              onClick={() => handleNav('about')}
              aria-current={isAboutActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isAboutActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
              }`}
            >
              <span>About</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isAboutActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            <button
              onClick={() => handleNav('contact')}
              aria-current={isContactActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isContactActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
              }`}
            >
              <span>Contact</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isContactActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>
          </nav>

          {/* Zone 3: Live Rate Chip + Gold Bag Button + Mobile Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Live Gold/Silver Rate Chip */}
            {rates && (
              <button
                type="button"
                onClick={onOpenCalculator}
                title="View live bullion rates & calculator"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white border border-[#C9A54B]/40 hover:border-[#C9A54B] rounded-full text-xs text-[#1E1B18] shadow-2xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden"
              >
                <span className="flex items-center gap-1 font-medium text-[#8E6E24]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A54B]" />
                  <span className="font-semibold text-[11px] uppercase tracking-wide">24K:</span>
                </span>
                <span className="font-mono text-[11px] font-bold text-[#1E1B18]">
                  {hasGoldRate ? formatPKR(rates.gold24KPerTola) : 'Rate unavailable'}
                </span>
                {hasSilverRate && (
                  <>
                    <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
                    <span className="hidden xl:inline text-[11px] font-medium text-[#64748B]">
                      Ag: <span className="font-mono font-semibold text-[#1E1B18]">{formatPKR(rates.silverRate)}</span>
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Bag Button: Gold gradient circle/pill with bag icon, count badge, bounce & shine sweep */}
            <button
              onClick={onOpenCart}
              aria-label={`Open jewellery bag with ${cartCount} items`}
              className={`relative flex items-center justify-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] hover:brightness-105 active:scale-[0.97] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden ${
                isAnimatingBag ? 'bag-shine-active' : ''
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-white shrink-0" />
              <span className="hidden min-[480px]:inline tracking-wide">Bag / Inquiry</span>

              {cartCount > 0 ? (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 text-[10px] font-bold text-[#8E6E24] bg-white rounded-full tabular-nums shadow-xs ${
                    isAnimatingBag ? 'badge-bounce' : ''
                  }`}
                >
                  {cartCount}
                </span>
              ) : (
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </button>

            {/* Mobile Hamburger Button with min 44px touch target */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-w-[44px] min-h-[44px] p-2 flex items-center justify-center text-[#1E1B18] hover:text-[#8E6E24] rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-In Panel & Scrim */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-In Drawer */}
          <aside className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#FAF7F2] border-l border-[#C9A54B]/30 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E2D8C9]">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/aistudio/logo-light_b9e6ed91.png"
                    alt="Sona & Chandi"
                    className="h-9 w-auto object-contain"
                  />
                  <div>
                    <span className="font-serif text-sm font-bold text-[#1E1B18] block leading-tight">
                      Sona &amp; Chandi
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#8E6E24] font-medium block">
                      Gold Collection
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-[#1E1B18] hover:text-[#8E6E24] hover:bg-[#F3EFEA] flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-[#C9A54B] outline-hidden cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Rate Chip */}
              {rates && (
                <div className="p-4 bg-white/70 border-b border-[#E2D8C9]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#8E6E24] font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#C9A54B]" />
                      24K Gold Rate / Tola
                    </span>
                    <span className="font-mono font-bold text-[#1E1B18]">
                      {hasGoldRate ? formatPKR(rates.gold24KPerTola) : 'Unavailable'}
                    </span>
                  </div>
                  {onOpenCalculator && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCalculator();
                      }}
                      className="w-full mt-2 py-2 px-3 text-center text-xs font-semibold text-[#8E6E24] bg-[#FAF7F2] hover:bg-white border border-[#C9A54B]/40 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Open Bullion Calculator</span>
                    </button>
                  )}
                </div>
              )}

              {/* Navigation Links with large tap targets >= 44px */}
              <nav className="p-4 space-y-1">
                <button
                  onClick={() => handleNav('home')}
                  aria-current={isHomeActive ? 'page' : undefined}
                  className={`w-full min-h-[48px] px-4 py-3 text-left text-sm font-medium rounded-lg flex items-center transition-colors cursor-pointer ${
                    isHomeActive
                      ? 'bg-white text-[#8E6E24] font-semibold border-l-3 border-[#C9A54B] shadow-2xs'
                      : 'text-[#1E1B18] hover:bg-white/80'
                  }`}
                >
                  Home
                </button>

                <button
                  onClick={() => handleNav('catalogue')}
                  aria-current={isCatalogueActive ? 'page' : undefined}
                  className={`w-full min-h-[48px] px-4 py-3 text-left text-sm font-medium rounded-lg flex items-center transition-colors cursor-pointer ${
                    isCatalogueActive
                      ? 'bg-white text-[#8E6E24] font-semibold border-l-3 border-[#C9A54B] shadow-2xs'
                      : 'text-[#1E1B18] hover:bg-white/80'
                  }`}
                >
                  All Jewellery Catalogue
                </button>

                <div className="pl-3 py-1 space-y-1">
                  <button
                    onClick={() => handleNav('catalogue', 'gold')}
                    aria-current={isGoldActive ? 'page' : undefined}
                    className={`w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-medium rounded-lg flex items-center transition-colors cursor-pointer ${
                      isGoldActive
                        ? 'bg-white text-[#8E6E24] font-semibold border-l-3 border-[#C9A54B] shadow-2xs'
                        : 'text-[#475569] hover:bg-white/80 hover:text-[#8E6E24]'
                    }`}
                  >
                    — 24K, 22K, 21K &amp; 18K Gold
                  </button>
                  <button
                    onClick={() => handleNav('catalogue', 'silver')}
                    aria-current={isSilverActive ? 'page' : undefined}
                    className={`w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-medium rounded-lg flex items-center transition-colors cursor-pointer ${
                      isSilverActive
                        ? 'bg-white text-[#8E6E24] font-semibold border-l-3 border-[#C9A54B] shadow-2xs'
                        : 'text-[#475569] hover:bg-white/80 hover:text-[#8E6E24]'
                    }`}
                  >
                    — 925 Pure Sterling Silver
                  </button>
                </div>

                <button
                  onClick={() => handleNav('about')}
                  aria-current={isAboutActive ? 'page' : undefined}
                  className={`w-full min-h-[48px] px-4 py-3 text-left text-sm font-medium rounded-lg flex items-center transition-colors cursor-pointer ${
                    isAboutActive
                      ? 'bg-white text-[#8E6E24] font-semibold border-l-3 border-[#C9A54B] shadow-2xs'
                      : 'text-[#1E1B18] hover:bg-white/80'
                  }`}
                >
                  About Heritage &amp; Hallmarking
                </button>

                <button
                  onClick={() => handleNav('contact')}
                  aria-current={isContactActive ? 'page' : undefined}
                  className={`w-full min-h-[48px] px-4 py-3 text-left text-sm font-medium rounded-lg flex items-center transition-colors cursor-pointer ${
                    isContactActive
                      ? 'bg-white text-[#8E6E24] font-semibold border-l-3 border-[#C9A54B] shadow-2xs'
                      : 'text-[#1E1B18] hover:bg-white/80'
                  }`}
                >
                  Contact &amp; Showroom Timings
                </button>
              </nav>
            </div>

            {/* Bottom Drawer Action */}
            <div className="p-4 border-t border-[#E2D8C9] space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCart();
                }}
                className="w-full min-h-[46px] py-3 px-4 bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] text-white font-semibold text-xs tracking-wider uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                <span>View Bag &amp; Inquiry ({cartCount})</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
