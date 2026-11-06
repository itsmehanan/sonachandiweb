import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { Product, getProducts } from '../data/store';
import { BullionRates, calculateProductPrice, formatPKR } from '../lib/pricing';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchSubmit: (query: string) => void;
  onSelectProduct: (product: Product) => void;
  rates: BullionRates;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSearchSubmit,
  onSelectProduct,
  rates,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 60);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  // Live filtered results
  const allProducts = getProducts();
  const trimmed = query.trim().toLowerCase();

  const matchingProducts = trimmed
    ? allProducts.filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(trimmed);
        const skuMatch = p.sku.toLowerCase().includes(trimmed);
        const descMatch = p.shortDescription.toLowerCase().includes(trimmed);
        const catMatch = p.category.toLowerCase().includes(trimmed);
        const metalMatch = p.metal.toLowerCase().includes(trimmed);
        const karatMatch = p.karat.toLowerCase().includes(trimmed);
        return titleMatch || skuMatch || descMatch || catMatch || metalMatch || karatMatch;
      })
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        onSearchSubmit(query.trim());
        onClose();
      }
    }
  };

  const handleSuggestionClick = (suggested: string) => {
    setQuery(suggested);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search jewellery collection"
        className="fixed inset-0 z-50 bg-[#FAF7F2]/96 backdrop-blur-md overflow-y-auto"
        ref={containerRef}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16 min-h-screen flex flex-col">
          {/* Top Row: Search Input + Close Button */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#C9A54B]/40">
            <div className="relative flex-1 flex items-center gap-3">
              <Search className="w-6 h-6 sm:w-7 sm:h-7 text-[#C9A54B] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search jewellery, 22K gold, rings, SKU..."
                className="w-full bg-transparent font-serif text-xl sm:text-3xl text-[#1E1B18] placeholder-[#94A3B8] outline-hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1.5 text-[#94A3B8] hover:text-[#1E1B18] rounded-full hover:bg-[#EAE3D6] transition-colors cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-[#8E6E24] hover:text-[#1E1B18] bg-white border border-[#E2D8C9] hover:border-[#C9A54B] rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-[#C9A54B] outline-hidden min-h-[44px]"
            >
              <span>Close</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#FAF7F2] border border-[#D6CBB8] rounded font-mono text-[#64748B]">
                Esc
              </kbd>
            </button>
          </div>

          {/* Quick Suggestions (when empty) */}
          {!trimmed && (
            <div className="pt-8 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8E6E24] block">
                Popular Searches:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Bridal Sets',
                  '22K Gold Necklaces',
                  '21K Traditional Karas',
                  '925 Sterling Silver',
                  'Diamond Solitaire Rings',
                  'Bangles',
                  'Jhumkas',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className="px-3.5 py-2 text-xs font-medium text-[#475569] hover:text-[#1E1B18] bg-white hover:bg-[#FAF7F2] border border-[#E2D8C9] hover:border-[#C9A54B] rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Search Results */}
          {trimmed && (
            <div className="pt-6 flex-1 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>
                  Found <strong className="text-[#1E1B18]">{matchingProducts.length}</strong> matching pieces
                </span>
                {matchingProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchSubmit(query.trim());
                      onClose();
                    }}
                    className="text-[#8E6E24] hover:text-[#1E1B18] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all in catalogue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {matchingProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                  {matchingProducts.slice(0, 9).map((product) => {
                    const priceEstimate = calculateProductPrice(product, rates);
                    const isRateMissing =
                      product.metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0;
                    const imageSrc =
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : '/assets/aistudio/logo-light.png';

                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          onSelectProduct(product);
                          onClose();
                        }}
                        className="p-3 bg-white hover:bg-[#FFFDF9] border border-[#E2D8C9] hover:border-[#C9A54B] rounded-xl transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex gap-3 group"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden bg-[#FAF7F2] border border-[#E2D8C9]/80 shrink-0">
                          <img
                            src={imageSrc}
                            alt={product.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#8E6E24]">
                              <span>{product.metal === 'gold' ? `${product.karat} Gold` : '925 Silver'}</span>
                              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
                              <span className="text-[#94A3B8]">{product.sku}</span>
                            </div>
                            <h4 className="font-serif text-sm font-semibold text-[#1E1B18] group-hover:text-[#8E6E24] transition-colors truncate">
                              {product.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className={`font-mono font-bold ${isRateMissing ? 'text-xs text-rose-700' : 'text-[#1E1B18]'}`}>
                              {isRateMissing ? 'Rate unavailable' : priceEstimate.formattedEstimate}
                            </span>
                            {product.inStock ? (
                              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded">
                                In Stock
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#64748B] font-medium bg-gray-50 px-1.5 py-0.2 rounded">
                                On Order
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* No Results Message */
                <div className="py-16 text-center space-y-3 bg-white/70 border border-[#E2D8C9] rounded-2xl p-8">
                  <Sparkles className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <h3 className="font-serif text-lg font-semibold text-[#1E1B18]">
                    No jewellery found for "{query}"
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    Try searching by piece (e.g. necklace, ring), metal (gold, silver), karat (22K), or product SKU.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
};
