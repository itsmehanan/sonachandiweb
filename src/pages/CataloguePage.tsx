import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { Product, getProducts, ProductCategory } from '../data/store';
import { BullionRates, calculateProductPrice, MetalType, GoldKarat, SilverPurity } from '../lib/pricing';
import { ProductCard } from '../components/ProductCard';

interface CataloguePageProps {
  rates: BullionRates;
  initialFilter?: string;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const CataloguePage: React.FC<CataloguePageProps> = ({
  rates,
  initialFilter,
  onSelectProduct,
  onAddToCart,
}) => {
  const allProducts = getProducts();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetal, setSelectedMetal] = useState<string>(
    initialFilter === 'gold' ? 'gold' : initialFilter === 'silver' ? 'silver' : 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ['rings', 'necklaces', 'bangles', 'earrings', 'bridal_sets'].includes(initialFilter || '')
      ? initialFilter!
      : 'all'
  );
  const [selectedKarat, setSelectedKarat] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

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
        if (selectedMetal !== 'all' && product.metal !== selectedMetal) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
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
    selectedMetal,
    selectedCategory,
    selectedKarat,
    inStockOnly,
    sortBy,
    rates,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMetal('all');
    setSelectedCategory('all');
    setSelectedKarat('all');
    setInStockOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedMetal !== 'all' ||
    selectedCategory !== 'all' ||
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
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'All Pieces' },
          { id: 'bridal_sets', label: 'Bridal Sets' },
          { id: 'necklaces', label: 'Necklaces' },
          { id: 'bangles', label: 'Bangles & Karas' },
          { id: 'earrings', label: 'Earrings & Jhumkas' },
          { id: 'rings', label: 'Rings' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? 'bg-[#1E1B18] text-white shadow-xs font-semibold'
                : 'bg-white text-[#64748B] hover:text-[#1E1B18] border border-[#E2D8C9]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-white border border-[#E2D8C9] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Metal Toggle */}
        <div className="flex items-center gap-1 bg-[#F3EFEA] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setSelectedMetal('all');
              setSelectedKarat('all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              selectedMetal === 'all'
                ? 'bg-white text-[#1E1B18] shadow-2xs font-semibold'
                : 'text-[#64748B] hover:text-[#1E1B18]'
            }`}
          >
            All Metals
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedMetal('gold');
              setSelectedKarat('all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              selectedMetal === 'gold'
                ? 'bg-[#C9A54B] text-white shadow-2xs font-semibold'
                : 'text-[#64748B] hover:text-[#1E1B18]'
            }`}
          >
            Gold (Sona)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedMetal('silver');
              setSelectedKarat('all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              selectedMetal === 'silver'
                ? 'bg-[#475569] text-white shadow-2xs font-semibold'
                : 'text-[#64748B] hover:text-[#1E1B18]'
            }`}
          >
            Silver (Chandi)
          </button>
        </div>

        {/* Karat Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B] font-medium hidden sm:inline">Karat:</span>
          <select
            value={selectedKarat}
            onChange={(e) => setSelectedKarat(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-xs text-[#1E1B18] outline-none focus:border-[#C9A54B]"
          >
            <option value="all">All Karats</option>
            {selectedMetal !== 'silver' && (
              <>
                <option value="24K">24K Pure</option>
                <option value="22K">22K Royal</option>
                <option value="21K">21K Traditional</option>
                <option value="18K">18K Modern</option>
              </>
            )}
            {selectedMetal !== 'gold' && (
              <option value="925_sterling">925 Sterling Silver</option>
            )}
          </select>
        </div>

        {/* Availability Filter Checkbox */}
        <label className="flex items-center gap-2 text-xs text-[#1E1B18] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded border-[#E2D8C9] text-[#C9A54B] focus:ring-[#C9A54B]"
          />
          <span className="font-medium">In Stock Ready to Ship</span>
        </label>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#64748B] font-medium hidden sm:inline">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-xs text-[#1E1B18] outline-none focus:border-[#C9A54B]"
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
              className="p-1.5 text-xs text-[#8E6E24] hover:text-[#1E1B18] flex items-center gap-1 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
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
