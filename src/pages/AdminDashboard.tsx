import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Database,
  Tag,
  Headphones,
  CheckCircle,
  Eye,
  ArrowLeft,
  Upload,
  Link,
  RotateCcw,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Wallet,
  Sparkles,
  Printer,
  Layers,
  FolderPlus,
  MapPin,
  X,
  MessageSquare,
  Loader2,
  ArrowUp,
  ArrowDown,
  Check,
  Flame,
  Star,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth, OWNER_EMAIL } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Product, OrderStatus, Banner, Voucher, StoreAnnouncementConfig, Category, Order } from '../types';
import { uploadImageFile } from '../utils/storage';
import { StarRating } from '../components/common/StarRating';

interface AdminDashboardProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

const ORDER_COLUMNS: { status: OrderStatus; label: string; badge: string }[] = [
  { status: 'ordered', label: 'Ordered', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { status: 'confirmed', label: 'Confirmed', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { status: 'packed', label: 'Packed', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { status: 'dispatched', label: 'Dispatched', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  { status: 'in_transit', label: 'In Transit', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { status: 'out_for_delivery', label: 'Out for Delivery', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  { status: 'delivered', label: 'Delivered', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { status: 'returned', label: 'Returned', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
  { status: 'cancelled', label: 'Cancelled', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { currentUser, isAdmin, signInWithGoogle } = useAuth();
  const {
    products,
    categories,
    banners,
    vouchers,
    orders,
    supportMessages,
    announcementConfig,
    storeConfig,
    trendingProductIds,
    seedInitialDataToFirestore,
    updateOrderStatus,
    handleCancelRequest,
    handleReturnRequest,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    addBanner,
    deleteBanner,
    updateTrendingProducts,
    replySupportMessage,
    creditCustomerWalletFromChat,
    updateAnnouncementConfig,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'trending' | 'orders' | 'banners' | 'announcement' | 'support' | 'vouchers'
  >('overview');

  // Success Notification Toast
  const [dashboardSuccessMsg, setDashboardSuccessMsg] = useState('');
  const [dashboardErrorMsg, setDashboardErrorMsg] = useState('');

  // Trending Products Management State
  const [localTrendingIds, setLocalTrendingIds] = useState<string[]>([]);
  const [trendingSearch, setTrendingSearch] = useState('');
  const [trendingCategoryFilter, setTrendingCategoryFilter] = useState('all');
  const [trendingSaving, setTrendingSaving] = useState(false);

  useEffect(() => {
    setLocalTrendingIds(trendingProductIds || []);
  }, [trendingProductIds]);

  // Product Modal & Image Upload
  const [productModal, setProductModal] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: '',
    brand: '',
    category: 'electronics',
    categories: ['electronics'],
    categoryIds: ['electronics'],
    sellingPrice: 1999,
    originalPrice: 2999,
    discountPercent: 33,
    stock: 20,
    mainImage: '',
    images: [],
    description: '',
    highlights: ['1 Year Brand Warranty', 'Free Express Delivery'],
    isActive: true,
  });

  // Multiple category selection state for product
  const [prodCategories, setProdCategories] = useState<string[]>(['electronics']);
  const [quickCatName, setQuickCatName] = useState('');
  const [showQuickCat, setShowQuickCat] = useState(false);

  // Extra image management state
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);

  // Dynamic Variant rows (Left: Name like Size/Color, Right: comma-separated options)
  const [variantRows, setVariantRows] = useState<{ name: string; optionsStr: string }[]>([
    { name: 'Size', optionsStr: 'S, M, L, XL, XXL' },
  ]);

  // Dynamic Specifications / Features table (Left: Feature Name, Right: Value)
  const [specRows, setSpecRows] = useState<{ key: string; value: string }[]>([
    { key: 'Material', value: 'Premium Grade Quality' },
    { key: 'Warranty', value: '1 Year Brand Warranty' },
  ]);

  // Category Modal
  const [categoryModal, setCategoryModal] = useState(false);
  const [newCat, setNewCat] = useState<{ name: string; slug: string; icon: string; description: string }>({
    name: '',
    slug: '',
    icon: 'Layers',
    description: '',
  });

  // Batch Print Packing Slips Modal
  const [packingSlipModal, setPackingSlipModal] = useState(false);
  const [packingSlipStatus, setPackingSlipStatus] = useState<string>('all');

  // Banner Modal & Image Upload
  const [bannerModal, setBannerModal] = useState(false);
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({
    title: '',
    imageUrl: '',
    link: '/products',
    order: 1,
    isActive: true,
  });

  // Announcement Bar State
  const [localAnnouncement, setLocalAnnouncement] = useState<StoreAnnouncementConfig>(announcementConfig);
  const [announcementSavedMsg, setAnnouncementSavedMsg] = useState('');

  // Selected Order Status Column in Orders Tab
  const [selectedStatusCol, setSelectedStatusCol] = useState<string>('all');

  // Chat direct response
  const [chatReplyText, setChatReplyText] = useState<Record<string, string>>({});
  const [seedingStatus, setSeedingStatus] = useState('');

  if (!currentUser || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Protected Administrator Portal</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          Access is strictly restricted to the authorized store owner: <strong>{OWNER_EMAIL}</strong>.
        </p>
        {!currentUser ? (
          <button
            onClick={signInWithGoogle}
            className="mt-6 bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
          >
            Sign In with Owner Account
          </button>
        ) : (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl inline-block">
            Access Denied: &lt;{currentUser.email}&gt; is not authorized.
          </div>
        )}
      </div>
    );
  }

  // Image Upload & Gallery Helpers using Firebase Storage
  const handleProductMainImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploadingProgress(10);
        const url = await uploadImageFile(file, 'products', (prog) => setUploadingProgress(prog));
        setNewProd((prev) => {
          const currentImages = prev.images || [];
          const updatedImages = currentImages.includes(url) ? currentImages : [url, ...currentImages];
          return {
            ...prev,
            mainImage: url,
            images: updatedImages,
          };
        });
        setDashboardSuccessMsg('Main thumbnail uploaded and set successfully!');
        setTimeout(() => setDashboardSuccessMsg(''), 3000);
      } catch (err: any) {
        setDashboardErrorMsg(err.message || 'Failed to upload thumbnail image');
        setTimeout(() => setDashboardErrorMsg(''), 4000);
      } finally {
        setUploadingProgress(null);
      }
    }
  };

  const handleProductExtraImagesMultiple = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingProgress(5);
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadImageFile(file, 'products', (prog) => {
          const overall = Math.round(((i + prog / 100) / files.length) * 100);
          setUploadingProgress(overall);
        });
        uploadedUrls.push(url);
      }

      setNewProd((prev) => {
        const existing = prev.images || [];
        const combined = [...existing, ...uploadedUrls].filter((u, idx, arr) => arr.indexOf(u) === idx);
        return {
          ...prev,
          mainImage: prev.mainImage || combined[0] || '',
          images: combined,
        };
      });

      setDashboardSuccessMsg(`Added ${uploadedUrls.length} image(s) to product gallery!`);
      setTimeout(() => setDashboardSuccessMsg(''), 3000);
    } catch (err: any) {
      setDashboardErrorMsg(err.message || 'Failed to upload images');
      setTimeout(() => setDashboardErrorMsg(''), 4000);
    } finally {
      setUploadingProgress(null);
    }
  };

  const handleAddImageUrl = () => {
    const clean = newImageUrl.trim();
    if (!clean) return;
    try {
      new URL(clean);
    } catch {
      setDashboardErrorMsg('Please enter a valid image URL starting with http:// or https://');
      setTimeout(() => setDashboardErrorMsg(''), 3000);
      return;
    }

    setNewProd((prev) => {
      const existing = prev.images || [];
      const combined = existing.includes(clean) ? existing : [...existing, clean];
      return {
        ...prev,
        mainImage: prev.mainImage || clean,
        images: combined,
      };
    });
    setNewImageUrl('');
  };

  const handleSetMainThumbnail = (url: string) => {
    setNewProd((prev) => ({
      ...prev,
      mainImage: url,
    }));
  };

  const handleRemoveGalleryImage = (urlToRemove: string) => {
    setNewProd((prev) => {
      const updated = (prev.images || []).filter((u) => u !== urlToRemove);
      const newMain = prev.mainImage === urlToRemove ? updated[0] || '' : prev.mainImage;
      return {
        ...prev,
        mainImage: newMain,
        images: updated,
      };
    });
  };

  const handleReorderGalleryImage = (index: number, direction: 'up' | 'down') => {
    setNewProd((prev) => {
      const list = [...(prev.images || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return {
        ...prev,
        images: list,
      };
    });
  };

  const handleQuickAddCategory = async () => {
    if (!quickCatName.trim()) return;
    try {
      const slug = quickCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await addCategory({
        name: quickCatName.trim(),
        slug,
        icon: 'Layers',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
        subCategories: [],
        description: 'Product category collection',
      });
      setProdCategories((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
      setQuickCatName('');
      setShowQuickCat(false);
      setDashboardSuccessMsg(`Category "${quickCatName}" created and assigned!`);
      setTimeout(() => setDashboardSuccessMsg(''), 3000);
    } catch (e: any) {
      setDashboardErrorMsg(e.message || 'Error creating category');
      setTimeout(() => setDashboardErrorMsg(''), 4000);
    }
  };

  // Trending Management Handlers
  const handleSaveTrendingProducts = async () => {
    setTrendingSaving(true);
    try {
      await updateTrendingProducts(localTrendingIds);
      setDashboardSuccessMsg(`Trending queue (${localTrendingIds.length} products) saved persistently to Firebase!`);
      setTimeout(() => setDashboardSuccessMsg(''), 4000);
    } catch (e: any) {
      setDashboardErrorMsg(e.message || 'Failed to save trending products');
      setTimeout(() => setDashboardErrorMsg(''), 4000);
    } finally {
      setTrendingSaving(false);
    }
  };

  const handleToggleProductTrending = (productId: string) => {
    setLocalTrendingIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleMoveTrendingItem = (index: number, direction: 'up' | 'down') => {
    setLocalTrendingIds((prev) => {
      const list = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return list;
    });
  };

  const handleRemoveFromTrending = (productId: string) => {
    setLocalTrendingIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleBannerImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewBanner((prev) => ({ ...prev, imageUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.sellingPrice || !newProd.mainImage) {
      alert('Please provide product title, selling price, and thumbnail image.');
      return;
    }

    try {
      // Process variants: Left side name, Right side comma-separated options
      const processedVariants = variantRows
        .filter((v) => v.name.trim() && v.optionsStr.trim())
        .map((v) => ({
          name: v.name.trim(),
          type: v.name.toLowerCase().includes('color') ? 'color' : 'size',
          options: v.optionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }));

      // Process specifications / features table
      const processedSpecs: Record<string, string> = {};
      specRows.forEach((row) => {
        if (row.key.trim() && row.value.trim()) {
          processedSpecs[row.key.trim()] = row.value.trim();
        }
      });

      const selectedCats = prodCategories.length ? prodCategories : [newProd.category || 'electronics'];
      const finalGallery = (newProd.images && newProd.images.length > 0)
        ? (newProd.images.includes(newProd.mainImage) ? newProd.images : [newProd.mainImage, ...newProd.images])
        : [newProd.mainImage];

      const productPayload = {
        name: newProd.name,
        slug: newProd.slug || newProd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        brand: newProd.brand || 'TrendPro Select',
        category: selectedCats[0] || 'electronics',
        categories: selectedCats,
        categoryIds: selectedCats,
        description: newProd.description || 'Premium quality marketplace product.',
        highlights: newProd.highlights || ['1 Year Brand Warranty', 'Fast Express Dispatch'],
        mainImage: newProd.mainImage,
        images: finalGallery,
        originalPrice: newProd.originalPrice || Math.round(newProd.sellingPrice * 1.25),
        sellingPrice: newProd.sellingPrice,
        discountPercent:
          newProd.originalPrice && newProd.originalPrice > newProd.sellingPrice
            ? Math.round(((newProd.originalPrice - newProd.sellingPrice) / newProd.originalPrice) * 100)
            : 0,
        stock: Number(newProd.stock) >= 0 ? Number(newProd.stock) : 25,
        rating: editingProductId ? (newProd.rating || 0) : 0,
        ratingCount: editingProductId ? (newProd.ratingCount || 0) : 0,
        variants: processedVariants.length ? processedVariants : undefined,
        specs: Object.keys(processedSpecs).length ? processedSpecs : undefined,
        deliveryDays: 8,
        isActive: true,
      };

      if (editingProductId) {
        await updateProduct(editingProductId, productPayload);
        setDashboardSuccessMsg(`Product "${newProd.name}" updated successfully!`);
      } else {
        await addProduct(productPayload);
        setDashboardSuccessMsg(`Product "${newProd.name}" published to catalog successfully!`);
      }

      setProductModal(false);
      setEditingProductId(null);
      setTimeout(() => setDashboardSuccessMsg(''), 5000);
    } catch (err: any) {
      setDashboardErrorMsg(err.message || 'Error saving product');
      setTimeout(() => setDashboardErrorMsg(''), 5000);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) {
      setDashboardErrorMsg('Please enter category name');
      setTimeout(() => setDashboardErrorMsg(''), 4000);
      return;
    }

    try {
      await addCategory({
        name: newCat.name.trim(),
        slug: newCat.slug.trim() || newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: newCat.icon || 'Layers',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
        subCategories: [],
        description: newCat.description || 'Marketplace product collection',
      });
      setCategoryModal(false);
      setDashboardSuccessMsg(`New Category "${newCat.name}" created and added to store!`);
      setNewCat({ name: '', slug: '', icon: 'Layers', description: '' });
      setTimeout(() => setDashboardSuccessMsg(''), 5000);
    } catch (err: any) {
      setDashboardErrorMsg(err.message || 'Error creating category');
      setTimeout(() => setDashboardErrorMsg(''), 5000);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.imageUrl) {
      setDashboardErrorMsg('Please upload or provide a banner image.');
      setTimeout(() => setDashboardErrorMsg(''), 4000);
      return;
    }

    try {
      await addBanner({
        imageUrl: newBanner.imageUrl,
        link: newBanner.link || '/products',
        order: newBanner.order || banners.length + 1,
        isActive: true,
      });
      setBannerModal(false);
      setNewBanner({ title: '', imageUrl: '', link: '/products', order: 1, isActive: true });
      setDashboardSuccessMsg('Promotional banner published successfully (pure image with click redirect)!');
      setTimeout(() => setDashboardSuccessMsg(''), 5000);
    } catch (err: any) {
      setDashboardErrorMsg(err.message || 'Error saving banner');
      setTimeout(() => setDashboardErrorMsg(''), 5000);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAnnouncementConfig(localAnnouncement);
      setAnnouncementSavedMsg('Top offer banner settings updated successfully!');
      setTimeout(() => setAnnouncementSavedMsg(''), 3000);
    } catch (err: any) {
      setDashboardErrorMsg(err.message || 'Error updating announcement');
      setTimeout(() => setDashboardErrorMsg(''), 5000);
    }
  };

  const handleSeedDatabase = async () => {
    setSeedingStatus('Synchronizing sample catalog & categories to Firestore...');
    try {
      await seedInitialDataToFirestore();
      setSeedingStatus('Catalog synchronized successfully to Cloud Firestore!');
      setTimeout(() => setSeedingStatus(''), 4000);
    } catch (err: any) {
      setDashboardErrorMsg(err.message || 'Error syncing database');
      setTimeout(() => setDashboardErrorMsg(''), 5000);
      setSeedingStatus('');
    }
  };

  // Cancellation and Return Action Modals
  const [cancelActionModal, setCancelActionModal] = useState<{
    order: Order;
    action: 'approve' | 'reject';
  } | null>(null);

  const [returnActionModal, setReturnActionModal] = useState<{
    order: Order;
    action: 'approve' | 'reject';
  } | null>(null);

  const [actionNote, setActionNote] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const executeCancelAction = async () => {
    if (!cancelActionModal || isProcessingAction) return;
    setIsProcessingAction(true);
    const { order, action } = cancelActionModal;
    const isApprove = action === 'approve';

    try {
      await handleCancelRequest(order.id, isApprove, actionNote.trim() || undefined);
      setDashboardSuccessMsg(
        isApprove
          ? `Order #${order.id} cancellation approved & processed. Inventory restored!`
          : `Order #${order.id} cancellation request was rejected.`
      );
      setCancelActionModal(null);
      setActionNote('');
      setTimeout(() => setDashboardSuccessMsg(''), 5000);
    } catch (err: any) {
      setDashboardErrorMsg(err.message || 'Error processing cancellation request');
      setTimeout(() => setDashboardErrorMsg(''), 5000);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const executeReturnAction = async () => {
    if (!returnActionModal || isProcessingAction) return;
    setIsProcessingAction(true);
    const { order, action } = returnActionModal;
    const isApprove = action === 'approve';

    try {
      await handleReturnRequest(order.id, isApprove, actionNote.trim() || undefined);
      setDashboardSuccessMsg(
        isApprove
          ? `Order #${order.id} return approved & refund processed to customer wallet!`
          : `Order #${order.id} return request was rejected.`
      );
      setReturnActionModal(null);
      setActionNote('');
      setTimeout(() => setDashboardSuccessMsg(''), 5000);
    } catch (err: any) {
      setDashboardErrorMsg(err.message || 'Error processing return request');
      setTimeout(() => setDashboardErrorMsg(''), 5000);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid' && o.orderStatus !== 'cancelled')
    .reduce((acc, o) => acc + o.pricing.total, 0);

  const pendingCancels = orders.filter((o) => o.cancelRequest?.status === 'pending');
  const pendingReturns = orders.filter((o) => o.returnRequest?.status === 'pending');

  const filteredOrders =
    selectedStatusCol === 'all'
      ? orders
      : selectedStatusCol === 'pending_cancels'
      ? orders.filter((o) => o.cancelRequest?.status === 'pending')
      : selectedStatusCol === 'pending_returns'
      ? orders.filter((o) => o.returnRequest?.status === 'pending')
      : orders.filter((o) => {
          if (selectedStatusCol === 'ordered' && o.orderStatus === 'placed') return true;
          if (selectedStatusCol === 'packed' && o.orderStatus === 'processing') return true;
          return o.orderStatus === selectedStatusCol;
        });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              TrendPro Master Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Owner Control Dashboard</h1>
          <p className="text-xs text-slate-400">
            Authenticated Store Owner: <strong className="text-white font-mono">{currentUser.email}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDatabase}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Database className="w-4 h-4" />
            <span>Sync Catalog to Firestore</span>
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            Storefront
          </button>
        </div>
      </div>

      {dashboardSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm">{dashboardSuccessMsg}</span>
          </div>
          <button onClick={() => setDashboardSuccessMsg('')} className="p-1 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {dashboardErrorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm">{dashboardErrorMsg}</span>
          </div>
          <button onClick={() => setDashboardErrorMsg('')} className="p-1 hover:text-rose-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {seedingStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{seedingStatus}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview Metrics' },
          { id: 'orders', label: `Orders (${orders.length})` },
          { id: 'products', label: `Products (${products.length})` },
          { id: 'trending', label: `🔥 Trending (${localTrendingIds.length})` },
          { id: 'banners', label: `Banners (${banners.length})` },
          { id: 'announcement', label: 'Offer Header Bar' },
          { id: 'support', label: `Customer Chat (${supportMessages.length})` },
          { id: 'vouchers', label: `Vouchers (${vouchers.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Realized Revenue
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{totalRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
                Across {orders.length} placed transactions
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Orders Awaiting Action
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {pendingCancels.length + pendingReturns.length}
              </p>
              <span className="text-[10px] text-amber-700 font-bold mt-1 inline-block">
                {pendingCancels.length} cancel + {pendingReturns.length} return requests
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Catalog Items
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{products.length}</p>
              <span className="text-[10px] text-indigo-600 font-bold mt-1 inline-block">
                Including Digital Gift Cards
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Offer Bar Status
              </span>
              <p className="text-lg font-black text-slate-900 mt-1 flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    announcementConfig.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                {announcementConfig.isEnabled ? 'Visible & Active' : 'Hidden by Owner'}
              </p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">
                Code: {announcementConfig.couponCode}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS WITH ALL STATUS COLUMNS & CANCELLATION / RETURN ACTIONS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Order Pipeline & Fulfilment Management
              </h2>
              <p className="text-xs text-slate-500">
                Filter by granular order status column or review pending customer cancellation & return requests.
              </p>
            </div>
            
            <button
              onClick={() => {
                setPackingSlipStatus('all');
                setPackingSlipModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print All Orders PDF / Bills</span>
            </button>
          </div>

          {/* Granular Order Status Columns Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedStatusCol('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedStatusCol === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              All Columns ({orders.length})
            </button>

            {pendingCancels.length > 0 && (
              <button
                onClick={() => setSelectedStatusCol('pending_cancels')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                  selectedStatusCol === 'pending_cancels'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Pending Cancellations ({pendingCancels.length})</span>
              </button>
            )}

            {pendingReturns.length > 0 && (
              <button
                onClick={() => setSelectedStatusCol('pending_returns')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                  selectedStatusCol === 'pending_returns'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Returns ({pendingReturns.length})</span>
              </button>
            )}

            {ORDER_COLUMNS.map((col) => {
              const count = orders.filter((o) => {
                if (col.status === 'ordered' && o.orderStatus === 'placed') return true;
                if (col.status === 'packed' && o.orderStatus === 'processing') return true;
                return o.orderStatus === col.status;
              }).length;

              return (
                <button
                  key={col.status}
                  onClick={() => setSelectedStatusCol(col.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                    selectedStatusCol === col.status
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{col.label}</span>
                  <span className="bg-black/10 px-1.5 py-0.2 rounded-full text-[10px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">#{o.id}</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          {o.customerId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.orderStatus === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.orderStatus === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : o.orderStatus === 'returned'
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {o.orderStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {o.customerName} &lt;{o.customerEmail}&gt; • {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Direct Customer Support Chat Button */}
                      <button
                        onClick={() => onNavigate('support', { orderId: o.id, userId: o.userId })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                        title="Chat directly with customer regarding this order"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Chat with Customer</span>
                      </button>

                      <button
                        onClick={() => {
                          setPackingSlipStatus(o.id);
                          setPackingSlipModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
                        title="Print Packing Slip / Bill"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Print Bill</span>
                      </button>

                      <span className="text-slate-500 font-bold">Move Status:</span>
                      <select
                        value={o.orderStatus}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-bold text-indigo-700 outline-hidden cursor-pointer"
                      >
                        <option value="ordered">Ordered</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="in_transit">In Transit</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="returned">Returned</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Cancellation Request Pending */}
                  {o.cancelRequest && o.cancelRequest.status === 'pending' && (
                    <div className="bg-rose-50 border border-rose-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                      <div className="space-y-1">
                        <p className="font-black text-rose-950 flex items-center gap-1.5 text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Customer Cancellation Request Pending Review</span>
                        </p>
                        <p className="text-rose-800 text-xs">
                          <strong>Customer Reason:</strong> &ldquo;{o.cancelRequest.reason}&rdquo;
                        </p>
                        <p className="text-[11px] text-rose-600">
                          Requested on {new Date(o.cancelRequest.requestDate).toLocaleString()} • Payment Method: {o.paymentMethod.toUpperCase()} ({o.paymentStatus})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setActionNote('Cancellation request cannot be accepted as order has already been processed.');
                            setCancelActionModal({ order: o, action: 'reject' });
                          }}
                          className="px-3.5 py-2 bg-white border border-rose-300 text-rose-700 font-bold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer text-xs"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setActionNote('Approved by store owner');
                            setCancelActionModal({ order: o, action: 'approve' });
                          }}
                          className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-xs transition-colors cursor-pointer text-xs flex items-center gap-1.5 active:scale-95"
                        >
                          <span>Accept & Refund ₹{o.pricing.total.toLocaleString()}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Customer Return Request Pending */}
                  {o.returnRequest && o.returnRequest.status === 'pending' && (
                    <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                      <div className="space-y-1">
                        <p className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                          <RotateCcw className="w-4 h-4 text-amber-600" />
                          <span>Customer Return & Refund Request Pending Review</span>
                        </p>
                        <p className="text-amber-800 text-xs">
                          <strong>Customer Reason:</strong> &ldquo;{o.returnRequest.reason}&rdquo;
                        </p>
                        <p className="text-[11px] text-amber-700">
                          Requested on {new Date(o.returnRequest.requestDate).toLocaleString()}
                        </p>
                        {o.returnRequest.extraImages && o.returnRequest.extraImages.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {o.returnRequest.extraImages.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="Return defect photo"
                                className="w-12 h-12 object-cover rounded-lg border border-amber-300"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setActionNote('Return request rejected: Does not meet return policy condition.');
                            setReturnActionModal({ order: o, action: 'reject' });
                          }}
                          className="px-3.5 py-2 bg-white border border-amber-300 text-amber-800 font-bold rounded-xl hover:bg-amber-100 transition-colors cursor-pointer text-xs"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setActionNote('Return accepted by store owner. Refund credited to wallet.');
                            setReturnActionModal({ order: o, action: 'approve' });
                          }}
                          className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-xs transition-colors cursor-pointer text-xs flex items-center gap-1.5 active:scale-95"
                        >
                          <span>Accept & Refund ₹{o.pricing.total.toLocaleString()}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-between items-center text-slate-600 pt-1">
                    <div>
                      {o.items.map((item, i) => (
                        <span key={i} className="inline-block mr-2 font-medium">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      Total: ₹{o.pricing.total.toLocaleString()} ({o.paymentMethod.toUpperCase()})
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                No orders in this status column.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS WITH FILE UPLOADS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Catalog Products</h2>
            <button
              onClick={() => {
                setEditingProductId(null);
                setNewProd({
                  name: '',
                  brand: '',
                  category: categories[0]?.slug || 'electronics',
                  sellingPrice: 1999,
                  originalPrice: 2999,
                  stock: 25,
                  mainImage: '',
                  images: [],
                  description: '',
                  highlights: ['1 Year Brand Warranty', 'Free Express Delivery'],
                  isActive: true,
                });
                setProdCategories([categories[0]?.slug || 'electronics']);
                setVariantRows([{ name: 'Size', optionsStr: 'S, M, L, XL, XXL' }]);
                setSpecRows([
                  { key: 'Material', value: 'Premium Grade Quality' },
                  { key: 'Warranty', value: '1 Year Brand Warranty' },
                ]);
                setProductModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Product (With Variants & Specs)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 flex items-center gap-3">
                      <img src={p.mainImage} alt={p.name} className="w-10 h-10 object-contain rounded-lg bg-slate-50" />
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                        <span className="text-[10px] text-slate-400">{p.brand}</span>
                      </div>
                    </td>
                    <td className="p-3 capitalize text-slate-600">{p.category}</td>
                    <td className="p-3 font-bold text-slate-900">₹{p.sellingPrice.toLocaleString()}</td>
                    <td className="p-3 font-bold text-slate-700">{p.stock} units</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingProductId(p.id);
                          setNewProd(p);
                          setProdCategories(p.categories?.length ? p.categories : [p.category]);
                          if (p.variants && p.variants.length > 0) {
                            setVariantRows(
                              p.variants.map((v) => ({
                                name: v.name || v.type || 'Size',
                                optionsStr: v.options.join(', '),
                              }))
                            );
                          } else {
                            setVariantRows([{ name: 'Size', optionsStr: 'S, M, L, XL, XXL' }]);
                          }
                          if (p.specs && Object.keys(p.specs).length > 0) {
                            setSpecRows(
                              Object.entries(p.specs).map(([key, value]) => ({ key, value }))
                            );
                          } else {
                            setSpecRows([
                              { key: 'Material', value: 'Premium Grade Quality' },
                              { key: 'Warranty', value: '1 Year Brand Warranty' },
                            ]);
                          }
                          setProductModal(true);
                        }}
                        className="text-slate-600 hover:text-indigo-600 p-1 cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: OWNER-CONTROLLED TRENDING PRODUCTS */}
      {activeTab === 'trending' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h2 className="text-lg font-bold text-slate-900">Trending Products Manager</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Only products you explicitly select below appear in the Homepage Trending section and /trending route. Order them to control priority.
              </p>
            </div>

            <button
              onClick={handleSaveTrendingProducts}
              disabled={trendingSaving}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              {trendingSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Trending ({localTrendingIds.length} Selected)</span>
                </>
              )}
            </button>
          </div>

          {/* Section 1: Selected Trending Products in Order */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Active Trending Queue ({localTrendingIds.length} Products)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Top items appear first on the homepage. Use arrows to reorder position.
                </p>
              </div>
              {localTrendingIds.length > 0 && (
                <button
                  onClick={() => setLocalTrendingIds([])}
                  className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {localTrendingIds.length > 0 ? (
              <div className="space-y-2.5">
                {localTrendingIds.map((id, index) => {
                  const prod = products.find((p) => p.id === id);
                  if (!prod) return null;

                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          #{index + 1}
                        </span>
                        <img
                          src={prod.mainImage}
                          alt={prod.name}
                          className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{prod.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{prod.brand}</span>
                            <span>•</span>
                            <span className="capitalize">{prod.category}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-800">₹{prod.sellingPrice.toLocaleString()}</span>
                            <span>•</span>
                            <span className={prod.stock > 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                              {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of Stock'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleMoveTrendingItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveTrendingItem(index, 'down')}
                          disabled={index === localTrendingIds.length - 1}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromTrending(id)}
                          className="p-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          title="Remove from Trending"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Flame className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No trending products selected</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Browse products in the catalog browser below and check the boxes to designate them as trending.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Live Homepage Trending Preview */}
          {localTrendingIds.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Live Homepage Trending Preview
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {localTrendingIds.length} item(s) will render on storefront
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {localTrendingIds.slice(0, 4).map((id, idx) => {
                  const prod = products.find((p) => p.id === id);
                  if (!prod) return null;
                  return (
                    <div key={id} className="bg-white text-slate-900 rounded-2xl p-3 flex flex-col justify-between border border-slate-700 shadow-md">
                      <div>
                        <div className="relative aspect-square w-full bg-slate-50 rounded-xl overflow-hidden p-2 mb-2 flex items-center justify-center">
                          <img src={prod.mainImage} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply" />
                          <span className="absolute top-2 left-2 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                            #{idx + 1}
                          </span>
                        </div>
                        <p className="font-bold text-xs line-clamp-1">{prod.name}</p>
                        <p className="text-[10px] text-slate-400">{prod.brand}</p>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-black text-sm">₹{prod.sellingPrice.toLocaleString()}</span>
                        <StarRating rating={prod.rating || 0} reviewCount={prod.ratingCount} size="xs" showBadge={true} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Product Catalog Browser for Trending */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Browse & Add Store Products to Trending
                </h3>
                <p className="text-[11px] text-slate-500">
                  Click on any checkbox or row to toggle product in the Trending queue.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={trendingSearch}
                  onChange={(e) => setTrendingSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 outline-hidden focus:border-indigo-500 w-48"
                />
                <select
                  value={trendingCategoryFilter}
                  onChange={(e) => setTrendingCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {products
                .filter((p) => {
                  if (trendingSearch.trim()) {
                    const q = trendingSearch.toLowerCase();
                    const match =
                      p.name.toLowerCase().includes(q) ||
                      p.brand.toLowerCase().includes(q) ||
                      (p.sku && p.sku.toLowerCase().includes(q));
                    if (!match) return false;
                  }
                  if (trendingCategoryFilter !== 'all') {
                    const cat = trendingCategoryFilter.toLowerCase();
                    const matchesCat =
                      p.category?.toLowerCase() === cat ||
                      (p.categories && p.categories.some((c) => c.toLowerCase() === cat)) ||
                      (p.categoryIds && p.categoryIds.some((c) => c.toLowerCase() === cat));
                    if (!matchesCat) return false;
                  }
                  return true;
                })
                .map((p) => {
                  const isTrending = localTrendingIds.includes(p.id);
                  const trendIndex = localTrendingIds.indexOf(p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleProductTrending(p.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isTrending
                          ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/50 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleProductTrending(p.id);
                        }}
                        className="cursor-pointer"
                      >
                        {isTrending ? (
                          <CheckSquare className="w-5 h-5 text-amber-600 fill-amber-100" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <img
                        src={p.mainImage}
                        alt={p.name}
                        className="w-12 h-12 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                          {isTrending && (
                            <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                              #{trendIndex + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{p.brand}</span>
                          <span>•</span>
                          <span>₹{p.sellingPrice.toLocaleString()}</span>
                          <span>•</span>
                          <span>{p.stock} units</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hero Banners (Image Only)</h2>
              <p className="text-xs text-slate-500">
                Banners show pure images with no text overlay. Clicking a banner redirects visitors to your chosen link.
              </p>
            </div>
            <button
              onClick={() => setBannerModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Banner from File
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-2">
                <img src={b.imageUrl} alt="Banner" className="w-full h-44 object-cover" />
                <div className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Redirects To:</span>
                    <strong className="text-indigo-600 font-mono">{b.link}</strong>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this banner?')) deleteBanner(b.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TOP OFFER BAR MANAGEMENT (EDIT & HIDE/SHOW) */}
      {activeTab === 'announcement' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">Manage Top Header Offer Bar</h2>
            <p className="text-xs text-slate-500 mt-1">
              Control the top marquee offer bar. You can edit the headline, discount coupon, or completely hide it.
            </p>
          </div>

          <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
            {/* Toggle Visibility */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Offer Bar Visibility</p>
                <p className="text-slate-500 text-[11px]">
                  {localAnnouncement.isEnabled
                    ? 'Currently displayed to all store visitors'
                    : 'Currently hidden from storefront'}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setLocalAnnouncement({ ...localAnnouncement, isEnabled: !localAnnouncement.isEnabled })
                }
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {localAnnouncement.isEnabled ? (
                  <ToggleRight className="w-9 h-9 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-400" />
                )}
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Badge Text</label>
              <input
                type="text"
                value={localAnnouncement.badge}
                onChange={(e) => setLocalAnnouncement({ ...localAnnouncement, badge: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Offer Headline</label>
              <input
                type="text"
                value={localAnnouncement.headline}
                onChange={(e) => setLocalAnnouncement({ ...localAnnouncement, headline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={localAnnouncement.couponCode}
                  onChange={(e) => setLocalAnnouncement({ ...localAnnouncement, couponCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Discount Tag</label>
                <input
                  type="text"
                  value={localAnnouncement.discountText}
                  onChange={(e) => setLocalAnnouncement({ ...localAnnouncement, discountText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Shipping Note</label>
              <input
                type="text"
                value={localAnnouncement.shippingNote}
                onChange={(e) => setLocalAnnouncement({ ...localAnnouncement, shippingNote: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
              />
            </div>

            {announcementSavedMsg && (
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> {announcementSavedMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-xs"
            >
              Save & Apply Announcement Settings
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: SUPPORT CHAT WITH WALLET CREDIT */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Direct Customer Chat Messages</h2>
              <p className="text-xs text-slate-500">
                Reply to customer messages directly without bot interference. Credit wallet funds directly from chat.
              </p>
            </div>
            <button
              onClick={() => onNavigate('support')}
              className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Open Full Chat Center
            </button>
          </div>

          <div className="space-y-3">
            {supportMessages.map((msg) => (
              <div key={msg.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{msg.userName}</span>
                    <span className="text-indigo-600 font-mono font-bold ml-2">{msg.customerId}</span>
                    {msg.orderId && (
                      <span className="ml-2 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                        Ref Order #{msg.orderId}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="bg-slate-50 p-3 rounded-xl text-slate-700">{msg.message}</p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Type official reply as store owner..."
                    value={chatReplyText[msg.id] || ''}
                    onChange={(e) => setChatReplyText({ ...chatReplyText, [msg.id]: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-hidden"
                  />
                  <button
                    onClick={async () => {
                      const reply = chatReplyText[msg.id];
                      if (reply) {
                        try {
                          await replySupportMessage(msg.userId, reply, msg.orderId);
                          setChatReplyText({ ...chatReplyText, [msg.id]: '' });
                          setDashboardSuccessMsg('Reply sent to customer successfully!');
                          setTimeout(() => setDashboardSuccessMsg(''), 4000);
                        } catch (err: any) {
                          setDashboardErrorMsg(err.message || 'Error sending reply');
                          setTimeout(() => setDashboardErrorMsg(''), 4000);
                        }
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-xl shadow-xs cursor-pointer"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('support', { userId: msg.userId, orderId: msg.orderId });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                    title="Open live chat to credit wallet or attach images"
                  >
                    <Wallet className="w-3.5 h-3.5" /> Open Chat & Credit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: VOUCHERS */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Manage Store Vouchers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {vouchers.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-4 text-xs space-y-2">
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-sm">
                  {v.code}
                </span>
                <p className="text-slate-600">{v.description}</p>
                <p className="text-slate-400 text-[10px]">Min Order: ₹{v.minOrderValue} | Used: {v.usedCount} times</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Modal with File Upload */}
      {productModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingProductId ? 'Edit Product' : 'Add New Product (Image from File/URL)'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Categories (Can select multiple) *</label>
                    <button
                      type="button"
                      onClick={() => setCategoryModal(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3" /> + New Category
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-28 overflow-y-auto">
                    {categories.map((c) => {
                      const isSelected = prodCategories.includes(c.slug);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => {
                            if (isSelected) {
                              if (prodCategories.length > 1) {
                                setProdCategories(prodCategories.filter((slug) => slug !== c.slug));
                              }
                            } else {
                              setProdCategories([...prodCategories, c.slug]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {c.name} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProd.sellingPrice}
                    onChange={(e) => setNewProd({ ...newProd, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={newProd.originalPrice}
                    onChange={(e) => setNewProd({ ...newProd, originalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    value={newProd.stock}
                    onChange={(e) => setNewProd({ ...newProd, stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                  />
                </div>
              </div>

              {/* Main Thumbnail Image Upload from File */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Product Thumbnail Image (Upload from File) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProductMainImageFile}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="Or paste image URL"
                  value={newProd.mainImage}
                  onChange={(e) => setNewProd({ ...newProd, mainImage: e.target.value })}
                  className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
                {newProd.mainImage && (
                  <img
                    src={newProd.mainImage}
                    alt="Thumbnail preview"
                    className="w-16 h-16 object-contain rounded-xl border border-slate-200 mt-2 p-1"
                  />
                )}
              </div>

              {/* Extra Images from File */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Extra Gallery Images (Upload from File)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleProductExtraImagesMultiple}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {newProd.images && newProd.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {newProd.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Gallery"
                        className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-1"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                />
              </div>

              {/* Product Variants & Sizes (Left: Name, Right: comma-separated sizes) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 block text-xs">
                      Product Variants & Sizes (Optional)
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Left: Variant Name (Size, Color) • Right: Options with comma (S, M, L, XL or 28, 30, 32)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVariantRows([...variantRows, { name: 'Size', optionsStr: 'S, M, L, XL' }])}
                    className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
                  >
                    + Add Variant Group
                  </button>
                </div>

                {variantRows.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Variant (e.g. Size)"
                      value={v.name}
                      onChange={(e) => {
                        const updated = [...variantRows];
                        updated[idx].name = e.target.value;
                        setVariantRows(updated);
                      }}
                      className="w-1/3 bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="Options (e.g. S, M, L, XL, XXL or 28, 30, 32)"
                      value={v.optionsStr}
                      onChange={(e) => {
                        const updated = [...variantRows];
                        updated[idx].optionsStr = e.target.value;
                        setVariantRows(updated);
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-hidden"
                    />
                    {variantRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVariantRows(variantRows.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Product Specifications & Features Catalog Table (Left: Name, Right: Value) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 block text-xs">
                      Catalog Features & Specifications Table (Optional)
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Dynamic table: Left is Feature / Catalog Name, Right is Value
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpecRows([...specRows, { key: '', value: '' }])}
                    className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
                  >
                    + Add Feature Row
                  </button>
                </div>

                {specRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Feature Name (e.g. Fabric / Material / Battery)"
                      value={row.key}
                      onChange={(e) => {
                        const updated = [...specRows];
                        updated[idx].key = e.target.value;
                        setSpecRows(updated);
                      }}
                      className="w-1/2 bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="Feature Value (e.g. 100% Cotton / 30h Playtime)"
                      value={row.value}
                      onChange={(e) => {
                        const updated = [...specRows];
                        updated[idx].value = e.target.value;
                        setSpecRows(updated);
                      }}
                      className="w-1/2 bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-hidden"
                    />
                    {specRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSpecRows(specRows.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Remove Feature"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setProductModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Modal with File Upload & Redirect Link */}
      {bannerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Promotional Banner (Pure Image)</h3>
              <p className="text-xs text-slate-500">
                Upload banner image from file. When clicked on the storefront, visitors are redirected to the link you provide.
              </p>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Upload Banner Image from File *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerImageFile}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="Or paste image URL"
                  value={newBanner.imageUrl}
                  onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                  className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
                {newBanner.imageUrl && (
                  <img
                    src={newBanner.imageUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-xl border border-slate-200 mt-2"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Redirect Link Upon Click *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /products?category=electronics or /products?category=fashion"
                  value={newBanner.link}
                  onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBannerModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md cursor-pointer"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal: Add New Store Category */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
              <p className="text-xs text-slate-500">
                Created categories will immediately appear in product forms, header filters, and category lists.
              </p>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Footwear & Shoes"
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Slug (URL identifier)</label>
                <input
                  type="text"
                  placeholder="e.g. footwear-shoes (auto-generated if empty)"
                  value={newCat.slug}
                  onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Premium casual and sports shoes"
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Packing Slips / Print PDF Bills Modal for Store Owner */}
      {packingSlipModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Modal Actions Header (Hidden in Print) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  <span>Print Orders PDF Bills & Packing Slips</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Batch print all order invoices for packaging & dispatch from Shivaji Nagar, Samastipur, Bihar.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter Selector */}
                <select
                  value={packingSlipStatus}
                  onChange={(e) => setPackingSlipStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 outline-hidden"
                >
                  <option value="all">All Orders ({orders.length})</option>
                  <option value="ordered">Status: Ordered</option>
                  <option value="confirmed">Status: Confirmed</option>
                  <option value="packed">Status: Packed</option>
                  <option value="dispatched">Status: Dispatched</option>
                  <option value="delivered">Status: Delivered</option>
                </select>

                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF Now</span>
                </button>

                <button
                  onClick={() => setPackingSlipModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="overflow-y-auto flex-1 p-2 sm:p-4 space-y-8 bg-slate-100/60 print:bg-white print:p-0 print:space-y-6">
              {(() => {
                const slipsToRender = orders.filter((o) => {
                  if (packingSlipStatus === 'all') return true;
                  if (o.id === packingSlipStatus) return true;
                  return o.orderStatus === packingSlipStatus;
                });

                if (slipsToRender.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      No orders found matching the selected filter.
                    </div>
                  );
                }

                return slipsToRender.map((o, idx) => (
                  <div
                    key={o.id}
                    className="p-6 bg-white border border-slate-300 rounded-2xl shadow-xs print:border print:border-slate-400 print:shadow-none print:p-6 print:rounded-none space-y-4"
                    style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                            TRENDPRO
                          </h1>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                            Marketplace Invoice
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                          Order Packaging Slip & Delivery Bill
                        </p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          <strong>Dispatch Origin Facility:</strong> Near Station Road, Shivaji Nagar, Samastipur, Bihar - 848101
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-mono font-black text-slate-900">#{o.id}</p>
                        <p className="text-[10px] text-slate-500">{new Date(o.createdAt).toLocaleString()}</p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-[10px] font-bold uppercase">
                          Live Status: {o.orderStatus}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Destination Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 print:bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Delivery Destination (Customer):
                        </span>
                        <p className="font-black text-slate-900 text-sm mt-0.5">
                          {o.shippingAddress?.name || o.customerName}
                        </p>
                        <p className="text-slate-700 mt-0.5">
                          Phone: <strong>{o.shippingAddress?.phone}</strong>
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          {o.shippingAddress?.addressLine}, {o.shippingAddress?.locality}
                        </p>
                        <p className="text-slate-800 font-bold">
                          {o.shippingAddress?.city}, {o.shippingAddress?.state} - {o.shippingAddress?.pincode}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          Customer ID: {o.customerId}
                        </p>
                      </div>

                      <div className="space-y-1 text-slate-600">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Dispatch & Payment Details:
                        </span>
                        <p>
                          Dispatch Origin: <strong className="text-slate-900">Shivaji Nagar, Samastipur, Bihar</strong>
                        </p>
                        <p>
                          Payment Mode: <strong className="uppercase text-slate-900">{o.paymentMethod}</strong> ({o.paymentStatus.toUpperCase()})
                        </p>
                        <p>
                          Estimated Delivery: <strong className="text-slate-900">{o.estimatedDelivery || '8 Days from Order Date'}</strong>
                        </p>
                        <p>
                          Website Portal: <strong className="text-indigo-600">trendpro.netlify.app</strong>
                        </p>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-xs text-left border border-slate-200">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Item Description</th>
                          <th className="p-2">Size / Variant</th>
                          <th className="p-2 text-center w-16">Qty</th>
                          <th className="p-2 text-right w-24">Price</th>
                          <th className="p-2 text-right w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {o.items.map((it, itemIdx) => (
                          <tr key={itemIdx}>
                            <td className="p-2 font-mono text-slate-400 text-center">{itemIdx + 1}</td>
                            <td className="p-2 font-bold text-slate-900">
                              {it.name}
                              <span className="block text-[10px] text-slate-400 font-normal">{it.brand}</span>
                            </td>
                            <td className="p-2 text-indigo-700 font-bold">{it.variant || 'Standard'}</td>
                            <td className="p-2 text-center font-black text-slate-900">{it.quantity}</td>
                            <td className="p-2 text-right text-slate-600">₹{it.price.toLocaleString()}</td>
                            <td className="p-2 text-right font-black text-slate-900">
                              ₹{(it.price * it.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        {o.pricing.voucherDiscount > 0 && (
                          <tr>
                            <td colSpan={5} className="p-1.5 text-right text-emerald-600">
                              Coupon Discount ({o.pricing.voucherCode}):
                            </td>
                            <td className="p-1.5 text-right text-emerald-600">
                              - ₹{o.pricing.voucherDiscount.toLocaleString()}
                            </td>
                          </tr>
                        )}
                        {o.pricing.walletUsed > 0 && (
                          <tr>
                            <td colSpan={5} className="p-1.5 text-right text-indigo-600">
                              Wallet Credits Used:
                            </td>
                            <td className="p-1.5 text-right text-indigo-600">
                              - ₹{o.pricing.walletUsed.toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="border-t border-slate-300">
                          <td colSpan={5} className="p-2 text-right text-slate-900 text-sm">
                            Total Bill Payable:
                          </td>
                          <td className="p-2 text-right text-slate-900 text-base font-black">
                            ₹{o.pricing.total.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Footer Packing Sign-Off */}
                    <div className="flex flex-wrap justify-between items-center pt-3 text-[10px] text-slate-500 border-t border-slate-200">
                      <span>TrendPro Dispatch Hub • Shivaji Nagar, Samastipur, Bihar • Slip {idx + 1} of {slipsToRender.length}</span>
                      <div className="flex items-center gap-6">
                        <span>Items Verified [ ✓ ]</span>
                        <span>Packer Signature: __________________</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Cancellation Action Modal */}
      {cancelActionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    cancelActionModal.action === 'approve'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {cancelActionModal.action === 'approve'
                      ? 'Approve Order Cancellation'
                      : 'Reject Cancellation Request'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Order #{cancelActionModal.order.id} • {cancelActionModal.order.customerName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCancelActionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Amount:</span>
                <span className="font-black text-slate-900">
                  ₹{cancelActionModal.order.pricing.total.toLocaleString()} ({cancelActionModal.order.paymentMethod.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-indigo-700 capitalize">
                  {cancelActionModal.order.paymentStatus}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-0.5 font-semibold">Customer's Reason:</span>
                <p className="italic text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                  &ldquo;{cancelActionModal.order.cancelRequest?.reason}&rdquo;
                </p>
              </div>
            </div>

            {/* Action Notice */}
            {cancelActionModal.action === 'approve' ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-1">
                <p className="font-bold">Automated Operations on Approval:</p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-emerald-700">
                  <li>Order status updated to &ldquo;Cancelled&rdquo;</li>
                  <li>Product inventory automatically restored to catalog</li>
                  <li>
                    {cancelActionModal.order.paymentMethod === 'cod' && cancelActionModal.order.paymentStatus !== 'paid'
                      ? 'Unpaid Cash on Delivery: No uncollected funds deducted.'
                      : `Full payment of ₹${cancelActionModal.order.pricing.total.toLocaleString()} credited to customer wallet`}
                  </li>
                  <li>Customer receives real-time notification</li>
                </ul>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                <p className="font-bold">Rejection Notice:</p>
                <p className="text-[11px] mt-0.5 text-rose-700">
                  Order status remains &ldquo;{cancelActionModal.order.orderStatus}&rdquo;. The customer will be informed of your decision.
                </p>
              </div>
            )}

            {/* Admin Note Input */}
            <div>
              <label className="font-bold text-slate-700 block text-xs mb-1">
                Message / Explanation to Customer:
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Enter note or explanation for the customer..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelActionModal(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                disabled={isProcessingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeCancelAction}
                disabled={isProcessingAction}
                className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  cancelActionModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {cancelActionModal.action === 'approve'
                      ? 'Confirm & Process Approval'
                      : 'Confirm Rejection'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Action Modal */}
      {returnActionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    returnActionModal.action === 'approve'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {returnActionModal.action === 'approve'
                      ? 'Approve Return & Refund'
                      : 'Reject Return Request'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Order #{returnActionModal.order.id} • {returnActionModal.order.customerName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReturnActionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Total:</span>
                <span className="font-black text-slate-900">
                  ₹{returnActionModal.order.pricing.total.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-0.5 font-semibold">Customer's Return Reason:</span>
                <p className="italic text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                  &ldquo;{returnActionModal.order.returnRequest?.reason}&rdquo;
                </p>
              </div>

              {/* Customer Attached Photos */}
              {returnActionModal.order.returnRequest?.extraImages &&
                returnActionModal.order.returnRequest.extraImages.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1 font-semibold">Inspection Photos:</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {returnActionModal.order.returnRequest.extraImages.map((img, i) => (
                        <a
                          key={i}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="w-14 h-14 rounded-lg overflow-hidden border border-slate-300 block shrink-0 hover:opacity-90"
                        >
                          <img src={img} alt="Defect" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Action Notice */}
            {returnActionModal.action === 'approve' ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                <p className="font-bold">Operations on Return Approval:</p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800">
                  <li>Order status updated to &ldquo;Returned&rdquo;</li>
                  <li>Stock restored for delivered items</li>
                  <li>
                    ₹{returnActionModal.order.pricing.total.toLocaleString()} credited to customer wallet
                  </li>
                  <li>Customer notified via in-app notification</li>
                </ul>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                <p className="font-bold">Rejection Notice:</p>
                <p className="text-[11px] mt-0.5 text-rose-700">
                  Order status remains &ldquo;Delivered&rdquo;. The customer will receive your rejection note.
                </p>
              </div>
            )}

            {/* Admin Note Input */}
            <div>
              <label className="font-bold text-slate-700 block text-xs mb-1">
                Note for Customer:
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Enter note or return instructions..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnActionModal(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                disabled={isProcessingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeReturnAction}
                disabled={isProcessingAction}
                className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  returnActionModal.action === 'approve'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {returnActionModal.action === 'approve'
                      ? 'Confirm Return & Refund'
                      : 'Confirm Rejection'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
