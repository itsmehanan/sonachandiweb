import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { Product, getProducts, ProductCategory } from '../data/store';
import { BullionRates, calculateProductPrice, MetalType, GoldKarat, SilverPurity } from '../lib/pricing';
import { ProductCard } from '../components/ProductCard';

interface CataloguePageProps {
  rates: BullionRates;
  metal: 'all' | 'gold' | 'silver';
  onMetalChange: (metal: 'all' | 'gold' | 'silver') => void;
  category?: string;
  onCategoryChange: (category: string | undefined) => void;
  resetNonce?: number;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const CataloguePage: React.FC<CataloguePageProps> = ({
  rates,
  metal,
  onMetalChange,
  category,
  onCategoryChange,
  resetNonce,
  onSelectProduct,
  onAddToCart,
}) => {
  const allProducts = getProducts();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKarat, setSelectedKarat] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');

  const activeCategory = category || 'all';

  // Clear secondary filters when resetNonce changes (e.g. navbar click)
  useEffect(() => {
    if (resetNonce !== undefined && resetNonce > 0) {
      setSearchQuery('');
      setSelectedKarat('all');
      setInStockOnly(false);
    }
  }, [resetNonce]);

  // Reset karat filter when metal changes
  useEffect(() => {
    setSelectedKarat('all');
  }, [metal]);

  // Compute Prices & Filter Products
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Search by title or SKU
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = product.title.toLowerCase().includes(q);
          const matchesSku = product.sku.toLowerCase().includes(q);
          const matchesDesc = product.shortDescription.toLowerCase().includes(q);
          if (!matchesName && !matchesSku && !matchesDesc) return false;
        }

        // Metal filter
        if (metal !== 'all' && product.metal !== metal) {
          return false;
        }

        // Category filter
        if (activeCategory !== 'all' && product.category !== activeCategory) {
          return false;
        }

        // Karat filter
        if (selectedKarat !== 'all') {
          if (product.karat !== selectedKarat) return false;
        }

        // Availability filter
        if (inStockOnly && !product.inStock) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = calculateProductPrice(a, rates).totalEstimate;
        const priceB = calculateProductPrice(b, rates).totalEstimate;

        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        if (sortBy === 'weight_asc') return a.weightGrams - b.weightGrams;
        if (sortBy === 'weight_desc') return b.weightGrams - a.weightGrams;
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        // Default: featured first, then in stock
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [
    allProducts,
    searchQuery,
    metal,
    activeCategory,
    selectedKarat,
    inStockOnly,
    sortBy,
    rates,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    onMetalChange('all');
    onCategoryChange(undefined);
    setSelectedKarat('all');
    setInStockOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    metal !== 'all' ||
    activeCategory !== 'all' ||
    selectedKarat !== 'all' ||
    inStockOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E2D8C9]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1B18] font-normal tracking-tight">
            Jewellery Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-light">
            Showing {filteredProducts.length} of {allProducts.length} items with live bullion rates
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by name, SKU (e.g. SC-GLD)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#E2D8C9] rounded-lg text-xs sm:text-sm text-[#1E1B18] placeholder-[#94A3B8] outline-none focus:border-[#C9A54B] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#1E1B18]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Category Quick Switcher (Clean Segmented Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'All Pieces' },
          { id: 'bridal_sets', label: 'Bridal Sets' },
          { id: 'necklaces', label: 'Necklaces' },
          { id: 'bangles', label: 'Bangles & Karas' },
          { id: 'earrings', label: 'Earrings & Jhumkas' },
          { id: 'rings', label: 'Rings' },
        ].map((tab) => {
          const isSelected = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onCategoryChange(tab.id === 'all' ? undefined : tab.id)}
              className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-1 focus-visible:outline-none transition-all ${
                isSelected ? 'btn-filter-gold' : 'btn-filter-ivory'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-white/95 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        {/* Top Row: Metal Tabs & Availability & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Metal Tabs: Selected is Gold gradient, Unselected is Ivory */}
          <div className="flex items-center gap-1.5 bg-[#F6F2EA] p-1 rounded-xl border border-[#E2D8C9]/80">
            {[
              { id: 'all', label: 'All Metals' },
              { id: 'gold', label: 'Gold (Sona)' },
              { id: 'silver', label: 'Silver (Chandi)' },
            ].map((m) => {
              const isSelected = metal === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onMetalChange(m.id as 'all' | 'gold' | 'silver');
                    setSelectedKarat('all');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-1 focus-visible:outline-none transition-all ${
                    isSelected ? 'btn-filter-gold' : 'btn-filter-ivory'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Availability Toggle Button */}
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-1 focus-visible:outline-none transition-all ${
              inStockOnly ? 'btn-filter-gold' : 'btn-filter-ivory'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                inStockOnly ? 'bg-[#1E1B18]' : 'bg-[#C9A54B]'
              }`}
            />
            <span>In Stock Ready to Ship</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[#64748B] font-medium hidden sm:inline">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-1 transition-all ${
                sortBy !== 'featured' ? 'btn-filter-gold' : 'btn-filter-ivory'
              }`}
            >
              <option value="featured">Featured First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="weight_asc">Weight: Low to High</option>
              <option value="weight_desc">Weight: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-[#8E6E24] hover:text-[#1E1B18] flex items-center gap-1 rounded-lg border border-[#E2D8C9] hover:border-[#C9A54B] bg-[#FAF7F2] active:scale-[0.97] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:outline-none"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-medium">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Karat Chips */}
        <div className="pt-2 border-t border-[#F3EFEA] flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#64748B] font-medium mr-1">Karat &amp; Purity:</span>
          {[
            { id: 'all', label: 'All Karats' },
            ...(metal !== 'silver'
              ? [
                  { id: '24K', label: '24K Pure' },
                  { id: '22K', label: '22K Royal' },
                  { id: '21K', label: '21K Traditional' },
                  { id: '18K', label: '18K Modern' },
                ]
              : []),
            ...(metal !== 'gold'
              ? [{ id: '925_sterling', label: '925 Sterling Silver' }]
              : []),
          ].map((k) => {
            const isSelected = selectedKarat === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setSelectedKarat(k.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C9A54B] focus-visible:ring-offset-1 focus-visible:outline-none transition-all ${
                  isSelected ? 'btn-filter-gold' : 'btn-filter-ivory'
                }`}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        /* Empty State */
        <div className="py-20 text-center bg-white border border-[#E2D8C9] rounded-2xl p-8 space-y-4">
          <SlidersHorizontal className="w-12 h-12 text-[#94A3B8] mx-auto" />
          <h3 className="font-serif text-xl font-semibold text-[#1E1B18]">
            No matching jewellery found
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Try adjusting your search query, clearing karat filters, or toggling out-of-stock items.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 bg-[#C9A54B] hover:bg-[#B18D35] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all shadow-xs"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
