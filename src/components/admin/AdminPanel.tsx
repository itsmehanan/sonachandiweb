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
  AlertTriangle,
  LayoutGrid,
  Eye,
  EyeOff,
  ExternalLink,
  Mail,
  Globe,
} from 'lucide-react';
import { TolaGuide } from '../TolaGuide';
import {
  normalizeSocialUrl,
  normalizeWhatsAppNumber,
  isValidEmail,
  SocialHandles,
  SocialPlatform,
} from '../SocialLinks';
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
  fetchStoreSettingsAdmin,
  updateStoreSettingsInfo,
} from '../../lib/adminService';
import { uploadToCloudinary, ALLOWED_IMAGE_TYPES } from '../../lib/cloudinary';
import {
  BullionRates,
  get24KGoldPerGram,
  getGoldPerGramForKarat,
  getSilverPerGram,
  formatPKR,
} from '../../lib/pricing';
import {
  getRates,
  updateRates,
  getSettings,
  getShowcaseTiles,
  DEFAULT_SHOWCASE_TILES,
  ShowcaseTile,
  optimizeCloudinaryShowcase,
} from '../../data/store';

interface AdminPanelProps {
  onBackToStore: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToStore }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [staffRecord, setStaffRecord] = useState<StaffMember | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'rates' | 'products' | 'inventory' | 'enquiries' | 'rateHistory' | 'staff' | 'settings' | 'showcase'
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
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store Settings state
  const [settingsDoc, setSettingsDoc] = useState<StoreSettingsDoc | null>(null);
  const [inputWhatsApp, setInputWhatsApp] = useState('923109412332');
  const [inputPhone, setInputPhone] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputSocials, setInputSocials] = useState<SocialHandles>({
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    snapchat: '',
    x: '',
  });
  const [inputAddress, setInputAddress] = useState('');
  const [inputHours, setInputHours] = useState('');
  const [inputDelivery, setInputDelivery] = useState('');
  const [inputAboutStory, setInputAboutStory] = useState('');
  const [inputAboutImageUrl2, setInputAboutImageUrl2] = useState<string>(() => getSettings().aboutPageImageUrl2 || '');
  const [inputEstablishedYear, setInputEstablishedYear] = useState<string>(() => getSettings().establishedYear || '');
  const [uploadingAboutPhoto2, setUploadingAboutPhoto2] = useState(false);
  const [inputCraftsmanship, setInputCraftsmanship] = useState('');
  const [inputFamilyLineEn, setInputFamilyLineEn] = useState('Imtiyaz & Sons');
  const [inputFamilyLineUr, setInputFamilyLineUr] = useState('امتیاز اینڈ سنز');
  const [inputCloudinaryCloudName, setInputCloudinaryCloudName] = useState('');
  const [inputCloudinaryUploadPreset, setInputCloudinaryUploadPreset] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Homepage Showcase & About Media state
  const [showcaseTiles, setShowcaseTiles] = useState<ShowcaseTile[]>(() => getShowcaseTiles());
  const [aboutPageImageUrl, setAboutPageImageUrl] = useState<string>(() => getSettings().aboutPageImageUrl || '');
  const [savingShowcase, setSavingShowcase] = useState(false);
  const [showcaseFeedback, setShowcaseFeedback] = useState<string | null>(null);
  const [uploadingTileId, setUploadingTileId] = useState<string | null>(null);
  const [uploadingAboutPhoto, setUploadingAboutPhoto] = useState(false);
  const [showcaseError, setShowcaseError] = useState<string | null>(null);

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
    if (activeTab === 'settings' || activeTab === 'overview' || activeTab === 'rates' || activeTab === 'showcase') {
      loadStoreSettings();
    }
  }, [activeTab, currentUser, staffRecord]);

  const loadStoreSettings = async () => {
    try {
      const data = await fetchStoreSettingsAdmin();
      if (data) {
        setSettingsDoc(data);
        if (data.whatsappNumber) setInputWhatsApp(data.whatsappNumber);
        if (data.phone) setInputPhone(data.phone);
        if (data.contactEmail) setInputEmail(data.contactEmail);
        if (data.socialHandles) {
          setInputSocials({
            instagram: data.socialHandles.instagram || data.instagram || '',
            facebook: data.socialHandles.facebook || data.facebook || '',
            tiktok: data.socialHandles.tiktok || data.tiktok || '',
            youtube: data.socialHandles.youtube || data.youtube || '',
            snapchat: data.socialHandles.snapchat || data.snapchat || '',
            x: data.socialHandles.x || data.x || '',
          });
        } else {
          setInputSocials({
            instagram: data.instagram || '',
            facebook: data.facebook || '',
            tiktok: data.tiktok || '',
            youtube: data.youtube || '',
            snapchat: data.snapchat || '',
            x: data.x || '',
          });
        }
        if (data.address) setInputAddress(data.address);
        if (data.hoursText) setInputHours(data.hoursText);
        if (data.deliveryText) setInputDelivery(data.deliveryText);
        if (data.aboutPageStory) setInputAboutStory(data.aboutPageStory);
        if (data.aboutPageImageUrl2) setInputAboutImageUrl2(data.aboutPageImageUrl2);
        if (data.establishedYear) setInputEstablishedYear(data.establishedYear);
        if (data.craftsmanshipText) setInputCraftsmanship(data.craftsmanshipText);
        if (data.familyLineEn !== undefined) setInputFamilyLineEn(data.familyLineEn);
        if (data.familyLineUr !== undefined) setInputFamilyLineUr(data.familyLineUr);
        if (data.gold24kPerTola) setInputGold24k(data.gold24kPerTola);
        if (data.silverRate) setInputSilver(data.silverRate);
        if (data.silverUnit) setInputSilverUnit(data.silverUnit);
        if (data.cloudinaryCloudName) setInputCloudinaryCloudName(data.cloudinaryCloudName);
        if (data.cloudinaryUploadPreset) setInputCloudinaryUploadPreset(data.cloudinaryUploadPreset);
        if (Array.isArray(data.showcaseTiles) && data.showcaseTiles.length > 0) {
          setShowcaseTiles(data.showcaseTiles);
        }
        if (typeof data.aboutPageImageUrl === 'string') {
          setAboutPageImageUrl(data.aboutPageImageUrl);
        }
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
    if (isSigningIn) return;
    setIsSigningIn(true);
    setSignInError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      // Gracefully handle user cancellation/re-click without polluting console.error
      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/user-cancelled'
      ) {
        // User closed or cancelled the popup
      } else if (code === 'auth/popup-blocked') {
        setSignInError('Sign-in popup was blocked by your browser. Please allow popups for this site and retry.');
      } else {
        setSignInError(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
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
      // 1. WhatsApp Number validation & normalization
      const waResult = normalizeWhatsAppNumber(inputWhatsApp);
      if (inputWhatsApp.trim() && waResult.error) {
        setSettingsFeedback(`Error in WhatsApp number: ${waResult.error}`);
        setSavingSettings(false);
        return;
      }

      // 2. Email validation
      if (inputEmail.trim() && !isValidEmail(inputEmail)) {
        setSettingsFeedback('Error in contact email: Please enter a valid email address (e.g. info@sonachandi.pk).');
        setSavingSettings(false);
        return;
      }

      // 3. Social platforms validation & normalization
      const normalizedSocials: SocialHandles = {};
      const platformKeys: SocialPlatform[] = ['instagram', 'facebook', 'tiktok', 'youtube', 'snapchat', 'x'];
      for (const p of platformKeys) {
        const rawVal = inputSocials[p]?.trim() || '';
        if (rawVal) {
          const norm = normalizeSocialUrl(p, rawVal);
          if (norm.error) {
            setSettingsFeedback(`Error in ${p.toUpperCase()} URL: ${norm.error}`);
            setSavingSettings(false);
            return;
          }
          normalizedSocials[p] = norm.url;
        } else {
          normalizedSocials[p] = '';
        }
      }

      const cleanWa = waResult.normalized || inputWhatsApp.trim();

      await updateStoreSettingsInfo({
        whatsappNumber: cleanWa,
        phone: inputPhone.trim(),
        contactEmail: inputEmail.trim(),
        socialHandles: normalizedSocials,
        instagram: normalizedSocials.instagram,
        facebook: normalizedSocials.facebook,
        tiktok: normalizedSocials.tiktok,
        youtube: normalizedSocials.youtube,
        snapchat: normalizedSocials.snapchat,
        x: normalizedSocials.x,
        address: inputAddress.trim(),
        hoursText: inputHours.trim(),
        deliveryText: inputDelivery.trim(),
        aboutPageStory: inputAboutStory.trim(),
        aboutPageImageUrl2: inputAboutImageUrl2.trim(),
        establishedYear: inputEstablishedYear.trim(),
        craftsmanshipText: inputCraftsmanship.trim(),
        cloudinaryCloudName: inputCloudinaryCloudName.trim(),
        cloudinaryUploadPreset: inputCloudinaryUploadPreset.trim(),
        familyLineEn: inputFamilyLineEn.trim(),
        familyLineUr: inputFamilyLineUr.trim(),
      });

      // Update input fields to show normalized values immediately
      setInputWhatsApp(cleanWa);
      setInputSocials(normalizedSocials);

      setSettingsFeedback('✓ Store settings, contact details & social channels updated successfully!');
      setTimeout(() => setSettingsFeedback(null), 4000);
    } catch (err: any) {
      setSettingsFeedback(`Error saving settings: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // Helper for Cloudinary Config
  const getCloudinaryConfig = () => ({
    cloudName:
      settingsDoc?.cloudinaryCloudName?.trim() ||
      inputCloudinaryCloudName?.trim() ||
      (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME ||
      '',
    uploadPreset:
      settingsDoc?.cloudinaryUploadPreset?.trim() ||
      inputCloudinaryUploadPreset?.trim() ||
      (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET ||
      '',
  });

  // Showcase Handlers
  const handleTileFieldChange = (id: string, updates: Partial<ShowcaseTile>) => {
    setShowcaseTiles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleMoveTile = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= showcaseTiles.length) return;
    const reordered = [...showcaseTiles];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    // Re-assign order numbers 1..N
    const normalized = reordered.map((tile, i) => ({ ...tile, order: i + 1 }));
    setShowcaseTiles(normalized);
  };

  const handleUploadTileImage = async (tileId: string, file: File) => {
    setShowcaseError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setShowcaseError(`Invalid file format for "${file.name}". Only JPEG, PNG, and WebP images are allowed.`);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setShowcaseError(`"${file.name}" is over 2 MB. Please select an image under 2 MB.`);
      return;
    }

    setUploadingTileId(tileId);
    try {
      const config = getCloudinaryConfig();
      const secureUrl = await uploadToCloudinary(file, config);
      handleTileFieldChange(tileId, { imageUrl: secureUrl });
      setShowcaseFeedback('✓ Tile image uploaded successfully!');
      setTimeout(() => setShowcaseFeedback(null), 3000);
    } catch (err: any) {
      setShowcaseError(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingTileId(null);
    }
  };

  const handleRemoveTileImage = (tileId: string) => {
    handleTileFieldChange(tileId, { imageUrl: '' });
  };

  const handleUploadAboutPhoto = async (file: File) => {
    setShowcaseError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setShowcaseError(`Invalid file format for "${file.name}". Only JPEG, PNG, and WebP images are allowed.`);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setShowcaseError(`"${file.name}" is over 2 MB. Please select an image under 2 MB.`);
      return;
    }

    setUploadingAboutPhoto(true);
    try {
      const config = getCloudinaryConfig();
      const secureUrl = await uploadToCloudinary(file, config);
      setAboutPageImageUrl(secureUrl);
      setShowcaseFeedback('✓ About page photo uploaded successfully!');
      setTimeout(() => setShowcaseFeedback(null), 3000);
    } catch (err: any) {
      setShowcaseError(`About photo upload failed: ${err.message}`);
    } finally {
      setUploadingAboutPhoto(false);
    }
  };

  const handleRemoveAboutPhoto = () => {
    setAboutPageImageUrl('');
  };

  const handleUploadAboutPhoto2 = async (file: File) => {
    setSettingsFeedback(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSettingsFeedback(`Invalid file format for "${file.name}". Only JPEG, PNG, and WebP images are allowed.`);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSettingsFeedback(`"${file.name}" is over 2 MB. Please select an image under 2 MB.`);
      return;
    }

    setUploadingAboutPhoto2(true);
    try {
      const config = getCloudinaryConfig();
      const secureUrl = await uploadToCloudinary(file, config);
      setInputAboutImageUrl2(secureUrl);
      setSettingsFeedback('✓ Second About photo uploaded successfully! Click "Save Store Settings" to publish.');
      setTimeout(() => setSettingsFeedback(null), 4000);
    } catch (err: any) {
      setSettingsFeedback(`About photo upload failed: ${err.message}`);
    } finally {
      setUploadingAboutPhoto2(false);
    }
  };

  const handleRemoveAboutPhoto2 = () => {
    setInputAboutImageUrl2('');
  };

  const handleSaveShowcase = async () => {
    setSavingShowcase(true);
    setShowcaseFeedback(null);
    setShowcaseError(null);
    try {
      await updateStoreSettingsInfo({
        showcaseTiles,
        aboutPageImageUrl,
      });
      setShowcaseFeedback('✓ Homepage Showcase & About photo saved successfully!');
      setTimeout(() => setShowcaseFeedback(null), 4000);
    } catch (err: any) {
      setShowcaseError(`Error saving showcase: ${err.message}`);
    } finally {
      setSavingShowcase(false);
    }
  };

  const handleResetShowcaseDefaults = () => {
    if (window.confirm('Reset showcase tiles to initial 6 defaults? Any custom titles and image assignments will be cleared.')) {
      setShowcaseTiles(DEFAULT_SHOWCASE_TILES);
      setAboutPageImageUrl('');
      setShowcaseFeedback('Reset to default tiles. Click "Save Showcase Changes" to publish.');
    }
  };

  // Multi-File Image Upload via Cloudinary Unsigned Upload
  const handleImageFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;

    setProductFormError(null);
    setUploadProgressText(null);

    const existingImages = [...(editingProduct.images || [])];
    if (existingImages.length >= 6) {
      setProductFormError('Maximum 6 images allowed per product piece. Please remove an image first.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (existingImages.length + files.length > 6) {
      setProductFormError(
        `You can add at most ${6 - existingImages.length} more image(s) (maximum 6 images per product piece).`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate MIME types strictly: JPEG, PNG, WEBP only
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setProductFormError(
          `Invalid file format for "${file.name}". Only JPEG, PNG, and WebP images are permitted.`
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    // Resolve Cloudinary configuration
    const cloudName =
      inputCloudinaryCloudName.trim() ||
      settingsDoc?.cloudinaryCloudName?.trim() ||
      (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME ||
      '';
    const uploadPreset =
      inputCloudinaryUploadPreset.trim() ||
      settingsDoc?.cloudinaryUploadPreset?.trim() ||
      (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET ||
      '';

    if (!cloudName || !uploadPreset) {
      setProductFormError(
        'Cloudinary configuration required. Please enter your Cloudinary Cloud Name and Upload Preset in the Store Configuration tab (or set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET).'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingImage(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(
          `Uploading ${i + 1} of ${files.length}: "${file.name}" (resizing to ≤1600px & uploading)...`
        );

        const secureUrl = await uploadToCloudinary(file, {
          cloudName,
          uploadPreset,
        });

        if (!secureUrl) {
          throw new Error(`Cloudinary did not return a secure URL for ${file.name}`);
        }
        newUrls.push(secureUrl);
      }

      setEditingProduct({
        ...editingProduct,
        images: [...existingImages, ...newUrls].slice(0, 6),
      });
      setUploadProgressText(null);
    } catch (err: any) {
      // Show clear red error message and do NOT silently save
      setProductFormError(`Image upload failed: ${err.message || 'Unknown network error'}`);
    } finally {
      setUploadingImage(false);
      setUploadProgressText(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (!editingProduct || !editingProduct.images) return;
    const updated = editingProduct.images.filter((_, idx) => idx !== indexToRemove);
    setEditingProduct({ ...editingProduct, images: updated });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right' | 'up' | 'down') => {
    if (!editingProduct || !editingProduct.images) return;
    const list = [...editingProduct.images];
    const targetIndex = direction === 'left' || direction === 'up' ? index - 1 : index + 1;
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

    if (uploadingImage) {
      setProductFormError('Please wait for image uploads to complete before saving.');
      return;
    }

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
            src="/assets/aistudio/logo-light.png"
            alt="Sona Chandi Gold Collection"
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
            disabled={isSigningIn}
            className="gold-sheen w-full py-3.5 px-4 bg-[#C9A54B] hover:bg-[#B18D35] disabled:opacity-60 text-white font-medium text-sm rounded-lg transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
          >
            {isSigningIn ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </>
            )}
          </button>

          {signInError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{signInError}</span>
            </div>
          )}

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
                src="/assets/aistudio/logo-light.png"
                alt="Sona Chandi"
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
            <>
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

              <button
                onClick={() => setActiveTab('showcase')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'showcase'
                    ? 'bg-[#1E1B18] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Homepage Showcase</span>
              </button>
            </>
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
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      24K Gold Rate (PKR / Tola)
                    </label>
                    <TolaGuide triggerVariant="badge" label="What is a tola?" tone="light" />
                  </div>
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
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                    <span>1 tola = 11.6638 grams</span>
                    <TolaGuide triggerVariant="icon" tone="gold" />
                  </div>
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
                        className={`px-2 py-0.5 rounded cursor-pointer inline-flex items-center gap-1 ${
                          inputSilverUnit === 'tola'
                            ? 'bg-[#1E1B18] text-white font-semibold'
                            : 'bg-slate-100 text-[#64748B]'
                        }`}
                      >
                        <span>Per Tola</span>
                        <TolaGuide triggerVariant="icon" tone={inputSilverUnit === 'tola' ? 'dark' : 'light'} iconSize={12} />
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
                      <div className="p-3.5 bg-red-50 text-red-800 border-2 border-red-300 rounded-xl flex items-start gap-2.5 font-medium shadow-xs">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold block text-red-900">Upload / Action Error</span>
                          <span>{productFormError}</span>
                        </div>
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

                    {/* Multi-Image Cloudinary Unsigned Upload Section */}
                    <div className="space-y-3 pt-2 border-t border-[#E2D8C9]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block font-semibold text-[#1E1B18]">
                            Product Gallery Images ({editingProduct.images?.length || 0}/6)
                          </label>
                          <p className="text-[11px] text-[#64748B]">
                            Choose up to 6 images (JPEG, PNG, WebP). Resized to max 1600px. First image is the Main Cover.
                          </p>
                        </div>
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageFilesSelected}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage || (editingProduct.images?.length || 0) >= 6}
                            className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F3EFEA] border border-[#E2D8C9] text-[#8E6E24] font-semibold rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {uploadingImage
                                ? 'Uploading to Cloudinary...'
                                : (editingProduct.images?.length || 0) >= 6
                                ? 'Max 6 Images Reached'
                                : 'Upload Images'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Progress state */}
                      {uploadingImage && (
                        <div className="p-3 bg-amber-50/90 border border-[#C9A54B]/40 rounded-lg flex items-center gap-2.5 text-[#8E6E24]">
                          <RefreshCw className="w-4 h-4 animate-spin text-[#C9A54B] shrink-0" />
                          <span className="font-medium text-xs">
                            {uploadProgressText || 'Uploading image to Cloudinary (resizing to max 1600px)...'}
                          </span>
                        </div>
                      )}

                      {/* Warning if piece has no images */}
                      {(!editingProduct.images || editingProduct.images.length === 0) && (
                        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 flex items-start gap-2 text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block">Warning: No product images uploaded</span>
                            <span>This product piece currently has no photos. Storefront customers will see a neutral brand placeholder until images are added.</span>
                          </div>
                        </div>
                      )}

                      {/* Image Preview Strip */}
                      <div className="space-y-2">
                        {editingProduct.images && editingProduct.images.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {editingProduct.images.map((imgUrl, index) => (
                              <div
                                key={index}
                                className={`relative group border rounded-lg overflow-hidden bg-[#FAF7F2] p-1 space-y-1.5 ${
                                  index === 0 ? 'border-[#C9A54B] shadow-xs ring-1 ring-[#C9A54B]' : 'border-[#E2D8C9]'
                                }`}
                              >
                                <div className="h-24 w-full rounded overflow-hidden relative">
                                  <img
                                    src={imgUrl}
                                    alt={`Product view ${index + 1}`}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                  />
                                  {index === 0 ? (
                                    <span className="absolute top-1 left-1 bg-[#8E6E24] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shadow-xs">
                                      Main Cover
                                    </span>
                                  ) : (
                                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                                      #{index + 1}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between px-1">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => handleMoveImage(index, 'left')}
                                      className="p-1 text-[#64748B] hover:text-[#1E1B18] disabled:opacity-30 cursor-pointer"
                                      title="Move Left / Make Main"
                                    >
                                      <ArrowUp className="w-3 h-3 -rotate-90" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === (editingProduct.images?.length || 0) - 1}
                                      onClick={() => handleMoveImage(index, 'right')}
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
                            <p>No photos uploaded yet. Click "Upload Images" to select images (JPEG, PNG, WebP) from your computer.</p>
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
                {/* Contact and Social Card (Owner only) */}
                {staffRecord?.role === 'owner' && (
                  <div className="p-5 sm:p-6 bg-[#FAF7F2] border border-[#B8923A]/40 rounded-2xl space-y-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2D8C9] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#7A5A12]" />
                          <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                            Contact and Social Channels
                          </h3>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Configure official store contact lines and social media handles. Handles accept usernames or URLs and are normalised automatically.
                        </p>
                      </div>
                      <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F3EAD7] text-[#7A5A12] border border-[#B8923A]/30">
                        Owner Only
                      </span>
                    </div>

                    {/* WhatsApp Hotline with live preview and Test link button */}
                    {(() => {
                      const waNorm = normalizeWhatsAppNumber(inputWhatsApp);
                      return (
                        <div className="space-y-1.5 p-3.5 bg-white border border-[#E2D8C9] rounded-xl">
                          <div className="flex justify-between items-center">
                            <label className="font-semibold text-[#1E1B18] flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                              <span>WhatsApp Hotline Number</span>
                            </label>
                            {waNorm.waUrl && !waNorm.error && (
                              <a
                                href={waNorm.waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#25D366] hover:text-[#1EBE5A] hover:underline"
                              >
                                <span>Test link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={inputWhatsApp}
                              placeholder="e.g. 0310 9412332 or 923109412332"
                              onChange={(e) => setInputWhatsApp(e.target.value)}
                              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] font-mono text-xs focus:border-[#C9A54B] outline-none"
                            />
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                            <span className="text-[#64748B]">
                              Digits only with country code (converts 03xx to 923xx automatically).
                            </span>
                            {inputWhatsApp.trim() && (
                              <span className={`font-mono ${waNorm.error ? 'text-rose-600 font-semibold' : 'text-[#25D366] font-medium'}`}>
                                {waNorm.error ? `⚠ ${waNorm.error}` : `Live preview: wa.me/${waNorm.normalized}`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Phone & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3.5 bg-white border border-[#E2D8C9] rounded-xl space-y-1.5">
                        <label className="font-semibold text-[#1E1B18] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#7A5A12]" />
                          <span>Showroom Phone Number (Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={inputPhone}
                          placeholder="e.g. +92 51 1234567 or 0310 9412332"
                          onChange={(e) => setInputPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] text-xs focus:border-[#C9A54B] outline-none"
                        />
                        <span className="text-[10px] text-[#64748B] block">Direct landline or sales mobile.</span>
                      </div>

                      <div className="p-3.5 bg-white border border-[#E2D8C9] rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="font-semibold text-[#1E1B18] flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#7A5A12]" />
                            <span>Contact Email Address (Optional)</span>
                          </label>
                          {inputEmail.trim() && isValidEmail(inputEmail) && (
                            <a
                              href={`mailto:${inputEmail.trim()}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A5A12] hover:underline"
                            >
                              <span>Test mailto</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <input
                          type="email"
                          value={inputEmail}
                          placeholder="e.g. contact@sonachandi.pk"
                          onChange={(e) => setInputEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] text-xs focus:border-[#C9A54B] outline-none"
                        />
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#64748B]">Shown as "Email us" mailto link in footer &amp; contact page.</span>
                          {inputEmail.trim() && !isValidEmail(inputEmail) && (
                            <span className="text-rose-600 font-semibold">Invalid email format</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Social Handles Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#7A5A12]">
                          Social Media Profiles (Round brand icons on storefront)
                        </span>
                        <span className="text-[10px] text-[#64748B]">Empty handles are hidden cleanly</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(
                          [
                            { id: 'instagram' as SocialPlatform, label: 'Instagram', placeholder: '@sonachandi or URL', domain: 'instagram.com' },
                            { id: 'facebook' as SocialPlatform, label: 'Facebook', placeholder: 'page name or URL', domain: 'facebook.com' },
                            { id: 'tiktok' as SocialPlatform, label: 'TikTok', placeholder: '@sonachandi or URL', domain: 'tiktok.com' },
                            { id: 'youtube' as SocialPlatform, label: 'YouTube', placeholder: '@channel or URL', domain: 'youtube.com' },
                            { id: 'snapchat' as SocialPlatform, label: 'Snapchat', placeholder: 'username or URL', domain: 'snapchat.com' },
                            { id: 'x' as SocialPlatform, label: 'X (Twitter)', placeholder: '@handle or URL', domain: 'x.com / twitter.com' },
                          ] as const
                        ).map((item) => {
                          const rawVal = inputSocials[item.id] || '';
                          const norm = normalizeSocialUrl(item.id, rawVal);
                          return (
                            <div key={item.id} className="p-3 bg-white border border-[#E2D8C9] rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="font-semibold text-[#1E1B18]">{item.label}</label>
                                {norm.url && (
                                  <a
                                    href={norm.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-[#7A5A12] hover:underline inline-flex items-center gap-0.5"
                                  >
                                    <span>Preview</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                              <input
                                type="text"
                                value={rawVal}
                                placeholder={item.placeholder}
                                onChange={(e) =>
                                  setInputSocials((prev) => ({ ...prev, [item.id]: e.target.value }))
                                }
                                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-xs text-[#1E1B18] outline-none focus:border-[#C9A54B]"
                              />
                              <div className="text-[10px] truncate">
                                {norm.error ? (
                                  <span className="text-rose-600 font-semibold">{norm.error}</span>
                                ) : norm.url ? (
                                  <span className="text-emerald-700 font-mono truncate block" title={norm.url}>
                                    → {norm.url}
                                  </span>
                                ) : (
                                  <span className="text-[#64748B]">Domain: {item.domain}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-[#64748B] mb-1">Showroom Address (Optional)</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-[#8E6E24]" />
                    <input
                      type="text"
                      value={inputAddress}
                      placeholder="e.g. Shop 12, Main Commercial Market (Leave empty to show neutral 'Contact us on WhatsApp')"
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

                {/* About Page Configuration Card (Owner only) */}
                {staffRecord?.role === 'owner' && (
                  <div className="p-5 sm:p-6 bg-[#FAF7F2] border border-[#B8923A]/40 rounded-2xl space-y-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2D8C9] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#7A5A12]" />
                          <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                            About Page &amp; Story Configuration
                          </h3>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Configure the brand story text, optional established year badge, and secondary story portrait.
                        </p>
                      </div>
                      <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F3EAD7] text-[#7A5A12] border border-[#B8923A]/30">
                        Owner Only
                      </span>
                    </div>

                    {/* Established Year */}
                    <div className="space-y-1.5 p-3.5 bg-white border border-[#E2D8C9] rounded-xl">
                      <label className="font-semibold text-[#1E1B18] flex items-center justify-between">
                        <span>Established Year (Optional)</span>
                        {inputEstablishedYear.trim() && (
                          <span className="text-[11px] font-mono text-[#7A5A12]">
                            Badge preview: Est. {inputEstablishedYear.trim().replace(/^est\.?\s*/i, '')}
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={inputEstablishedYear}
                        placeholder="e.g. 1988 (Leave blank to hide Established badge)"
                        onChange={(e) => setInputEstablishedYear(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] text-xs focus:border-[#C9A54B] outline-none"
                      />
                      <span className="text-[10px] text-[#64748B] block">
                        When filled, an "Est. [Year]" badge appears in the About page hero banner. If blank, the badge is hidden.
                      </span>
                    </div>

                    {/* About Page Story Description */}
                    <div className="space-y-1.5 p-3.5 bg-white border border-[#E2D8C9] rounded-xl">
                      <label className="font-semibold text-[#1E1B18] block">
                        About Page Story Text (settings.aboutPageStory)
                      </label>
                      <textarea
                        rows={4}
                        value={inputAboutStory}
                        placeholder="Enter your custom brand story and philosophy. When left blank, this section is hidden on the About page."
                        onChange={(e) => setInputAboutStory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18] text-xs focus:border-[#C9A54B] outline-none leading-relaxed"
                      />
                      <span className="text-[10px] text-[#64748B] block">
                        Empty by default. If left blank, the story section on the About page is automatically hidden.
                      </span>
                    </div>

                    {/* Second Story Image (aboutPageImageUrl2) with Cloudinary Upload */}
                    <div className="space-y-2.5 p-3.5 bg-white border border-[#E2D8C9] rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-[#1E1B18]">
                          Second Story Image (Optional - aboutPageImageUrl2)
                        </label>
                        {inputAboutImageUrl2 && (
                          <button
                            type="button"
                            onClick={handleRemoveAboutPhoto2}
                            className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                          >
                            Remove second photo
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {/* Preview */}
                        <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border border-[#E2D8C9] bg-[#FAF7F2] shrink-0 relative flex items-center justify-center shadow-2xs">
                          {inputAboutImageUrl2 ? (
                            <img
                              src={inputAboutImageUrl2}
                              alt="Second Story Portrait"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="text-center p-2 text-[#8E6E24]">
                              <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                              <span className="text-[9px] block">No second photo</span>
                            </div>
                          )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 space-y-2 w-full">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EAD7] border border-[#B8923A]/40 text-[#7A5A12] font-semibold text-xs transition-colors cursor-pointer shadow-2xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{uploadingAboutPhoto2 ? 'Uploading...' : inputAboutImageUrl2 ? 'Replace Photo' : 'Upload Second Photo'}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={uploadingAboutPhoto2}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadAboutPhoto2(f);
                                }}
                              />
                            </label>
                          </div>

                          <div className="relative">
                            <input
                              type="text"
                              value={inputAboutImageUrl2}
                              placeholder="Or paste direct image URL (https://...)"
                              onChange={(e) => setInputAboutImageUrl2(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-xs text-[#1E1B18] outline-none focus:border-[#C9A54B]"
                            />
                          </div>

                          <span className="text-[10px] text-[#64748B] block">
                            Paired on the About page alongside the primary image with an arch frame and scroll reveal.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-[#64748B] mb-1">Craftsmanship &amp; Workshop Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={inputCraftsmanship}
                    placeholder="Enter details on craftsmanship, finishing, or jewellery techniques. When left blank, this section is hidden on product pages."
                    onChange={(e) => setInputCraftsmanship(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                  />
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">
                    Empty by default. If left blank, craftsmanship claims are hidden across product details.
                  </span>
                </div>

                {/* Family / Owner Line Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl">
                  <div className="sm:col-span-2">
                    <h4 className="font-serif text-sm font-semibold text-[#1E1B18]">Family / Lineage Subtitle</h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Displayed directly beneath the brand name in the header, intro screen, footer, and About page. Leave both blank to hide this line.
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#64748B] mb-1">Family / owner line (English)</label>
                    <input
                      type="text"
                      value={inputFamilyLineEn}
                      placeholder="Imtiyaz & Sons"
                      onChange={(e) => setInputFamilyLineEn(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                    />
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">Default: Imtiyaz &amp; Sons</span>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#64748B] mb-1">Family / owner line (Urdu)</label>
                    <input
                      type="text"
                      dir="rtl"
                      lang="ur"
                      value={inputFamilyLineUr}
                      placeholder="امتیاز اینڈ سنز"
                      onChange={(e) => setInputFamilyLineUr(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2D8C9] rounded-md text-[#1E1B18] text-right"
                    />
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">Default: امتیاز اینڈ سنز</span>
                  </div>
                </div>

                {/* Cloudinary Integration Settings */}
                <div className="p-4 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl space-y-3">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-[#1E1B18]">Cloudinary Unsigned Upload Configuration</h4>
                    <p className="text-[11px] text-[#64748B]">
                      Used for client-side direct uploads of catalogue photos (auto-resized to max 1600px).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#64748B] mb-1">Cloudinary Cloud Name</label>
                      <div className="relative">
                        <ImageIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#8E6E24]" />
                        <input
                          type="text"
                          value={inputCloudinaryCloudName}
                          placeholder="e.g. dxyz12345"
                          onChange={(e) => setInputCloudinaryCloudName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        />
                      </div>
                      <span className="text-[10px] text-[#64748B] mt-0.5 block">Also checks VITE_CLOUDINARY_CLOUD_NAME</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#64748B] mb-1">Upload Preset (Unsigned)</label>
                      <div className="relative">
                        <Upload className="w-4 h-4 absolute left-3 top-2.5 text-[#8E6E24]" />
                        <input
                          type="text"
                          value={inputCloudinaryUploadPreset}
                          placeholder="e.g. sonachandi_preset"
                          onChange={(e) => setInputCloudinaryUploadPreset(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2D8C9] rounded-md text-[#1E1B18]"
                        />
                      </div>
                      <span className="text-[10px] text-[#64748B] mt-0.5 block">Also checks VITE_CLOUDINARY_UPLOAD_PRESET</span>
                    </div>
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

          {/* TAB 8: HOMEPAGE SHOWCASE */}
          {activeTab === 'showcase' && canAccessSettings && (
            <div className="bg-white border border-[#E2D8C9] rounded-2xl p-6 sm:p-8 space-y-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2D8C9] pb-5">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1E1B18]">Homepage Showcase &amp; Collections</h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Manage the 6 curated collection tiles on the home page and the feature photo on the About page.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetShowcaseDefaults}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset to Defaults</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveShowcase}
                    disabled={savingShowcase || uploadingTileId !== null || uploadingAboutPhoto}
                    className="px-5 py-2 bg-[#C9A54B] hover:bg-[#B18D35] disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    {savingShowcase ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Showcase</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {showcaseFeedback && (
                <div className="p-3.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{showcaseFeedback}</span>
                </div>
              )}

              {showcaseError && (
                <div className="p-3.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{showcaseError}</span>
                </div>
              )}

              {/* SECTION 1: 6 CURATED SHOWCASE TILES */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1E1B18]">Curated Collections Showcase</h3>
                    <p className="text-xs text-[#64748B]">
                      6 featured tiles rendered on the storefront home page. Image priority: custom image &rarr; newest active product photo in category &rarr; branded placeholder.
                    </p>
                  </div>
                  <span className="text-[11px] text-[#8E6E24] font-medium bg-[#FAF7F2] px-2.5 py-1 rounded-md border border-[#E2D8C9]">
                    {showcaseTiles.filter((t) => t.visible !== false).length} of {showcaseTiles.length} Visible
                  </span>
                </div>

                <div className="space-y-4">
                  {showcaseTiles.map((tile, index) => {
                    const isUploadingThis = uploadingTileId === tile.id;
                    const previewUrl = tile.imageUrl ? optimizeCloudinaryShowcase(tile.imageUrl) : '';

                    return (
                      <div
                        key={tile.id}
                        className={`border rounded-xl p-4 sm:p-5 transition-all ${
                          tile.visible !== false
                            ? 'bg-[#FAF7F2]/60 border-[#E2D8C9]'
                            : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row gap-5 items-start">
                          {/* Live Thumbnail Preview */}
                          <div className="shrink-0 w-28 sm:w-32">
                            <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-[#E2D8C9] bg-gradient-to-br from-[#FAF7F2] via-[#F3EBE1] to-[#E5D7BE] flex flex-col items-center justify-center shadow-xs">
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt={tile.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="p-2 text-center flex flex-col items-center justify-center">
                                  <Sparkles className="w-5 h-5 text-[#C9A54B] mb-1.5" />
                                  <span className="font-serif text-[11px] font-bold text-[#1E1B18] leading-tight line-clamp-2">
                                    {tile.title}
                                  </span>
                                  <span className="text-[9px] text-[#8E6E24] mt-1 font-sans">
                                    Auto fallback
                                  </span>
                                </div>
                              )}

                              {/* Order & Visibility Badge */}
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                                #{tile.order || index + 1}
                              </div>

                              {tile.visible === false && (
                                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white text-slate-800 shadow-xs">
                                    Hidden
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-center text-[#64748B] block mt-1">
                              Preview (4:5)
                            </span>
                          </div>

                          {/* Editable Fields */}
                          <div className="flex-1 w-full space-y-3 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-[#1E1B18] mb-1">
                                  Tile Heading
                                </label>
                                <input
                                  type="text"
                                  value={tile.title}
                                  onChange={(e) => handleTileFieldChange(tile.id, { title: e.target.value })}
                                  placeholder="e.g. Bridal Sets"
                                  className="w-full px-3 py-2 bg-white border border-[#E2D8C9] rounded-lg text-[#1E1B18] font-serif font-semibold focus:outline-[#C9A54B]"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-[#1E1B18] mb-1">
                                  Subtitle / Tagline
                                </label>
                                <input
                                  type="text"
                                  value={tile.subtitle}
                                  onChange={(e) => handleTileFieldChange(tile.id, { subtitle: e.target.value })}
                                  placeholder="e.g. Explore the collection"
                                  className="w-full px-3 py-2 bg-white border border-[#E2D8C9] rounded-lg text-[#1E1B18] focus:outline-[#C9A54B]"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-[#1E1B18] mb-1">
                                  Storefront Link Target
                                </label>
                                <select
                                  value={tile.target}
                                  onChange={(e) =>
                                    handleTileFieldChange(tile.id, {
                                      target: e.target.value as ShowcaseTile['target'],
                                    })
                                  }
                                  className="w-full px-3 py-2 bg-white border border-[#E2D8C9] rounded-lg text-[#1E1B18] focus:outline-[#C9A54B]"
                                >
                                  <option value="bridal_sets">Bridal Sets (Category)</option>
                                  <option value="bangles">Bangles &amp; Karas (Category)</option>
                                  <option value="earrings">Jhumkas &amp; Balis (Category)</option>
                                  <option value="necklaces">Necklaces (Category)</option>
                                  <option value="rings">Gold Rings (Category)</option>
                                  <option value="silver">Silver Collection (Metal)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-semibold text-[#1E1B18] mb-1">
                                  Custom Photograph
                                </label>
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    type="file"
                                    id={`tile-upload-${tile.id}`}
                                    className="hidden"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleUploadTileImage(tile.id, file);
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`tile-upload-${tile.id}`)?.click()}
                                    disabled={isUploadingThis}
                                    className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F3EFEA] border border-[#E2D8C9] hover:border-[#C9A54B] rounded-md font-semibold text-[#1E1B18] transition-colors cursor-pointer flex items-center gap-1.5"
                                  >
                                    {isUploadingThis ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C9A54B]" />
                                        <span>Uploading...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-3.5 h-3.5 text-[#8E6E24]" />
                                        <span>{tile.imageUrl ? 'Replace Image' : 'Upload Image'}</span>
                                      </>
                                    )}
                                  </button>

                                  {tile.imageUrl && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTileImage(tile.id)}
                                      className="px-2.5 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                      title="Remove image and use category fallback"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Remove</span>
                                    </button>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#64748B] mt-1 block">
                                  Best: portrait photo, 4:5, under 2 MB
                                </span>
                              </div>
                            </div>

                            {/* Visibility & Reorder Controls */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#E2D8C9]/60">
                              <button
                                type="button"
                                onClick={() =>
                                  handleTileFieldChange(tile.id, {
                                    visible: tile.visible === false ? true : false,
                                  })
                                }
                                className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                  tile.visible !== false
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                              >
                                {tile.visible !== false ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Visible on Storefront</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Hidden from Storefront</span>
                                  </>
                                )}
                              </button>

                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-[#64748B] mr-2">Reorder:</span>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTile(index, -1)}
                                  disabled={index === 0}
                                  className="p-1.5 border border-[#E2D8C9] rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5 text-[#1E1B18]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTile(index, 1)}
                                  disabled={index === showcaseTiles.length - 1}
                                  className="p-1.5 border border-[#E2D8C9] rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5 text-[#1E1B18]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: ABOUT PAGE FEATURE PHOTO */}
              <div className="pt-6 border-t border-[#E2D8C9] space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1E1B18]">About Page Feature Portrait</h3>
                  <p className="text-xs text-[#64748B]">
                    The primary portrait photo displayed on the "About Sona Chandi" brand story page.
                  </p>
                </div>

                <div className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="shrink-0 w-32 sm:w-36">
                      <div className="aspect-[4/5] rounded-lg overflow-hidden border border-[#E2D8C9] bg-[#EAE2D5] shadow-xs relative">
                        {aboutPageImageUrl ? (
                          <img
                            src={aboutPageImageUrl}
                            alt="About Page Portrait"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#FAF7F2] to-[#EFE7D8] flex flex-col items-center justify-center p-3 text-center">
                            <Sparkles className="w-6 h-6 text-[#C9A54B]/60 mb-1" />
                            <span className="text-[10px] text-[#8E6E24] font-serif">Neutral Placeholder</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-center text-[#64748B] block mt-1">
                        {aboutPageImageUrl ? 'Custom Uploaded' : 'Neutral Placeholder'}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 text-xs">
                      <div>
                        <h4 className="font-serif text-sm font-semibold text-[#1E1B18]">Brand Heritage Photograph</h4>
                        <p className="text-[#64748B] text-[11px] mt-0.5 leading-relaxed">
                          This photo introduces your workshop or showroom to clients reading the About Sona Chandi story.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <input
                          type="file"
                          id="about-photo-file-input"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadAboutPhoto(file);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('about-photo-file-input')?.click()}
                          disabled={uploadingAboutPhoto}
                          className="px-4 py-2 bg-white hover:bg-[#FAF7F2] border border-[#E2D8C9] hover:border-[#C9A54B] rounded-lg font-semibold text-[#1E1B18] transition-colors cursor-pointer flex items-center gap-2"
                        >
                          {uploadingAboutPhoto ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C9A54B]" />
                              <span>Uploading Portrait...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-[#8E6E24]" />
                              <span>{aboutPageImageUrl ? 'Replace About Photo' : 'Upload About Photo'}</span>
                            </>
                          )}
                        </button>

                        {aboutPageImageUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveAboutPhoto}
                            className="px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Custom Photo</span>
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-[#64748B] block">
                        Best: portrait photo, 4:5, under 2 MB
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM SAVE BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2D8C9]">
                <p className="text-xs text-[#64748B]">
                  Changes will be saved directly to the store settings document and appear live across the storefront.
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetShowcaseDefaults}
                    className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveShowcase}
                    disabled={savingShowcase || uploadingTileId !== null || uploadingAboutPhoto}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#C9A54B] hover:bg-[#B18D35] disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
                  >
                    {savingShowcase ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Showcase Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: STAFF ACCESS */}
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
