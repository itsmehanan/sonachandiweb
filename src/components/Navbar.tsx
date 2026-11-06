import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Menu,
  X,
  Search,
  Scale,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { BullionRates, formatPKR } from '../lib/pricing';
import { getSettings, getStoreStatus, Product } from '../data/store';
import { WhatsAppButton } from './WhatsAppButton';
import { SearchOverlay } from './SearchOverlay';

export interface NavigateOptions {
  metal?: 'all' | 'gold' | 'silver';
  category?: string;
  karat?: string;
  sort?: string;
  search?: string;
}

interface NavbarProps {
  currentView: string;
  currentMetal?: 'all' | 'gold' | 'silver';
  currentCategory?: string;
  currentKarat?: string;
  currentSort?: string;
  onNavigate: (view: string, filterOrOptions?: string | NavigateOptions) => void;
  cartCount: number;
  onOpenCart: () => void;
  rates?: BullionRates;
  onOpenCalculator?: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentMetal = 'all',
  currentCategory,
  currentKarat = 'all',
  currentSort = 'featured',
  onNavigate,
  cartCount,
  onOpenCart,
  rates = { gold24KPerTola: 0, silverRate: 0, silverUnit: 'per_tola', lastUpdated: '' },
  onOpenCalculator,
  onSelectProduct,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnimatingBag, setIsAnimatingBag] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Desktop Dropdown State: 'gold' | 'silver' | null
  const [activeDropdown, setActiveDropdown] = useState<'gold' | 'silver' | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef = useRef(cartCount);

  // Mobile Accordion State
  const [mobileGoldOpen, setMobileGoldOpen] = useState(false);
  const [mobileSilverOpen, setMobileSilverOpen] = useState(false);

  const settings = getSettings();
  const storeStatus = getStoreStatus();

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

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setActiveDropdown(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 120ms hover delay handlers for desktop mega-menu
  const handleMouseEnter = (dropdown: 'gold' | 'silver') => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(dropdown);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 120);
  };

  const handleToggleClick = (dropdown: 'gold' | 'silver') => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveDropdown((prev) => (prev === dropdown ? null : dropdown));
  };

  const handleNav = (view: string, options?: string | NavigateOptions) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    onNavigate(view, options);
  };

  const handleSearchSubmit = (query: string) => {
    setSearchOpen(false);
    onNavigate('catalogue', { search: query, metal: 'all', category: undefined, karat: 'all' });
  };

  const handleSelectProductFromSearch = (product: Product) => {
    setSearchOpen(false);
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      onNavigate('product_detail');
    }
  };

  // Nav item active check rules
  const isHomeActive = currentView === 'home';
  const isNewArrivalsActive = currentView === 'catalogue' && currentSort === 'newest';
  const isGoldActive = currentView === 'catalogue' && currentMetal === 'gold';
  const isSilverActive = currentView === 'catalogue' && currentMetal === 'silver';
  const isBridalActive = currentView === 'catalogue' && currentCategory === 'bridal_sets';
  const isAboutActive = currentView === 'about';
  const isContactActive = currentView === 'contact';

  const shopGoldCategories = [
    { label: 'All Gold', category: undefined },
    { label: 'Rings', category: 'rings' },
    { label: 'Necklaces', category: 'necklaces' },
    { label: 'Bangles', category: 'bangles' },
    { label: 'Earrings', category: 'earrings' },
    { label: 'Bridal Sets', category: 'bridal_sets' },
  ];

  const goldPurities = [
    { label: '24K Gold', sub: '99.9% Pure Bullion', karat: '24K' },
    { label: '22K Gold', sub: '91.6% Fine Jewellery', karat: '22K' },
    { label: '21K Gold', sub: '87.5% Traditional', karat: '21K' },
    { label: '18K Gold', sub: '75.0% Contemporary', karat: '18K' },
  ];

  const shopSilverCategories = [
    { label: 'All Silver', category: undefined },
    { label: 'Rings', category: 'rings' },
    { label: 'Necklaces', category: 'necklaces' },
    { label: 'Bangles', category: 'bangles' },
    { label: 'Earrings', category: 'earrings' },
    { label: 'Bridal Sets', category: 'bridal_sets' },
  ];

  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        'Hello Sona & Chandi Gold Collection, I would like to inquire about your jewellery.'
      )}`
    : undefined;

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-[#FBF8F2]/85 backdrop-blur-md border-b border-[#C9A54B]/30 transition-all duration-300 ease-out ${
          isScrolled ? 'shadow-xs' : ''
        }`}
      >
        <div
          className={`max-w-[1280px] mx-auto px-4 sm:px-8 flex items-center justify-between gap-3 md:gap-6 transition-all duration-300 ease-out ${
            isScrolled ? 'h-16 sm:h-18' : 'h-20 sm:h-22'
          }`}
        >
          {/* Zone 1: Logo Left (larger on desktop) */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-left focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded-lg outline-hidden group shrink-0 cursor-pointer"
            aria-label="Sona & Chandi Gold Collection Home"
          >
            <img
              src="/assets/aistudio/logo-light.png"
              alt="Sona & Chandi Gold Collection"
              className={`w-auto object-contain transition-all duration-300 ease-out group-hover:scale-102 ${
                isScrolled ? 'h-10 sm:h-12 lg:h-13' : 'h-12 sm:h-14 lg:h-16'
              }`}
              referrerPolicy="no-referrer"
            />
            <div className="hidden min-[480px]:block">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1410] block leading-tight">
                Sona &amp; Chandi
              </span>
              <span className="text-[10px] sm:text-[11px] tracking-widest uppercase text-[#7A5A12] font-semibold block">
                Gold Collection
              </span>
            </div>
          </button>

          {/* Zone 2: Nav Centre */}
          <nav
            data-dropdown-container
            className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium text-[#4A3F35]"
          >
            {/* 1. Home */}
            <button
              onClick={() => handleNav('home')}
              aria-current={isHomeActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isHomeActive ? 'text-[#7A5A12] font-semibold' : 'hover:text-[#1A1410]'
              }`}
            >
              <span>Home</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isHomeActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            {/* 2. New Arrivals (catalogue sorted newest first) */}
            <button
              onClick={() =>
                handleNav('catalogue', {
                  sort: 'newest',
                  metal: 'all',
                  category: undefined,
                  karat: 'all',
                })
              }
              aria-current={isNewArrivalsActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isNewArrivalsActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
              }`}
            >
              <span>New Arrivals</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isNewArrivalsActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            {/* 3. Gold (Dropdown mega-menu) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('gold')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => handleToggleClick('gold')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleClick('gold');
                  }
                }}
                aria-expanded={activeDropdown === 'gold'}
                aria-haspopup="true"
                aria-current={isGoldActive ? 'page' : undefined}
                className={`relative py-2.5 flex items-center gap-1 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                  isGoldActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
                }`}
              >
                <span>Gold</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#C9A54B] transition-transform duration-200 ${
                    activeDropdown === 'gold' ? 'rotate-180' : ''
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                    isGoldActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </button>

              {/* Gold Mega-Menu Panel */}
              {activeDropdown === 'gold' && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ width: '420px' }}
                >
                  <div className="bg-[#FAF7F2] border border-[#C9A54B]/35 rounded-2xl shadow-xl p-5 backdrop-blur-md">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Column 1: Shop Gold */}
                      <div>
                        <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#8E6E24] block pb-2.5 mb-2 border-b border-[#E2D8C9]">
                          Shop Gold
                        </span>
                        <div className="space-y-1">
                          {shopGoldCategories.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() =>
                                handleNav('catalogue', {
                                  metal: 'gold',
                                  category: item.category,
                                  karat: 'all',
                                  sort: 'featured',
                                  search: '',
                                })
                              }
                              className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-[#1E1B18] hover:text-[#8E6E24] hover:bg-[#F3EFEA] rounded-lg transition-colors flex items-center justify-between cursor-pointer focus-visible:ring-1 focus-visible:ring-[#C9A54B] outline-hidden"
                            >
                              <span>{item.label}</span>
                              <ArrowRight className="w-3 h-3 text-[#C9A54B] opacity-0 group-hover:opacity-100" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: By Purity */}
                      <div>
                        <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#8E6E24] block pb-2.5 mb-2 border-b border-[#E2D8C9]">
                          By Purity
                        </span>
                        <div className="space-y-1">
                          {goldPurities.map((purity) => (
                            <button
                              key={purity.karat}
                              type="button"
                              onClick={() =>
                                handleNav('catalogue', {
                                  metal: 'gold',
                                  karat: purity.karat,
                                  category: undefined,
                                  sort: 'featured',
                                  search: '',
                                })
                              }
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F3EFEA] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#C9A54B] outline-hidden group"
                            >
                              <div className="font-semibold text-xs text-[#1E1B18] group-hover:text-[#8E6E24]">
                                {purity.label}
                              </div>
                              <div className="text-[10px] text-[#64748B]">{purity.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Quick Link */}
                    <div className="mt-4 pt-3 border-t border-[#E2D8C9] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#64748B]">Priced from Live Rates</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleNav('catalogue', {
                            metal: 'gold',
                            category: undefined,
                            karat: 'all',
                            sort: 'featured',
                          })
                        }
                        className="text-[#8E6E24] hover:text-[#1E1B18] font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All Gold Collection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Silver (Dropdown mega-menu) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('silver')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => handleToggleClick('silver')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleClick('silver');
                  }
                }}
                aria-expanded={activeDropdown === 'silver'}
                aria-haspopup="true"
                aria-current={isSilverActive ? 'page' : undefined}
                className={`relative py-2.5 flex items-center gap-1 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                  isSilverActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
                }`}
              >
                <span>Silver</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#C9A54B] transition-transform duration-200 ${
                    activeDropdown === 'silver' ? 'rotate-180' : ''
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                    isSilverActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </button>

              {/* Silver Mega-Menu Panel */}
              {activeDropdown === 'silver' && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ width: '400px' }}
                >
                  <div className="bg-[#FAF7F2] border border-[#C9A54B]/35 rounded-2xl shadow-xl p-5 backdrop-blur-md">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Column 1: Shop Silver */}
                      <div>
                        <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#8E6E24] block pb-2.5 mb-2 border-b border-[#E2D8C9]">
                          Shop Silver
                        </span>
                        <div className="space-y-1">
                          {shopSilverCategories.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() =>
                                handleNav('catalogue', {
                                  metal: 'silver',
                                  category: item.category,
                                  karat: 'all',
                                  sort: 'featured',
                                  search: '',
                                })
                              }
                              className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-[#1E1B18] hover:text-[#8E6E24] hover:bg-[#F3EFEA] rounded-lg transition-colors flex items-center justify-between cursor-pointer focus-visible:ring-1 focus-visible:ring-[#C9A54B] outline-hidden"
                            >
                              <span>{item.label}</span>
                              <ArrowRight className="w-3 h-3 text-[#C9A54B] opacity-0 group-hover:opacity-100" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: By Purity */}
                      <div>
                        <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#8E6E24] block pb-2.5 mb-2 border-b border-[#E2D8C9]">
                          By Purity
                        </span>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleNav('catalogue', {
                                metal: 'silver',
                                karat: '925',
                                category: undefined,
                                sort: 'featured',
                                search: '',
                              })
                            }
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F3EFEA] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#C9A54B] outline-hidden group"
                          >
                            <div className="font-semibold text-xs text-[#1E1B18] group-hover:text-[#8E6E24]">
                              925 Pure Sterling Silver
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              92.5% Pure with Anti-Tarnish Finish
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Quick Link */}
                    <div className="mt-4 pt-3 border-t border-[#E2D8C9] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#64748B]">Authentic 925 Stamp</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleNav('catalogue', {
                            metal: 'silver',
                            category: undefined,
                            karat: 'all',
                            sort: 'featured',
                          })
                        }
                        className="text-[#8E6E24] hover:text-[#1E1B18] font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All Silver Collection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Bridal Sets */}
            <button
              onClick={() =>
                handleNav('catalogue', {
                  category: 'bridal_sets',
                  metal: 'all',
                  karat: 'all',
                  sort: 'featured',
                })
              }
              aria-current={isBridalActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isBridalActive ? 'text-[#8E6E24] font-semibold' : 'hover:text-[#1E1B18]'
              }`}
            >
              <span>Bridal Sets</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isBridalActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            {/* 6. Rates (opens Price Estimator) */}
            {onOpenCalculator && (
              <button
                type="button"
                onClick={onOpenCalculator}
                className="relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden hover:text-[#1E1B18]"
              >
                <span>Rates</span>
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center scale-x-0 group-hover:scale-x-100" />
              </button>
            )}

            {/* 7. About */}
            <button
              onClick={() => handleNav('about')}
              aria-current={isAboutActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isAboutActive ? 'text-[#7A5A12] font-semibold' : 'hover:text-[#1A1410]'
              }`}
            >
              <span>About</span>
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A54B] rounded-full transition-transform duration-300 ease-out origin-center ${
                  isAboutActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            {/* 8. Contact */}
            <button
              onClick={() => handleNav('contact')}
              aria-current={isContactActive ? 'page' : undefined}
              className={`relative py-2.5 transition-colors duration-200 group whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 rounded outline-hidden ${
                isContactActive ? 'text-[#7A5A12] font-semibold' : 'hover:text-[#1A1410]'
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

          {/* Zone 3: Icons Right (Search, Rates, Bag, Mobile Hamburger) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Icon Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              title="Search jewellery collection (Press / or click)"
              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2 sm:p-2.5 rounded-full bg-white/85 hover:bg-white text-[#1A1410] hover:text-[#7A5A12] border border-[#E2D8C9] hover:border-[#B8923A] transition-all shadow-2xs flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden"
              aria-label="Open search"
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Rates (Calculator) Icon Button */}
            {onOpenCalculator && (
              <button
                type="button"
                onClick={onOpenCalculator}
                title="Open live bullion rate estimator"
                className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2 sm:p-2.5 rounded-full bg-white/85 hover:bg-white text-[#1A1410] hover:text-[#7A5A12] border border-[#E2D8C9] hover:border-[#B8923A] transition-all shadow-2xs flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden"
                aria-label="Live bullion rates and price estimator"
              >
                <Scale className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#7A5A12]" />
              </button>
            )}

            {/* Bag Button: Gold gradient with shopping bag icon and count badge */}
            <button
              onClick={onOpenCart}
              aria-label={`Open jewellery bag with ${cartCount} items`}
              className={`relative flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-semibold text-[#1A1410] rounded-full bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] hover:brightness-105 active:scale-[0.97] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-2 outline-hidden min-h-[40px] sm:min-h-[44px] ${
                isAnimatingBag ? 'bag-shine-active' : ''
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#1A1410] shrink-0" />
              <span className="hidden md:inline tracking-wide font-semibold">Bag</span>

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
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-Width Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearchSubmit={handleSearchSubmit}
        onSelectProduct={handleSelectProductFromSearch}
        rates={rates}
      />

      {/* Mobile Full-Height Slide-In Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-In Drawer */}
          <aside className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#FAF7F2] border-l border-[#C9A54B]/30 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E2D8C9]">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/aistudio/logo-light.png"
                    alt="Sona & Chandi"
                    className="h-10 w-auto object-contain"
                  />
                  <div>
                    <span className="font-serif text-base font-bold text-[#1E1B18] block leading-tight">
                      Sona &amp; Chandi
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#8E6E24] font-medium block">
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

              {/* Navigation Items with Accordions */}
              <nav className="p-4 space-y-1">
                {/* Home */}
                <button
                  onClick={() => handleNav('home')}
                  aria-current={isHomeActive ? 'page' : undefined}
                  className={`w-full min-h-[46px] px-4 py-2.5 text-left text-sm font-medium rounded-xl flex items-center transition-colors cursor-pointer ${
                    isHomeActive
                      ? 'bg-white text-[#8E6E24] font-semibold border-l-4 border-[#C9A54B] shadow-2xs'
                      : 'text-[#1E1B18] hover:bg-white/80'
                  }`}
                >
                  Home
                </button>

                {/* New Arrivals */}
                <button
                  onClick={() =>
                    handleNav('catalogue', {
                      sort: 'newest',
                      metal: 'all',
                      category: undefined,
                      karat: 'all',
                    })
                  }
                  aria-current={isNewArrivalsActive ? 'page' : undefined}
                  className={`w-full min-h-[46px] px-4 py-2.5 text-left text-sm font-medium rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                    isNewArrivalsActive
                      ? 'bg-white text-[#8E6E24] font-semibold border-l-4 border-[#C9A54B] shadow-2xs'
                      : 'text-[#1E1B18] hover:bg-white/80'
                  }`}
                >
                  <span>New Arrivals</span>
                  <span className="text-[10px] uppercase tracking-wider bg-[#FAF7F2] text-[#8E6E24] px-2 py-0.5 rounded border border-[#C9A54B]/30 font-semibold">
                    New
                  </span>
                </button>

                {/* Gold Accordion */}
                <div className="border border-[#E2D8C9]/80 rounded-xl overflow-hidden bg-white/60">
                  <button
                    type="button"
                    onClick={() => setMobileGoldOpen((prev) => !prev)}
                    className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left text-sm font-semibold text-[#1E1B18] hover:bg-white transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[#8E6E24]">
                      <Sparkles className="w-4 h-4 text-[#C9A54B]" />
                      <span>Gold Jewellery</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
                        mobileGoldOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {mobileGoldOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-3 bg-white/40 border-t border-[#E2D8C9]/60">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E6E24] block mb-1">
                          Categories
                        </span>
                        <div className="space-y-0.5">
                          {shopGoldCategories.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() =>
                                handleNav('catalogue', {
                                  metal: 'gold',
                                  category: item.category,
                                  karat: 'all',
                                  sort: 'featured',
                                })
                              }
                              className="w-full min-h-[42px] px-3 py-2 text-left text-xs font-medium text-[#1E1B18] hover:text-[#8E6E24] hover:bg-[#FAF7F2] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span>{item.label}</span>
                              <ArrowRight className="w-3 h-3 text-[#C9A54B]" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E2D8C9]/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E6E24] block mb-1">
                          Filter by Purity
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {goldPurities.map((p) => (
                            <button
                              key={p.karat}
                              type="button"
                              onClick={() =>
                                handleNav('catalogue', {
                                  metal: 'gold',
                                  karat: p.karat,
                                  category: undefined,
                                  sort: 'featured',
                                })
                              }
                              className="min-h-[42px] p-2 text-left bg-[#FAF7F2] hover:bg-white border border-[#E2D8C9] rounded-lg transition-colors cursor-pointer"
                            >
                              <div className="text-xs font-bold text-[#8E6E24]">{p.label}</div>
                              <div className="text-[9px] text-[#64748B]">{p.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Silver Accordion */}
                <div className="border border-[#E2D8C9]/80 rounded-xl overflow-hidden bg-white/60">
                  <button
                    type="button"
                    onClick={() => setMobileSilverOpen((prev) => !prev)}
                    className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left text-sm font-semibold text-[#1E1B18] hover:bg-white transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[#475569]">
                      <Sparkles className="w-4 h-4 text-[#94A3B8]" />
                      <span>Silver Jewellery</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#475569] transition-transform duration-200 ${
                        mobileSilverOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {mobileSilverOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-3 bg-white/40 border-t border-[#E2D8C9]/60">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] block mb-1">
                          Categories
                        </span>
                        <div className="space-y-0.5">
                          {shopSilverCategories.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() =>
                                handleNav('catalogue', {
                                  metal: 'silver',
                                  category: item.category,
                                  karat: 'all',
                                  sort: 'featured',
                                })
                              }
                              className="w-full min-h-[42px] px-3 py-2 text-left text-xs font-medium text-[#1E1B18] hover:text-[#8E6E24] hover:bg-[#FAF7F2] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span>{item.label}</span>
                              <ArrowRight className="w-3 h-3 text-[#C9A54B]" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E2D8C9]/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] block mb-1">
                          Purity
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleNav('catalogue', {
                              metal: 'silver',
                              karat: '925',
                              category: undefined,
                              sort: 'featured',
                            })
                          }
                          className="w-full min-h-[42px] p-2.5 text-left bg-[#FAF7F2] hover:bg-white border border-[#E2D8C9] rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="text-xs font-bold text-[#1E1B18]">
                            925 Pure Sterling Silver
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            92.5% pure silver jewellery
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bridal Sets */}
                <button
                  onClick={() =>
                    handleNav('catalogue', {
                      category: 'bridal_sets',
                      metal: 'all',
                      karat: 'all',
                      sort: 'featured',
                    })
                  }
                  aria-current={isBridalActive ? 'page' : undefined}
                  className={`w-full min-h-[46px] px-4 py-2.5 text-left text-sm font-medium rounded-xl flex items-center transition-colors cursor-pointer ${
                    isBridalActive
                      ? 'bg-white text-[#8E6E24] font-semibold border-l-4 border-[#C9A54B] shadow-2xs'
                      : 'text-[#1E1B18] hover:bg-white/80'
                  }`}
                >
                  Bridal Sets
                </button>

                {/* Rates (Price Estimator) */}
                {onOpenCalculator && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCalculator();
                    }}
                    className="w-full min-h-[46px] px-4 py-2.5 text-left text-sm font-medium rounded-xl flex items-center gap-2 text-[#8E6E24] hover:bg-white/80 transition-colors cursor-pointer"
                  >
                    <Scale className="w-4 h-4 text-[#C9A54B]" />
                    <span>Live Rates &amp; Price Estimator</span>
                  </button>
                )}

                {/* About */}
                <button
                  onClick={() => handleNav('about')}
                  aria-current={isAboutActive ? 'page' : undefined}
                  className={`w-full min-h-[46px] px-4 py-2.5 text-left text-sm font-medium rounded-xl flex items-center transition-colors cursor-pointer ${
                    isAboutActive
                      ? 'bg-white text-[#8E6E24] font-semibold border-l-4 border-[#C9A54B] shadow-2xs'
                      : 'text-[#1E1B18] hover:bg-white/80'
                  }`}
                >
                  About Our Jewellery
                </button>

                {/* Contact */}
                <button
                  onClick={() => handleNav('contact')}
                  aria-current={isContactActive ? 'page' : undefined}
                  className={`w-full min-h-[46px] px-4 py-2.5 text-left text-sm font-medium rounded-xl flex items-center transition-colors cursor-pointer ${
                    isContactActive
                      ? 'bg-white text-[#8E6E24] font-semibold border-l-4 border-[#C9A54B] shadow-2xs'
                      : 'text-[#1E1B18] hover:bg-white/80'
                  }`}
                >
                  Contact &amp; Showroom Timings
                </button>
              </nav>

              {/* Store Hours & Open/Closed Status Section */}
              <div className="mx-4 p-3.5 bg-white/70 border border-[#E2D8C9] rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1E1B18] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#8E6E24]" />
                    <span>Store Timings</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      storeStatus.isOpen
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        storeStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span>{storeStatus.isOpen ? 'Open now' : 'Closed'}</span>
                  </span>
                </div>
                {settings.storeHoursDescription && (
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    {settings.storeHoursDescription}
                  </p>
                )}
                {rates && rates.gold24KPerTola > 0 && (
                  <div className="pt-2 border-t border-[#E2D8C9] flex items-center justify-between text-[11px]">
                    <span className="text-[#8E6E24] font-medium">24K Gold Rate / Tola:</span>
                    <span className="font-mono font-bold text-[#1E1B18]">
                      {formatPKR(rates.gold24KPerTola)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions: Bag & Green WhatsAppButton */}
            <div className="p-4 border-t border-[#E2D8C9] space-y-2.5 bg-[#FAF7F2]">
              {whatsappHref && (
                <WhatsAppButton
                  href={whatsappHref}
                  label="Order on WhatsApp"
                  fullWidth
                  size="md"
                />
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCart();
                }}
                className="w-full min-h-[46px] py-3 px-4 bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all"
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
