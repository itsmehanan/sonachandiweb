import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  LogIn,
  LogOut,
  ArrowLeft,
  DollarSign,
  Package,
  Layers,
  MessageSquare,
  History,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  Sparkles,
  Scale,
  Upload,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Phone,
  Clock,
  MapPin,
  Truck,
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  StaffMember,
  StaffRole,
  AdminProduct,
  EnquiryDoc,
  RateHistoryItem,
  StoreSettingsDoc,
  getStaffRecord,
  fetchAllStaff,
  saveStaffMember,
  deleteStaffMember,
  updateBullionRates,
  fetchRateHistory,
  fetchAllProductsAdmin,
  saveProduct,
  updateProductStockOnly,
  deleteProduct,
  fetchAllEnquiries,
  updateEnquiryStatus,
  uploadProductImage,
  fetchStoreSettingsAdmin,
  updateStoreSettingsInfo,
} from '../../lib/adminService';
import {
  BullionRates,
  get24KGoldPerGram,
  getGoldPerGramForKarat,
  getSilverPerGram,
  formatPKR,
} from '../../lib/pricing';
import { getRates, updateRates, getSettings } from '../../data/store';

interface AdminPanelProps {
  onBackToStore: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToStore }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [staffRecord, setStaffRecord] = useState<StaffMember | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'rates' | 'products' | 'inventory' | 'enquiries' | 'rateHistory' | 'staff' | 'settings'
  >('overview');

  // Rates state
  const [rates, setRatesState] = useState<BullionRates>(() => getRates());
  const [inputGold24k, setInputGold24k] = useState<number>(rates.gold24KPerTola || 0);
  const [inputSilver, setInputSilver] = useState<number>(rates.silverRate || 0);
  const [inputSilverUnit, setInputSilverUnit] = useState<'tola' | 'gram'>(
    rates.silverUnit === 'per_gram' ? 'gram' : 'tola'
  );
  const [savingRates, setSavingRates] = useState(false);
  const [ratesFeedback, setRatesFeedback] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<AdminProduct> | null>(null);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store Settings state
  const [settingsDoc, setSettingsDoc] = useState<StoreSettingsDoc | null>(null);
  const [inputWhatsApp, setInputWhatsApp] = useState('923109412332');
  const [inputAddress, setInputAddress] = useState('');
  const [inputHours, setInputHours] = useState('');
  const [inputDelivery, setInputDelivery] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Inventory state
  const [inventorySearch, setInventorySearch] = useState('');

  // Enquiries state
  const [enquiries, setEnquiries] = useState<EnquiryDoc[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  // Rate History state
  const [rateHistory, setRateHistory] = useState<RateHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Staff state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('viewer');
  const [newStaffName, setNewStaffName] = useState('');

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        setLoadingAuth(true);
        try {
          const staff = await getStaffRecord(user.email);
          if (staff) {
            setStaffRecord(staff);
            setAccessDenied(false);
            if (staff.role === 'rate_manager') setActiveTab('rates');
            else if (staff.role === 'product_manager') setActiveTab('products');
            else if (staff.role === 'support') setActiveTab('enquiries');
            else setActiveTab('overview');
          } else {
            setStaffRecord(null);
            setAccessDenied(true);
          }
        } catch (err) {
          console.error('Error fetching staff info:', err);
          setAccessDenied(true);
        } finally {
          setLoadingAuth(false);
        }
      } else {
        setStaffRecord(null);
        setAccessDenied(false);
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch data when switching tabs
  useEffect(() => {
    if (!currentUser || !staffRecord) return;

    if (activeTab === 'overview' || activeTab === 'products' || activeTab === 'inventory') {
      loadProducts();
    }
    if (activeTab === 'overview' || activeTab === 'enquiries') {
      loadEnquiries();
    }
    if (activeTab === 'overview' || activeTab === 'rateHistory') {
      loadRateHistory();
    }
    if (activeTab === 'staff' && staffRecord.role === 'owner') {
      loadStaff();
    }
    if (activeTab === 'settings' || activeTab === 'overview' || activeTab === 'rates') {
      loadStoreSettings();
    }
  }, [activeTab, currentUser, staffRecord]);

  const loadStoreSettings = async () => {
    try {
      const data = await fetchStoreSettingsAdmin();
      if (data) {
        setSettingsDoc(data);
        if (data.whatsappNumber) setInputWhatsApp(data.whatsappNumber);
        if (data.address) setInputAddress(data.address);
        if (data.hoursText) setInputHours(data.hoursText);
        if (data.deliveryText) setInputDelivery(data.deliveryText);
        if (data.gold24kPerTola) setInputGold24k(data.gold24kPerTola);
        if (data.silverRate) setInputSilver(data.silverRate);
        if (data.silverUnit) setInputSilverUnit(data.silverUnit);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await fetchAllProductsAdmin();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const data = await fetchAllEnquiries();
      setEnquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  const loadRateHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchRateHistory();
      setRateHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await fetchAllStaff();
      setStaffList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setStaffRecord(null);
    setAccessDenied(false);
  };

  // Rates Update Handler (Atomic with dual rateHistory records)
  const handleSaveRates = async () => {
    if (inputGold24k <= 0 || inputSilver <= 0) {
      setRatesFeedback('Rates must be positive numbers');
      return;
    }
    setSavingRates(true);
    setRatesFeedback(null);
    try {
      await updateBullionRates(inputGold24k, inputSilver, inputSilverUnit, rates);
      const updated = updateRates({
        gold24KPerTola: inputGold24k,
        silverRate: inputSilver,
        silverUnit: inputSilverUnit === 'gram' ? 'per_gram' : 'per_tola',
      });
      setRatesState(updated);
      setRatesFeedback('✓ Bullion rates & atomic audit history logged successfully!');
      setTimeout(() => setRatesFeedback(null), 4000);
      await loadRateHistory();
    } catch (err: any) {
      setRatesFeedback(`Error saving rates: ${err.message || 'Check Firestore permissions'}`);
    } finally {
      setSavingRates(false);
    }
  };

  // Store General Settings Save Handler
  const handleSaveStoreSettings = async () => {
    setSavingSettings(true);
    setSettingsFeedback(null);
    try {
      await updateStoreSettingsInfo({
        whatsappNumber: inputWhatsApp.trim(),
        address: inputAddress.trim(),
        hoursText: inputHours.trim(),
        deliveryText: inputDelivery.trim(),
      });
      setSettingsFeedback('✓ Store settings updated successfully!');
      setTimeout(() => setSettingsFeedback(null), 4000);
    } catch (err: any) {
      setSettingsFeedback(`Error saving settings: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // Multi-File Image Upload to Firebase Storage
  const handleImageFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;

    setUploadingImage(true);
    setProductFormError(null);
    try {
      const prodId = editingProduct.id || 'new_piece';
      const existingImages = [...(editingProduct.images || [])];
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (existingImages.length + newUrls.length >= 10) {
          alert('Maximum 10 images allowed per product piece.');
          break;
        }
        const url = await uploadProductImage(prodId, file);
        newUrls.push(url);
      }

      setEditingProduct({
        ...editingProduct,
        images: [...existingImages, ...newUrls],
      });
    } catch (err: any) {
      setProductFormError(`Image upload error: ${err.message}`);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (!editingProduct || !editingProduct.images) return;
    const updated = editingProduct.images.filter((_, idx) => idx !== indexToRemove);
    setEditingProduct({ ...editingProduct, images: updated });
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (!editingProduct || !editingProduct.images) return;
    const list = [...editingProduct.images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setEditingProduct({ ...editingProduct, images: list });
  };

  // Product Save Handler
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setProductFormError(null);

    if (!editingProduct.sku || !editingProduct.name) {
      setProductFormError('SKU and Product Title are required');
      return;
    }
    if (!editingProduct.weightG || editingProduct.weightG <= 0) {
      setProductFormError('Weight must be greater than 0 grams');
      return;
    }
    if (editingProduct.makingValue === undefined || editingProduct.makingValue < 0) {
      setProductFormError('Making charge cannot be negative');
      return;
    }
    if (editingProduct.stock === undefined || editingProduct.stock < 0) {
      setProductFormError('Stock cannot be negative');
      return;
    }

    setProductSaving(true);
    try {
      await saveProduct(editingProduct as any);
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      setProductFormError(err.message || 'Error saving product');
    } finally {
      setProductSaving(false);
    }
  };

  // Staff Management
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail || !newStaffEmail.includes('@')) return;
    try {
      await saveStaffMember(newStaffEmail, newStaffRole, newStaffName);
      setNewStaffEmail('');
      setNewStaffName('');
      await loadStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (email: string) => {
    if (email === 'bengamers494@gmail.com') {
      alert('The primary owner cannot be removed.');
      return;
    }
    if (confirm(`Remove access for ${email}?`)) {
      try {
        await deleteStaffMember(email);
        await loadStaff();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Permissions check helpers
  const canAccessRates = staffRecord?.role === 'owner' || staffRecord?.role === 'rate_manager';
  const canAccessProducts = staffRecord?.role === 'owner' || staffRecord?.role === 'product_manager';
  const canAccessEnquiries = staffRecord?.role === 'owner' || staffRecord?.role === 'support';
  const canAccessStaff = staffRecord?.role === 'owner';
  const canAccessSettings = staffRecord?.role === 'owner';

  // Live Gram Rates preview math for the Rates tab
  const preview24kPerGram = inputGold24k > 0 ? get24KGoldPerGram(inputGold24k) : 0;
  const preview22kPerGram = inputGold24k > 0 ? getGoldPerGramForKarat('22K', inputGold24k) : 0;
  const preview21kPerGram = inputGold24k > 0 ? getGoldPerGramForKarat('21K', inputGold24k) : 0;
  const preview18kPerGram = inputGold24k > 0 ? getGoldPerGramForKarat('18K', inputGold24k) : 0;
  const previewSilverPerGram = inputSilver > 0
    ? getSilverPerGram(inputSilver, inputSilverUnit === 'gram' ? 'per_gram' : 'per_tola')
    : 0;

  // If Auth loading
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#C9A54B] animate-spin" />
          <p className="text-sm font-serif text-[#1E1B18]">Verifying Staff Authorization...</p>
        </div>
      </div>
    );
  }

  // If Not Logged In
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4">
        <div className="w-full max-w-md bg-white border border-[#E2D8C9] rounded-2xl p-8 shadow-xl text-center space-y-6">
          <img
            src="/public/assets/aistudio/logo-light_b9e6ed91.png"
            alt="Sona & Chandi Gold Collection"
            className="h-16 w-auto mx-auto object-contain"
          />

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold text-[#1E1B18]">Staff Portal</h1>
            <p className="text-xs text-[#64748B]">
              Sign in with your verified staff Google account to manage bullion rates, catalogue pieces, and orders.
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="gold-sheen w-full py-3.5 px-4 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-medium text-sm rounded-lg transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google</span>
          </button>

          <div className="pt-2">
            <button
              onClick={onBackToStore}
              className="text-xs font-semibold text-[#64748B] hover:text-[#1E1B18] flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If Logged in but not in staff collection
  if (accessDenied || !staffRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4">
        <div className="w-full max-w-md bg-white border border-rose-200 rounded-2xl p-8 shadow-xl text-center space-y-5">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <Shield className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Access Restricted</h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Signed in as <strong className="text-[#1E1B18]">{currentUser.email}</strong>, but this account is not registered in the staff roster.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Sign Out
            </button>
            <button
              onClick={onBackToStore}
              className="text-xs text-[#64748B] hover:text-[#1E1B18] cursor-pointer"
            >
              Back to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3ED] text-[#1E1B18]">
      {/* Top Admin Navbar */}
      <header className="bg-white border-b border-[#E2D8C9] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToStore}
              className="p-2 text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer"
              title="Return to Storefront"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <img
                src="/public/assets/aistudio/logo-light_b9e6ed91.png"
                alt="Sona & Chandi"
                className="h-8 w-auto object-contain"
              />
              <span className="font-serif font-bold text-base text-[#1E1B18] hidden sm:inline">
                Admin Console
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#F7F0DC] text-[#8E6E24] rounded-md border border-[#C9A54B]/30">
                {staffRecord.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* User profile & Sign out */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#64748B] hidden md:inline">{currentUser.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-56 shrink-0 bg-white border border-[#E2D8C9] rounded-xl p-3 h-fit space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#1E1B18] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview</span>
          </button>

          {canAccessRates && (
            <button
              onClick={() => setActiveTab('rates')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'rates'
                  ? 'bg-[#1E1B18] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Bullion Rates</span>
            </button>
          )}

          {canAccessProducts && (
            <>
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-[#1E1B18] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Products &amp; Images</span>
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-[#1E1B18] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2]'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Stock Control</span>
              </button>
            </>
          )}

          {canAccessEnquiries && (
            <button
              onClick={() => setActiveTab('enquiries')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'enquiries'
                  ? 'bg-[#1E1B18] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Customer Enquiries</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('rateHistory')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rateHistory'
                ? 'bg-[#1E1B18] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Rate Audit History</span>
          </button>

          {canAccessSettings && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#1E1B18] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2]'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Store Configuration</span>
            </button>
          )}

          {canAccessStaff && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-[#1E1B18] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff Access</span>
            </button>
          )}
        </aside>

        {/* Workspace Body */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 shadow-xs">
                <h2 className="font-serif text-xl font-bold text-[#1E1B18] mb-1">Store Performance &amp; Bullion Overview</h2>
                <p className="text-xs text-[#64748B]">Real-time bullion status and inventory health</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-[#8E6E24] uppercase tracking-wider">24K Gold / Tola</span>
                    <p className="font-mono text-2xl font-bold text-[#1E1B18]">
                      {rates.gold24KPerTola > 0 ? formatPKR(rates.gold24KPerTola) : 'Rate unavailable'}
                    </p>
                    <span className="text-[10px] text-[#64748B] block">
                      {rates.gold24KPerTola > 0
                        ? `22K: ${formatPKR(getGoldPerGramForKarat('22K', rates.gold24KPerTola))}/g`
                        : 'Please configure rates in Bullion tab'}
                    </span>
                  </div>

                  <div className="p-4 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Silver Rate</span>
                    <p className="font-mono text-2xl font-bold text-[#1E1B18]">
                      {rates.silverRate > 0 ? formatPKR(rates.silverRate) : 'Rate unavailable'}
                    </p>
                    <span className="text-[10px] text-[#64748B] block">
                      Unit: Per {rates.silverUnit === 'per_gram' ? 'Gram' : 'Tola'}
                    </span>
                  </div>

                  <div className="p-4 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Catalogue Items</span>
                    <p className="font-mono text-2xl font-bold text-[#1E1B18]">{products.length}</p>
                    <span className="text-[10px] text-emerald-700 font-medium block">
                      {products.filter((p) => p.status === 'active').length} Active Pieces
                    </span>
                  </div>

                  <div className="p-4 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">WhatsApp Enquiries</span>
                    <p className="font-mono text-2xl font-bold text-[#1E1B18]">{enquiries.length}</p>
                    <span className="text-[10px] text-[#8E6E24] font-medium block">
                      {enquiries.filter((e) => e.status === 'new').length} New Enquiries
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Enquiries Preview */}
              <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-[#1E1B18]">Recent WhatsApp Enquiries</h3>
                  {canAccessEnquiries && (
                    <button
                      onClick={() => setActiveTab('enquiries')}
                      className="text-xs font-semibold text-[#8E6E24] hover:underline cursor-pointer"
                    >
                      View All ({enquiries.length})
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#F3EFEA] text-xs">
                  {enquiries.slice(0, 5).map((enq) => (
                    <div key={enq.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-semibold text-[#1E1B18]">{enq.customerName || 'Inquiry Contact'}</span>
                        <span className="text-[#64748B] ml-2">({enq.fulfilment === 'courier' ? 'Courier Delivery' : 'Store Pickup'})</span>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{enq.items?.length || 0} items · {new Date(enq.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-[#1E1B18]">{formatPKR(enq.estimatedTotal)}</span>
                        <span className="block text-[10px] uppercase font-bold text-[#8E6E24]">{enq.status}</span>
                      </div>
                    </div>
                  ))}
                  {enquiries.length === 0 && (
                    <p className="py-6 text-center text-[#94A3B8]">No customer enquiries logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RATES */}
          {activeTab === 'rates' && canAccessRates && (
            <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Daily Bullion Rates Configuration</h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Adjust 24K Gold per tola and Silver rates. Changes are atomically saved with an immutable audit log.
                </p>
              </div>

              {ratesFeedback && (
                <div
                  className={`p-3.5 rounded-lg text-xs font-medium ${
                    ratesFeedback.startsWith('✓')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {ratesFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 24K Gold Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    24K Gold Rate (PKR / Tola)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-[#8E6E24]">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={inputGold24k || ''}
                      placeholder="e.g. 285000"
                      onChange={(e) => setInputGold24k(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-sm text-[#1E1B18] font-mono outline-none focus:border-[#C9A54B]"
                    />
                  </div>
                  <span className="text-[11px] text-[#64748B] block">1 tola = 11.6638 grams</span>
                </div>

                {/* Silver Rate Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      Silver Rate (PKR)
                    </label>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setInputSilverUnit('tola')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          inputSilverUnit === 'tola'
                            ? 'bg-[#1E1B18] text-white font-semibold'
                            : 'bg-slate-100 text-[#64748B]'
                        }`}
                      >
                        Per Tola
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputSilverUnit('gram')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          inputSilverUnit === 'gram'
                            ? 'bg-[#1E1B18] text-white font-semibold'
                            : 'bg-slate-100 text-[#64748B]'
                        }`}
                      >
                        Per Gram
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-slate-600">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={inputSilver || ''}
                      placeholder="e.g. 3400"
                      onChange={(e) => setInputSilver(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-sm text-[#1E1B18] font-mono outline-none focus:border-[#C9A54B]"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Karat Breakdown Preview */}
              <div className="p-5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl space-y-3">
                <span className="text-xs uppercase font-semibold text-[#8E6E24] tracking-wider block">
                  Computed Gram Rates Breakdown
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white border border-[#E2D8C9] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">24K (Pure)</span>
                    <span className="font-mono font-bold text-sm text-[#1E1B18]">
                      {preview24kPerGram > 0 ? `${formatPKR(preview24kPerGram)}/g` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-[#E2D8C9] rounded-lg">
                    <span className="text-[10px] text-[#8E6E24] block">22K (916)</span>
                    <span className="font-mono font-bold text-sm text-[#1E1B18]">
                      {preview22kPerGram > 0 ? `${formatPKR(preview22kPerGram)}/g` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-[#E2D8C9] rounded-lg">
                    <span className="text-[10px] text-[#8E6E24] block">21K (875)</span>
                    <span className="font-mono font-bold text-sm text-[#1E1B18]">
                      {preview21kPerGram > 0 ? `${formatPKR(preview21kPerGram)}/g` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-[#E2D8C9] rounded-lg">
                    <span className="text-[10px] text-[#8E6E24] block">18K (750)</span>
                    <span className="font-mono font-bold text-sm text-[#1E1B18]">
                      {preview18kPerGram > 0 ? `${formatPKR(preview18kPerGram)}/g` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveRates}
                  disabled={savingRates}
                  className="gold-sheen px-6 py-2.5 bg-[#C9A54B] hover:bg-[#B18D35] disabled:opacity-50 text-white font-medium text-xs uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingRates ? 'Logging Atomic Batch...' : 'Save & Publish Rates'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS & IMAGES */}
          {activeTab === 'products' && canAccessProducts && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Jewellery Catalogue Management</h2>
                  <p className="text-xs text-[#64748B]">Add or edit pieces with multi-file Firebase Storage image uploads</p>
                </div>
                <button
                  onClick={() =>
                    setEditingProduct({
                      sku: `SC-${Math.floor(100 + Math.random() * 900)}`,
                      name: '',
                      description: '',
                      metal: 'gold',
                      category: 'necklaces',
                      karat: 22,
                      weightG: 10,
                      makingType: 'perGram',
                      makingValue: 1200,
                      stock: 1,
                      status: 'active',
                      featured: false,
                      images: [],
                    })
                  }
                  className="gold-sheen px-4 py-2 bg-[#C9A54B] hover:bg-[#B18D35] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-white border border-[#E2D8C9] rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F2] border-b border-[#E2D8C9] text-[#64748B] uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Metal &amp; Karat</th>
                        <th className="py-3 px-4">Weight</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3EFEA]">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-[#1E1B18] flex items-center gap-2.5">
                            {p.images && p.images[0] ? (
                              <img
                                src={p.images[0]}
                                alt=""
                                className="w-8 h-8 rounded object-cover border border-[#E2D8C9]"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-[#F3EFEA] border border-[#E2D8C9] flex items-center justify-center text-[#8E6E24]">
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <span className="line-clamp-1">{p.name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#64748B]">{p.sku}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize">{p.metal}</span>
                            {p.metal === 'gold' && <span className="text-[#8E6E24] font-semibold ml-1">({p.karat}K)</span>}
                          </td>
                          <td className="py-3 px-4 font-mono">{p.weightG}g</td>
                          <td className="py-3 px-4 font-mono font-bold">
                            <span className={p.stock > 0 ? 'text-[#1E1B18]' : 'text-rose-600 font-medium'}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                p.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : p.status === 'draft'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => setEditingProduct({ ...p })}
                              className="p-1 text-[#64748B] hover:text-[#1E1B18] cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete ${p.name}?`)) {
                                  await deleteProduct(p.id);
                                  await loadProducts();
                                }
                              }}
                              className="p-1 text-[#64748B] hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-[#94A3B8]">
                            No jewellery pieces in Firestore. Click "Add Product" to create your first item.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Product Edit / Create Modal */}
              {editingProduct && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white border border-[#E2D8C9] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2D8C9]">
                      <h3 className="font-serif text-lg font-bold text-[#1E1B18]">
                        {editingProduct.id ? 'Edit Jewellery Piece' : 'Create New Piece'}
                      </h3>
                      <button onClick={() => setEditingProduct(null)} className="text-[#64748B] hover:text-[#1E1B18] cursor-pointer">
                        ✕
                      </button>
                    </div>

                    {productFormError && (
                      <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg">
                        {productFormError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#64748B] mb-1">SKU</label>
                        <input
                          type="text"
                          value={editingProduct.sku || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#64748B] mb-1">Product Title</label>
                        <input
                          type="text"
                          value={editingProduct.name || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#64748B] mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={editingProduct.description || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[#64748B] mb-1">Metal</label>
                        <select
                          value={editingProduct.metal || 'gold'}
                          onChange={(e) => setEditingProduct({ ...editingProduct, metal: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        >
                          <option value="gold">Gold</option>
                          <option value="silver">Silver</option>
                        </select>
                      </div>

                      {editingProduct.metal === 'gold' && (
                        <div>
                          <label className="block font-semibold text-[#64748B] mb-1">Karat (Required)</label>
                          <select
                            value={editingProduct.karat || 22}
                            onChange={(e) => setEditingProduct({ ...editingProduct, karat: parseInt(e.target.value, 10) })}
                            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                          >
                            <option value={24}>24K</option>
                            <option value={22}>22K</option>
                            <option value={21}>21K</option>
                            <option value={18}>18K</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block font-semibold text-[#64748B] mb-1">Category</label>
                        <select
                          value={editingProduct.category || 'necklaces'}
                          onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        >
                          <option value="necklaces">Necklaces</option>
                          <option value="bridal_sets">Bridal Sets</option>
                          <option value="bangles">Bangles &amp; Karas</option>
                          <option value="earrings">Earrings</option>
                          <option value="rings">Rings</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[#64748B] mb-1">Weight (Grams &gt; 0)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editingProduct.weightG || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, weightG: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#64748B] mb-1">Making Charge Type</label>
                        <select
                          value={editingProduct.makingType || 'perGram'}
                          onChange={(e) => setEditingProduct({ ...editingProduct, makingType: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        >
                          <option value="perGram">Per Gram</option>
                          <option value="fixed">Fixed Per Piece</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#64748B] mb-1">Making Amount (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          value={editingProduct.makingValue !== undefined ? editingProduct.makingValue : ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, makingValue: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[#64748B] mb-1">Stock (Integer &gt;= 0)</label>
                        <input
                          type="number"
                          min="0"
                          value={editingProduct.stock !== undefined ? editingProduct.stock : ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#64748B] mb-1">Status</label>
                        <select
                          value={editingProduct.status || 'active'}
                          onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.featured)}
                            onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                            className="rounded border-[#E2D8C9] text-[#C9A54B]"
                          />
                          <span className="font-semibold text-[#1E1B18]">Featured Item</span>
                        </label>
                      </div>
                    </div>

                    {/* Multi-Image Firebase Storage Upload Section */}
                    <div className="space-y-3 pt-2 border-t border-[#E2D8C9]">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block font-semibold text-[#1E1B18]">
                            Product Gallery Images ({editingProduct.images?.length || 0}/10)
                          </label>
                          <p className="text-[11px] text-[#64748B]">
                            Upload photos to Firebase Storage. First image is the Main Cover photo. Max 2MB per file.
                          </p>
                        </div>
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            accept="image/*"
                            onChange={handleImageFilesSelected}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage || (editingProduct.images?.length || 0) >= 10}
                            className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F3EFEA] border border-[#E2D8C9] text-[#8E6E24] font-semibold rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingImage ? 'Uploading to Storage...' : 'Upload Images'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Image Preview Strip */}
                      <div className="space-y-2">
                        {editingProduct.images && editingProduct.images.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {editingProduct.images.map((imgUrl, index) => (
                              <div
                                key={index}
                                className="relative group border border-[#E2D8C9] rounded-lg overflow-hidden bg-[#FAF7F2] p-1 space-y-1.5"
                              >
                                <div className="h-24 w-full rounded overflow-hidden relative">
                                  <img
                                    src={imgUrl}
                                    alt={`Product view ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {index === 0 && (
                                    <span className="absolute top-1 left-1 bg-[#1E1B18] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                      Main Cover
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between px-1">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => handleMoveImage(index, 'up')}
                                      className="p-1 text-[#64748B] hover:text-[#1E1B18] disabled:opacity-30 cursor-pointer"
                                      title="Move Left / Priority"
                                    >
                                      <ArrowUp className="w-3 h-3 -rotate-90" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === (editingProduct.images?.length || 0) - 1}
                                      onClick={() => handleMoveImage(index, 'down')}
                                      className="p-1 text-[#64748B] hover:text-[#1E1B18] disabled:opacity-30 cursor-pointer"
                                      title="Move Right"
                                    >
                                      <ArrowDown className="w-3 h-3 -rotate-90" />
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="p-1 text-[#64748B] hover:text-rose-600 cursor-pointer"
                                    title="Remove image"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 border border-dashed border-[#E2D8C9] rounded-lg text-center bg-[#FAF7F2]/50 text-[#64748B]">
                            <ImageIcon className="w-6 h-6 mx-auto text-[#CBD5E1] mb-1" />
                            <p>No photos uploaded yet. Click "Upload Images" to select images from your computer.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E2D8C9] flex justify-end gap-2">
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 border border-[#E2D8C9] rounded-md text-[#64748B] hover:text-[#1E1B18] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProduct}
                        disabled={productSaving}
                        className="px-5 py-2 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-semibold rounded-md shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {productSaving ? 'Saving...' : 'Save Product'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVENTORY */}
          {activeTab === 'inventory' && canAccessProducts && (
            <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#E2D8C9]">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Stock &amp; Availability Control</h2>
                  <p className="text-xs text-[#64748B]">Zero stock automatically triggers 'Ask on WhatsApp' on the storefront</p>
                </div>
                <input
                  type="text"
                  placeholder="Filter by SKU or Title..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-xs text-[#1E1B18] w-full sm:w-64"
                />
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF7F2] text-[#64748B] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">SKU</th>
                      <th className="py-2.5 px-4">Title</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-center">In-Stock Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFEA]">
                    {products
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(inventorySearch.toLowerCase())
                      )
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAF7F2]/40">
                          <td className="py-3 px-4 font-mono font-semibold text-[#1E1B18]">{p.sku}</td>
                          <td className="py-3 px-4 text-[#1E1B18]">{p.name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                p.stock > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {p.stock > 0 ? `${p.stock} Available` : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center border border-[#E2D8C9] rounded-md bg-white">
                              <button
                                onClick={async () => {
                                  const updated = Math.max(0, p.stock - 1);
                                  await updateProductStockOnly(p.id, updated);
                                  setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, stock: updated } : item)));
                                }}
                                className="px-2 py-1 text-slate-600 hover:text-[#1E1B18] font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-3 font-mono font-bold text-xs">{p.stock}</span>
                              <button
                                onClick={async () => {
                                  const updated = p.stock + 1;
                                  await updateProductStockOnly(p.id, updated);
                                  setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, stock: updated } : item)));
                                }}
                                className="px-2 py-1 text-slate-600 hover:text-[#1E1B18] font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ENQUIRIES */}
          {activeTab === 'enquiries' && canAccessEnquiries && (
            <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Customer WhatsApp Enquiries</h2>
                <p className="text-xs text-[#64748B]">Update status, follow up on quotes, and record fulfillment notes</p>
              </div>

              <div className="space-y-4">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="p-4 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl text-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2D8C9] pb-2.5">
                      <div>
                        <span className="font-bold text-[#1E1B18] text-sm">{enq.customerName || 'Inquiry Contact'}</span>
                        {enq.customerPhone && <span className="ml-2 font-mono text-[#64748B]">{enq.customerPhone}</span>}
                        <span className="ml-2 text-[#8E6E24] font-medium">({enq.fulfilment})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={enq.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as any;
                            await updateEnquiryStatus(enq.id, newStatus);
                            setEnquiries((prev) => prev.map((item) => (item.id === enq.id ? { ...item, status: newStatus } : item)));
                          }}
                          className="px-2.5 py-1 bg-white border border-[#E2D8C9] rounded font-semibold text-[#8E6E24]"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="awaiting_customer">Awaiting Customer</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <span className="font-mono font-bold text-sm text-[#1E1B18]">{formatPKR(enq.estimatedTotal)}</span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase">Inquired Pieces:</span>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                        {enq.items?.map((it, idx) => (
                          <li key={idx}>
                            <strong>{it.name}</strong> ({it.sku}) - Qty: {it.qty} · {it.weightG}g · Est: {formatPKR(it.estimate)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Notes textarea */}
                    <div>
                      <textarea
                        rows={1}
                        placeholder="Add internal staff notes for this order/inquiry..."
                        defaultValue={enq.notes || ''}
                        onBlur={async (e) => {
                          const val = e.target.value;
                          await updateEnquiryStatus(enq.id, enq.status, val);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2D8C9] rounded text-slate-700 outline-none"
                      />
                    </div>
                  </div>
                ))}
                {enquiries.length === 0 && (
                  <p className="py-8 text-center text-[#94A3B8] text-xs">No customer inquiries logged yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: RATE HISTORY */}
          {activeTab === 'rateHistory' && (
            <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Immutable Bullion Rate Audit Trail</h2>
                <p className="text-xs text-[#64748B]">Read-only historical changes written with security rule guarantees</p>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF7F2] text-[#64748B] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Date &amp; Time</th>
                      <th className="py-2.5 px-4">Metal</th>
                      <th className="py-2.5 px-4">New Rate</th>
                      <th className="py-2.5 px-4">Previous</th>
                      <th className="py-2.5 px-4">Changed By UID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFEA]">
                    {rateHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-[#FAF7F2]/40">
                        <td className="py-3 px-4 text-[#1E1B18] font-mono">
                          {new Date(h.changedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 capitalize font-semibold">{h.metal}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">{formatPKR(h.newValue)}</td>
                        <td className="py-3 px-4 font-mono text-[#64748B]">{formatPKR(h.oldValue)}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{h.changedBy}</td>
                      </tr>
                    ))}
                    {rateHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                          No historical rate changes logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: STORE CONFIGURATION (Settings) */}
          {activeTab === 'settings' && canAccessSettings && (
            <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Store Configuration &amp; Contact Details</h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Manage WhatsApp hotline, physical showroom address, operating hours, and dispatch policies.
                </p>
              </div>

              {settingsFeedback && (
                <div
                  className={`p-3.5 rounded-lg text-xs font-medium ${
                    settingsFeedback.startsWith('✓')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {settingsFeedback}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#64748B] mb-1">WhatsApp Order &amp; Hotline Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[#8E6E24]" />
                    <input
                      type="text"
                      value={inputWhatsApp}
                      placeholder="923109412332"
                      onChange={(e) => setInputWhatsApp(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                    />
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Format: International with country code, e.g. 923109412332</span>
                </div>

                <div>
                  <label className="block font-semibold text-[#64748B] mb-1">Showroom Address (Optional)</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-[#8E6E24]" />
                    <input
                      type="text"
                      value={inputAddress}
                      placeholder="e.g. Suite 4-B, Gold Souk, Lahore (Leave empty to show neutral 'Contact us on WhatsApp')"
                      onChange={(e) => setInputAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                    />
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">If left empty, storefront displays neutral "Contact us on WhatsApp".</span>
                </div>

                <div>
                  <label className="block font-semibold text-[#64748B] mb-1">Operating Hours Notice (Optional)</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-2.5 text-[#8E6E24]" />
                    <input
                      type="text"
                      value={inputHours}
                      placeholder="Monday to Saturday: 9:00 AM – 9:00 PM PKT | Sunday: Closed"
                      onChange={(e) => setInputHours(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#64748B] mb-1">Delivery / Transit Information</label>
                  <div className="relative">
                    <Truck className="w-4 h-4 absolute left-3 top-2.5 text-[#8E6E24]" />
                    <textarea
                      rows={2}
                      value={inputDelivery}
                      placeholder="Nationwide insured courier transit with tamper-evident security packing."
                      onChange={(e) => setInputDelivery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveStoreSettings}
                    disabled={savingSettings}
                    className="px-6 py-2.5 bg-[#C9A54B] hover:bg-[#B18D35] disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingSettings ? 'Saving Settings...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: STAFF ACCESS */}
          {activeTab === 'staff' && canAccessStaff && (
            <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Staff Authorization &amp; Role Management</h2>
                <p className="text-xs text-[#64748B]">Only owner can add, modify, or revoke staff access</p>
              </div>

              {/* Add New Staff Form */}
              <form onSubmit={handleAddStaff} className="p-4 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl flex flex-col sm:flex-row gap-3 items-end text-xs">
                <div className="flex-1 w-full">
                  <label className="block font-semibold text-[#64748B] mb-1">Google Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@gmail.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <label className="block font-semibold text-[#64748B] mb-1">Role Assignment</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 bg-white border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                  >
                    <option value="owner">Owner (Full Access)</option>
                    <option value="rate_manager">Rate Manager</option>
                    <option value="product_manager">Product Manager</option>
                    <option value="support">Support</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-semibold rounded-md shadow-xs cursor-pointer"
                >
                  Authorize Staff
                </button>
              </form>

              {/* Staff List Table */}
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF7F2] text-[#64748B] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Staff Email</th>
                      <th className="py-2.5 px-4">Assigned Role</th>
                      <th className="py-2.5 px-4">Added Date</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFEA]">
                    {staffList.map((s) => (
                      <tr key={s.email} className="hover:bg-[#FAF7F2]/40">
                        <td className="py-3 px-4 font-semibold text-[#1E1B18]">{s.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#F7F0DC] text-[#8E6E24] border border-[#C9A54B]/30">
                            {s.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">{s.addedAt ? new Date(s.addedAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-3 px-4 text-right">
                          {s.email !== 'bengamers494@gmail.com' ? (
                            <button
                              onClick={() => handleDeleteStaff(s.email)}
                              className="text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Primary Owner</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
