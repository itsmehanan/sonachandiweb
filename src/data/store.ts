/**
 * Sona & Chandi Gold Collection - Centralized Data Store (Connected to Cloud Firestore)
 *
 * Clean production store with zero fake sample data.
 * All products and settings are read in real-time from Firestore.
 * If settings/store is missing or a rate is 0, "Rate unavailable" is triggered.
 */

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  addDoc,
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

export interface ShowcaseTile {
  id: string;
  title: string;
  subtitle: string;
  target: 'bridal_sets' | 'bangles' | 'earrings' | 'necklaces' | 'rings' | 'silver' | string;
  imageUrl?: string;
  visible: boolean;
  order: number;
}

export const DEFAULT_SHOWCASE_TILES: ShowcaseTile[] = [
  {
    id: 'bridal_sets',
    title: 'Bridal Sets',
    subtitle: 'Explore the collection',
    target: 'bridal_sets',
    imageUrl: '',
    visible: true,
    order: 1,
  },
  {
    id: 'bangles',
    title: 'Bangles & Karas',
    subtitle: 'Explore the collection',
    target: 'bangles',
    imageUrl: '',
    visible: true,
    order: 2,
  },
  {
    id: 'earrings',
    title: 'Jhumkas & Balis',
    subtitle: 'Explore the collection',
    target: 'earrings',
    imageUrl: '',
    visible: true,
    order: 3,
  },
  {
    id: 'necklaces',
    title: 'Necklaces',
    subtitle: 'Explore the collection',
    target: 'necklaces',
    imageUrl: '',
    visible: true,
    order: 4,
  },
  {
    id: 'rings',
    title: 'Gold Rings',
    subtitle: 'Explore the collection',
    target: 'rings',
    imageUrl: '',
    visible: true,
    order: 5,
  },
  {
    id: 'silver',
    title: 'Silver',
    subtitle: 'Explore the collection',
    target: 'silver',
    imageUrl: '',
    visible: true,
    order: 6,
  },
];

export interface StoreSettings {
  brandName: string;
  tagline: string;
  whatsappNumber: string;
  currency: string;
  storeHoursDescription?: string;
  address?: string;
  phone?: string;
  deliveryText?: string;
  aboutPageImageUrl?: string;
  showcaseTiles?: ShowcaseTile[];
  policies?: {
    estimateDisclaimer: string;
    hallmarkPolicy?: string;
    exchangePolicy?: string;
    shippingPolicy?: string;
  };
}

// Initial rates start empty (0) until fetched from settings/store
let currentRates: BullionRates = {
  gold24KPerTola: 0,
  silverRate: 0,
  silverUnit: 'per_tola',
  lastUpdated: '',
};

// Initial store settings with neutral placeholders only
let currentSettings: StoreSettings = {
  brandName: 'Sona & Chandi Gold Collection',
  tagline: 'Timeless Pakistani Fine Jewellery',
  whatsappNumber: '923109412332',
  currency: 'PKR',
  storeHoursDescription: '',
  address: '',
  phone: '',
  deliveryText: '',
  policies: {
    estimateDisclaimer:
      'Estimated price only. Final price will be confirmed on WhatsApp based on the latest rate.',
  },
  showcaseTiles: DEFAULT_SHOWCASE_TILES,
  aboutPageImageUrl: '',
};

// Live in-memory cache populated exclusively from Firestore
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
  const weightGrams = Number(docData.weightG || docData.weightGrams || 0);
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
    images: Array.isArray(docData.images) ? docData.images : [],
    specs: {
      grossWeightGrams: weightGrams,
      purity: metal === 'gold' ? `${karat} Solid Gold` : '92.5% Solid Sterling Silver',
      hallmarkStamp: metal === 'gold' ? `${karat} Laser Hallmark` : '925 Silver Hallmark',
      craftsmanship: docData.craftsmanship || 'Handcrafted fine jewellery',
      dimensionsOrSize: docData.dimensionsOrSize || '',
      occasion: docData.occasion || '',
    },
  };
}

/**
 * Real-time Firestore Subscriptions
 */
export function initFirestoreStore(): void {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  // 1. Listen to Settings / Store document
  try {
    const settingsRef = doc(db, 'settings', 'store');
    onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const gold = Number(data.gold24kPerTola) || 0;
          const silver = Number(data.silverRate) || 0;
          const ratesUpdatedAt = data.ratesUpdatedAt || '';

          currentRates = {
            gold24KPerTola: gold,
            silverRate: silver,
            silverUnit: data.silverUnit === 'gram' ? 'per_gram' : 'per_tola',
            // Show last-updated time ONLY from ratesUpdatedAt
            lastUpdated: ratesUpdatedAt
              ? `Updated ${new Date(ratesUpdatedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Karachi',
                })} PKT`
              : '',
          };

          if (data.whatsappNumber) currentSettings.whatsappNumber = data.whatsappNumber;
          if (data.hoursText) currentSettings.storeHoursDescription = data.hoursText;
          if (data.address) currentSettings.address = data.address;
          if (data.deliveryText) currentSettings.deliveryText = data.deliveryText;
          if (Array.isArray(data.showcaseTiles) && data.showcaseTiles.length > 0) {
            currentSettings.showcaseTiles = data.showcaseTiles;
          } else {
            currentSettings.showcaseTiles = DEFAULT_SHOWCASE_TILES;
          }
          if (typeof data.aboutPageImageUrl === 'string') {
            currentSettings.aboutPageImageUrl = data.aboutPageImageUrl;
          }
          notifyStoreListeners();
        } else {
          currentRates = {
            gold24KPerTola: 0,
            silverRate: 0,
            silverUnit: 'per_tola',
            lastUpdated: '',
          };
          notifyStoreListeners();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/store');
      }
    );
  } catch (err) {
    console.warn('Settings listener init error', err);
  }

  // 2. Listen to active products
  try {
    const productsQuery = query(collection(db, 'products'), where('status', '==', 'active'));
    onSnapshot(
      productsQuery,
      (snapshot) => {
        liveProducts = snapshot.docs.map((d) => mapDocToProduct(d.data(), d.id));
        notifyStoreListeners();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );
  } catch (err) {
    console.warn('Products listener init error', err);
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

export function getShowcaseTiles(): ShowcaseTile[] {
  return currentSettings.showcaseTiles && currentSettings.showcaseTiles.length > 0
    ? [...currentSettings.showcaseTiles]
    : [...DEFAULT_SHOWCASE_TILES];
}

/**
 * Optimizes Cloudinary URLs for fast delivery in 4:5 showcase tiles:
 * inserts f_auto,q_auto,w_600,c_fill,ar_4:5
 */
export function optimizeCloudinaryShowcase(url?: string): string {
  if (!url) return '';
  if (url.includes('/image/upload/') && !url.includes('f_auto')) {
    return url.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_600,c_fill,ar_4:5/');
  }
  return url;
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
