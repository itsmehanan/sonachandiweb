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
  lastHistoryId?: string;
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
    // Hardcoded initial super owner check
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
 * Enforces rule: "every rate change must be saved in the SAME batched write as a rateHistory document"
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
    const historyRef = doc(collection(db, 'rateHistory'));
    const nowIso = new Date().toISOString();

    // 1. Record rateHistory
    batch.set(historyRef, {
      metal: 'both',
      oldValue: oldRates ? oldRates.gold24KPerTola : 0,
      newValue: newGold24k,
      unit: 'tola',
      changedBy: user.uid,
      changedAt: nowIso,
    });

    // 2. Update settings/store with matching lastHistoryId
    const settingsRef = doc(db, 'settings', 'store');
    batch.set(
      settingsRef,
      {
        gold24kPerTola: newGold24k,
        silverRate: newSilverRate,
        silverUnit,
        ratesUpdatedAt: nowIso,
        lastHistoryId: historyRef.id,
      },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/store');
  }
}

export async function fetchRateHistory(): Promise<RateHistoryItem[]> {
  try {
    const q = query(collection(db, 'rateHistory'), orderBy('changedAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RateHistoryItem, 'id'>) }));
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

  const cleanData: any = {
    sku: product.sku.trim().toUpperCase(),
    name: product.name.trim(),
    description: product.description || '',
    metal: product.metal || 'gold',
    category: product.category || 'necklaces',
    karat: product.metal === 'gold' ? Number(product.karat) : 0,
    weightG: Number(product.weightG),
    makingType: product.makingType || 'perGram',
    makingValue: Number(product.makingValue),
    stock: Math.floor(Number(product.stock)),
    status: product.status || 'active',
    featured: Boolean(product.featured),
    images: Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : ['/src/assets/images/jewel_gold_bridal_necklace_1793522998312.jpg'],
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
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    await updateDoc(doc(db, 'enquiries', enquiryId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `enquiries/${enquiryId}`);
  }
}

/**
 * Initial Seeding Check
 * Seeds ownerBengamers, settings/store, and sample products if collection is fresh
 */
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    // 1. Seed Owner
    const ownerEmail = 'bengamers494@gmail.com';
    await setDoc(
      doc(db, 'staff', ownerEmail),
      {
        role: 'owner',
        name: 'Head Goldsmith & Owner',
        addedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Check settings/store
    const settingsSnap = await getDoc(doc(db, 'settings', 'store'));
    if (!settingsSnap.exists()) {
      const historyRef = doc(collection(db, 'rateHistory'));
      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);

      batch.set(historyRef, {
        metal: 'both',
        oldValue: 0,
        newValue: 284500,
        unit: 'tola',
        changedBy: 'system-init',
        changedAt: nowIso,
      });

      batch.set(doc(db, 'settings', 'store'), {
        gold24kPerTola: 284500,
        silverRate: 3420,
        silverUnit: 'tola',
        ratesUpdatedAt: nowIso,
        whatsappNumber: '923109412332',
        hoursText: 'Monday to Saturday: 9:00 AM – 9:00 PM PKT | Sunday: Closed',
        address: '[Placeholder Address: Suite 4-B, Gold Souk, Liberty Market, Gulberg III, Lahore, Pakistan]',
        deliveryText: 'Insured nationwide courier transit with sealed tamper-evident security packing.',
        lastHistoryId: historyRef.id,
      });

      await batch.commit();
    }
  } catch (err) {
    console.warn('Initial seeding note:', err);
  }
}
