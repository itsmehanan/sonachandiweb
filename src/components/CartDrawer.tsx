import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  Truck,
  Store,
  Info,
  ShieldCheck,
  Scale,
  Sparkles,
} from 'lucide-react';
import {
  BullionRates,
  calculateCartSummary,
  getWhatsAppOrderUrl,
  ESTIMATE_DISCLAIMER,
  FulfillmentOptions,
  gramsToTola,
  formatPKR,
} from '../lib/pricing';
import { Product, getSettings, logWhatsAppEnquiry } from '../data/store';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  rates: BullionRates;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigateToCatalogue: () => void;
  onSelectProduct: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  rates,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateToCatalogue,
  onSelectProduct,
}) => {
  const settings = getSettings();
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'courier' | 'pickup'>('courier');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState(
    settings.pickupBranches[0]?.name || 'Flagship Showroom - Liberty Market, Lahore'
  );
  const [orderNotes, setOrderNotes] = useState('');

  if (!isOpen) return null;

  // Pricing math handled strictly via pricing.ts
  const summary = calculateCartSummary(
    items.map((i) => ({ product: i.product, quantity: i.quantity })),
    rates
  );

  const fulfillment: FulfillmentOptions = {
    method: fulfillmentMethod,
    customerName: customerName.trim() || undefined,
    customerPhone: customerPhone.trim() || undefined,
    city: fulfillmentMethod === 'courier' ? city.trim() || undefined : undefined,
    deliveryAddress:
      fulfillmentMethod === 'courier' ? deliveryAddress.trim() || undefined : undefined,
    pickupLocation:
      fulfillmentMethod === 'pickup' ? pickupLocation : undefined,
    orderNotes: orderNotes.trim() || undefined,
  };

  const handleWhatsAppOrder = () => {
    const url = getWhatsAppOrderUrl(summary, fulfillment);

    // Save an enquiry with rate snapshot to Firestore, opening WhatsApp even if saving fails. Never say order was sent.
    logWhatsAppEnquiry({
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      fulfilment: fulfillmentMethod,
      notes: orderNotes.trim() || undefined,
      rateSnapshot: rates,
      estimatedTotal: summary.totalEstimate,
      items: summary.items.map((i) => ({
        sku: i.product.sku,
        name: i.product.title,
        qty: i.quantity,
        weightG: i.product.weightGrams,
        estimate: i.lineTotalEstimate,
      })),
    }).catch(() => {});

    // Open WhatsApp immediately
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag and WhatsApp order"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#FAF7F2] border-l border-[#E2D8C9] shadow-2xl flex flex-col h-full text-[#1E1B18]">
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-white border-b border-[#E2D8C9] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
                Jewellery Bag &amp; Inquiry
              </h2>
              <p className="text-xs text-[#64748B]">
                {items.length === 0
                  ? 'Your bag is empty'
                  : `${summary.totalQuantity} item${summary.totalQuantity > 1 ? 's' : ''} · ${summary.totalWeightGrams.toFixed(1)}g total`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#64748B] hover:text-[#1E1B18] rounded-md transition-colors"
              aria-label="Close bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#F3EFEA] border border-[#E2D8C9] flex items-center justify-center text-[#8E6E24]">
                  <Scale className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#1E1B18]">
                  Your bag is currently empty
                </h3>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                  Browse our handcrafted Pakistani gold and 925 silver collection to start an inquiry.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToCatalogue();
                  }}
                  className="px-6 py-2.5 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-medium text-xs uppercase tracking-wider rounded-md transition-all shadow-xs"
                >
                  Explore Catalogue
                </button>
              </div>
            ) : (
              <>
                {/* Itemized List */}
                <div className="space-y-4">
                  {summary.items.map((cartItem) => {
                    const { product, quantity, unitBreakdown, lineTotalEstimate } = cartItem;
                    const fullProduct = items.find((i) => i.product.id === product.id)?.product;
                    const tolaInfo = gramsToTola(product.weightGrams);

                    return (
                      <div
                        key={product.id}
                        className="p-4 bg-white border border-[#E2D8C9] rounded-xl flex gap-3.5 transition-shadow hover:shadow-xs"
                      >
                        {/* Thumbnail */}
                        <button
                          type="button"
                          onClick={() => {
                            if (fullProduct) {
                              onSelectProduct(fullProduct);
                              onClose();
                            }
                          }}
                          className="w-20 h-20 bg-[#FAF7F2] rounded-lg overflow-hidden shrink-0 border border-[#E2D8C9] group"
                        >
                          <img
                            src={fullProduct?.images[0] || '/public/assets/aistudio/intro-poster_d8a114e6.jpg'}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </button>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                onClick={() => {
                                  if (fullProduct) {
                                    onSelectProduct(fullProduct);
                                    onClose();
                                  }
                                }}
                                className="font-serif text-sm font-semibold text-[#1E1B18] line-clamp-1 cursor-pointer hover:text-[#8E6E24]"
                              >
                                {product.title}
                              </h4>
                              <button
                                onClick={() => onRemoveItem(product.id)}
                                className="text-[#94A3B8] hover:text-rose-600 transition-colors p-1"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Clean unboxed metadata */}
                            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                              <span className="font-mono text-[#1E1B18] font-medium">{product.sku}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-[#8E6E24]">
                                {unitBreakdown.karatLabel} {product.metal}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {product.weightGrams}g ({tolaInfo.formattedTola})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F3EFEA]">
                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-[#E2D8C9] rounded-md bg-[#FAF7F2]">
                              <button
                                onClick={() => onUpdateQuantity(product.id, -1)}
                                className="p-1 hover:text-[#8E6E24] text-[#64748B] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-semibold tabular-nums text-[#1E1B18]">
                                {quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(product.id, 1)}
                                className="p-1 hover:text-[#8E6E24] text-[#64748B] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Line Estimated Price */}
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-[#1E1B18]">
                                {formatPKR(lineTotalEstimate)}
                              </span>
                              {quantity > 1 && (
                                <span className="block text-[10px] text-[#64748B]">
                                  ({unitBreakdown.formattedEstimate} each)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Fulfilment Choice */}
                <div className="p-4 bg-white border border-[#E2D8C9] rounded-xl space-y-3.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Fulfilment Choice
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('courier')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        fulfillmentMethod === 'courier'
                          ? 'bg-[#FAF7F2] text-[#8E6E24] border-[#C9A54B] shadow-2xs'
                          : 'bg-white text-[#64748B] border-[#E2D8C9] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Courier Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('pickup')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        fulfillmentMethod === 'pickup'
                          ? 'bg-[#FAF7F2] text-[#8E6E24] border-[#C9A54B] shadow-2xs'
                          : 'bg-white text-[#64748B] border-[#E2D8C9] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Store Pickup</span>
                    </button>
                  </div>

                  {/* Customer Details Form */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Your Name (optional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] placeholder-[#94A3B8] outline-none focus:border-[#C9A54B]"
                      />
                      <input
                        type="text"
                        placeholder="WhatsApp / Phone (optional)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] placeholder-[#94A3B8] outline-none focus:border-[#C9A54B]"
                      />
                    </div>

                    {fulfillmentMethod === 'courier' ? (
                      <>
                        <input
                          type="text"
                          placeholder="Delivery City (e.g. Lahore, Karachi, Islamabad)"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] placeholder-[#94A3B8] outline-none focus:border-[#C9A54B]"
                        />
                        <textarea
                          placeholder="Complete Delivery Address & Landmark (optional)"
                          rows={2}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] placeholder-[#94A3B8] outline-none focus:border-[#C9A54B]"
                        />
                      </>
                    ) : (
                      <div>
                        <label className="block text-[11px] text-[#64748B] mb-1">
                          Select Showroom Branch for Pickup:
                        </label>
                        <select
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] outline-none focus:border-[#C9A54B]"
                        >
                          {settings.pickupBranches.map((branch) => (
                            <option key={branch.name} value={branch.name}>
                              {branch.name} ({branch.city})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Special notes or ring size requirement (optional)"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] placeholder-[#94A3B8] outline-none focus:border-[#C9A54B]"
                    />
                  </div>
                </div>

                {/* Price Breakdown & Required Disclaimer */}
                <div className="p-4 bg-[#F7F0DC]/40 border border-[#C9A54B]/30 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Total Jewellery Weight:</span>
                    <span className="font-mono text-[#1E1B18] font-medium">
                      {summary.totalWeightGrams.toFixed(2)} grams (~{gramsToTola(summary.totalWeightGrams).formattedTola})
                    </span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Fulfilment:</span>
                    <span className="font-medium text-[#1E1B18]">
                      {fulfillmentMethod === 'courier' ? 'Courier Delivery' : 'Store Pickup'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#C9A54B]/30 flex justify-between items-baseline">
                    <span className="font-semibold uppercase tracking-wider text-[#8E6E24] text-xs">
                      Estimated Total:
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#1E1B18]">
                      {summary.formattedTotal}
                    </span>
                  </div>

                  {/* MANDATORY EXACT LINE */}
                  <div className="mt-2 pt-2 border-t border-[#E2D8C9] flex items-start gap-1.5 text-[11px] text-[#8E6E24] leading-relaxed">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p className="font-medium italic">
                      "{ESTIMATE_DISCLAIMER}"
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer Actions */}
          {items.length > 0 && (
            <div className="p-5 bg-white border-t border-[#E2D8C9] space-y-3">
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="gold-sheen w-full py-3.5 px-4 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-medium text-sm tracking-wide rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Order on WhatsApp</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1">
                <span>No online payment required</span>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="hover:text-rose-600 transition-colors"
                >
                  Clear Bag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
