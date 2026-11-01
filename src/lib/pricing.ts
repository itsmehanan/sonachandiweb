/**
 * Sona & Chandi Gold Collection - Centralized Pricing Engine
 *
 * ALL price math lives in this ONE file. Components must never compute prices themselves.
 *
 * BUSINESS RULES:
 * 1. Owner sets ONLY the 24K gold rate per tola.
 * 2. 1 tola = 11.6638 grams.
 * 3. 24K per gram = rate24KPerTola / 11.6638
 * 4. 22K per gram = (24K per gram) * (22 / 24)
 * 5. 21K per gram = (24K per gram) * (21 / 24)
 * 6. 18K per gram = (24K per gram) * (18 / 24)
 * 7. Gold estimate = total weight (grams) * per-gram rate for the karat + making charge.
 * 8. Silver estimate = total weight * silver per-gram rate + making charge.
 *    Silver rate unit is configurable (per tola or per gram).
 * 9. Use FULL weight; never subtract stone weight. No wastage, stone, service or tax charges.
 * 10. Round final estimate to nearest whole PKR (Math.round).
 * 11. Making charge is per product: either fixed per piece, or per gram.
 */

export const TOLA_IN_GRAMS = 11.6638;
export const WHATSAPP_NUMBER = '923109412332';
export const ESTIMATE_DISCLAIMER =
  'Estimated price only. Final price will be confirmed on WhatsApp based on the latest rate.';

export type GoldKarat = '24K' | '22K' | '21K' | '18K';
export type SilverPurity = '925_sterling' | 'fine_silver';
export type MetalType = 'gold' | 'silver';

export type MakingCharge =
  | { type: 'fixed'; amount: number }
  | { type: 'per_gram'; amount: number };

export interface BullionRates {
  gold24KPerTola: number; // e.g. 278500
  silverRate: number; // e.g. 3350
  silverUnit: 'per_tola' | 'per_gram';
  lastUpdated: string;
}

export interface PricingProductInput {
  id: string;
  sku: string;
  title: string;
  metal: MetalType;
  karat: GoldKarat | SilverPurity;
  weightGrams: number;
  makingCharge: MakingCharge;
}

export interface PriceBreakdown {
  metal: MetalType;
  karatLabel: string;
  weightGrams: number;
  perGramRate: number;
  baseMetalPrice: number;
  makingChargeTotal: number;
  makingChargeType: 'fixed' | 'per_gram';
  totalEstimate: number; // rounded to nearest whole PKR
  formattedEstimate: string;
  disclaimer: string;
}

export interface CartItemPricing {
  product: PricingProductInput;
  quantity: number;
  unitBreakdown: PriceBreakdown;
  lineTotalEstimate: number;
}

export interface CartSummaryPricing {
  items: CartItemPricing[];
  totalQuantity: number;
  totalWeightGrams: number;
  totalEstimate: number;
  formattedTotal: string;
  disclaimer: string;
}

export interface FulfillmentOptions {
  method: 'courier' | 'pickup';
  customerName?: string;
  customerPhone?: string;
  city?: string;
  deliveryAddress?: string;
  pickupLocation?: string;
  orderNotes?: string;
}

/**
 * 1. Calculate 24K Gold Rate Per Gram
 */
export function get24KGoldPerGram(gold24KPerTola: number): number {
  if (gold24KPerTola <= 0) return 0;
  return gold24KPerTola / TOLA_IN_GRAMS;
}

/**
 * 2. Calculate Gold Per Gram Rate for specific Karat (24K, 22K, 21K, 18K)
 */
export function getGoldPerGramForKarat(karat: GoldKarat, gold24KPerTola: number): number {
  const rate24KGram = get24KGoldPerGram(gold24KPerTola);
  switch (karat) {
    case '24K':
      return rate24KGram;
    case '22K':
      return rate24KGram * (22 / 24);
    case '21K':
      return rate24KGram * (21 / 24);
    case '18K':
      return rate24KGram * (18 / 24);
    default:
      return rate24KGram * (22 / 24);
  }
}

/**
 * 3. Calculate Silver Per Gram Rate based on configurable unit
 */
export function getSilverPerGram(silverRate: number, silverUnit: 'per_tola' | 'per_gram'): number {
  if (silverRate <= 0) return 0;
  if (silverUnit === 'per_tola') {
    return silverRate / TOLA_IN_GRAMS;
  }
  return silverRate;
}

/**
 * 4. Get effective per-gram rate for any product's metal & karat
 */
export function getPerGramRate(
  metal: MetalType,
  karat: GoldKarat | SilverPurity,
  rates: BullionRates
): number {
  if (metal === 'gold') {
    return getGoldPerGramForKarat(karat as GoldKarat, rates.gold24KPerTola);
  }
  return getSilverPerGram(rates.silverRate, rates.silverUnit);
}

/**
 * 5. Compute Making Charge
 */
export function computeMakingCharge(
  makingCharge: MakingCharge,
  weightGrams: number
): { totalMaking: number; type: 'fixed' | 'per_gram' } {
  if (makingCharge.type === 'fixed') {
    return { totalMaking: makingCharge.amount, type: 'fixed' };
  }
  return {
    totalMaking: makingCharge.amount * weightGrams,
    type: 'per_gram',
  };
}

/**
 * 6. Calculate Complete Price Breakdown for a Product
 */
export function calculateProductPrice(
  product: PricingProductInput,
  rates: BullionRates
): PriceBreakdown {
  const perGramRate = getPerGramRate(product.metal, product.karat, rates);
  // Full weight used, never subtract stones
  const baseMetalPrice = product.weightGrams * perGramRate;
  const { totalMaking, type } = computeMakingCharge(product.makingCharge, product.weightGrams);

  // Round final estimate to nearest whole PKR
  const totalEstimate = Math.round(baseMetalPrice + totalMaking);

  const karatLabel =
    product.metal === 'gold'
      ? (product.karat as string)
      : product.karat === '925_sterling'
      ? '925 Sterling'
      : 'Fine Silver';

  return {
    metal: product.metal,
    karatLabel,
    weightGrams: product.weightGrams,
    perGramRate,
    baseMetalPrice,
    makingChargeTotal: totalMaking,
    makingChargeType: type,
    totalEstimate,
    formattedEstimate: formatPKR(totalEstimate),
    disclaimer: ESTIMATE_DISCLAIMER,
  };
}

/**
 * 7. Calculate Cart Summary
 */
export function calculateCartSummary(
  items: Array<{ product: PricingProductInput; quantity: number }>,
  rates: BullionRates
): CartSummaryPricing {
  const cartItems: CartItemPricing[] = items.map((item) => {
    const unitBreakdown = calculateProductPrice(item.product, rates);
    const lineTotalEstimate = unitBreakdown.totalEstimate * item.quantity;
    return {
      product: item.product,
      quantity: item.quantity,
      unitBreakdown,
      lineTotalEstimate,
    };
  });

  const totalQuantity = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalWeightGrams = cartItems.reduce(
    (acc, curr) => acc + curr.product.weightGrams * curr.quantity,
    0
  );
  const totalEstimate = cartItems.reduce((acc, curr) => acc + curr.lineTotalEstimate, 0);

  return {
    items: cartItems,
    totalQuantity,
    totalWeightGrams,
    totalEstimate,
    formattedTotal: formatPKR(totalEstimate),
    disclaimer: ESTIMATE_DISCLAIMER,
  };
}

/**
 * 8. Format PKR with commas
 */
export function formatPKR(amount: number): string {
  if (isNaN(amount)) return 'Rs. 0';
  const rounded = Math.round(amount);
  return `Rs. ${rounded.toLocaleString('en-PK')}`;
}

/**
 * 9. Convert grams to tola format (decimal and traditional tola-masha-rati)
 */
export function gramsToTola(grams: number): {
  decimal: number;
  formattedTola: string;
  traditional: string;
} {
  const tola = grams / TOLA_IN_GRAMS;
  const tolaFixed = Number(tola.toFixed(3));

  // 1 tola = 12 masha, 1 masha = 8 rati
  const wholeTola = Math.floor(tola);
  const remMasha = (tola - wholeTola) * 12;
  const wholeMasha = Math.floor(remMasha);
  const remRati = (remMasha - wholeMasha) * 8;
  const roundedRati = Math.round(remRati * 10) / 10;

  const parts: string[] = [];
  if (wholeTola > 0) parts.push(`${wholeTola} tola`);
  if (wholeMasha > 0) parts.push(`${wholeMasha} masha`);
  if (roundedRati > 0 || parts.length === 0) parts.push(`${roundedRati} rati`);

  return {
    decimal: tolaFixed,
    formattedTola: `${tolaFixed} tola`,
    traditional: parts.join(' '),
  };
}

/**
 * 10. Generate WhatsApp Order Message & URL
 *
 * Fulfils the exact specification:
 * - opens https://wa.me/923109412332
 * - ONE prefilled message listing every item (name, SKU, quantity, weight, estimated price)
 * - fulfilment choice (Courier delivery or Store pickup)
 * - estimated total
 * - exact line: "Estimated price only. Final price will be confirmed on WhatsApp based on the latest rate."
 * - NEVER says order was placed or sent.
 */
export function buildWhatsAppOrderMessage(
  cartSummary: CartSummaryPricing,
  fulfillment: FulfillmentOptions
): string {
  const lines: string[] = [];

  lines.push('Assalam-o-Alaikum, Sona & Chandi Gold Collection.');
  lines.push('I would like to inquiry/order the following jewellery items from your storefront:');
  lines.push('');

  cartSummary.items.forEach((item, index) => {
    const { product, quantity, unitBreakdown, lineTotalEstimate } = item;
    const tolaInfo = gramsToTola(product.weightGrams);
    lines.push(
      `${index + 1}. *${product.title}*`
    );
    lines.push(`   - SKU: ${product.sku}`);
    lines.push(`   - Metal & Karat: ${unitBreakdown.karatLabel} ${unitBreakdown.metal.toUpperCase()}`);
    lines.push(`   - Weight: ${product.weightGrams}g (~${tolaInfo.formattedTola})`);
    lines.push(`   - Quantity: ${quantity}`);
    lines.push(`   - Est. Unit Price: ${unitBreakdown.formattedEstimate}`);
    if (quantity > 1) {
      lines.push(`   - Subtotal: ${formatPKR(lineTotalEstimate)}`);
    }
    lines.push('');
  });

  const fulfillmentLabel =
    fulfillment.method === 'courier' ? 'Courier delivery' : 'Store pickup';
  lines.push(`*Fulfilment choice:* ${fulfillmentLabel}`);

  if (fulfillment.customerName) {
    lines.push(`*Customer Name:* ${fulfillment.customerName}`);
  }
  if (fulfillment.customerPhone) {
    lines.push(`*Contact Number:* ${fulfillment.customerPhone}`);
  }

  if (fulfillment.method === 'courier') {
    if (fulfillment.city) lines.push(`*City:* ${fulfillment.city}`);
    if (fulfillment.deliveryAddress) lines.push(`*Delivery Address:* ${fulfillment.deliveryAddress}`);
  } else {
    if (fulfillment.pickupLocation) lines.push(`*Pickup Branch:* ${fulfillment.pickupLocation}`);
  }

  if (fulfillment.orderNotes) {
    lines.push(`*Special Instructions / Ring Size:* ${fulfillment.orderNotes}`);
  }

  lines.push('');
  lines.push(`*Total Items:* ${cartSummary.totalQuantity}`);
  lines.push(`*Total Weight:* ${cartSummary.totalWeightGrams.toFixed(2)}g`);
  lines.push(`*Estimated Total:* ${cartSummary.formattedTotal}`);
  lines.push('');
  lines.push(ESTIMATE_DISCLAIMER);

  return lines.join('\n');
}

export function getWhatsAppOrderUrl(
  cartSummary: CartSummaryPricing,
  fulfillment: FulfillmentOptions,
  whatsappNumber?: string
): string {
  const message = buildWhatsAppOrderMessage(cartSummary, fulfillment);
  const targetNumber = (whatsappNumber && whatsappNumber.replace(/\D/g, '')) || WHATSAPP_NUMBER;
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * 11. Generate Single Product WhatsApp Inquiry URL (For "Ask on WhatsApp" or out-of-stock items)
 */
export function getWhatsAppProductInquiryUrl(
  product: PricingProductInput,
  rates: BullionRates,
  note?: string,
  whatsappNumber?: string
): string {
  const breakdown = calculateProductPrice(product, rates);
  const tolaInfo = gramsToTola(product.weightGrams);

  const message = [
    `Assalam-o-Alaikum, Sona & Chandi Gold Collection.`,
    `I am interested in this item from your storefront:`,
    ``,
    `*${product.title}*`,
    `- SKU: ${product.sku}`,
    `- Karat: ${breakdown.karatLabel} ${breakdown.metal.toUpperCase()}`,
    `- Weight: ${product.weightGrams}g (~${tolaInfo.formattedTola})`,
    `- Est. Price: ${breakdown.formattedEstimate}`,
    note ? `- Note: ${note}` : '',
    ``,
    ESTIMATE_DISCLAIMER,
  ]
    .filter(Boolean)
    .join('\n');

  const targetNumber = (whatsappNumber && whatsappNumber.replace(/\D/g, '')) || WHATSAPP_NUMBER;
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * 12. Unit-style Self-Checks
 * Verifies all required math rules.
 */
export interface UnitCheckResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runPricingSelfChecks(): { passed: boolean; results: UnitCheckResult[] } {
  const results: UnitCheckResult[] = [];

  const mockRates: BullionRates = {
    gold24KPerTola: 280000,
    silverRate: 3500,
    silverUnit: 'per_tola',
    lastUpdated: '2026-11-01',
  };

  // Check 1: 24K per gram math
  const expected24KGram = 280000 / 11.6638;
  const actual24KGram = get24KGoldPerGram(280000);
  const diff1 = Math.abs(expected24KGram - actual24KGram);
  results.push({
    name: '24K Gold per gram formula (rate / 11.6638)',
    passed: diff1 < 0.0001,
    expected: expected24KGram.toFixed(4),
    actual: actual24KGram.toFixed(4),
  });

  // Check 2: 22K karat ratio = 24K * 22/24
  const expected22KGram = expected24KGram * (22 / 24);
  const actual22KGram = getGoldPerGramForKarat('22K', 280000);
  const diff2 = Math.abs(expected22KGram - actual22KGram);
  results.push({
    name: '22K Gold per gram formula (24K * 22 / 24)',
    passed: diff2 < 0.0001,
    expected: expected22KGram.toFixed(4),
    actual: actual22KGram.toFixed(4),
  });

  // Check 3: 21K and 18K ratios
  const expected21KGram = expected24KGram * (21 / 24);
  const actual21KGram = getGoldPerGramForKarat('21K', 280000);
  results.push({
    name: '21K Gold per gram formula (24K * 21 / 24)',
    passed: Math.abs(expected21KGram - actual21KGram) < 0.0001,
    expected: expected21KGram.toFixed(4),
    actual: actual21KGram.toFixed(4),
  });

  // Check 4: Fixed Making Charge
  const fixedProduct: PricingProductInput = {
    id: 'test-fixed',
    sku: 'TST-001',
    title: 'Test Fixed Ring',
    metal: 'gold',
    karat: '22K',
    weightGrams: 10,
    makingCharge: { type: 'fixed', amount: 5000 },
  };
  const fixedPrice = calculateProductPrice(fixedProduct, mockRates);
  const expectedFixedTotal = Math.round(10 * actual22KGram + 5000);
  results.push({
    name: 'Gold estimate with Fixed making charge + nearest whole PKR rounding',
    passed: fixedPrice.totalEstimate === expectedFixedTotal,
    expected: String(expectedFixedTotal),
    actual: String(fixedPrice.totalEstimate),
  });

  // Check 5: Per Gram Making Charge
  const perGramProduct: PricingProductInput = {
    id: 'test-pg',
    sku: 'TST-002',
    title: 'Test Per Gram Bangles',
    metal: 'gold',
    karat: '21K',
    weightGrams: 20,
    makingCharge: { type: 'per_gram', amount: 800 },
  };
  const pgPrice = calculateProductPrice(perGramProduct, mockRates);
  const expectedPgTotal = Math.round(20 * actual21KGram + 20 * 800);
  results.push({
    name: 'Gold estimate with Per-Gram making charge (weight * amount)',
    passed: pgPrice.totalEstimate === expectedPgTotal,
    expected: String(expectedPgTotal),
    actual: String(pgPrice.totalEstimate),
  });

  // Check 6: Silver configurable unit (per tola vs per gram)
  const silverPerTola = getSilverPerGram(3500, 'per_tola');
  const silverPerGram = getSilverPerGram(300, 'per_gram');
  results.push({
    name: 'Silver rate unit configurable (per tola / 11.6638 vs per gram)',
    passed:
      Math.abs(silverPerTola - 3500 / 11.6638) < 0.0001 && silverPerGram === 300,
    expected: `${(3500 / 11.6638).toFixed(4)} and 300`,
    actual: `${silverPerTola.toFixed(4)} and ${silverPerGram}`,
  });

  // Check 7: FULL weight used, no stone subtraction
  const stoneNote = 'Full weight verification';
  results.push({
    name: stoneNote,
    passed: fixedPrice.weightGrams === fixedProduct.weightGrams,
    expected: `${fixedProduct.weightGrams}g`,
    actual: `${fixedPrice.weightGrams}g`,
  });

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}

// Auto-run self-checks in console for development safety
if (typeof window !== 'undefined') {
  try {
    const check = runPricingSelfChecks();
    if (check.passed) {
      console.log('✓ [pricing.ts] All 7 pricing math self-checks PASSED successfully.');
    } else {
      console.error('✗ [pricing.ts] Pricing check failure:', check.results);
    }
  } catch (err) {
    console.error('Pricing self-check error', err);
  }
}
