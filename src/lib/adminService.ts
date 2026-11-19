import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { BullionRates } from './pricing';
import {
  Category,
  CategoryAppliesTo,
  DEFAULT_CATEGORIES,
  ShowcaseTile,
  formatCategorySlugFallback,
  generateCategorySlug,
} from '../data/store';

export type StaffRole = 'owner' | 'rate_manager' | 'product_manager' | 'support' | 'viewer';

export interface StaffMember {
  email: string;
  role: StaffRole;
  name?: string;
  addedAt?: string;
}

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  metal: 'gold' | 'silver';
  category: string;
  karat: number; // 18, 21, 22, 24 for gold, 0 or 925 for silver
  weightG: number;
  makingType: 'fixed' | 'perGram';
  makingValue: number;
  stock: number;
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreSettingsDoc {
  gold24kPerTola: number;
  silverRate: number;
  silverUnit: 'tola' | 'gram';
  ratesUpdatedAt?: string;
  whatsappNumber?: string;
  hoursText?: string;
  address?: string;
  deliveryText?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  showcaseTiles?: ShowcaseTile[];
  aboutPageImageUrl?: string;
  aboutPageImageUrl2?: string;
  aboutPageStory?: string;
  establishedYear?: string;
  craftsmanshipText?: string;
  familyLineEn?: string;
  familyLineUr?: string;
  contactEmail?: string;
  phone?: string;
  socialHandles?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    snapchat?: string;
    x?: string;
  };
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  snapchat?: string;
  x?: string;
  lastHistoryId?: string;
  lastGoldHistoryId?: string;
  lastSilverHistoryId?: string;
}

export interface RateHistoryItem {
  id: string;
  metal: string;
  oldValue: number;
  newValue: number;
  unit: string;
  changedBy: string;
  changedAt: string;
}

export interface EnquiryItem {
  sku: string;
  name: string;
  qty: number;
  weightG: number;
  estimate: number;
}

export interface EnquiryDoc {
  id: string;
  customerName?: string;
  customerPhone?: string;
  fulfilment: 'courier' | 'pickup';
  status: 'new' | 'contacted' | 'awaiting_customer' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  rateSnapshot?: any;
  estimatedTotal: number;
  items: EnquiryItem[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Staff verification and management
 */
export async function getStaffRecord(email: string): Promise<StaffMember | null> {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const docSnap = await getDoc(doc(db, 'staff', normalizedEmail));
    if (docSnap.exists()) {
      return { email: normalizedEmail, ...(docSnap.data() as Omit<StaffMember, 'email'>) };
    }
    // Initial super owner check
    if (normalizedEmail === 'bengamers494@gmail.com') {
      return {
        email: normalizedEmail,
        role: 'owner',
        name: 'Super Owner',
        addedAt: new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `staff/${normalizedEmail}`);
  }
}

export async function fetchAllStaff(): Promise<StaffMember[]> {
  try {
    const snap = await getDocs(collection(db, 'staff'));
    return snap.docs.map((d) => ({ email: d.id, ...(d.data() as Omit<StaffMember, 'email'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'staff');
  }
}

export async function saveStaffMember(email: string, role: StaffRole, name?: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    await setDoc(doc(db, 'staff', normalizedEmail), {
      role,
      name: name || normalizedEmail.split('@')[0],
      addedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `staff/${normalizedEmail}`);
  }
}

export async function deleteStaffMember(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    await deleteDoc(doc(db, 'staff', normalizedEmail));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `staff/${normalizedEmail}`);
  }
}

/**
 * Bullion Rates with Atomic RateHistory Batched Write
 * Enforces rule: "every rate change must be saved in the same batch as NEW rateHistory documents.
 * One history doc per changed metal: metal 'gold' or 'silver', oldValue, newValue, unit,
 * changedBy == request.auth.uid, changedAt == request.time.
 * Rules must check the history newValue equals the new settings value for that metal."
 */
export async function updateBullionRates(
  newGold24k: number,
  newSilverRate: number,
  silverUnit: 'tola' | 'gram',
  oldRates?: BullionRates
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  try {
    const batch = writeBatch(db);
    const goldHistoryRef = doc(collection(db, 'rateHistory'));
    const silverHistoryRef = doc(collection(db, 'rateHistory'));
    const nowIso = new Date().toISOString();

    // 1. Record Gold rateHistory
    batch.set(goldHistoryRef, {
      metal: 'gold',
      oldValue: oldRates ? oldRates.gold24KPerTola : 0,
      newValue: newGold24k,
      unit: 'tola',
      changedBy: user.uid,
      changedAt: serverTimestamp(),
    });

    // 2. Record Silver rateHistory
    batch.set(silverHistoryRef, {
      metal: 'silver',
      oldValue: oldRates ? oldRates.silverRate : 0,
      newValue: newSilverRate,
      unit: silverUnit,
      changedBy: user.uid,
      changedAt: serverTimestamp(),
    });

    // 3. Update settings/store with matching ids
    const settingsRef = doc(db, 'settings', 'store');
    batch.set(
      settingsRef,
      {
        gold24kPerTola: newGold24k,
        silverRate: newSilverRate,
        silverUnit,
        ratesUpdatedAt: nowIso,
        lastGoldHistoryId: goldHistoryRef.id,
        lastSilverHistoryId: silverHistoryRef.id,
        lastHistoryId: goldHistoryRef.id,
      },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/store');
  }
}

/**
 * Fetch Store Settings Doc for Admin
 */
export async function fetchStoreSettingsAdmin(): Promise<StoreSettingsDoc | null> {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'store'));
    if (docSnap.exists()) {
      return docSnap.data() as StoreSettingsDoc;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/store');
  }
}

function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Update General Store Settings (e.g. whatsappNumber, address, hoursText, deliveryText)
 */
export async function updateStoreSettingsInfo(updates: {
  whatsappNumber?: string;
  hoursText?: string;
  address?: string;
  deliveryText?: string;
  aboutPageStory?: string;
  establishedYear?: string;
  craftsmanshipText?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  showcaseTiles?: ShowcaseTile[];
  aboutPageImageUrl?: string;
  aboutPageImageUrl2?: string;
  familyLineEn?: string;
  familyLineUr?: string;
  contactEmail?: string;
  phone?: string;
  socialHandles?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    snapchat?: string;
    x?: string;
  };
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  snapchat?: string;
  x?: string;
}): Promise<void> {
  try {
    const cleanUpdates = stripUndefined(updates);
    await setDoc(doc(db, 'settings', 'store'), cleanUpdates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'settings/store');
  }
}

export async function fetchRateHistory(): Promise<RateHistoryItem[]> {
  try {
    const q = query(collection(db, 'rateHistory'), orderBy('changedAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      let changedAtStr = '';
      if (data.changedAt?.toDate) {
        changedAtStr = data.changedAt.toDate().toISOString();
      } else if (typeof data.changedAt === 'string') {
        changedAtStr = data.changedAt;
      }
      return {
        id: d.id,
        metal: data.metal,
        oldValue: data.oldValue,
        newValue: data.newValue,
        unit: data.unit,
        changedBy: data.changedBy,
        changedAt: changedAtStr || new Date().toISOString(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'rateHistory');
  }
}


/**
 * Products CRUD
 */
export async function fetchAllProductsAdmin(): Promise<AdminProduct[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminProduct, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

export async function saveProduct(product: Partial<AdminProduct> & { sku: string; name: string }): Promise<string> {
  const prodId = product.id || doc(collection(db, 'products')).id;
  const nowIso = new Date().toISOString();

  // Validate values
  if (!product.weightG || product.weightG <= 0) throw new Error('Weight must be greater than 0');
  if (product.makingValue === undefined || product.makingValue < 0) throw new Error('Making charge cannot be negative');
  if (product.stock === undefined || product.stock < 0) throw new Error('Stock cannot be negative');
  if (product.metal === 'gold' && !product.karat) throw new Error('Karat is required for gold products');
  const trimmedCategory = typeof product.category === 'string' ? product.category.trim() : '';
  if (!trimmedCategory) throw new Error('Please select a category for this product');

  const cleanData: any = {
    sku: product.sku.trim().toUpperCase(),
    name: product.name.trim(),
    description: product.description || '',
    metal: product.metal || 'gold',
    category: trimmedCategory,
    karat: product.metal === 'gold' ? Number(product.karat) : 0,
    weightG: Number(product.weightG),
    makingType: product.makingType || 'perGram',
    makingValue: Number(product.makingValue),
    stock: Math.floor(Number(product.stock)),
    status: product.status || 'active',
    featured: Boolean(product.featured),
    images: Array.isArray(product.images) ? product.images.slice(0, 6) : [],
    updatedAt: nowIso,
  };

  if (!product.id) {
    cleanData.createdAt = nowIso;
  }

  try {
    await setDoc(doc(db, 'products', prodId), cleanData, { merge: true });
    return prodId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${prodId}`);
  }
}

export async function updateProductStockOnly(productId: string, newStock: number): Promise<void> {
  if (newStock < 0) throw new Error('Stock cannot be negative');
  try {
    await updateDoc(doc(db, 'products', productId), {
      stock: Math.floor(newStock),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
}

/**
 * Enquiries Management
 */
export async function fetchAllEnquiries(): Promise<EnquiryDoc[]> {
  try {
    const q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EnquiryDoc, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'enquiries');
  }
}

export async function updateEnquiryStatus(
  enquiryId: string,
  status: EnquiryDoc['status'],
  notes?: string
): Promise<void> {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (notes !== undefined && notes !== null && notes.trim() !== '') {
      updateData.notes = notes.trim().slice(0, 1000);
    }
    await updateDoc(doc(db, 'enquiries', enquiryId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `enquiries/${enquiryId}`);
  }
}

/**
 * Categories Management (Admin)
 */
export async function fetchAllCategoriesAdmin(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    const list: Category[] = snap.docs.map((d) => {
      const data = d.data();
      const slug = typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : d.id;
      const appliesTo: CategoryAppliesTo =
        data.appliesTo === 'gold' || data.appliesTo === 'silver' || data.appliesTo === 'both'
          ? data.appliesTo
          : 'both';
      return {
        id: d.id,
        slug,
        name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : formatCategorySlugFallback(slug),
        description: typeof data.description === 'string' ? data.description : '',
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
        appliesTo,
        displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 999,
        visible: data.visible !== false,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
        updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
      };
    });
    return list.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'categories');
  }
}

export interface SaveCategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
  appliesTo: CategoryAppliesTo;
  displayOrder: number;
  visible: boolean;
}

export async function createCategoryAdmin(
  input: SaveCategoryInput,
  existingCategories: Category[],
  staffEmail: string
): Promise<Category> {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 40) {
    throw new Error('Category name must be between 2 and 40 characters.');
  }
  const duplicateName = existingCategories.some(
    (c) => c.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicateName) {
    throw new Error(`A category named "${name}" already exists.`);
  }

  const description = (input.description || '').trim();
  if (description.length > 160) {
    throw new Error('Description must be at most 160 characters.');
  }

  const imageUrl = (input.imageUrl || '').trim();
  if (imageUrl.length > 500) {
    throw new Error('Image URL must be at most 500 characters.');
  }

  const slug = generateCategorySlug(
    name,
    existingCategories.map((c) => c.slug)
  );
  const nowIso = new Date().toISOString();
  const payload = {
    name,
    slug,
    description,
    imageUrl,
    appliesTo: input.appliesTo,
    displayOrder: Number(input.displayOrder),
    visible: Boolean(input.visible),
    createdAt: nowIso,
    updatedAt: nowIso,
    updatedBy: staffEmail.toLowerCase().trim(),
  };

  try {
    await setDoc(doc(db, 'categories', slug), payload);
    return { id: slug, ...payload };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `categories/${slug}`);
  }
}

export async function updateCategoryAdmin(
  slug: string,
  input: SaveCategoryInput,
  existingCategories: Category[],
  staffEmail: string
): Promise<void> {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 40) {
    throw new Error('Category name must be between 2 and 40 characters.');
  }
  const duplicateName = existingCategories.some(
    (c) => c.slug !== slug && c.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicateName) {
    throw new Error(`Another category named "${name}" already exists.`);
  }

  const description = (input.description || '').trim();
  if (description.length > 160) {
    throw new Error('Description must be at most 160 characters.');
  }

  const imageUrl = (input.imageUrl || '').trim();
  if (imageUrl.length > 500) {
    throw new Error('Image URL must be at most 500 characters.');
  }

  const nowIso = new Date().toISOString();
  const existing = existingCategories.find((c) => c.slug === slug);
  const payload = {
    name,
    slug,
    description,
    imageUrl,
    appliesTo: input.appliesTo,
    displayOrder: Number(input.displayOrder),
    visible: Boolean(input.visible),
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
    updatedBy: staffEmail.toLowerCase().trim(),
  };

  try {
    await setDoc(doc(db, 'categories', slug), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `categories/${slug}`);
  }
}

export async function reorderCategoriesBatch(
  orderedCategories: Category[],
  staffEmail: string
): Promise<void> {
  if (orderedCategories.length === 0) return;
  const nowIso = new Date().toISOString();
  const updatedBy = staffEmail.toLowerCase().trim();

  try {
    const batch = writeBatch(db);
    orderedCategories.forEach((cat, idx) => {
      const nextOrder = idx + 1;
      batch.set(
        doc(db, 'categories', cat.slug),
        {
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          imageUrl: cat.imageUrl || '',
          appliesTo: cat.appliesTo,
          displayOrder: nextOrder,
          visible: Boolean(cat.visible),
          createdAt: cat.createdAt || nowIso,
          updatedAt: nowIso,
          updatedBy,
        },
        { merge: true }
      );
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'categories');
  }
}

export async function deleteCategoryAdmin(slug: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', slug));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${slug}`);
  }
}

export async function reassignProductsCategoryBatch(
  productsToMove: AdminProduct[],
  targetCategorySlug: string
): Promise<void> {
  if (productsToMove.length === 0) return;
  const target = targetCategorySlug.trim();
  if (!target) throw new Error('Please choose a target category.');
  const nowIso = new Date().toISOString();

  try {
    const chunkSize = 400;
    for (let i = 0; i < productsToMove.length; i += chunkSize) {
      const chunk = productsToMove.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const product of chunk) {
        batch.update(doc(db, 'products', product.id), {
          category: target,
          updatedAt: nowIso,
        });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
  }
}

/**
 * Idempotently imports the 5 default categories into Firestore in a single batched write.
 * Safe to invoke multiple times: skips any slug that already exists.
 */
export async function importDefaultCategoriesBatch(staffEmail: string): Promise<number> {
  const nowIso = new Date().toISOString();
  const updatedBy = staffEmail.toLowerCase().trim();

  try {
    const existingSnap = await getDocs(collection(db, 'categories'));
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));
    const toCreate = DEFAULT_CATEGORIES.filter((cat) => !existingIds.has(cat.slug));
    if (toCreate.length === 0) return 0;

    const batch = writeBatch(db);
    for (const cat of toCreate) {
      batch.set(doc(db, 'categories', cat.slug), {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        imageUrl: cat.imageUrl || '',
        appliesTo: cat.appliesTo,
        displayOrder: cat.displayOrder,
        visible: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        updatedBy,
      });
    }
    await batch.commit();
    return toCreate.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'categories');
  }
}
