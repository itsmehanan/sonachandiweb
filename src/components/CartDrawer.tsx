import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  Info,
  Scale,
  Sparkles,
  CheckCircle2,
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
import { WhatsAppButton } from './WhatsAppButton';

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
    settings.address || 'Showroom Pickup (Arranged via WhatsApp)'
  );
  const [orderNotes, setOrderNotes] = useState('');
  const [savedForTeam, setSavedForTeam] = useState(false);

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
    // 1. Generate WhatsApp URL and open immediately without blocking
    const url = getWhatsAppOrderUrl(summary, fulfillment, settings.whatsappNumber);
    window.open(url, '_blank', 'noopener,noreferrer');

    // 2. Put city, address, pickup location inside notes (max 1000 chars) for Firestore enquiry compliance
    const noteParts: string[] = [];
    if (fulfillmentMethod === 'courier') {
      if (city.trim()) noteParts.push(`City: ${city.trim()}`);
      if (deliveryAddress.trim()) noteParts.push(`Address: ${deliveryAddress.trim()}`);
    } else {
      if (pickupLocation) noteParts.push(`Pickup: ${pickupLocation}`);
    }
    if (orderNotes.trim()) {
      noteParts.push(`Notes: ${orderNotes.trim()}`);
    }
    const combinedNotes = noteParts.join(' | ').slice(0, 1000);

    // 3. Log enquiry to Firestore in background; show confirmation only if saving succeeded
    logWhatsAppEnquiry({
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      fulfilment: fulfillmentMethod,
      notes: combinedNotes || undefined,
      rateSnapshot: rates,
      estimatedTotal: summary.totalEstimate,
      items: summary.items.map((i) => ({
        sku: i.product.sku,
        name: i.product.title,
        qty: i.quantity,
        weightG: i.product.weightGrams,
        estimate: i.lineTotalEstimate,
      })),
    })
      .then((success) => {
        if (success) {
          setSavedForTeam(true);
        }
      })
      .catch(() => {});
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
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#FBF8F2] border-l border-[#E2D8C9] shadow-2xl flex flex-col h-full text-[#1A1410]">
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-white border-b border-[#E2D8C9] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1A1410]">
                Jewellery Bag &amp; Inquiry
              </h2>
              <p className="text-xs text-[#5C5046]">
                {items.length === 0
                  ? 'Your bag is empty'
                  : `${summary.totalQuantity} item${summary.totalQuantity > 1 ? 's' : ''} · ${summary.totalWeightGrams.toFixed(1)}g total`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#5C5046] hover:text-[#1A1410] rounded-full transition-colors cursor-pointer"
              aria-label="Close bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#F3EAD7] border border-[#B8923A]/30 flex items-center justify-center text-[#7A5A12]">
                  <Scale className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#1A1410]">
                  Your bag is currently empty
                </h3>
                <p className="text-xs text-[#5C5046] max-w-xs mx-auto">
                  Browse our Pakistani gold and 925 silver collection to start an inquiry.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToCatalogue();
                  }}
                  className="btn-primary-gold rounded-full px-6 py-2.5 font-semibold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
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
                        className="p-4 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl flex gap-3.5 transition-shadow hover:shadow-xs"
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
                          className="w-20 h-20 bg-[#F3EAD7] rounded-xl overflow-hidden shrink-0 border border-[#E2D8C9] group flex items-center justify-center cursor-pointer"
                        >
                          {fullProduct?.images && fullProduct.images[0] ? (
                            <img
                              src={fullProduct.images[0]}
                              alt={product.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Sparkles className="w-6 h-6 text-[#7A5A12]" />
                          )}
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
                                className="font-serif text-sm font-semibold text-[#1A1410] line-clamp-1 cursor-pointer hover:text-[#7A5A12]"
                              >
                                {product.title}
                              </h4>
                              <button
                                onClick={() => onRemoveItem(product.id)}
                                className="text-[#A8ADB3] hover:text-rose-600 transition-colors p-1 cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Clean metadata */}
                            <div className="flex items-center gap-1.5 text-[11px] text-[#5C5046] mt-0.5">
                              <span className="font-mono text-[#1A1410] font-medium">{product.sku}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-[#7A5A12]">
                                {unitBreakdown.karatLabel} {product.metal}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {product.weightGrams}g ({tolaInfo.formattedTola})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E2D8C9]">
                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-[#E2D8C9] rounded-full bg-[#F3EAD7]/50">
                              <button
                                onClick={() => onUpdateQuantity(product.id, -1)}
                                className="p-1 hover:text-[#7A5A12] text-[#5C5046] transition-colors cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-semibold tabular-nums text-[#1A1410]">
                                {quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(product.id, 1)}
                                className="p-1 hover:text-[#7A5A12] text-[#5C5046] transition-colors cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Line Estimated Price */}
                            <div className="text-right">
                              {product.metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0 ? (
                                <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                  Rate unavailable
                                </span>
                              ) : (
                                <>
                                  <span className="font-serif font-bold text-sm text-[#1A1410] tabular-nums">
                                    {formatPKR(lineTotalEstimate)}
                                  </span>
                                  {quantity > 1 && (
                                    <span className="block text-[10px] text-[#5C5046] tabular-nums">
                                      ({unitBreakdown.formattedEstimate} each)
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Fulfilment Choice */}
                <div className="p-5 bg-white/85 backdrop-blur-xs border border-[#E2D8C9] rounded-2xl space-y-3.5">
                  <label className="label-kicker block text-[#7A5A12]">
                    Fulfilment Choice
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('courier')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                        fulfillmentMethod === 'courier'
                          ? 'bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] text-[#1A1410] border-[#B8923A] shadow-xs'
                          : 'bg-[#FBF8F2] text-[#5C5046] border-[#E2D8C9] hover:border-[#B8923A]'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Courier Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('pickup')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                        fulfillmentMethod === 'pickup'
                          ? 'bg-gradient-to-r from-[#C9A54B] to-[#F1D98B] text-[#1A1410] border-[#B8923A] shadow-xs'
                          : 'bg-[#FBF8F2] text-[#5C5046] border-[#E2D8C9] hover:border-[#B8923A]'
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
                        className="w-full px-3.5 py-2.5 bg-[#FBF8F2] border border-[#E2D8C9] rounded-xl text-[#1A1410] placeholder-[#A8ADB3] outline-none focus:border-[#B8923A]"
                      />
                      <input
                        type="text"
                        placeholder="WhatsApp / Phone (optional)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FBF8F2] border border-[#E2D8C9] rounded-xl text-[#1A1410] placeholder-[#A8ADB3] outline-none focus:border-[#B8923A]"
                      />
                    </div>

                    {fulfillmentMethod === 'courier' ? (
                      <>
                        <input
                          type="text"
                          placeholder="Delivery City (e.g. Lahore, Karachi, Islamabad)"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#FBF8F2] border border-[#E2D8C9] rounded-xl text-[#1A1410] placeholder-[#A8ADB3] outline-none focus:border-[#B8923A]"
                        />
                        <textarea
                          placeholder="Complete Delivery Address &amp; Landmark (optional)"
                          rows={2}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#FBF8F2] border border-[#E2D8C9] rounded-xl text-[#1A1410] placeholder-[#A8ADB3] outline-none focus:border-[#B8923A]"
                        />
                      </>
                    ) : (
                      <div>
                        <label className="block text-[11px] text-[#5C5046] mb-1">
                          Showroom Location for Pickup:
                        </label>
                        <select
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#FBF8F2] border border-[#E2D8C9] rounded-xl text-[#1A1410] outline-none focus:border-[#B8923A]"
                        >
                          {settings.address ? (
                            <option value={settings.address}>{settings.address}</option>
                          ) : (
                            <option value="Main Showroom (Contact on WhatsApp for appointment)">
                              Main Showroom (Contact on WhatsApp for appointment)
                            </option>
                          )}
                        </select>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Special notes or sizing request (optional)"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#FBF8F2] border border-[#E2D8C9] rounded-xl text-[#1A1410] placeholder-[#A8ADB3] outline-none focus:border-[#B8923A]"
                    />
                  </div>
                </div>

                {/* Price Breakdown & Required Disclaimer */}
                <div className="p-5 bg-[#F3EAD7] border border-[#B8923A]/30 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex justify-between text-[#5C5046]">
                    <span>Total Jewellery Weight:</span>
                    <span className="font-mono text-[#1A1410] font-medium">
                      {summary.totalWeightGrams.toFixed(2)} grams (~{gramsToTola(summary.totalWeightGrams).formattedTola})
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5C5046]">
                    <span>Fulfilment:</span>
                    <span className="font-medium text-[#1A1410]">
                      {fulfillmentMethod === 'courier' ? 'Courier Delivery' : 'Store Pickup'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#B8923A]/30 flex justify-between items-baseline">
                    <span className="label-kicker text-[#7A5A12]">
                      Estimated Total:
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#1A1410] tabular-nums">
                      {summary.items.some((i) =>
                        i.product.metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0
                      ) ? (
                        <span className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded">
                          Rate unavailable
                        </span>
                      ) : (
                        summary.formattedTotal
                      )}
                    </span>
                  </div>

                  {/* MANDATORY EXACT LINE */}
                  <div className="mt-2 pt-2 border-t border-[#E2D8C9] flex items-start gap-1.5 text-[11px] text-[#7A5A12] leading-relaxed">
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
              <WhatsAppButton
                onClick={handleWhatsAppOrder}
                label="Order on WhatsApp"
                size="lg"
                fullWidth
                disabled={summary.items.some((i) =>
                  i.product.metal === 'gold' ? rates.gold24KPerTola <= 0 : rates.silverRate <= 0
                )}
              />

              {savedForTeam && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-lg animate-in fade-in duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Saved for our team</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-[#5C5046] px-1">
                <span>No online payment required</span>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="hover:text-rose-700 transition-colors cursor-pointer"
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
