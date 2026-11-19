import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  Product,
  getProducts,
  getSettings,
  getVisibleCategories,
  getVisibleGoldCategories,
  getVisibleSilverCategories,
  getCategoryDisplayName,
  areCategoriesLoaded,
  subscribeToStore,
  areProductsLoaded,
  hasProductsError,
  retryStoreListeners,
  normalizeCategory,
  optimizeCloudinaryShowcase,
} from '../data/store';
import {
  BullionRates,
  WHATSAPP_NUMBER,
  calculateProductPrice,
  formatPKR,
} from '../lib/pricing';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { StaggerGrid, StaggerItem } from '../components/motion/MotionUtils';

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
  const allProducts = useSyncExternalStore(subscribeToStore, getProducts, getProducts);
  const settings = useSyncExternalStore(subscribeToStore, getSettings, getSettings);
  const visibleAllCategories = useSyncExternalStore(
    subscribeToStore,
    getVisibleCategories,
    getVisibleCategories
  );
  const visibleGoldCategories = useSyncExternalStore(
    subscribeToStore,
    getVisibleGoldCategories,
    getVisibleGoldCategories
  );
  const visibleSilverCategories = useSyncExternalStore(
    subscribeToStore,
    getVisibleSilverCategories,
    getVisibleSilverCategories
  );
  const categoriesLoaded = useSyncExternalStore(
    subscribeToStore,
    areCategoriesLoaded,
    areCategoriesLoaded
  );
  const productsLoaded = useSyncExternalStore(
    subscribeToStore,
    areProductsLoaded,
    areProductsLoaded
  );
  const productsError = useSyncExternalStore(
    subscribeToStore,
    hasProductsError,
    hasProductsError
  );

  const activeVisibleCategories =
    metal === 'gold'
      ? visibleGoldCategories
      : metal === 'silver'
      ? visibleSilverCategories
      : visibleAllCategories;

  // Internal Filter States
  const [internalSearch, setInternalSearch] = useState('');
  const [internalKarat, setInternalKarat] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [internalSortBy, setInternalSortBy] = useState<string>('newest');
  // null = no price limit unless visitor actively moved the slider
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number | null>(null);

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

  const activeCategory = useMemo(() => {
    if (!category || category === 'all') return 'all';
    const resolved = normalizeCategory(category, visibleAllCategories);
    return resolved || category.trim().toLowerCase();
  }, [category, visibleAllCategories]);

  const selectedCategoryObj = useMemo(() => {
    if (activeCategory === 'all') return undefined;
    return visibleAllCategories.find((c) => c.slug === activeCategory);
  }, [activeCategory, visibleAllCategories]);

  const activeCategoryLabel = useMemo(() => {
    if (activeCategory === 'all') return '';
    return selectedCategoryObj?.name || getCategoryDisplayName(activeCategory);
  }, [activeCategory, selectedCategoryObj]);

  const activeKarat = karat !== undefined ? karat : internalKarat;
  const activeSort = controlledSortBy !== undefined ? controlledSortBy : internalSortBy;
  const activeSearch = controlledSearch !== undefined ? controlledSearch : internalSearch;

  // Compute highest price in catalogue during render for slider bounds
  const highestCataloguePrice = useMemo(() => {
    if (allProducts.length === 0) return 1000000;
    const prices = allProducts.map((p) => calculateProductPrice(p, rates).totalEstimate);
    const max = Math.max(...prices, 0);
    return Math.max(50000, Math.ceil(max / 50000) * 50000);
  }, [allProducts, rates]);

  // Effective slider display & limit (null means unlimited)
  const effectiveMaxPrice =
    selectedMaxPrice !== null
      ? Math.min(selectedMaxPrice, highestCataloguePrice)
      : highestCataloguePrice;

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

  // Clear local secondary filters ONLY when resetNonce changes (e.g. navbar click)
  useEffect(() => {
    if (resetNonce !== undefined && resetNonce > 0) {
      if (!onSearchChange) {
        setInternalSearch('');
      }
      setInStockOnly(false);
      setSelectedMaxPrice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetNonce]);

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
          const matchesCategory = getCategoryDisplayName(product.category)
            .toLowerCase()
            .includes(q);
          if (!matchesName && !matchesSku && !matchesDesc && !matchesKarat && !matchesCategory) {
            return false;
          }
        }

        // Metal filter
        if (metal !== 'all' && product.metal !== metal) {
          return false;
        }

        // Category filter (live visible categories; hidden/deleted category yields normal empty state)
        if (activeCategory !== 'all') {
          if (categoriesLoaded && !selectedCategoryObj) {
            return false;
          }
          const productCat = normalizeCategory(product.category, visibleAllCategories);
          if (!productCat || productCat !== activeCategory) {
            return false;
          }
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

        // Price range slider (only apply when visitor has explicitly set a limit)
        if (selectedMaxPrice !== null) {
          const price = calculateProductPrice(product, rates).totalEstimate;
          if (price > selectedMaxPrice) {
            return false;
          }
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
    categoriesLoaded,
    selectedCategoryObj,
    visibleAllCategories,
    activeKarat,
    inStockOnly,
    selectedMaxPrice,
    activeSort,
    rates,
  ]);

  const handleResetFilters = () => {
    handleSearchInput('');
    onMetalChange('all');
    onCategoryChange(undefined);
    handleKaratSelect('all');
    setInStockOnly(false);
    setSelectedMaxPrice(null);
    handleSortSelect('newest');
  };

  // Clears category, search, karat, in-stock, and price filters while keeping current metal
  const handleShowAllInMetal = () => {
    handleSearchInput('');
    onCategoryChange(undefined);
    handleKaratSelect('all');
    setInStockOnly(false);
    setSelectedMaxPrice(null);
  };

  const isPriceFiltered =
    selectedMaxPrice !== null && selectedMaxPrice < highestCataloguePrice;
  const hasActiveFilters =
    activeSearch !== '' ||
    metal !== 'all' ||
    activeCategory !== 'all' ||
    activeKarat !== 'all' ||
    inStockOnly ||
    isPriceFiltered;

  // Dynamic Title Construction (driven by live category name)
  const pageTitle = useMemo(() => {
    const metalName =
      metal === 'gold' ? 'Gold' : metal === 'silver' ? 'Sterling Silver' : '';
    const catName = activeCategory !== 'all' ? activeCategoryLabel : '';

    if (metalName && catName) return `${metalName} ${catName}`;
    if (catName) return catName;
    if (metalName) return `${metalName} Collection`;
    return 'Fine Jewellery Collection';
  }, [metal, activeCategory, activeCategoryLabel]);

  const categories = useMemo(
    () => [
      { id: 'all', label: 'All Pieces' },
      ...activeVisibleCategories.map((cat) => ({
        id: cat.slug,
        label: cat.name,
      })),
    ],
    [activeVisibleCategories]
  );

  const purities = [
    { id: 'all', label: 'All Purities' },
    ...(metal !== 'silver'
      ? [
          { id: '24K', label: '24K Solid Gold (99.9%)' },
          { id: '22K', label: '22K Traditional (91.6%)' },
          { id: '21K', label: '21K (87.5%)' },
          { id: '18K', label: '18K Contemporary (75.0%)' },
        ]
      : []),
    ...(metal !== 'gold'
      ? [{ id: '925', label: '925 Sterling Silver (92.5%)' }]
      : []),
  ];

  const emptyStateWhatsAppHref = useMemo(() => {
    const waNumber = (settings.whatsappNumber || WHATSAPP_NUMBER).replace(/[^0-9]/g, '');
    const catWords = activeCategory !== 'all' ? activeCategoryLabel.toLowerCase() : '';
    let phrase = '';
    if (metal !== 'all' && catWords) {
      phrase = `${metal} ${catWords}`;
    } else if (metal !== 'all') {
      phrase = `${metal} jewellery`;
    } else if (catWords) {
      phrase = catWords;
    }

    const message = phrase
      ? `Hello Sona Chandi Gold Collection, I am looking for ${phrase}. Can you help or make a custom piece?`
      : 'Hello Sona Chandi Gold Collection, I am browsing your collection. Can you help or make a custom piece?';

    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  }, [settings.whatsappNumber, metal, activeCategory, activeCategoryLabel]);

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
          <div className="grid grid-cols-3 gap-2 mt-3">
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
                    const nextMetal = m.id as 'all' | 'gold' | 'silver';
                    onMetalChange(nextMetal);
                    handleKaratSelect('all');
                    if (
                      activeCategory !== 'all' &&
                      selectedCategoryObj &&
                      nextMetal !== 'all' &&
                      selectedCategoryObj.appliesTo !== 'both' &&
                      selectedCategoryObj.appliesTo !== nextMetal
                    ) {
                      onCategoryChange(undefined);
                    }
                  }}
                  className={`py-2 px-2 text-xs font-semibold rounded-full text-center transition-all cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#B8923A] outline-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] text-[#1A1410] shadow-xs'
                      : 'bg-[#FBF8F2] text-[#4A3F35] hover:text-[#1A1410] border border-[#E2D8C9] hover:border-[#B8923A]'
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
          className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-[0.14em] text-[#1A1410] py-1 cursor-pointer"
        >
          <span>Category</span>
          <ChevronDown
            className={`w-4 h-4 text-[#7A5A12] transition-transform duration-200 ${
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
                  className={`w-full py-2 px-3 text-xs font-medium rounded-full text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#B8923A] outline-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] text-[#1A1410] font-semibold shadow-xs'
                      : 'bg-[#FBF8F2] text-[#4A3F35] hover:text-[#1A1410] border border-[#E2D8C9] hover:border-[#B8923A]'
                  }`}
                >
                  <span>{cat.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A1410]" />
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
          className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-[0.14em] text-[#1A1410] py-1 cursor-pointer"
        >
          <span>Purity &amp; Karat</span>
          <ChevronDown
            className={`w-4 h-4 text-[#7A5A12] transition-transform duration-200 ${
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
                  className={`w-full py-2 px-3 text-xs font-medium rounded-full text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#B8923A] outline-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] text-[#1A1410] font-semibold shadow-xs'
                      : 'bg-[#FBF8F2] text-[#4A3F35] hover:text-[#1A1410] border border-[#E2D8C9] hover:border-[#B8923A]'
                  }`}
                >
                  <span>{p.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A1410]" />
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
          className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-[0.14em] text-[#1A1410] py-1 cursor-pointer"
        >
          <span>Availability</span>
          <ChevronDown
            className={`w-4 h-4 text-[#7A5A12] transition-transform duration-200 ${
              openGroups.availability ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openGroups.availability && (
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`w-full py-2 px-3 rounded-full text-xs font-medium transition-all flex items-center justify-between cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#B8923A] outline-hidden ${
                inStockOnly
                  ? 'bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] text-[#1A1410] font-semibold shadow-xs'
                  : 'bg-[#FBF8F2] text-[#4A3F35] hover:text-[#1A1410] border border-[#E2D8C9] hover:border-[#B8923A]'
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
                {formatPKR(effectiveMaxPrice)}
              </span>
            </div>

            <input
              type="range"
              min={20000}
              max={highestCataloguePrice}
              step={10000}
              value={effectiveMaxPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedMaxPrice(val >= highestCataloguePrice ? null : val);
              }}
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

  const gridKey = `${metal}|${activeCategory}|${activeKarat}|${activeSort}`;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-8">
      {/* 1. Breadcrumbs (Home / Gold / Rings) */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#6E6259] flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (onNavigateHome) onNavigateHome();
          }}
          className="hover:text-[#7A5A12] transition-colors cursor-pointer"
        >
          Home
        </button>
        <span className="text-[#B8923A]/60" aria-hidden="true">/</span>

        <button
          type="button"
          onClick={() => {
            onCategoryChange(undefined);
          }}
          className={`hover:text-[#7A5A12] transition-colors cursor-pointer ${
            activeCategory === 'all' ? 'font-semibold text-[#1A1410]' : ''
          }`}
        >
          {metal === 'gold' ? 'Gold' : metal === 'silver' ? 'Silver' : 'All Jewellery'}
        </button>

        {activeCategory !== 'all' && (
          <>
            <span className="text-[#B8923A]/60" aria-hidden="true">/</span>
            <span className="font-semibold text-[#1A1410]">
              {activeCategoryLabel}
            </span>
          </>
        )}
      </nav>

      {/* 2. Page Title, Count & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E2D8C9]">
        <div>
          <h1 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] text-[#1A1410] font-medium leading-[1.2] [text-wrap:balance]">
            {pageTitle}
          </h1>
          <p className="text-sm text-[#4A3F35] mt-1 font-light">
            {!productsLoaded || (activeCategory !== 'all' && !categoriesLoaded)
              ? 'Loading collection with live bullion pricing...'
              : `Showing ${filteredProducts.length} ${
                  filteredProducts.length === 1 ? 'piece' : 'pieces'
                } with transparent live bullion pricing`}
          </p>
        </div>

        {/* Right: Search, Filter Button (mobile) & Sort Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden min-h-[44px] px-4 py-2 bg-white/85 border border-[#B8923A] rounded-full text-xs font-semibold text-[#7A5A12] flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-[0.97]"
          >
            <Filter className="w-4 h-4 text-[#B8923A]" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#B8923A]" />
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6E6259] font-medium hidden md:inline">Sort:</span>
            <select
              value={activeSort}
              onChange={(e) => handleSortSelect(e.target.value)}
              className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold bg-white/85 text-[#1A1410] border border-[#E2D8C9] hover:border-[#B8923A] cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#B8923A] shadow-2xs"
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

      {/* Optional Category Banner (shown when selected category has description or imageUrl) */}
      {selectedCategoryObj &&
        (selectedCategoryObj.description || selectedCategoryObj.imageUrl) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 bg-[#FAF7F2]/90 border border-[#E2D8C9] rounded-2xl shadow-2xs">
            {selectedCategoryObj.imageUrl && (
              <img
                src={optimizeCloudinaryShowcase(selectedCategoryObj.imageUrl)}
                alt={selectedCategoryObj.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#C9A54B]/40 shrink-0"
                loading="lazy"
              />
            )}
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#7A5A12] block">
                {selectedCategoryObj.name}
              </span>
              {selectedCategoryObj.description && (
                <p className="text-xs sm:text-sm text-[#4A3F35] font-light leading-relaxed">
                  {selectedCategoryObj.description}
                </p>
              )}
            </div>
          </div>
        )}

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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] shadow-2xs">
              <span>{activeCategoryLabel}</span>
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

          {isPriceFiltered && selectedMaxPrice !== null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C9A54B] to-[#E8CF8A] text-[#1E1B18] shadow-2xs">
              <span>Under {formatPKR(selectedMaxPrice)}</span>
              <button
                type="button"
                onClick={() => setSelectedMaxPrice(null)}
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
          {!productsLoaded || (activeCategory !== 'all' && !categoriesLoaded) ? (
            /* Loading Skeleton Grid */
            <div
              className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6"
              aria-label="Loading jewellery collection"
            >
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white/85 border border-[#E2D8C9] rounded-2xl overflow-hidden flex flex-col animate-pulse"
                >
                  <div className="aspect-4/5 w-full bg-[#EFE9DF]" />
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="h-2.5 w-16 bg-[#EFE9DF] rounded" />
                    <div className="h-4 w-3/4 bg-[#E6DDD0] rounded" />
                    <div className="h-3 w-1/2 bg-[#EFE9DF] rounded" />
                    <div className="pt-3 border-t border-[#E2D8C9]/70 flex items-center justify-between">
                      <div className="h-5 w-24 bg-[#E6DDD0] rounded" />
                      <div className="h-7 w-14 bg-[#EFE9DF] rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : productsError && allProducts.length === 0 ? (
            /* Error State when listener failed and catalogue is empty */
            <div className="py-16 sm:py-24 text-center bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl p-8 space-y-5">
              <div className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#C9A54B]/40 flex items-center justify-center mx-auto shadow-2xs">
                <AlertCircle className="w-6 h-6 text-[#C9A54B]" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1E1B18]">
                  We could not load our collection. Please try again.
                </h3>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => retryStoreListeners()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] text-[#1A1410] text-xs font-semibold uppercase tracking-wider rounded-full transition-all shadow-xs cursor-pointer min-h-[44px] hover:brightness-105 active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            /* Mount-animated Grid keyed by filter/sort so cards never wait for scroll triggers */
            <StaggerGrid
              key={gridKey}
              animateOnMount
              className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6"
            >
              {filteredProducts.map((product, idx) => (
                <StaggerItem key={product.id} animateOnMount index={idx}>
                  <ProductCard
                    product={product}
                    rates={rates}
                    onSelect={onSelectProduct}
                    onAddToCart={onAddToCart}
                  />
                </StaggerItem>
              ))}
            </StaggerGrid>
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

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-lg mx-auto">
                <WhatsAppButton
                  href={emptyStateWhatsAppHref}
                  label="Message us on WhatsApp"
                  size="md"
                  className="w-full sm:w-auto"
                />

                <button
                  type="button"
                  onClick={handleShowAllInMetal}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#D4AF37] via-[#C9A54B] to-[#B18D35] hover:brightness-105 active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-all shadow-xs cursor-pointer min-h-[44px]"
                >
                  All pieces
                </button>
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
