import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Product, getProducts, getSettings } from '../data/store';
import { BullionRates, calculateProductPrice, formatPKR } from '../lib/pricing';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppButton } from '../components/WhatsAppButton';

interface CataloguePageProps {
  rates: BullionRates;
  metal: 'all' | 'gold' | 'silver';
  onMetalChange: (metal: 'all' | 'gold' | 'silver') => void;
  category?: string;
  onCategoryChange: (category: string | undefined) => void;
  karat?: string;
  onKaratChange?: (karat: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  searchQuery?: string;
  onSearchChange?: (search: string) => void;
  resetNonce?: number;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onNavigateHome?: () => void;
}

export const CataloguePage: React.FC<CataloguePageProps> = ({
  rates,
  metal,
  onMetalChange,
  category,
  onCategoryChange,
  karat = 'all',
  onKaratChange,
  sortBy: controlledSortBy,
  onSortChange,
  searchQuery: controlledSearch,
  onSearchChange,
  resetNonce,
  onSelectProduct,
  onAddToCart,
  onNavigateHome,
}) => {
  const allProducts = getProducts();
  const settings = getSettings();

  // Internal Filter States
  const [internalSearch, setInternalSearch] = useState('');
  const [internalKarat, setInternalKarat] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [internalSortBy, setInternalSortBy] = useState<string>('newest');

  // Mobile Bottom Sheet Filter State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Desktop Collapsible Filter Groups (all open by default)
  const [openGroups, setOpenGroups] = useState({
    metal: true,
    category: true,
    purity: true,
    availability: true,
    price: true,
  });

  const toggleGroup = (group: keyof typeof openGroups) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const activeCategory = category || 'all';
  const activeKarat = karat !== undefined ? karat : internalKarat;
  const activeSort = controlledSortBy !== undefined ? controlledSortBy : internalSortBy;
  const activeSearch = controlledSearch !== undefined ? controlledSearch : internalSearch;

  // Compute highest price in catalogue for the price slider bounds
  const highestCataloguePrice = useMemo(() => {
    if (allProducts.length === 0) return 1000000;
    const prices = allProducts.map(
      (p) => calculateProductPrice(p, rates).totalEstimate
    );
    const max = Math.max(...prices);
    return Math.ceil(max / 50000) * 50000; // round up to nearest 50k
  }, [allProducts, rates]);

  // Price Range Filter State
  const [maxPrice, setMaxPrice] = useState<number>(highestCataloguePrice);

  // Reset maxPrice when catalogue bounds change
  useEffect(() => {
    if (highestCataloguePrice > 0) {
      setMaxPrice(highestCataloguePrice);
    }
  }, [highestCataloguePrice]);

  const handleKaratSelect = (newKarat: string) => {
    if (onKaratChange) {
      onKaratChange(newKarat);
    } else {
      setInternalKarat(newKarat);
    }
  };

  const handleSortSelect = (newSort: string) => {
    if (onSortChange) {
      onSortChange(newSort);
    } else {
      setInternalSortBy(newSort);
    }
  };

  const handleSearchInput = (newSearch: string) => {
    if (onSearchChange) {
      onSearchChange(newSearch);
    } else {
      setInternalSearch(newSearch);
    }
  };

  // Clear secondary filters when resetNonce changes (e.g. navbar click)
  useEffect(() => {
    if (resetNonce !== undefined && resetNonce > 0) {
      handleSearchInput('');
      setInStockOnly(false);
      setMaxPrice(highestCataloguePrice);
    }
  }, [resetNonce, highestCataloguePrice]);

  // Lock scroll when mobile bottom sheet is open
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Search query
        if (activeSearch.trim()) {
          const q = activeSearch.toLowerCase().trim();
          const matchesName = product.title.toLowerCase().includes(q);
          const matchesSku = product.sku.toLowerCase().includes(q);
          const matchesDesc = product.shortDescription.toLowerCase().includes(q);
          const matchesKarat = product.karat.toLowerCase().includes(q);
          if (!matchesName && !matchesSku && !matchesDesc && !matchesKarat) return false;
        }

        // Metal filter
        if (metal !== 'all' && product.metal !== metal) {
          return false;
        }

        // Category filter
        if (activeCategory !== 'all' && product.category !== activeCategory) {
          return false;
        }

        // Karat / Purity filter
        if (activeKarat !== 'all') {
          if (activeKarat === '925') {
            if (product.metal !== 'silver') return false;
          } else if (product.karat !== activeKarat) {
            return false;
          }
        }

        // Availability filter
        if (inStockOnly && (!product.inStock || product.stock <= 0)) {
          return false;
        }

        // Price range slider
        const price = calculateProductPrice(product, rates).totalEstimate;
        if (price > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (activeSort === 'newest') {
          return b.id.localeCompare(a.id);
        }
        const priceA = calculateProductPrice(a, rates).totalEstimate;
        const priceB = calculateProductPrice(b, rates).totalEstimate;

        if (activeSort === 'price_asc') return priceA - priceB;
        if (activeSort === 'price_desc') return priceB - priceA;
        if (activeSort === 'weight_asc') return a.weightGrams - b.weightGrams;
        if (activeSort === 'weight_desc') return b.weightGrams - a.weightGrams;
        if (activeSort === 'name') return a.title.localeCompare(b.title);
        // Default: featured first
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [
    allProducts,
    activeSearch,
    metal,
    activeCategory,
    activeKarat,
    inStockOnly,
    maxPrice,
    activeSort,
    rates,
  ]);

  const handleResetFilters = () => {
    handleSearchInput('');
    onMetalChange('all');
    onCategoryChange(undefined);
    handleKaratSelect('all');
    setInStockOnly(false);
    setMaxPrice(highestCataloguePrice);
    handleSortSelect('newest');
  };

  const isPriceFiltered = maxPrice < highestCataloguePrice;
  const hasActiveFilters =
    activeSearch !== '' ||
    metal !== 'all' ||
    activeCategory !== 'all' ||
    activeKarat !== 'all' ||
    inStockOnly ||
    isPriceFiltered;

  // Dynamic Title Construction
  const pageTitle = useMemo(() => {
    const metalName =
      metal === 'gold' ? 'Gold' : metal === 'silver' ? 'Sterling Silver' : '';
    const catName =
      activeCategory !== 'all'
        ? activeCategory === 'bridal_sets'
          ? 'Bridal Sets'
          : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)
        : '';

    if (metalName && catName) return `${metalName} ${catName}`;
    if (catName) return catName;
    if (metalName) return `${metalName} Collection`;
    return 'Fine Jewellery Collection';
  }, [metal, activeCategory]);

  const categories = [
    { id: 'all', label: 'All Pieces' },
    { id: 'rings', label: 'Rings' },
    { id: 'necklaces', label: 'Necklaces' },
    { id: 'bangles', label: 'Bangles & Karas' },
    { id: 'earrings', label: 'Earrings & Jhumkas' },
    { id: 'bridal_sets', label: 'Bridal Sets' },
  ];

  const purities = [
    { id: 'all', label: 'All Purities' },
    ...(metal !== 'silver'
      ? [
          { id: '24K', label: '24K Solid Gold (99.9%)' },
          { id: '22K', label: '22K Traditional (91.6%)' },
          { id: '21K', label: '21K Handcrafted (87.5%)' },
          { id: '18K', label: '18K Contemporary (75.0%)' },
        ]
      : []),
    ...(metal !== 'gold'
      ? [{ id: '925', label: '925 Sterling Silver (92.5%)' }]
      : []),
  ];

  const whatsappArrivalsHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        'Hello Sona & Chandi Gold Collection, I would like to inquire about your upcoming new arrivals and custom designs.'
      )}`
    : undefined;

  // Filter content component reused between desktop sidebar and mobile bottom sheet
  const filterControls = (
    <div className="space-y-6">
      {/* 1. Metal Group */}
      <div className="border-b border-[#E2D8C9] pb-5">
        <button
          type="button"
          onClick={() => toggleGroup('metal')}
          className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-[#1E1B18] py-1 cursor-pointer"
        >
          <span>Metal</span>
          <ChevronDown
            className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
              openGroups.metal ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openGroups.metal && (
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {[
              { id: 'all', label: 'All' },
              { id: 'gold', label: 'Gold' },
              { id: 'silver', label: 'Silver' },
            ].map((m) => {
              const isSelected = metal === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onMetalChange(m.id as 'all' | 'gold' | 'silver');
                    handleKaratSelect('all');
                  }}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] shadow-xs'
                      : 'bg-[#FAF7F2] text-[#475569] hover:text-[#1E1B18] border border-[#E2D8C9] hover:border-[#C9A54B]/60'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Category Group */}
      <div className="border-b border-[#E2D8C9] pb-5">
        <button
          type="button"
          onClick={() => toggleGroup('category')}
          className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-[#1E1B18] py-1 cursor-pointer"
        >
          <span>Category</span>
          <ChevronDown
            className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
              openGroups.category ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openGroups.category && (
          <div className="space-y-1.5 mt-3">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(cat.id === 'all' ? undefined : cat.id)}
                  className={`w-full py-2 px-3 text-xs font-medium rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] font-bold shadow-xs'
                      : 'bg-[#FAF7F2] text-[#475569] hover:text-[#1E1B18] hover:bg-[#F3EFEA]'
                  }`}
                >
                  <span>{cat.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E1B18]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Purity / Karat Group */}
      <div className="border-b border-[#E2D8C9] pb-5">
        <button
          type="button"
          onClick={() => toggleGroup('purity')}
          className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-[#1E1B18] py-1 cursor-pointer"
        >
          <span>Purity &amp; Karat</span>
          <ChevronDown
            className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
              openGroups.purity ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openGroups.purity && (
          <div className="space-y-1.5 mt-3">
            {purities.map((p) => {
              const isSelected = activeKarat === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleKaratSelect(p.id)}
                  className={`w-full py-2 px-3 text-xs font-medium rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] font-bold shadow-xs'
                      : 'bg-[#FAF7F2] text-[#475569] hover:text-[#1E1B18] hover:bg-[#F3EFEA]'
                  }`}
                >
                  <span>{p.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E1B18]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Availability Group */}
      <div className="border-b border-[#E2D8C9] pb-5">
        <button
          type="button"
          onClick={() => toggleGroup('availability')}
          className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-[#1E1B18] py-1 cursor-pointer"
        >
          <span>Availability</span>
          <ChevronDown
            className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
              openGroups.availability ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openGroups.availability && (
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                inStockOnly
                  ? 'bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] font-bold shadow-xs'
                  : 'bg-[#FAF7F2] text-[#475569] hover:text-[#1E1B18] border border-[#E2D8C9]'
              }`}
            >
              <span>In Stock Only</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  inStockOnly ? 'bg-[#1E1B18]' : 'bg-[#CBD5E1]'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* 5. Price Range Slider */}
      <div>
        <button
          type="button"
          onClick={() => toggleGroup('price')}
          className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-[#1E1B18] py-1 cursor-pointer"
        >
          <span>Estimated Price</span>
          <ChevronDown
            className={`w-4 h-4 text-[#8E6E24] transition-transform duration-200 ${
              openGroups.price ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openGroups.price && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span>Up to:</span>
              <span className="font-serif font-bold text-sm text-[#1E1B18]">
                {formatPKR(maxPrice)}
              </span>
            </div>

            <input
              type="range"
              min={20000}
              max={highestCataloguePrice}
              step={10000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#C9A54B] cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
              <span>Rs. 20,000</span>
              <span>{formatPKR(highestCataloguePrice)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* 1. Breadcrumbs (Home / Gold / Rings) */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#64748B] flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (onNavigateHome) onNavigateHome();
          }}
          className="hover:text-[#8E6E24] transition-colors cursor-pointer"
        >
          Home
        </button>
        <span className="text-[#C9A54B]/60" aria-hidden="true">/</span>

        <button
          type="button"
          onClick={() => {
            onCategoryChange(undefined);
          }}
          className={`hover:text-[#8E6E24] transition-colors cursor-pointer ${
            activeCategory === 'all' ? 'font-semibold text-[#1E1B18]' : ''
          }`}
        >
          {metal === 'gold' ? 'Gold' : metal === 'silver' ? 'Silver' : 'All Jewellery'}
        </button>

        {activeCategory !== 'all' && (
          <>
            <span className="text-[#C9A54B]/60" aria-hidden="true">/</span>
            <span className="font-semibold text-[#1E1B18] capitalize">
              {activeCategory.replace('_', ' ')}
            </span>
          </>
        )}
      </nav>

      {/* 2. Page Title, Count & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E2D8C9]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1E1B18] font-normal tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-light">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} with transparent live bullion pricing
          </p>
        </div>

        {/* Right: Search, Filter Button (mobile) & Sort Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden min-h-[44px] px-3.5 py-2 bg-[#FAF7F2] border border-[#C9A54B]/50 hover:border-[#C9A54B] rounded-xl text-xs font-semibold text-[#8E6E24] flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Filter className="w-4 h-4 text-[#C9A54B]" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#C9A54B]" />
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium hidden md:inline">Sort:</span>
            <select
              value={activeSort}
              onChange={(e) => handleSortSelect(e.target.value)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAF7F2] text-[#1E1B18] border border-[#E2D8C9] hover:border-[#C9A54B] cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#C9A54B] shadow-2xs"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="weight_asc">Weight: Low to High</option>
              <option value="weight_desc">Weight: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Selected Filters Gold Chips with "Clear all" link */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-[#64748B] font-medium">Active:</span>

          {activeSearch && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] shadow-2xs">
              <span>"{activeSearch}"</span>
              <button
                type="button"
                onClick={() => handleSearchInput('')}
                className="hover:opacity-75 cursor-pointer"
                aria-label="Remove search filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {metal !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] shadow-2xs">
              <span>{metal === 'gold' ? 'Gold' : 'Silver'}</span>
              <button
                type="button"
                onClick={() => onMetalChange('all')}
                className="hover:opacity-75 cursor-pointer"
                aria-label="Remove metal filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] shadow-2xs capitalize">
              <span>{activeCategory.replace('_', ' ')}</span>
              <button
                type="button"
                onClick={() => onCategoryChange(undefined)}
                className="hover:opacity-75 cursor-pointer"
                aria-label="Remove category filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeKarat !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] shadow-2xs">
              <span>{activeKarat === '925' ? '925 Silver' : activeKarat}</span>
              <button
                type="button"
                onClick={() => handleKaratSelect('all')}
                className="hover:opacity-75 cursor-pointer"
                aria-label="Remove purity filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {inStockOnly && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] shadow-2xs">
              <span>In Stock</span>
              <button
                type="button"
                onClick={() => setInStockOnly(false)}
                className="hover:opacity-75 cursor-pointer"
                aria-label="Remove in stock filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {isPriceFiltered && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] shadow-2xs">
              <span>Under {formatPKR(maxPrice)}</span>
              <button
                type="button"
                onClick={() => setMaxPrice(highestCataloguePrice)}
                className="hover:opacity-75 cursor-pointer"
                aria-label="Remove price filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-[#8E6E24] hover:text-[#1E1B18] underline underline-offset-4 ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* 4. Main Two-Column Layout (Sidebar + Product Grid) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Left Filter Sidebar */}
        <aside className="hidden lg:block w-64 xl:w-72 shrink-0 bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl p-5 sticky top-24 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2D8C9]">
            <span className="font-serif text-lg font-bold text-[#1E1B18] flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#C9A54B]" />
              <span>Filters</span>
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#8E6E24] hover:text-[#1E1B18] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {filterControls}
        </aside>

        {/* Product Grid Area */}
        <div className="flex-1 w-full min-w-0">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  rates={rates}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          ) : (
            /* 5. Empty State */
            <div className="py-16 sm:py-24 text-center bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl p-8 space-y-5">
              <div className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#C9A54B]/40 flex items-center justify-center mx-auto shadow-2xs">
                <Sparkles className="w-6 h-6 text-[#C9A54B]" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1E1B18]">
                  No pieces in this collection right now.
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  We frequently craft custom jewellery and update our collections with fine Pakistani gold and silver artistry.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] hover:brightness-105 active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px]"
                >
                  View all jewellery
                </button>

                {whatsappArrivalsHref && (
                  <WhatsAppButton
                    href={whatsappArrivalsHref}
                    label="Ask us about new arrivals"
                    size="md"
                    className="w-full sm:w-auto"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Mobile Filter Bottom Sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Modal */}
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-[#FAF7F2] rounded-t-3xl border-t border-[#C9A54B]/40 shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E2D8C9] shrink-0">
              <span className="font-serif text-lg font-bold text-[#1E1B18] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#C9A54B]" />
                <span>Filters &amp; Refinements</span>
              </span>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-[#64748B] hover:text-[#1E1B18] rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Controls */}
            <div className="p-5 overflow-y-auto flex-1">
              {filterControls}
            </div>

            {/* Footer with Apply Button & Clear all */}
            <div className="p-4 border-t border-[#E2D8C9] bg-[#FAF7F2] flex items-center gap-3 shrink-0">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    handleResetFilters();
                  }}
                  className="px-4 py-3 text-xs font-semibold text-[#8E6E24] hover:text-[#1E1B18] cursor-pointer min-h-[44px]"
                >
                  Clear all
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-xs text-center cursor-pointer min-h-[44px]"
              >
                Apply Filters ({filteredProducts.length} pieces)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
