/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Navbar, NavigateOptions } from './components/Navbar';
import { LiveRateStrip } from './components/LiveRateStrip';
import { BrandIntro } from './components/BrandIntro';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { RateCalculatorModal } from './components/RateCalculatorModal';
import { Footer } from './components/Footer';
import { AnimatedGoldBackground } from './components/AnimatedGoldBackground';

const AdminPanel = React.lazy(() =>
  import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);

import { HomePage } from './pages/HomePage';
import { CataloguePage } from './pages/CataloguePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';

import { Product, getProducts, getRates, getProductById, subscribeToStore } from './data/store';
import { BullionRates, runPricingSelfChecks } from './lib/pricing';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'home' | 'catalogue' | 'product_detail' | 'about' | 'contact' | 'admin'
  >(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return 'home';
  });

  const [catalogueMetal, setCatalogueMetal] = useState<'all' | 'gold' | 'silver'>('all');
  const [catalogueCategory, setCatalogueCategory] = useState<string | undefined>(undefined);
  const [catalogueKarat, setCatalogueKarat] = useState<string>('all');
  const [catalogueSort, setCatalogueSort] = useState<string>('featured');
  const [catalogueSearch, setCatalogueSearch] = useState<string>('');
  const [filterResetNonce, setFilterResetNonce] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const prefersReduced = useReducedMotion();

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sc_cart');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading cart', e);
      }
    }
    return [];
  });

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [rates, setRates] = useState<BullionRates>(() => getRates());

  // Brand Intro session management
  const [showBrandIntro, setShowBrandIntro] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin')) return false;
      const alreadyPlayed = sessionStorage.getItem('sc_intro_played');
      return !alreadyPlayed;
    }
    return false;
  });

  // Verify pricing formulas on initialization
  useEffect(() => {
    runPricingSelfChecks();
  }, []);

  // Subscribe to real-time Firestore updates from store.ts
  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setRates(getRates());
      // Force refresh of selected product if open
      if (selectedProduct) {
        const fresh = getProductById(selectedProduct.id);
        if (fresh) setSelectedProduct(fresh);
      }
    });
    return () => unsubscribe();
  }, [selectedProduct]);

  // Sync cart to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sc_cart', JSON.stringify(cartItems));
      } catch (e) {
        console.error('Error saving cart', e);
      }
    }
  }, [cartItems]);

  // Dynamically set --bg-anim-opacity: 0.25 on catalogue and product pages, 0.5 on home
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (currentView === 'catalogue' || currentView === 'product_detail') {
        document.documentElement.style.setProperty('--bg-anim-opacity', '0.25');
      } else {
        document.documentElement.style.setProperty('--bg-anim-opacity', '0.5');
      }
    }
  }, [currentView]);

  // Listen to browser popstate
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        setCurrentView('admin');
      } else if (currentView === 'admin') {
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  // Handlers
  const handleNavigate = (view: string, filterOrOptions?: string | NavigateOptions) => {
    // Check if clicking already active button:
    if (view === 'home' && currentView === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (view === 'about' && currentView === 'about') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (view === 'contact' && currentView === 'contact') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (view === 'admin') {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/admin');
      }
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }

    if (view === 'product_detail') {
      setCurrentView('product_detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'catalogue') {
      if (typeof filterOrOptions === 'object' && filterOrOptions !== null) {
        setCatalogueMetal(filterOrOptions.metal ?? 'all');
        setCatalogueCategory(filterOrOptions.category);
        setCatalogueKarat(filterOrOptions.karat ?? 'all');
        setCatalogueSort(filterOrOptions.sort ?? 'featured');
        setCatalogueSearch(filterOrOptions.search ?? '');
        setFilterResetNonce((n) => n + 1);
      } else {
        const filter = filterOrOptions;
        if (filter === 'gold') {
          setCatalogueMetal('gold');
          setCatalogueCategory(undefined);
          setCatalogueKarat('all');
          setCatalogueSort('featured');
          setCatalogueSearch('');
          setFilterResetNonce((n) => n + 1);
        } else if (filter === 'silver') {
          setCatalogueMetal('silver');
          setCatalogueCategory(undefined);
          setCatalogueKarat('all');
          setCatalogueSort('featured');
          setCatalogueSearch('');
          setFilterResetNonce((n) => n + 1);
        } else if (!filter || filter === 'all') {
          setCatalogueMetal('all');
          setCatalogueCategory(undefined);
          setCatalogueKarat('all');
          setCatalogueSort('featured');
          setCatalogueSearch('');
          setFilterResetNonce((n) => n + 1);
        } else {
          // Category link from Footer or elsewhere
          setCatalogueCategory(filter);
          setCatalogueMetal('all');
          setCatalogueKarat('all');
          setCatalogueSort('featured');
          setCatalogueSearch('');
          setFilterResetNonce((n) => n + 1);
        }
      }
      setSelectedProduct(null);
      setCurrentView('catalogue');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSelectedProduct(null);
    setCurrentView(view as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, quantityToAdd: number = 1) => {
    if (!product.inStock || product.stock <= 0) return;
    const isRateMissing =
      product.metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0;
    if (isRateMissing) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }
      return [...prev, { product, quantity: quantityToAdd }];
    });
    setCartDrawerOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleReplayIntro = () => {
    setShowBrandIntro(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cartTotalCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  // If Admin View is active, render AdminPanel directly
  if (currentView === 'admin') {
    return (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
            <div className="space-y-3">
              <div className="w-10 h-10 border-2 border-[#C9A54B] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-serif text-sm text-[#1E1B18]">Loading Staff Portal...</p>
            </div>
          </div>
        }
      >
        <AdminPanel
          onBackToStore={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
            }
            setCurrentView('home');
          }}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#1E1B18] font-sans relative">
      {/* Animated Liquid Gold & Silver Background (storefront only, 50% opacity via CSS var) */}
      <AnimatedGoldBackground />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Brand Intro overlay (once per session, with skip button) */}
        {showBrandIntro && (
          <BrandIntro
            onComplete={() => setShowBrandIntro(false)}
          />
        )}

        {/* Live Bullion Rate Strip */}
        <LiveRateStrip
          rates={rates}
          onOpenCalculator={() => setCalculatorOpen(true)}
        />

        {/* Top Bar Navigation Contract with sticky glass header & live rate chip */}
        <Navbar
          currentView={currentView}
          currentMetal={catalogueMetal}
          currentCategory={catalogueCategory}
          currentKarat={catalogueKarat}
          currentSort={catalogueSort}
          onNavigate={handleNavigate}
          cartCount={cartTotalCount}
          onOpenCart={() => setCartDrawerOpen(true)}
          rates={rates}
          onOpenCalculator={() => setCalculatorOpen(true)}
          onSelectProduct={handleSelectProduct}
        />

        {/* Main Content Router with Page-to-Page Fade Transition */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView === 'product_detail' ? `product_${selectedProduct?.id}` : currentView}
              initial={prefersReduced ? undefined : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {currentView === 'home' && (
                <HomePage
                  rates={rates}
                  onSelectProduct={handleSelectProduct}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onNavigateToCatalogue={(filter) => handleNavigate('catalogue', filter)}
                  onOpenCalculator={() => setCalculatorOpen(true)}
                />
              )}

              {currentView === 'catalogue' && (
                <CataloguePage
                  rates={rates}
                  metal={catalogueMetal}
                  onMetalChange={setCatalogueMetal}
                  category={catalogueCategory}
                  onCategoryChange={setCatalogueCategory}
                  karat={catalogueKarat}
                  onKaratChange={setCatalogueKarat}
                  sortBy={catalogueSort}
                  onSortChange={setCatalogueSort}
                  searchQuery={catalogueSearch}
                  onSearchChange={setCatalogueSearch}
                  resetNonce={filterResetNonce}
                  onSelectProduct={handleSelectProduct}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onNavigateHome={() => handleNavigate('home')}
                />
              )}

              {currentView === 'product_detail' && selectedProduct && (
                <ProductDetailPage
                  product={selectedProduct}
                  rates={rates}
                  onBack={() => handleNavigate('catalogue')}
                  onSelectProduct={handleSelectProduct}
                  onAddToCart={handleAddToCart}
                  onOpenCalculator={() => setCalculatorOpen(true)}
                />
              )}

              {currentView === 'about' && (
                <AboutPage
                  rates={rates}
                  onNavigateToCatalogue={() => handleNavigate('catalogue')}
                  onOpenCalculator={() => setCalculatorOpen(true)}
                />
              )}

              {currentView === 'contact' && <ContactPage />}
            </motion.div>
          </AnimatePresence>
        </main>

      {/* Slide-over Cart & Inquiry Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={cartItems}
        rates={rates}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onNavigateToCatalogue={() => handleNavigate('catalogue')}
        onSelectProduct={handleSelectProduct}
      />

      {/* Interactive Bullion Rate Calculator Modal */}
      <RateCalculatorModal
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        rates={rates}
      />

      {/* Espresso Luxury Footer with Dark Logo */}
      <Footer
        rates={rates}
        onNavigate={handleNavigate}
        onOpenCalculator={() => setCalculatorOpen(true)}
        onReplayIntro={handleReplayIntro}
      />
      </div>
    </div>
  );
}
