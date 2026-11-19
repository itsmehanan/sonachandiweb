/**
 * Sona Chandi Gold Collection - Centralized Data Store (Connected to Cloud Firestore)
 *
 * Clean production store with zero fake product data.
 * Products, settings, and categories are read in real-time from Firestore.
 * Categories use an in-memory read-only fallback until Firestore responds or if empty.
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

export type CategoryAppliesTo = 'both' | 'gold' | 'silver';

/**
 * Plain string category slug matching a document id in the Firestore "categories" collection
 * (or '' if unrecognised/missing).
 */
export type ProductCategory = string;

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  appliesTo: CategoryAppliesTo;
  displayOrder: number;
  visible: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Product extends PricingProductInput {
  slug: string;
  category: ProductCategory;
  rawCategory?: string;
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
  target: string;
  imageUrl?: string;
  visible: boolean;
  order: number;
}

/**
 * Built-in read-only in-memory fallback categories used before the first Firestore
 * snapshot arrives or if the Firestore categories collection is empty.
 * Never written to Firestore automatically by storefront visitors.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'rings',
    slug: 'rings',
    name: 'Rings',
    description: '',
    imageUrl: '',
    appliesTo: 'both',
    displayOrder: 1,
    visible: true,
  },
  {
    id: 'necklaces',
    slug: 'necklaces',
    name: 'Necklaces',
    description: '',
    imageUrl: '',
    appliesTo: 'both',
    displayOrder: 2,
    visible: true,
  },
  {
    id: 'bangles',
    slug: 'bangles',
    name: 'Bangles',
    description: '',
    imageUrl: '',
    appliesTo: 'both',
    displayOrder: 3,
    visible: true,
  },
  {
    id: 'earrings',
    slug: 'earrings',
    name: 'Earrings & Jhumkas',
    description: '',
    imageUrl: '',
    appliesTo: 'both',
    displayOrder: 4,
    visible: true,
  },
  {
    id: 'bridal_sets',
    slug: 'bridal_sets',
    name: 'Bridal Sets',
    description: '',
    imageUrl: '',
    appliesTo: 'both',
    displayOrder: 5,
    visible: true,
  },
];

export const DEFAULT_SHOWCASE_TILES: ShowcaseTile[] = [
  ...DEFAULT_CATEGORIES.map((cat, idx) => ({
    id: cat.slug,
    title: cat.name,
    subtitle: 'Explore the collection',
    target: cat.slug,
    imageUrl: '',
    visible: true,
    order: idx + 1,
  })),
  {
    id: 'silver',
    title: 'Silver',
    subtitle: 'Explore the collection',
    target: 'silver',
    imageUrl: '',
    visible: true,
    order: DEFAULT_CATEGORIES.length + 1,
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

// Legacy aliases kept strictly inside store.ts for normalizing older/misspelled values
const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  bridal: 'bridal_sets',
  'bridal set': 'bridal_sets',
  'bridal sets': 'bridal_sets',
  'bridal suite': 'bridal_sets',
  necklace: 'necklaces',
  necklaces: 'necklaces',
  haar: 'necklaces',
  haars: 'necklaces',
  set: 'necklaces',
  sets: 'necklaces',
  'necklace set': 'necklaces',
  'necklace sets': 'necklaces',
  ring: 'rings',
  rings: 'rings',
  bangle: 'bangles',
  bangles: 'bangles',
  kara: 'bangles',
  karas: 'bangles',
  kada: 'bangles',
  kadas: 'bangles',
  earring: 'earrings',
  earrings: 'earrings',
  jhumka: 'earrings',
  jhumkas: 'earrings',
  jhumki: 'earrings',
  jhumkis: 'earrings',
};

/**
 * Generates a unique URL-safe slug (2-50 chars, lowercase letters/digits/hyphens/underscores)
 * from a category display name.
 */
export function generateCategorySlug(
  name: string,
  existingSlugs?: Iterable<string>
): string {
  const existingSet = new Set<string>();
  if (existingSlugs) {
    for (const s of existingSlugs) {
      if (s) existingSet.add(s.toLowerCase().trim());
    }
  }

  let base = name
    .toLowerCase()
    .trim()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/[-_]{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');

  if (base.length < 2) {
    base = base ? `cat-${base}` : 'category';
  }
  if (base.length > 50) {
    base = base.slice(0, 50).replace(/[-_]+$/g, '');
  }

  if (!existingSet.has(base)) {
    return base;
  }

  let counter = 2;
  while (counter < 1000) {
    const suffix = `-${counter}`;
    const candidate = `${base.slice(0, 50 - suffix.length)}${suffix}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
    counter += 1;
  }

  return `${base.slice(0, 42)}-${Date.now().toString().slice(-6)}`;
}

/**
 * Converts a category slug into a readable title when the category is not in the live list.
 */
export function formatCategorySlugFallback(slug: string | undefined | null): string {
  if (!slug || typeof slug !== 'string') return '';
  const cleaned = slug.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeLookupKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Normalize raw category names/slugs from Firestore, URLs, tiles, and UI links
 * to a slug that exists in the live categories list (or '' if no live category matches).
 */
export function normalizeCategory(
  raw: unknown,
  categoriesOverride?: Category[]
): ProductCategory {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.toLowerCase().trim();
  if (!trimmed) return '';

  const cleaned = normalizeLookupKey(trimmed);
  if (!cleaned) return '';

  const source = categoriesOverride ?? effectiveCategories;
  if (source.length === 0) return '';

  // 1. Exact slug match
  const exactSlug = source.find((c) => c.slug.toLowerCase() === trimmed);
  if (exactSlug) return exactSlug.slug;

  // 2. Hyphen/underscore/space normalized slug or display name match
  const normalizedMatch = source.find(
    (c) =>
      normalizeLookupKey(c.slug) === cleaned ||
      normalizeLookupKey(c.name) === cleaned
  );
  if (normalizedMatch) return normalizedMatch.slug;

  // 3. Legacy aliases mapped to a live category if present
  const aliasedSlug = LEGACY_CATEGORY_ALIASES[cleaned];
  if (aliasedSlug) {
    const liveAliasTarget = source.find(
      (c) =>
        c.slug.toLowerCase() === aliasedSlug ||
        normalizeLookupKey(c.slug) === normalizeLookupKey(aliasedSlug)
    );
    if (liveAliasTarget) return liveAliasTarget.slug;
  }

  // 4. Simple singular/plural tolerance against live categories (e.g. "pendant" -> "pendants")
  const singularOrPlural = cleaned.endsWith('s')
    ? cleaned.slice(0, -1)
    : `${cleaned}s`;
  const fuzzyMatch = source.find(
    (c) =>
      normalizeLookupKey(c.slug) === singularOrPlural ||
      normalizeLookupKey(c.name) === singularOrPlural
  );
  if (fuzzyMatch) return fuzzyMatch.slug;

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

// Live categories cache & stable snapshots for useSyncExternalStore
let liveCategories: Category[] = [];
let effectiveCategories: Category[] = DEFAULT_CATEGORIES;
let categoriesLoaded = false;
let categoriesError = false;

let cachedVisibleAll: Category[] = [];
let cachedVisibleGold: Category[] = [];
let cachedVisibleSilver: Category[] = [];
let cachedAllAll: Category[] = [];
let cachedAllGold: Category[] = [];
let cachedAllSilver: Category[] = [];

function sortCategoriesByOrder(list: Category[]): Category[] {
  return [...list].sort((a, b) => {
    const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 9999;
    const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 9999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

function rebuildCategoryCaches(): void {
  const sorted = sortCategoriesByOrder(effectiveCategories);
  cachedAllAll = sorted;
  cachedAllGold = sorted.filter((c) => c.appliesTo === 'both' || c.appliesTo === 'gold');
  cachedAllSilver = sorted.filter((c) => c.appliesTo === 'both' || c.appliesTo === 'silver');
  cachedVisibleAll = sorted.filter((c) => c.visible !== false);
  cachedVisibleGold = cachedVisibleAll.filter(
    (c) => c.appliesTo === 'both' || c.appliesTo === 'gold'
  );
  cachedVisibleSilver = cachedVisibleAll.filter(
    (c) => c.appliesTo === 'both' || c.appliesTo === 'silver'
  );
}

// Initialize caches from DEFAULT_CATEGORIES immediately so menus are never blank
rebuildCategoryCaches();

// Live in-memory products cache populated exclusively from Firestore
let rawProductDocs: Array<{ id: string; data: any }> = [];
let liveProducts: Product[] = [];
let productsLoaded = false;
let settingsLoaded = false;
let productsError = false;
let settingsError = false;
let listenersInitialized = false;

const MAX_LISTENER_RETRIES = 5;
let productsUnsub: (() => void) | null = null;
let settingsUnsub: (() => void) | null = null;
let categoriesUnsub: (() => void) | null = null;
let productsRetryTimer: ReturnType<typeof setTimeout> | null = null;
let settingsRetryTimer: ReturnType<typeof setTimeout> | null = null;
let categoriesRetryTimer: ReturnType<typeof setTimeout> | null = null;
let productsRetryCount = 0;
let settingsRetryCount = 0;
let categoriesRetryCount = 0;

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

function mapDocToCategory(docData: any, docId: string): Category {
  const rawAppliesTo = docData.appliesTo;
  const appliesTo: CategoryAppliesTo =
    rawAppliesTo === 'gold' || rawAppliesTo === 'silver' || rawAppliesTo === 'both'
      ? rawAppliesTo
      : 'both';
  const slug =
    typeof docData.slug === 'string' && docData.slug.trim()
      ? docData.slug.trim()
      : docId;
  const name =
    typeof docData.name === 'string' && docData.name.trim()
      ? docData.name.trim()
      : formatCategorySlugFallback(slug);

  return {
    id: docId,
    slug,
    name,
    description: typeof docData.description === 'string' ? docData.description : '',
    imageUrl: typeof docData.imageUrl === 'string' ? docData.imageUrl : '',
    appliesTo,
    displayOrder: typeof docData.displayOrder === 'number' ? docData.displayOrder : 999,
    visible: docData.visible !== false,
    createdAt: typeof docData.createdAt === 'string' ? docData.createdAt : undefined,
    updatedAt: typeof docData.updatedAt === 'string' ? docData.updatedAt : undefined,
    updatedBy: typeof docData.updatedBy === 'string' ? docData.updatedBy : undefined,
  };
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
  const rawCategory = typeof docData.category === 'string' ? docData.category.trim() : '';
  const normalizedCategory = normalizeCategory(rawCategory);
  if (!normalizedCategory && categoriesLoaded) {
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
    rawCategory,
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

function rebuildLiveProducts(): void {
  if (rawProductDocs.length === 0) {
    if (liveProducts.length > 0) {
      liveProducts = [];
    }
    return;
  }
  liveProducts = rawProductDocs.map((entry) => mapDocToProduct(entry.data, entry.id));
}

function subscribeCategories(): void {
  if (categoriesRetryTimer) {
    clearTimeout(categoriesRetryTimer);
    categoriesRetryTimer = null;
  }
  if (categoriesUnsub) {
    categoriesUnsub();
    categoriesUnsub = null;
  }

  try {
    // Filter visible == true to satisfy public security rules without needing a composite index;
    // sort by displayOrder on the client.
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('visible', '==', true)
    );
    categoriesUnsub = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const mapped = sortCategoriesByOrder(
          snapshot.docs.map((d) => mapDocToCategory(d.data(), d.id))
        );
        liveCategories = mapped;
        // Fallback to built-in read-only defaults when collection is empty
        effectiveCategories = mapped.length > 0 ? mapped : DEFAULT_CATEGORIES;
        categoriesLoaded = true;
        categoriesError = false;
        categoriesRetryCount = 0;

        rebuildCategoryCaches();
        rebuildLiveProducts();
        notifyStoreListeners();
      },
      (error) => {
        console.error('Firestore categories listener error:', error);
        // Keep last good categories in memory and mark loaded so UI never hangs
        categoriesLoaded = true;
        categoriesError = true;
        notifyStoreListeners();

        if (categoriesUnsub) {
          categoriesUnsub();
          categoriesUnsub = null;
        }
        if (categoriesRetryCount < MAX_LISTENER_RETRIES) {
          const delayMs = Math.min(2000 * Math.pow(1.5, categoriesRetryCount), 15000);
          categoriesRetryCount += 1;
          categoriesRetryTimer = setTimeout(() => {
            subscribeCategories();
          }, delayMs);
        }
      }
    );
  } catch (err) {
    console.error('Categories listener init error:', err);
    categoriesLoaded = true;
    categoriesError = true;
    notifyStoreListeners();
  }
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
        rawProductDocs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
        rebuildLiveProducts();
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
  categoriesRetryCount = 0;
  productsError = false;
  categoriesError = false;
  if (liveProducts.length === 0) {
    productsLoaded = false;
  }
  notifyStoreListeners();
  subscribeProducts();
  subscribeCategories();
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

  subscribeCategories();
  subscribeSettings();
  subscribeProducts();

  // Auto-recover listeners when browser comes back online
  window.addEventListener('online', () => {
    if (categoriesError || !categoriesUnsub) {
      categoriesRetryCount = 0;
      subscribeCategories();
    }
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
 * Category Accessors (stable cached references for useSyncExternalStore)
 */
export interface GetCategoriesOptions {
  metal?: 'all' | 'gold' | 'silver';
  visibleOnly?: boolean;
}

export function getCategories(options: GetCategoriesOptions = {}): Category[] {
  const metal = options.metal ?? 'all';
  const visibleOnly = options.visibleOnly ?? true;

  if (visibleOnly) {
    if (metal === 'gold') return cachedVisibleGold;
    if (metal === 'silver') return cachedVisibleSilver;
    return cachedVisibleAll;
  }

  if (metal === 'gold') return cachedAllGold;
  if (metal === 'silver') return cachedAllSilver;
  return cachedAllAll;
}

export function getVisibleCategories(): Category[] {
  return cachedVisibleAll;
}

export function getVisibleGoldCategories(): Category[] {
  return cachedVisibleGold;
}

export function getVisibleSilverCategories(): Category[] {
  return cachedVisibleSilver;
}

export function getCategoryBySlug(slug: string | undefined | null): Category | undefined {
  if (!slug || typeof slug !== 'string') return undefined;
  const trimmed = slug.toLowerCase().trim();
  if (!trimmed) return undefined;
  return cachedAllAll.find((c) => c.slug.toLowerCase() === trimmed);
}

export function getCategoryDisplayName(
  slug: string | undefined | null,
  fallback = 'Jewellery'
): string {
  if (!slug || typeof slug !== 'string' || !slug.trim()) return fallback;
  const live = getCategoryBySlug(slug);
  if (live) return live.name;
  const normalized = normalizeCategory(slug);
  if (normalized) {
    const resolved = getCategoryBySlug(normalized);
    if (resolved) return resolved.name;
  }
  return formatCategorySlugFallback(slug) || fallback;
}

export function getCategoryProductCount(
  slug: string,
  options: { activeOnly?: boolean } = {}
): number {
  const target = slug.toLowerCase().trim();
  if (!target) return 0;
  const activeOnly = options.activeOnly ?? true;
  return liveProducts.filter((p) => {
    if (activeOnly && (!p.inStock || p.stock <= 0)) {
      // Note: liveProducts only contains status === 'active' products;
      // keep counting all status==='active' unless caller strictly asks otherwise
    }
    return p.category.toLowerCase() === target;
  }).length;
}

export function areCategoriesLoaded(): boolean {
  return categoriesLoaded;
}

export function hasCategoriesError(): boolean {
  return categoriesError;
}

export function isUsingDefaultCategories(): boolean {
  return liveCategories.length === 0;
}

/**
 * Product & Settings Accessor Functions (stable cached references for useSyncExternalStore)
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
      customerName: enquiry.customerName?.trim()
        ? enquiry.customerName.trim().slice(0, 100)
        : undefined,
      customerPhone: enquiry.customerPhone?.trim()
        ? enquiry.customerPhone.trim().slice(0, 50)
        : undefined,
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
