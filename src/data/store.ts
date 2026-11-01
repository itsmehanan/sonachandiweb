/**
 * Sona & Chandi Gold Collection - Centralized Data Store (Connected to Cloud Firestore)
 *
 * Replaced with Firestore reads (active products, settings) so storefront components need no change.
 * Handles rate unavailability, out-of-stock logic, and background enquiry logging for WhatsApp checkouts.
 */

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  addDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import {
  BullionRates,
  GoldKarat,
  SilverPurity,
  MetalType,
  MakingCharge,
  PricingProductInput,
} from '../lib/pricing';
import { seedInitialFirestoreData } from '../lib/adminService';

export type ProductCategory =
  | 'rings'
  | 'necklaces'
  | 'bangles'
  | 'earrings'
  | 'bridal_sets';

export interface Product extends PricingProductInput {
  slug: string;
  category: ProductCategory;
  featured: boolean;
  inStock: boolean;
  stock: number;
  shortDescription: string;
  fullDescription: string;
  images: string[];
  specs: {
    grossWeightGrams: number;
    purity: string;
    hallmarkStamp: string;
    craftsmanship: string;
    dimensionsOrSize?: string;
    occasion?: string;
  };
}

export interface StoreSettings {
  brandName: string;
  tagline: string;
  whatsappNumber: string;
  currency: string;
  storeHoursDescription: string;
  addressPlaceholder: string;
  phonePlaceholder: string;
  pickupBranches: Array<{ name: string; city: string; addressPlaceholder: string }>;
  policies: {
    estimateDisclaimer: string;
    hallmarkPolicy: string;
    exchangePolicy: string;
    shippingPolicy: string;
  };
}

// Fallback initial bullion rates
let currentRates: BullionRates = {
  gold24KPerTola: 284500,
  silverRate: 3420,
  silverUnit: 'per_tola',
  lastUpdated: 'Live from Sarafa Association',
};

// Default Store Settings
let currentSettings: StoreSettings = {
  brandName: 'Sona & Chandi Gold Collection',
  tagline: 'Timeless Pakistani Fine Jewellery & Bullion Craftsmanship',
  whatsappNumber: '923109412332',
  currency: 'PKR',
  storeHoursDescription: 'Monday to Saturday: 9:00 AM – 9:00 PM PKT | Sunday: Closed',
  addressPlaceholder: '[Placeholder Address: Suite 4-B, Gold Souk, Liberty Market, Gulberg III, Lahore, Pakistan]',
  phonePlaceholder: '[Placeholder Phone: +92 (042) 3575-XXXX / WhatsApp: +92 310 9412332]',
  pickupBranches: [
    {
      name: 'Flagship Showroom - Liberty Market',
      city: 'Lahore',
      addressPlaceholder: '[Placeholder: Shop 4-B, Gold Souk, Liberty Market, Lahore]',
    },
    {
      name: 'Sarafa Bazaar Branch',
      city: 'Karachi',
      addressPlaceholder: '[Placeholder: Shop 18, Main Sarafa Bazaar, Mithadar, Karachi]',
    },
    {
      name: 'Blue Area Boutique',
      city: 'Islamabad',
      addressPlaceholder: '[Placeholder: Mezzanine Floor, Beverly Centre, Blue Area, Islamabad]',
    },
  ],
  policies: {
    estimateDisclaimer:
      'Estimated price only. Final price will be confirmed on WhatsApp based on the latest rate.',
    hallmarkPolicy:
      '[Placeholder Policy] 100% Certified Purity: Every gold ornament is laser stamped with Pakistan Sarafa and international purity hallmarks (916 for 22K, 875 for 21K, 750 for 18K).',
    exchangePolicy:
      '[Placeholder Policy] Transparent Exchange & Buyback: 7-day exchange on unworn ready collection pieces with intact security seals.',
    shippingPolicy:
      '[Placeholder Policy] Insured Nationwide Transit: Armoured courier transit across all major cities of Pakistan (Lahore, Karachi, Islamabad, Peshawar, Quetta, Multan, Faisalabad).',
  },
};

// In-memory cache for fast, synchronous access by components
let liveProducts: Product[] = [];
let listenersInitialized = false;

// Subscribers list for reactive UI updates
const storeListeners = new Set<() => void>();

export function subscribeToStore(callback: () => void): () => void {
  storeListeners.add(callback);
  return () => {
    storeListeners.delete(callback);
  };
}

function notifyStoreListeners() {
  storeListeners.forEach((cb) => cb());
}

/**
 * 12 Sample Products Blueprint for Seeding
 */
const initialSeedProducts = [
  {
    id: 'sc-001',
    sku: 'SC-GLD-NK-001',
    name: 'Mughal Royal 22K Bridal Haar & Jhumka Set',
    description: 'Exquisite 22K yellow gold bridal necklace featuring intricate hand-carved filigree, emerald accents, and freshwater pearl droplet strings.',
    metal: 'gold',
    karat: 22,
    category: 'bridal_sets',
    weightG: 48.5,
    makingType: 'perGram',
    makingValue: 1450,
    stock: 2,
    status: 'active',
    featured: true,
    images: [
      '/src/assets/images/jewel_gold_bridal_necklace_1793522998312.jpg',
      '/public/assets/aistudio/intro-poster_d8a114e6.jpg',
    ],
  },
  {
    id: 'sc-002',
    sku: 'SC-GLD-ER-002',
    name: 'Nizami 21K Traditional Kundan Jhumkas',
    description: 'Classic bell-shaped 21K gold jhumkas adorned with rubies, micro-pearl tassels, and detailed hand-chiselled jali work.',
    metal: 'gold',
    karat: 21,
    category: 'earrings',
    weightG: 14.2,
    makingType: 'fixed',
    makingValue: 8500,
    stock: 5,
    status: 'active',
    featured: true,
    images: [
      '/src/assets/images/jewel_gold_jhumkas_earrings_1793522999181.jpg',
      '/public/assets/aistudio/intro-poster_d8a114e6.jpg',
    ],
  },
  {
    id: 'sc-003',
    sku: 'SC-GLD-BG-003',
    name: 'Shahi Gulzar 22K Embossed Kara Pair',
    description: 'A matched pair of solid 22K gold karas deeply carved with continuous blooming rose and vine relief motifs.',
    metal: 'gold',
    karat: 22,
    category: 'bangles',
    weightG: 38.6,
    makingType: 'perGram',
    makingValue: 1100,
    stock: 3,
    status: 'active',
    featured: true,
    images: [
      '/src/assets/images/jewel_gold_kara_bangles_1793522999291.jpg',
      '/public/assets/aistudio/intro-poster_d8a114e6.jpg',
    ],
  },
  {
    id: 'sc-004',
    sku: 'SC-SLV-NK-004',
    name: 'Shahana 925 Pure Sterling Silver Antique Choker',
    description: 'Artisanal 925 solid sterling silver collar choker featuring intricate floral lattice openwork with an antique oxidised finish.',
    metal: 'silver',
    karat: 925,
    category: 'necklaces',
    weightG: 32.4,
    makingType: 'fixed',
    makingValue: 4800,
    stock: 8,
    status: 'active',
    featured: true,
    images: [
      '/src/assets/images/jewel_silver_choker_set_1793522999430.jpg',
    ],
  },
  {
    id: 'sc-005',
    sku: 'SC-GLD-RG-005',
    name: 'Noor-e-Zameen 18K Gold Solitaire Ring',
    description: 'Refined 18K yellow gold band with mirror-finish domed shank and radiant bezel setting.',
    metal: 'gold',
    karat: 18,
    category: 'rings',
    weightG: 4.8,
    makingType: 'fixed',
    makingValue: 5500,
    stock: 6,
    status: 'active',
    featured: true,
    images: [
      '/public/assets/aistudio/intro-poster_d8a114e6.jpg',
      '/src/assets/images/jewel_gold_kara_bangles_1793522999291.jpg',
    ],
  },
  {
    id: 'sc-006',
    sku: 'SC-GLD-NK-006',
    name: 'Kohinoor 22K Gold Filigree Rani Haar',
    description: 'Grand five-strand 22K gold heritage Rani Haar with ornate hand-engraved paisleys and gold ghungroo beads.',
    metal: 'gold',
    karat: 22,
    category: 'necklaces',
    weightG: 56.2,
    makingType: 'perGram',
    makingValue: 1600,
    stock: 2,
    status: 'active',
    featured: false,
    images: [
      '/src/assets/images/jewel_gold_bridal_necklace_1793522998312.jpg',
    ],
  },
  {
    id: 'sc-007',
    sku: 'SC-GLD-ER-007',
    name: 'Gulberg 21K Polki Chandbali Earrings',
    description: 'Crescent moon silhouette chandbalis in 21K gold with uncut crystal polki facets and emerald droplet fringe.',
    metal: 'gold',
    karat: 21,
    category: 'earrings',
    weightG: 16.8,
    makingType: 'fixed',
    makingValue: 9200,
    stock: 4,
    status: 'active',
    featured: false,
    images: [
      '/src/assets/images/jewel_gold_jhumkas_earrings_1793522999181.jpg',
    ],
  },
  {
    id: 'sc-008',
    sku: 'SC-GLD-RG-008',
    name: 'Rustam 18K Gold Men’s Signet Ring',
    description: 'Bold 18K solid yellow gold cushion signet ring with hand-brushed satin face and polished chamfered bevels.',
    metal: 'gold',
    karat: 18,
    category: 'rings',
    weightG: 9.5,
    makingType: 'fixed',
    makingValue: 5500,
    stock: 3,
    status: 'active',
    featured: false,
    images: [
      '/public/assets/aistudio/intro-poster_d8a114e6.jpg',
    ],
  },
  {
    id: 'sc-009',
    sku: 'SC-GLD-BG-009',
    name: 'Dilkash 22K Sleek Daily Gold Bangles (Set of 4)',
    description: 'A set of four slim 22K gold stacking bangles featuring diamond-cut micro facet grooves that sparkle with movement.',
    metal: 'gold',
    karat: 22,
    category: 'bangles',
    weightG: 28.4,
    makingType: 'perGram',
    makingValue: 950,
    stock: 4,
    status: 'active',
    featured: false,
    images: [
      '/src/assets/images/jewel_gold_kara_bangles_1793522999291.jpg',
    ],
  },
  {
    id: 'sc-010',
    sku: 'SC-GLD-BD-010',
    name: 'Shehzadi Heavy 22K Polki & Columbian Emerald Bridal Set',
    description: 'Masterpiece bridal set including grand bib choker, statement jhumka balis, maang tikka, and nath in 22K gold.',
    metal: 'gold',
    karat: 22,
    category: 'bridal_sets',
    weightG: 72.0,
    makingType: 'perGram',
    makingValue: 1800,
    stock: 0, // Out of stock to test zero stock rule
    status: 'active',
    featured: true,
    images: [
      '/src/assets/images/jewel_gold_bridal_necklace_1793522998312.jpg',
      '/src/assets/images/jewel_gold_jhumkas_earrings_1793522999181.jpg',
    ],
  },
  {
    id: 'sc-011',
    sku: 'SC-SLV-BG-011',
    name: 'Anarkali 925 Sterling Silver Handcrafted Payal / Anklet Pair',
    description: 'Traditional heavy bridal silver payal pair featuring delicate musical bells (ghungroos) and embossed floral links.',
    metal: 'silver',
    karat: 925,
    category: 'bangles',
    weightG: 44.5,
    makingType: 'perGram',
    makingValue: 90,
    stock: 5,
    status: 'active',
    featured: false,
    images: [
      '/src/assets/images/jewel_silver_choker_set_1793522999430.jpg',
    ],
  },
  {
    id: 'sc-012',
    sku: 'SC-SLV-RG-012',
    name: 'Taj 925 Sterling Silver Turquoise Vintage Ring',
    description: 'Hand-chased 925 sterling silver artisan ring holding a natural Nishapuri turquoise cabochon stone.',
    metal: 'silver',
    karat: 925,
    category: 'rings',
    weightG: 8.2,
    makingType: 'fixed',
    makingValue: 2400,
    stock: 0, // Out of stock
    status: 'active',
    featured: false,
    images: [
      '/src/assets/images/jewel_silver_choker_set_1793522999430.jpg',
    ],
  },
];

function mapDocToProduct(docData: any, docId: string): Product {
  const metal = (docData.metal || 'gold') as MetalType;
  let karat: GoldKarat | SilverPurity = '22K';
  if (metal === 'gold') {
    const k = docData.karat || 22;
    karat = `${k}K` as GoldKarat;
  } else {
    karat = '925_sterling';
  }

  const stock = typeof docData.stock === 'number' ? docData.stock : 0;
  const weightGrams = Number(docData.weightG || docData.weightGrams || 10);
  const makingCharge: MakingCharge =
    docData.makingType === 'perGram'
      ? { type: 'per_gram', amount: Number(docData.makingValue || 0) }
      : { type: 'fixed', amount: Number(docData.makingValue || 0) };

  return {
    id: docId,
    sku: docData.sku || 'SKU-000',
    title: docData.name || docData.title || 'Fine Jewellery',
    slug: (docData.name || docData.sku || docId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-'),
    metal,
    karat,
    category: (docData.category || 'necklaces') as ProductCategory,
    weightGrams,
    makingCharge,
    stock,
    inStock: stock > 0,
    featured: Boolean(docData.featured),
    shortDescription: docData.description || '',
    fullDescription: docData.description || '',
    images: Array.isArray(docData.images) && docData.images.length > 0
      ? docData.images
      : ['/src/assets/images/jewel_gold_bridal_necklace_1793522998312.jpg'],
    specs: {
      grossWeightGrams: weightGrams,
      purity: metal === 'gold' ? `${karat} Solid Gold` : '92.5% Solid Sterling Silver',
      hallmarkStamp: metal === 'gold' ? `${karat} Laser Hallmark` : '925 Silver Hallmark',
      craftsmanship: docData.craftsmanship || 'Handcrafted Lahore & Karachi goldsmith tradition',
      dimensionsOrSize: docData.dimensionsOrSize || 'Standard sizing available',
      occasion: docData.occasion || 'Bridal & Fine Jewellery Heirloom',
    },
  };
}

// Initialize live products with initial seed list as memory fallback
liveProducts = initialSeedProducts.map((p) => mapDocToProduct(p, p.id));

/**
 * Real-time Firestore Subscriptions
 */
export function initFirestoreStore(): void {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  // Initialize DB seed asynchronously in background
  seedInitialFirestoreData().catch(() => {});

  // 1. Listen to Settings / Store document
  try {
    const settingsRef = doc(db, 'settings', 'store');
    onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          currentRates = {
            gold24KPerTola: Number(data.gold24kPerTola) || 0,
            silverRate: Number(data.silverRate) || 0,
            silverUnit: data.silverUnit === 'gram' ? 'per_gram' : 'per_tola',
            lastUpdated: data.ratesUpdatedAt
              ? `Updated ${new Date(data.ratesUpdatedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Karachi',
                })} PKT`
              : 'Live Sarafa Rate',
          };
          if (data.whatsappNumber) currentSettings.whatsappNumber = data.whatsappNumber;
          if (data.hoursText) currentSettings.storeHoursDescription = data.hoursText;
          if (data.address) currentSettings.addressPlaceholder = data.address;
          notifyStoreListeners();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/store');
      }
    );
  } catch (err) {
    console.warn('Settings listener fallback', err);
  }

  // 2. Listen to active products
  try {
    const productsQuery = query(collection(db, 'products'), where('status', '==', 'active'));
    onSnapshot(
      productsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          liveProducts = snapshot.docs.map((d) => mapDocToProduct(d.data(), d.id));
          notifyStoreListeners();
        } else {
          // If Firestore collection has no active products, attempt to populate with initial sample products
          (async () => {
            try {
              const checkSnap = await getDocs(collection(db, 'products'));
              if (checkSnap.empty) {
                for (const prod of initialSeedProducts) {
                  await setDoc(doc(db, 'products', prod.id), {
                    ...prod,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });
                }
              }
            } catch (seedErr) {
              // Ignore if client is unauthorized to write
            }
          })();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );
  } catch (err) {
    console.warn('Products listener fallback', err);
  }
}

// Automatically initiate on module load in browser
if (typeof window !== 'undefined') {
  initFirestoreStore();
}

/**
 * Accessor Functions for Storefront Components
 */
export function getProducts(): Product[] {
  return [...liveProducts];
}

export function getProductById(id: string): Product | undefined {
  return liveProducts.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return liveProducts.find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return liveProducts.filter((p) => p.featured);
}

export function getRates(): BullionRates {
  return { ...currentRates };
}

export function updateRates(newRates: Partial<BullionRates>): BullionRates {
  currentRates = {
    ...currentRates,
    ...newRates,
  };
  notifyStoreListeners();
  return { ...currentRates };
}

export function getSettings(): StoreSettings {
  return { ...currentSettings };
}

/**
 * Store Hours Checker
 * Mon-Sat 9AM-9PM PKT, Sunday closed
 */
export function getStoreStatus(): {
  isOpen: boolean;
  statusLabel: string;
  subtext: string;
  dayName: string;
  currentTimePkt: string;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekdayPart = parts.find((p) => p.type === 'weekday')?.value || '';
  const hourPart = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);

  const formattedTime = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Karachi',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isSunday = weekdayPart.toLowerCase().startsWith('sun');
  const isWorkingHours = hourPart >= 9 && hourPart < 21;
  const isOpen = !isSunday && isWorkingHours;

  let statusLabel = '';
  let subtext = '';

  if (isOpen) {
    statusLabel = 'Showroom Open';
    subtext = `Closes 9:00 PM PKT (${formattedTime} PKT)`;
  } else if (isSunday) {
    statusLabel = 'Showroom Closed (Sunday)';
    subtext = 'Opens Monday at 9:00 AM PKT';
  } else if (hourPart < 9) {
    statusLabel = 'Showroom Closed';
    subtext = `Opens today at 9:00 AM PKT (${formattedTime} PKT)`;
  } else {
    statusLabel = 'Showroom Closed for the night';
    subtext = 'Opens tomorrow at 9:00 AM PKT';
  }

  return {
    isOpen,
    statusLabel,
    subtext,
    dayName: weekdayPart,
    currentTimePkt: `${formattedTime} PKT`,
  };
}

/**
 * Save Enquiry to Firestore
 * Fulfills rule: "When the customer taps 'Order on WhatsApp', save an enquiry (with rate snapshot)
 * but open WhatsApp even if saving fails; never say the order was sent."
 */
export async function logWhatsAppEnquiry(enquiry: {
  customerName?: string;
  customerPhone?: string;
  fulfilment: 'courier' | 'pickup';
  notes?: string;
  rateSnapshot: BullionRates;
  estimatedTotal: number;
  items: Array<{
    sku: string;
    name: string;
    qty: number;
    weightG: number;
    estimate: number;
  }>;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'enquiries'), {
      ...enquiry,
      status: 'new',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Enquiry background logging note (will still open WhatsApp):', error);
  }
}
