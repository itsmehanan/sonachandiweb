import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Phone, MessageCircle } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, filter?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  cartCount,
  onOpenCart,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: string, filter?: string) => {
    onNavigate(view, filter);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E2D8C9] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark & Logo (Single text/logo element) */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 text-left focus:outline-hidden group shrink-0"
        >
          <img
            src="/public/assets/aistudio/logo-light_b9e6ed91.png"
            alt="Sona & Chandi Gold Collection"
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-102"
            referrerPolicy="no-referrer"
          />
          <div className="hidden min-[420px]:block">
            <span className="font-serif text-base sm:text-lg font-semibold tracking-tight text-[#1E1B18] block leading-tight">
              Sona &amp; Chandi
            </span>
            <span className="text-[10px] tracking-widest uppercase text-[#8E6E24] font-medium block">
              Gold Collection
            </span>
          </div>
        </button>

        {/* Zone 2: 4-5 Clean Nav Links (Single line text links) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475569]">
          <button
            onClick={() => handleNav('home')}
            className={`whitespace-nowrap transition-colors hover:text-[#1E1B18] ${
              currentView === 'home' ? 'text-[#8E6E24] font-semibold border-b-2 border-[#C9A54B] pb-1' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('catalogue')}
            className={`whitespace-nowrap transition-colors hover:text-[#1E1B18] ${
              currentView === 'catalogue' ? 'text-[#8E6E24] font-semibold border-b-2 border-[#C9A54B] pb-1' : ''
            }`}
          >
            Catalogue
          </button>
          <button
            onClick={() => handleNav('catalogue', 'gold')}
            className="whitespace-nowrap transition-colors hover:text-[#8E6E24]"
          >
            Gold
          </button>
          <button
            onClick={() => handleNav('catalogue', 'silver')}
            className="whitespace-nowrap transition-colors hover:text-[#8E6E24]"
          >
            Silver
          </button>
          <button
            onClick={() => handleNav('about')}
            className={`whitespace-nowrap transition-colors hover:text-[#1E1B18] ${
              currentView === 'about' ? 'text-[#8E6E24] font-semibold border-b-2 border-[#C9A54B] pb-1' : ''
            }`}
          >
            About
          </button>
          <button
            onClick={() => handleNav('contact')}
            className={`whitespace-nowrap transition-colors hover:text-[#1E1B18] ${
              currentView === 'contact' ? 'text-[#8E6E24] font-semibold border-b-2 border-[#C9A54B] pb-1' : ''
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Cart Drawer trigger + Mobile Toggle) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCart}
            aria-label={`Open shopping cart with ${cartCount} items`}
            className="relative flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 text-xs font-semibold text-[#1E1B18] bg-white hover:bg-[#FAF7F2] border border-[#C9A54B]/40 hover:border-[#C9A54B] rounded-lg transition-all shadow-xs focus:ring-2 focus:ring-[#C9A54B]/30"
          >
            <ShoppingBag className="w-4 h-4 sm:mr-2 text-[#8E6E24]" />
            <span className="hidden sm:inline">Bag / Inquiry</span>
            {cartCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#C9A54B] rounded-full tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#1E1B18] hover:text-[#8E6E24] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-b border-[#E2D8C9] px-6 py-5 space-y-4 animate-fade-in shadow-lg">
          <nav className="flex flex-col space-y-3 text-sm font-medium">
            <button
              onClick={() => handleNav('home')}
              className="text-left py-1.5 text-[#1E1B18] hover:text-[#8E6E24]"
            >
              Home
            </button>
            <button
              onClick={() => handleNav('catalogue')}
              className="text-left py-1.5 text-[#1E1B18] hover:text-[#8E6E24]"
            >
              All Jewellery Catalogue
            </button>
            <button
              onClick={() => handleNav('catalogue', 'gold')}
              className="text-left py-1.5 pl-3 text-[#8E6E24]"
            >
              — 24K, 22K, 21K &amp; 18K Gold
            </button>
            <button
              onClick={() => handleNav('catalogue', 'silver')}
              className="text-left py-1.5 pl-3 text-[#475569]"
            >
              — 925 Pure Sterling Silver
            </button>
            <button
              onClick={() => handleNav('about')}
              className="text-left py-1.5 text-[#1E1B18] hover:text-[#8E6E24]"
            >
              About Heritage &amp; Hallmarking
            </button>
            <button
              onClick={() => handleNav('contact')}
              className="text-left py-1.5 text-[#1E1B18] hover:text-[#8E6E24]"
            >
              Contact &amp; Showroom Timings
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
