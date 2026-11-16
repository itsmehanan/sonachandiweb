/**
 * Sona Chandi Gold Collection - Centralized Data Store (Connected to Cloud Firestore)
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
import { db } from '../lib/firebase';
import {
  BullionRates,
  GoldKarat,
  SilverPurity,
  MetalType,
  MakingCharge,
  PricingProductInput,
} from '../lib/pricing';
import { SocialHandles } from '../components/SocialLinks';

export type ProductCategory =
  | 'rings'
  | 'necklaces'
  | 'bangles'
  | 'earrings'
  | 'bridal_sets';

export interface Product extends PricingProductInput {
  slug: string;
  category: ProductCategory | '';
  featured: boolean;
  inStock: boolean;
  stock: number;
  shortDescription: string;
  fullDescription: string;
  images: string[];
  specs: {
    grossWeightGrams: number;
    purity: string;
    hallmarkStamp?: string;
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
  contactEmail?: string;
  socialHandles?: SocialHandles;
  deliveryText?: string;
  aboutPageImageUrl?: string;
  aboutPageImageUrl2?: string;
  aboutPageStory?: string;
  establishedYear?: string;
  craftsmanshipText?: string;
  familyLineEn?: string;
  familyLineUr?: string;
  showcaseTiles?: ShowcaseTile[];
  policies?: {
    estimateDisclaimer: string;
    hallmarkPolicy?: string;
    exchangePolicy?: string;
    shippingPolicy?: string;
  };
}

/**
 * Normalize raw category names from Firestore, URLs, tiles, and UI links
 * to canonical ProductCategory values, or '' if missing/unrecognised.
 */
export function normalizeCategory(raw: unknown): ProductCategory | '' {
  if (typeof raw !== 'string') return '';
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (!cleaned) return '';

  // Check bridal before set/necklaces
  if (
    cleaned === 'bridal' ||
    cleaned === 'bridal set' ||
    cleaned === 'bridal sets' ||
    cleaned === 'bridal suite'
  ) {
    return 'bridal_sets';
  }

  if (
    cleaned === 'necklace' ||
    cleaned === 'necklaces' ||
    cleaned === 'haar' ||
    cleaned === 'haars' ||
    cleaned === 'set' ||
    cleaned === 'sets' ||
    cleaned === 'necklace set' ||
    cleaned === 'necklace sets'
  ) {
    return 'necklaces';
  }

  if (cleaned === 'ring' || cleaned === 'rings') {
    return 'rings';
  }

  if (
    cleaned === 'bangle' ||
    cleaned === 'bangles' ||
    cleaned === 'kara' ||
    cleaned === 'karas' ||
    cleaned === 'kada' ||
    cleaned === 'kadas'
  ) {
    return 'bangles';
  }

  if (
    cleaned === 'earring' ||
    cleaned === 'earrings' ||
    cleaned === 'jhumka' ||
    cleaned === 'jhumkas' ||
    cleaned === 'jhumki' ||
    cleaned === 'jhumkis'
  ) {
    return 'earrings';
  }

  return '';
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
  brandName: 'Sona Chandi Gold Collection',
  tagline: 'Timeless Pakistani Fine Jewellery',
  whatsappNumber: '923109412332',
  currency: 'PKR',
  storeHoursDescription: '',
  address: '',
  phone: '',
  contactEmail: '',
  socialHandles: {},
  deliveryText: '',
  aboutPageStory: '',
  craftsmanshipText: '',
  establishedYear: '',
  familyLineEn: 'Imtiyaz & Sons',
  familyLineUr: 'امتیاز اینڈ سنز',
  policies: {
    estimateDisclaimer:
      'Estimated price only. Final price will be confirmed on WhatsApp based on the latest rate.',
  },
  showcaseTiles: DEFAULT_SHOWCASE_TILES,
  aboutPageImageUrl: '',
  aboutPageImageUrl2: '',
};

let currentShowcaseTiles: ShowcaseTile[] = DEFAULT_SHOWCASE_TILES;

// Live in-memory cache populated exclusively from Firestore
let liveProducts: Product[] = [];
let productsLoaded = false;
let settingsLoaded = false;
let productsError = false;
let settingsError = false;
let listenersInitialized = false;

const MAX_LISTENER_RETRIES = 5;
let productsUnsub: (() => void) | null = null;
let settingsUnsub: (() => void) | null = null;
let productsRetryTimer: ReturnType<typeof setTimeout> | null = null;
let settingsRetryTimer: ReturnType<typeof setTimeout> | null = null;
let productsRetryCount = 0;
let settingsRetryCount = 0;

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

  const sku = docData.sku || 'SKU-000';
  const normalizedCategory = normalizeCategory(docData.category);
  if (!normalizedCategory) {
    console.warn(
      `[Store] Product "${docId}" (SKU: ${sku}) has missing or unrecognised category:`,
      docData.category
    );
  }

  const stock = typeof docData.stock === 'number' ? docData.stock : 0;
  const weightGrams = Number(docData.weightG || docData.weightGrams || 0);
  const makingCharge: MakingCharge =
    docData.makingType === 'perGram'
      ? { type: 'per_gram', amount: Number(docData.makingValue || 0) }
      : { type: 'fixed', amount: Number(docData.makingValue || 0) };

  return {
    id: docId,
    sku,
    title: docData.name || docData.title || 'Fine Jewellery',
    slug: (docData.name || docData.sku || docId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-'),
    metal,
    karat,
    category: normalizedCategory,
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
      purity: metal === 'gold' ? `${karat} Gold` : '925 Silver',
      craftsmanship: docData.craftsmanship || '',
      dimensionsOrSize: docData.dimensionsOrSize || '',
      occasion: docData.occasion || '',
    },
  };
}

function subscribeSettings(): void {
  if (settingsRetryTimer) {
    clearTimeout(settingsRetryTimer);
    settingsRetryTimer = null;
  }
  if (settingsUnsub) {
    settingsUnsub();
    settingsUnsub = null;
  }

  try {
    const settingsRef = doc(db, 'settings', 'store');
    settingsUnsub = onSnapshot(
      settingsRef,
      (docSnap) => {
        settingsLoaded = true;
        settingsError = false;
        settingsRetryCount = 0;

        if (docSnap.exists()) {
          const data = docSnap.data();
          const gold = Number(data.gold24kPerTola) || 0;
          const silver = Number(data.silverRate) || 0;
          const ratesUpdatedAt = data.ratesUpdatedAt || '';

          currentRates = {
            gold24KPerTola: gold,
            silverRate: silver,
            silverUnit: data.silverUnit === 'gram' ? 'per_gram' : 'per_tola',
            lastUpdated: ratesUpdatedAt
              ? `Updated ${new Date(ratesUpdatedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Karachi',
                })} PKT`
              : '',
          };

          const nextShowcaseTiles =
            Array.isArray(data.showcaseTiles) && data.showcaseTiles.length > 0
              ? data.showcaseTiles
              : DEFAULT_SHOWCASE_TILES;
          currentShowcaseTiles = nextShowcaseTiles;

          const nextSettings: StoreSettings = {
            ...currentSettings,
            showcaseTiles: nextShowcaseTiles,
          };

          if (data.whatsappNumber) nextSettings.whatsappNumber = data.whatsappNumber;
          if (data.hoursText) nextSettings.storeHoursDescription = data.hoursText;
          if (data.address) nextSettings.address = data.address;
          if (data.deliveryText) nextSettings.deliveryText = data.deliveryText;
          if (typeof data.aboutPageStory === 'string') {
            nextSettings.aboutPageStory = data.aboutPageStory;
          }
          if (typeof data.craftsmanshipText === 'string') {
            nextSettings.craftsmanshipText = data.craftsmanshipText;
          }
          if (typeof data.aboutPageImageUrl === 'string') {
            nextSettings.aboutPageImageUrl = data.aboutPageImageUrl;
          }
          if (typeof data.aboutPageImageUrl2 === 'string') {
            nextSettings.aboutPageImageUrl2 = data.aboutPageImageUrl2;
          }
          if (typeof data.establishedYear === 'string') {
            nextSettings.establishedYear = data.establishedYear;
          }
          if (typeof data.familyLineEn === 'string') {
            nextSettings.familyLineEn = data.familyLineEn;
          }
          if (typeof data.familyLineUr === 'string') {
            nextSettings.familyLineUr = data.familyLineUr;
          }
          if (typeof data.contactEmail === 'string') {
            nextSettings.contactEmail = data.contactEmail;
          }
          if (typeof data.phone === 'string') {
            nextSettings.phone = data.phone;
          }
          if (data.socialHandles && typeof data.socialHandles === 'object') {
            nextSettings.socialHandles = {
              instagram: data.socialHandles.instagram || data.instagram || '',
              facebook: data.socialHandles.facebook || data.facebook || '',
              tiktok: data.socialHandles.tiktok || data.tiktok || '',
              youtube: data.socialHandles.youtube || data.youtube || '',
              snapchat: data.socialHandles.snapchat || data.snapchat || '',
              x: data.socialHandles.x || data.x || '',
            };
          } else if (
            data.instagram ||
            data.facebook ||
            data.tiktok ||
            data.youtube ||
            data.snapchat ||
            data.x
          ) {
            nextSettings.socialHandles = {
              instagram: data.instagram || '',
              facebook: data.facebook || '',
              tiktok: data.tiktok || '',
              youtube: data.youtube || '',
              snapchat: data.snapchat || '',
              x: data.x || '',
            };
          }

          currentSettings = nextSettings;
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
        console.error('Firestore settings listener error:', error);
        settingsLoaded = true;
        settingsError = true;
        notifyStoreListeners();

        if (settingsUnsub) {
          settingsUnsub();
          settingsUnsub = null;
        }
        if (settingsRetryCount < MAX_LISTENER_RETRIES) {
          const delayMs = Math.min(2000 * Math.pow(1.5, settingsRetryCount), 15000);
          settingsRetryCount += 1;
          settingsRetryTimer = setTimeout(() => {
            subscribeSettings();
          }, delayMs);
        }
      }
    );
  } catch (err) {
    console.error('Settings listener init error:', err);
    settingsLoaded = true;
    settingsError = true;
    notifyStoreListeners();
  }
}

function subscribeProducts(): void {
  if (productsRetryTimer) {
    clearTimeout(productsRetryTimer);
    productsRetryTimer = null;
  }
  if (productsUnsub) {
    productsUnsub();
    productsUnsub = null;
  }

  try {
    const productsQuery = query(collection(db, 'products'), where('status', '==', 'active'));
    productsUnsub = onSnapshot(
      productsQuery,
      (snapshot) => {
        liveProducts = snapshot.docs.map((d) => mapDocToProduct(d.data(), d.id));
        productsLoaded = true;
        productsError = false;
        productsRetryCount = 0;
        notifyStoreListeners();
      },
      (error) => {
        console.error('Firestore products listener error:', error);
        // Keep last good products in memory and mark loaded so UI does not spin forever
        productsLoaded = true;
        productsError = true;
        notifyStoreListeners();

        if (productsUnsub) {
          productsUnsub();
          productsUnsub = null;
        }
        if (productsRetryCount < MAX_LISTENER_RETRIES) {
          const delayMs = Math.min(2000 * Math.pow(1.5, productsRetryCount), 15000);
          productsRetryCount += 1;
          productsRetryTimer = setTimeout(() => {
            subscribeProducts();
          }, delayMs);
        }
      }
    );
  } catch (err) {
    console.error('Products listener init error:', err);
    productsLoaded = true;
    productsError = true;
    notifyStoreListeners();
  }
}

/**
 * Manually retry Firestore listeners (used by Retry button & online recovery).
 */
export function retryStoreListeners(): void {
  productsRetryCount = 0;
  settingsRetryCount = 0;
  productsError = false;
  if (liveProducts.length === 0) {
    productsLoaded = false;
  }
  notifyStoreListeners();
  subscribeProducts();
  if (settingsError || !settingsLoaded || !settingsUnsub) {
    subscribeSettings();
  }
}

/**
 * Real-time Firestore Subscriptions
 */
export function initFirestoreStore(): void {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  subscribeSettings();
  subscribeProducts();

  // Auto-recover listeners when browser comes back online
  window.addEventListener('online', () => {
    if (productsError || !productsUnsub) {
      productsRetryCount = 0;
      subscribeProducts();
    }
    if (settingsError || !settingsUnsub) {
      settingsRetryCount = 0;
      subscribeSettings();
    }
  });
}

// Automatically initiate on module load in browser
if (typeof window !== 'undefined') {
  initFirestoreStore();
}

/**
 * Accessor Functions for Storefront Components (stable cached references for useSyncExternalStore)
 */
export function getProducts(): Product[] {
  return liveProducts;
}

export function areProductsLoaded(): boolean {
  return productsLoaded;
}

export function areSettingsLoaded(): boolean {
  return settingsLoaded;
}

export function hasProductsError(): boolean {
  return productsError;
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
  return currentRates;
}

export function updateRates(newRates: Partial<BullionRates>): BullionRates {
  currentRates = {
    ...currentRates,
    ...newRates,
  };
  notifyStoreListeners();
  return currentRates;
}

export function getSettings(): StoreSettings {
  return currentSettings;
}

export function getShowcaseTiles(): ShowcaseTile[] {
  return currentShowcaseTiles;
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
 * Security rules enforce: customerName, customerPhone, fulfilment, status, notes, rateSnapshot, estimatedTotal, items, createdAt
 * Any undefined or empty string key is strictly omitted before addDoc.
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
}): Promise<boolean> {
  try {
    const raw: Record<string, any> = {
      customerName: enquiry.customerName?.trim() ? enquiry.customerName.trim().slice(0, 100) : undefined,
      customerPhone: enquiry.customerPhone?.trim() ? enquiry.customerPhone.trim().slice(0, 50) : undefined,
      fulfilment: enquiry.fulfilment === 'pickup' ? 'pickup' : 'courier',
      status: 'new',
      notes: enquiry.notes?.trim() ? enquiry.notes.trim().slice(0, 1000) : undefined,
      rateSnapshot: enquiry.rateSnapshot,
      estimatedTotal: Math.max(0, Number(enquiry.estimatedTotal) || 0),
      items: Array.isArray(enquiry.items)
        ? enquiry.items.slice(0, 50).map((it) => ({
            sku: String(it.sku || '').slice(0, 50),
            name: String(it.name || '').slice(0, 100),
            qty: Math.max(1, Math.floor(Number(it.qty) || 1)),
            weightG: Math.max(0, Number(it.weightG) || 0),
            estimate: Math.max(0, Number(it.estimate) || 0),
          }))
        : [],
      createdAt: new Date().toISOString(),
    };

    const allowedKeys = [
      'customerName',
      'customerPhone',
      'fulfilment',
      'status',
      'notes',
      'rateSnapshot',
      'estimatedTotal',
      'items',
      'createdAt',
    ] as const;

    const cleanPayload: Record<string, any> = {};
    for (const key of allowedKeys) {
      const val = raw[key];
      if (val !== undefined && val !== null && val !== '') {
        cleanPayload[key] = val;
      }
    }

    await addDoc(collection(db, 'enquiries'), cleanPayload);
    return true;
  } catch (error) {
    console.warn('Enquiry background logging note (will still open WhatsApp):', error);
    return false;
  }
}
