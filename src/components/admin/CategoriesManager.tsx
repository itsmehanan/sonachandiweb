import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Download,
  RefreshCw,
  X,
  FolderOpen,
} from 'lucide-react';
import {
  Category,
  CategoryAppliesTo,
  DEFAULT_CATEGORIES,
  generateCategorySlug,
  optimizeCloudinaryShowcase,
} from '../../data/store';
import {
  AdminProduct,
  createCategoryAdmin,
  updateCategoryAdmin,
  reorderCategoriesBatch,
  deleteCategoryAdmin,
  reassignProductsCategoryBatch,
  importDefaultCategoriesBatch,
} from '../../lib/adminService';
import { uploadToCloudinary, ALLOWED_IMAGE_TYPES } from '../../lib/cloudinary';

interface CategoriesManagerProps {
  categories: Category[];
  loading: boolean;
  products: AdminProduct[];
  canEdit: boolean;
  isOwner: boolean;
  staffEmail: string;
  getCloudinaryConfig: () => { cloudName: string; uploadPreset: string };
  getFriendlyError: (err: unknown, fallback: string) => string;
  onRefreshCategories: () => Promise<void>;
  onRefreshProducts: () => Promise<void>;
}

interface CategoryFormState {
  mode: 'add' | 'edit';
  originalSlug?: string;
  name: string;
  description: string;
  imageUrl: string;
  appliesTo: CategoryAppliesTo;
  visible: boolean;
  displayOrder: number;
}

const MAX_CATEGORY_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

const APPLIES_TO_BADGE: Record<CategoryAppliesTo, { label: string; className: string }> = {
  both: {
    label: 'Gold & Silver',
    className: 'bg-[#F7F0DC] text-[#7A5A12] border border-[#C9A54B]/40',
  },
  gold: {
    label: 'Gold Only',
    className: 'bg-amber-50 text-amber-800 border border-amber-300/70',
  },
  silver: {
    label: 'Silver Only',
    className: 'bg-slate-100 text-slate-700 border border-slate-300/80',
  },
};

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  loading,
  products,
  canEdit,
  isOwner,
  staffEmail,
  getCloudinaryConfig,
  getFriendlyError,
  onRefreshCategories,
  onRefreshProducts,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [importingDefaults, setImportingDefaults] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);
  const [dragOverSlug, setDragOverSlug] = useState<string | null>(null);

  // Add / Edit modal state
  const [formState, setFormState] = useState<CategoryFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteTargetSlug, setDeleteTargetSlug] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [processingDelete, setProcessingDelete] = useState(false);

  // Unknown-category quick reassignment map: productId -> selected target slug
  const [quickAssignTargets, setQuickAssignTargets] = useState<Record<string, string>>({});
  const [assigningProductId, setAssigningProductId] = useState<string | null>(null);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.name.localeCompare(b.name);
      }),
    [categories]
  );

  // Count active products per category slug
  const activeCountBySlug = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.status !== 'active') continue;
      const slug = (p.category || '').trim();
      if (slug) counts[slug] = (counts[slug] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Count ALL products (active, draft, hidden) per category slug (for safe deletion checks)
  const allProductsBySlug = useMemo(() => {
    const grouped: Record<string, AdminProduct[]> = {};
    for (const p of products) {
      const slug = (p.category || '').trim();
      if (!slug) continue;
      if (!grouped[slug]) grouped[slug] = [];
      grouped[slug].push(p);
    }
    return grouped;
  }, [products]);

  // Active products whose category does not match any known category slug
  const unknownCategoryProducts = useMemo(() => {
    const referenceCategories =
      sortedCategories.length > 0 ? sortedCategories : DEFAULT_CATEGORIES;
    const validSlugs = new Set(referenceCategories.map((c) => c.slug));
    return products.filter((p) => {
      if (p.status !== 'active') return false;
      const cat = (p.category || '').trim();
      return !cat || !validSlugs.has(cat);
    });
  }, [products, sortedCategories]);

  // Auto-focus Name field and support Escape key for modals
  useEffect(() => {
    if (!formState && !deletingCategory) return;

    if (formState) {
      const timer = setTimeout(() => nameInputRef.current?.focus(), 40);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !savingForm && !uploadingImage) {
          setFormState(null);
          setFormError(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    if (deletingCategory) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !processingDelete) {
          setDeletingCategory(null);
          setDeleteError(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [formState, deletingCategory, savingForm, uploadingImage, processingDelete]);

  // Auto-dismiss success banners after 4s
  useEffect(() => {
    if (feedback?.type === 'success') {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const liveSlugPreview = useMemo(() => {
    if (!formState) return '';
    if (formState.mode === 'edit') return formState.originalSlug || '';
    const existingSlugs = sortedCategories.map((c) => c.slug);
    return formState.name.trim()
      ? generateCategorySlug(formState.name, existingSlugs)
      : '';
  }, [formState, sortedCategories]);

  const openAddModal = () => {
    if (!canEdit) return;
    const maxOrder = sortedCategories.reduce(
      (max, c) => (c.displayOrder > max ? c.displayOrder : max),
      0
    );
    setFormError(null);
    setFormState({
      mode: 'add',
      name: '',
      description: '',
      imageUrl: '',
      appliesTo: 'both',
      visible: true,
      displayOrder: maxOrder + 1,
    });
  };

  const openEditModal = (cat: Category) => {
    if (!canEdit) return;
    setFormError(null);
    setFormState({
      mode: 'edit',
      originalSlug: cat.slug,
      name: cat.name,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      appliesTo: cat.appliesTo,
      visible: cat.visible,
      displayOrder: cat.displayOrder,
    });
  };

  const handleUploadCategoryImage = async (file: File) => {
    if (!formState) return;
    setFormError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormError('Invalid image format. Please choose a JPG, PNG, or WebP file.');
      return;
    }
    if (file.size > MAX_CATEGORY_IMAGE_BYTES) {
      setFormError('Image exceeds the 2 MB limit. Please select a smaller image.');
      return;
    }

    setUploadingImage(true);
    try {
      const config = getCloudinaryConfig();
      const url = await uploadToCloudinary(file, config);
      setFormState((prev) => (prev ? { ...prev, imageUrl: url } : null));
    } catch (err) {
      setFormError(getFriendlyError(err, 'Failed to upload category image. Please try again.'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState || !canEdit) return;
    setFormError(null);

    if (uploadingImage) {
      setFormError('Please wait for the image upload to finish before saving.');
      return;
    }

    const trimmedName = formState.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      setFormError('Category name must be between 2 and 40 characters.');
      return;
    }

    const trimmedDesc = formState.description.trim();
    if (trimmedDesc.length > 160) {
      setFormError('Description must be 160 characters or fewer.');
      return;
    }

    // Check case-insensitive duplicate name
    const duplicate = sortedCategories.find(
      (c) =>
        c.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        (formState.mode === 'add' || c.slug !== formState.originalSlug)
    );
    if (duplicate) {
      setFormError(`A category named "${duplicate.name}" already exists.`);
      return;
    }

    setSavingForm(true);
    try {
      if (formState.mode === 'add') {
        await createCategoryAdmin(
          {
            name: trimmedName,
            description: trimmedDesc,
            imageUrl: formState.imageUrl.trim(),
            appliesTo: formState.appliesTo,
            displayOrder: formState.displayOrder,
            visible: formState.visible,
          },
          sortedCategories,
          staffEmail
        );
        setFeedback({ type: 'success', message: `Category "${trimmedName}" created.` });
      } else if (formState.originalSlug) {
        await updateCategoryAdmin(
          formState.originalSlug,
          {
            name: trimmedName,
            description: trimmedDesc,
            imageUrl: formState.imageUrl.trim(),
            appliesTo: formState.appliesTo,
            displayOrder: formState.displayOrder,
            visible: formState.visible,
          },
          sortedCategories,
          staffEmail
        );
        setFeedback({ type: 'success', message: `Category "${trimmedName}" updated.` });
      }
      setFormState(null);
      await onRefreshCategories();
    } catch (err) {
      setFormError(getFriendlyError(err, 'Unable to save category. Please try again.'));
    } finally {
      setSavingForm(false);
    }
  };

  const handleToggleVisible = async (cat: Category) => {
    if (!canEdit || togglingSlug) return;
    setTogglingSlug(cat.slug);
    setFeedback(null);
    try {
      await updateCategoryAdmin(
        cat.slug,
        {
          name: cat.name,
          description: cat.description || '',
          imageUrl: cat.imageUrl || '',
          appliesTo: cat.appliesTo,
          displayOrder: cat.displayOrder,
          visible: !cat.visible,
        },
        sortedCategories,
        staffEmail
      );
      await onRefreshCategories();
      setFeedback({
        type: 'success',
        message: !cat.visible
          ? `"${cat.name}" is now visible on the storefront.`
          : `"${cat.name}" is now hidden from the storefront.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getFriendlyError(err, 'Could not update category visibility.'),
      });
    } finally {
      setTogglingSlug(null);
    }
  };

  const applyOrder = async (newList: Category[]) => {
    if (!canEdit || reordering) return;
    setReordering(true);
    setFeedback(null);
    try {
      await reorderCategoriesBatch(newList, staffEmail);
      await onRefreshCategories();
      setFeedback({ type: 'success', message: 'Category display order updated.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getFriendlyError(err, 'Could not save the new category order.'),
      });
    } finally {
      setReordering(false);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sortedCategories.length) return;
    const next = [...sortedCategories];
    [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
    void applyOrder(next);
  };

  const handleDropOnSlug = (targetSlug: string) => {
    if (!canEdit || !draggedSlug || draggedSlug === targetSlug) {
      setDraggedSlug(null);
      setDragOverSlug(null);
      return;
    }
    const fromIdx = sortedCategories.findIndex((c) => c.slug === draggedSlug);
    const toIdx = sortedCategories.findIndex((c) => c.slug === targetSlug);
    setDraggedSlug(null);
    setDragOverSlug(null);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...sortedCategories];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    void applyOrder(next);
  };

  const handleImportDefaults = async () => {
    if (!canEdit || importingDefaults) return;
    setImportingDefaults(true);
    setFeedback(null);
    try {
      const created = await importDefaultCategoriesBatch(staffEmail);
      await onRefreshCategories();
      setFeedback({
        type: 'success',
        message:
          created > 0
            ? `Imported ${created} default ${created === 1 ? 'category' : 'categories'} into Firestore.`
            : 'Default categories already exist.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getFriendlyError(err, 'Failed to import default categories.'),
      });
    } finally {
      setImportingDefaults(false);
    }
  };

  const openDeleteModal = (cat: Category) => {
    if (!isOwner) return;
    setDeleteError(null);
    setDeletingCategory(cat);
    const otherCats = sortedCategories.filter((c) => c.slug !== cat.slug);
    setDeleteTargetSlug(otherCats[0]?.slug || '');
  };

  const productsInDeletingCategory = useMemo(() => {
    if (!deletingCategory) return [];
    return allProductsBySlug[deletingCategory.slug] || [];
  }, [deletingCategory, allProductsBySlug]);

  const handleReassignAndKeepOpen = async () => {
    if (!deletingCategory || !deleteTargetSlug || processingDelete) return;
    setDeleteError(null);
    setProcessingDelete(true);
    const movedCount = productsInDeletingCategory.length;
    try {
      await reassignProductsCategoryBatch(productsInDeletingCategory, deleteTargetSlug);
      await onRefreshProducts();
      const targetName =
        sortedCategories.find((c) => c.slug === deleteTargetSlug)?.name || deleteTargetSlug;
      setFeedback({
        type: 'success',
        message: `Moved ${movedCount} ${movedCount === 1 ? 'product' : 'products'} to "${targetName}". You can now delete "${deletingCategory.name}".`,
      });
    } catch (err) {
      setDeleteError(
        getFriendlyError(err, 'Failed to move products to the selected category.')
      );
    } finally {
      setProcessingDelete(false);
    }
  };

  const handleHideInsteadOfDelete = async () => {
    if (!deletingCategory || processingDelete) return;
    setDeleteError(null);
    setProcessingDelete(true);
    try {
      await updateCategoryAdmin(
        deletingCategory.slug,
        {
          name: deletingCategory.name,
          description: deletingCategory.description || '',
          imageUrl: deletingCategory.imageUrl || '',
          appliesTo: deletingCategory.appliesTo,
          displayOrder: deletingCategory.displayOrder,
          visible: false,
        },
        sortedCategories,
        staffEmail
      );
      await onRefreshCategories();
      setFeedback({
        type: 'success',
        message: `"${deletingCategory.name}" has been hidden from customers.`,
      });
      setDeletingCategory(null);
    } catch (err) {
      setDeleteError(getFriendlyError(err, 'Failed to hide category.'));
    } finally {
      setProcessingDelete(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory || !isOwner || processingDelete) return;
    if (productsInDeletingCategory.length > 0) {
      setDeleteError('Move all products out of this category before deleting it.');
      return;
    }
    setDeleteError(null);
    setProcessingDelete(true);
    try {
      await deleteCategoryAdmin(deletingCategory.slug);
      await onRefreshCategories();
      setFeedback({
        type: 'success',
        message: `Category "${deletingCategory.name}" deleted.`,
      });
      setDeletingCategory(null);
    } catch (err) {
      setDeleteError(getFriendlyError(err, 'Failed to delete category.'));
    } finally {
      setProcessingDelete(false);
    }
  };

  const handleQuickAssignProduct = async (product: AdminProduct, targetSlug: string) => {
    if (!targetSlug || !canEdit || assigningProductId) return;
    setAssigningProductId(product.id);
    setFeedback(null);
    try {
      await reassignProductsCategoryBatch([product], targetSlug);
      await onRefreshProducts();
      const targetName =
        sortedCategories.find((c) => c.slug === targetSlug)?.name || targetSlug;
      setFeedback({
        type: 'success',
        message: `Assigned "${product.name}" to "${targetName}".`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getFriendlyError(err, 'Failed to assign category to product.'),
      });
    } finally {
      setAssigningProductId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-[#E2D8C9] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
            Category Management
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Single source of truth for the storefront navbar, mobile menu, footer, home collections, and catalogue filters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!loading && sortedCategories.length === 0 && canEdit && (
            <button
              type="button"
              onClick={handleImportDefaults}
              disabled={importingDefaults}
              className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F3EAD7] text-[#7A5A12] border border-[#C9A54B] text-xs font-semibold uppercase tracking-wider rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {importingDefaults ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{importingDefaults ? 'Importing...' : 'Import default categories'}</span>
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={openAddModal}
              className="gold-sheen px-4 py-2 bg-[#C9A54B] hover:bg-[#B18D35] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Read-only notice for non-editing roles */}
      {!canEdit && (
        <div className="p-3.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl text-xs text-[#64748B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#8E6E24] shrink-0" />
          <span>
            You have read-only access to categories. Contact an Owner or Product Manager to make changes.
          </span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pre-import info banner when Firestore categories collection is empty */}
      {!loading && sortedCategories.length === 0 && (
        <div className="p-5 bg-[#FAF7F2] border border-[#C9A54B]/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#C9A54B]/40 flex items-center justify-center text-[#8E6E24] shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                No categories saved in Firestore yet
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-xl">
                Until categories are created, the storefront safely shows the 5 built-in default categories (Rings, Necklaces, Bangles, Earrings &amp; Jhumkas, Bridal Sets). Click &ldquo;Import default categories&rdquo; to populate Firestore and customize them freely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unknown Category Warning Panel */}
      {unknownCategoryProducts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-base font-bold text-amber-950">
                Products with unknown category ({unknownCategoryProducts.length})
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                These active products have a category slug that does not match any live category. They still appear in &ldquo;All Pieces&rdquo;, but will not appear under a specific category filter until reassigned.
              </p>
            </div>
          </div>

          {sortedCategories.length === 0 ? (
            <p className="text-xs text-amber-900 font-medium pl-7">
              Import default categories or add a new category above to reassign these products.
            </p>
          ) : (
            <div className="divide-y divide-amber-200/80 bg-white/80 border border-amber-200 rounded-xl overflow-hidden">
              {unknownCategoryProducts.map((prod) => {
                const compatibleCats = sortedCategories.filter(
                  (c) => c.appliesTo === 'both' || c.appliesTo === prod.metal
                );
                const selectedTarget =
                  quickAssignTargets[prod.id] ?? compatibleCats[0]?.slug ?? '';

                return (
                  <div
                    key={prod.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[#1E1B18] block truncate">
                        {prod.name}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        SKU: <span className="font-mono">{prod.sku}</span> ·{' '}
                        <span className="capitalize">{prod.metal}</span> · Current category:{' '}
                        <span className="font-mono text-amber-800">
                          {prod.category || '(empty)'}
                        </span>
                      </span>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="sr-only" htmlFor={`assign-cat-${prod.id}`}>
                          Choose category for {prod.name}
                        </label>
                        <select
                          id={`assign-cat-${prod.id}`}
                          value={selectedTarget}
                          onChange={(e) =>
                            setQuickAssignTargets((prev) => ({
                              ...prev,
                              [prod.id]: e.target.value,
                            }))
                          }
                          className="px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-xs text-[#1E1B18]"
                        >
                          <option value="">Select category...</option>
                          {compatibleCats.map((cat) => (
                            <option key={cat.slug} value={cat.slug}>
                              {cat.name}
                              {!cat.visible ? ' (Hidden)' : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!selectedTarget || assigningProductId === prod.id}
                          onClick={() => void handleQuickAssignProduct(prod, selectedTarget)}
                          className="px-3 py-1.5 bg-[#1E1B18] hover:bg-[#332E29] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {assigningProductId === prod.id ? 'Saving...' : 'Assign'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Categories List (Loading Skeleton / Desktop Table / Mobile Cards) */}
      {loading ? (
        <div
          className="bg-white border border-[#E2D8C9] rounded-2xl p-5 space-y-3 animate-pulse"
          aria-label="Loading categories"
        >
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 py-2 border-b border-[#F3EFEA] last:border-b-0"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-[#EFE9DF]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-36 bg-[#E6DDD0] rounded" />
                  <div className="h-2.5 w-24 bg-[#EFE9DF] rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-[#EFE9DF] rounded-full" />
              <div className="h-6 w-12 bg-[#EFE9DF] rounded-full" />
            </div>
          ))}
        </div>
      ) : sortedCategories.length > 0 ? (
        <div className="bg-white border border-[#E2D8C9] rounded-2xl overflow-hidden shadow-xs">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#E2D8C9] text-[#64748B] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4 w-24">Order</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Metal</th>
                  <th className="py-3 px-4">Active Pieces</th>
                  <th className="py-3 px-4">Visible</th>
                  {(canEdit || isOwner) && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA]">
                {sortedCategories.map((cat, idx) => {
                  const badge = APPLIES_TO_BADGE[cat.appliesTo] || APPLIES_TO_BADGE.both;
                  const activeCount = activeCountBySlug[cat.slug] || 0;
                  const isDragOver = dragOverSlug === cat.slug && draggedSlug !== cat.slug;

                  return (
                    <tr
                      key={cat.slug}
                      draggable={canEdit && !reordering}
                      onDragStart={() => setDraggedSlug(cat.slug)}
                      onDragOver={(e) => {
                        if (!canEdit) return;
                        e.preventDefault();
                        if (dragOverSlug !== cat.slug) setDragOverSlug(cat.slug);
                      }}
                      onDragLeave={() => {
                        if (dragOverSlug === cat.slug) setDragOverSlug(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnSlug(cat.slug);
                      }}
                      onDragEnd={() => {
                        setDraggedSlug(null);
                        setDragOverSlug(null);
                      }}
                      className={`transition-colors ${
                        isDragOver
                          ? 'bg-[#F7F0DC]/70 outline-2 outline-dashed outline-[#C9A54B]'
                          : 'hover:bg-[#FAF7F2]/60'
                      } ${!cat.visible ? 'opacity-75' : ''}`}
                    >
                      {/* Order + Move Up/Down + Drag Handle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {canEdit && (
                            <span
                              className="text-[#94A3B8] cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                              aria-hidden="true"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className="font-mono font-semibold text-[#64748B] w-6">
                            #{idx + 1}
                          </span>
                          {canEdit && (
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0 || reordering}
                                onClick={() => handleMove(idx, 'up')}
                                aria-label={`Move ${cat.name} up`}
                                className="p-1 text-[#64748B] hover:text-[#1E1B18] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed rounded hover:bg-[#EFE9DF]"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === sortedCategories.length - 1 || reordering}
                                onClick={() => handleMove(idx, 'down')}
                                aria-label={`Move ${cat.name} down`}
                                className="p-1 text-[#64748B] hover:text-[#1E1B18] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed rounded hover:bg-[#EFE9DF]"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Thumbnail + Name + Description */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {cat.imageUrl ? (
                            <img
                              src={optimizeCloudinaryShowcase(cat.imageUrl)}
                              alt={cat.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#E2D8C9] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E2D8C9] flex items-center justify-center text-[#C9A54B] shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-[#1E1B18] block">
                              {cat.name}
                            </span>
                            {cat.description && (
                              <span className="text-[11px] text-[#64748B] line-clamp-1 block max-w-xs">
                                {cat.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3 px-4 font-mono text-[#64748B]">{cat.slug}</td>

                      {/* Applies To */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Active Product Count */}
                      <td className="py-3 px-4 font-mono font-bold text-[#1E1B18]">
                        {activeCount}
                      </td>

                      {/* Visible Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={cat.visible}
                          aria-label={`Toggle visibility for ${cat.name}`}
                          disabled={!canEdit || togglingSlug === cat.slug}
                          onClick={() => handleToggleVisible(cat)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                            cat.visible
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          } ${
                            canEdit
                              ? 'cursor-pointer hover:brightness-95'
                              : 'cursor-default opacity-80'
                          }`}
                        >
                          {cat.visible ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      {(canEdit || isOwner) && (
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              aria-label={`Edit ${cat.name}`}
                              className="p-1.5 text-[#64748B] hover:text-[#1E1B18] hover:bg-[#FAF7F2] rounded-md transition-colors cursor-pointer"
                              title="Edit category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => openDeleteModal(cat)}
                              aria-label={`Delete ${cat.name}`}
                              className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete category (Owner only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="md:hidden divide-y divide-[#F3EFEA]">
            {sortedCategories.map((cat, idx) => {
              const badge = APPLIES_TO_BADGE[cat.appliesTo] || APPLIES_TO_BADGE.both;
              const activeCount = activeCountBySlug[cat.slug] || 0;

              return (
                <div
                  key={cat.slug}
                  className={`p-4 space-y-3 ${!cat.visible ? 'bg-[#FAF7F2]/60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {cat.imageUrl ? (
                        <img
                          src={optimizeCloudinaryShowcase(cat.imageUrl)}
                          alt={cat.name}
                          className="w-11 h-11 rounded-lg object-cover border border-[#E2D8C9] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-[#FAF7F2] border border-[#E2D8C9] flex items-center justify-center text-[#C9A54B] shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-[#64748B]">#{idx + 1}</span>
                          <span className="font-semibold text-sm text-[#1E1B18] truncate">
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#64748B] block">
                          /{cat.slug}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={cat.visible}
                      aria-label={`Toggle visibility for ${cat.name}`}
                      disabled={!canEdit || togglingSlug === cat.slug}
                      onClick={() => handleToggleVisible(cat)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                        cat.visible
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {cat.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{cat.visible ? 'Visible' : 'Hidden'}</span>
                    </button>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-[#64748B] leading-relaxed">{cat.description}</p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs text-[#64748B]">
                        <strong className="font-mono text-[#1E1B18]">{activeCount}</strong> active{' '}
                        {activeCount === 1 ? 'piece' : 'pieces'}
                      </span>
                    </div>

                    {(canEdit || isOwner) && (
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              disabled={idx === 0 || reordering}
                              onClick={() => handleMove(idx, 'up')}
                              aria-label={`Move ${cat.name} up`}
                              className="p-2 text-[#64748B] hover:text-[#1E1B18] disabled:opacity-30 rounded-lg border border-[#E2D8C9] cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === sortedCategories.length - 1 || reordering}
                              onClick={() => handleMove(idx, 'down')}
                              aria-label={`Move ${cat.name} down`}
                              className="p-2 text-[#64748B] hover:text-[#1E1B18] disabled:opacity-30 rounded-lg border border-[#E2D8C9] cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              aria-label={`Edit ${cat.name}`}
                              className="p-2 text-[#64748B] hover:text-[#1E1B18] rounded-lg border border-[#E2D8C9] cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => openDeleteModal(cat)}
                            aria-label={`Delete ${cat.name}`}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Add / Edit Category Modal */}
      {formState && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <form
            onSubmit={handleSubmitForm}
            className="bg-white border border-[#E2D8C9] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D8C9]">
              <h3 id="category-modal-title" className="font-serif text-lg font-bold text-[#1E1B18]">
                {formState.mode === 'add' ? 'Add New Category' : 'Edit Category'}
              </h3>
              <button
                type="button"
                disabled={savingForm || uploadingImage}
                onClick={() => {
                  setFormState(null);
                  setFormError(null);
                }}
                aria-label="Close category modal"
                className="p-1 text-[#64748B] hover:text-[#1E1B18] cursor-pointer rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl flex items-start gap-2 font-medium"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Category Name */}
            <div>
              <label
                htmlFor="cat-name-input"
                className="block font-semibold text-[#1E1B18] mb-1"
              >
                Display Name <span className="text-rose-600">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="cat-name-input"
                type="text"
                required
                minLength={2}
                maxLength={40}
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="e.g. Pendants, Bracelets, Bridal Sets"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-[#1E1B18] focus:outline-[#C9A54B]"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748B]">
                <span>2 to 40 characters</span>
                <span>{formState.name.trim().length}/40</span>
              </div>
            </div>

            {/* Slug Preview / Read-Only */}
            <div className="p-3 bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#64748B]">
                  {formState.mode === 'add' ? 'Auto-generated Slug' : 'Category Slug (Locked)'}
                </span>
                <span className="font-mono font-bold text-[#1E1B18]">
                  {liveSlugPreview || '—'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                {formState.mode === 'add'
                  ? 'Used in catalogue URLs (?category=slug) and product links. Cannot be changed after creation.'
                  : 'Slugs are locked after creation so existing product references and links never break.'}
              </p>
            </div>

            {/* Applies To */}
            <div>
              <label
                htmlFor="cat-applies-select"
                className="block font-semibold text-[#1E1B18] mb-1"
              >
                Applies To
              </label>
              <select
                id="cat-applies-select"
                value={formState.appliesTo}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    appliesTo: e.target.value as CategoryAppliesTo,
                  })
                }
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-[#1E1B18] focus:outline-[#C9A54B]"
              >
                <option value="both">Both Gold &amp; Silver</option>
                <option value="gold">Gold Only</option>
                <option value="silver">Silver Only</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="cat-desc-input"
                className="block font-semibold text-[#1E1B18] mb-1"
              >
                Short Description (Optional)
              </label>
              <textarea
                id="cat-desc-input"
                rows={2}
                maxLength={160}
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="Shown on the home tile and under the catalogue heading."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-[#1E1B18] focus:outline-[#C9A54B]"
              />
              <div className="text-right text-[11px] text-[#64748B] mt-0.5">
                {formState.description.length}/160
              </div>
            </div>

            {/* Category Image Upload */}
            <div className="space-y-2">
              <span className="block font-semibold text-[#1E1B18]">
                Category Photo (Optional, max 2 MB)
              </span>
              <div className="flex items-center gap-3">
                {formState.imageUrl ? (
                  <img
                    src={optimizeCloudinaryShowcase(formState.imageUrl)}
                    alt="Category preview"
                    className="w-16 h-16 rounded-xl object-cover border border-[#E2D8C9] shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#FAF7F2] border border-[#E2D8C9] flex items-center justify-center text-[#94A3B8] shrink-0">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    id="category-image-upload"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleUploadCategoryImage(file);
                        e.target.value = '';
                      }
                    }}
                  />
                  <label
                    htmlFor="category-image-upload"
                    className={`px-3 py-2 bg-[#FAF7F2] hover:bg-[#F3EAD7] border border-[#C9A54B]/60 text-[#7A5A12] rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors ${
                      uploadingImage ? 'opacity-60 pointer-events-none' : 'cursor-pointer'
                    }`}
                  >
                    {uploadingImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {uploadingImage
                        ? 'Uploading...'
                        : formState.imageUrl
                        ? 'Replace Photo'
                        : 'Upload Photo'}
                    </span>
                  </label>

                  {formState.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, imageUrl: '' })}
                      className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility Toggle */}
            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formState.visible}
                onChange={(e) => setFormState({ ...formState, visible: e.target.checked })}
                className="w-4 h-4 accent-[#C9A54B] rounded cursor-pointer"
              />
              <span className="font-semibold text-[#1E1B18]">
                Visible to customers on the storefront
              </span>
            </label>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#E2D8C9] flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={savingForm || uploadingImage}
                onClick={() => {
                  setFormState(null);
                  setFormError(null);
                }}
                className="px-4 py-2 text-[#64748B] hover:text-[#1E1B18] font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingForm || uploadingImage}
                className="px-5 py-2 bg-[#C9A54B] hover:bg-[#B18D35] text-white font-semibold uppercase tracking-wider rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {savingForm && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {savingForm
                    ? 'Saving...'
                    : formState.mode === 'add'
                    ? 'Create Category'
                    : 'Save Changes'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Category Modal (Owner only) */}
      {deletingCategory && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className="bg-white border border-[#E2D8C9] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D8C9]">
              <h3 id="delete-category-title" className="font-serif text-lg font-bold text-[#1E1B18]">
                Delete Category
              </h3>
              <button
                type="button"
                disabled={processingDelete}
                onClick={() => {
                  setDeletingCategory(null);
                  setDeleteError(null);
                }}
                aria-label="Close delete confirmation"
                className="p-1 text-[#64748B] hover:text-[#1E1B18] cursor-pointer rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl flex items-start gap-2 font-medium"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            {productsInDeletingCategory.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <p className="font-semibold">
                    &ldquo;{deletingCategory.name}&rdquo; still has{' '}
                    {productsInDeletingCategory.length}{' '}
                    {productsInDeletingCategory.length === 1 ? 'product' : 'products'}.
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    You cannot delete a category while products are assigned to it. Move those products to another category first, or hide this category instead.
                  </p>
                </div>

                {sortedCategories.filter((c) => c.slug !== deletingCategory.slug).length > 0 && (
                  <div className="space-y-2">
                    <label
                      htmlFor="move-products-select"
                      className="block font-semibold text-[#1E1B18]"
                    >
                      Move all {productsInDeletingCategory.length}{' '}
                      {productsInDeletingCategory.length === 1 ? 'product' : 'products'} to:
                    </label>
                    <select
                      id="move-products-select"
                      value={deleteTargetSlug}
                      onChange={(e) => setDeleteTargetSlug(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2D8C9] rounded-lg text-[#1E1B18]"
                    >
                      {sortedCategories
                        .filter((c) => c.slug !== deletingCategory.slug)
                        .map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name} ({APPLIES_TO_BADGE[c.appliesTo].label})
                            {!c.visible ? ' — Hidden' : ''}
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      disabled={!deleteTargetSlug || processingDelete}
                      onClick={handleReassignAndKeepOpen}
                      className="w-full py-2.5 px-4 bg-[#1E1B18] hover:bg-[#332E29] text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {processingDelete
                        ? 'Moving products...'
                        : `Move ${productsInDeletingCategory.length} ${
                            productsInDeletingCategory.length === 1 ? 'product' : 'products'
                          }`}
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E2D8C9] flex items-center justify-between gap-2">
                  {deletingCategory.visible && (
                    <button
                      type="button"
                      disabled={processingDelete}
                      onClick={handleHideInsteadOfDelete}
                      className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F3EAD7] border border-[#C9A54B]/60 text-[#7A5A12] font-semibold rounded-lg cursor-pointer"
                    >
                      Hide Category Instead
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={processingDelete}
                    onClick={() => {
                      setDeletingCategory(null);
                      setDeleteError(null);
                    }}
                    className="ml-auto px-4 py-2 text-[#64748B] hover:text-[#1E1B18] font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[#475569] leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-[#1E1B18]">&ldquo;{deletingCategory.name}&rdquo;</strong>{' '}
                  (<span className="font-mono">{deletingCategory.slug}</span>)? No products are assigned to this category.
                </p>

                <div className="pt-3 border-t border-[#E2D8C9] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={processingDelete}
                    onClick={() => {
                      setDeletingCategory(null);
                      setDeleteError(null);
                    }}
                    className="px-4 py-2 text-[#64748B] hover:text-[#1E1B18] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={processingDelete}
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {processingDelete ? 'Deleting...' : 'Delete Category'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
