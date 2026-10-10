import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useAuth, OWNER_EMAIL } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Product, OrderStatus, Banner, Voucher, StoreAnnouncementConfig } from '../types';

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
    orders,
    banners,
    vouchers,
    supportMessages,
    announcementConfig,
    seedInitialDataToFirestore,
    updateOrderStatus,
    handleCancelRequest,
    handleReturnRequest,
    addProduct,
    updateProduct,
    deleteProduct,
    addBanner,
    deleteBanner,
    replySupportMessage,
    creditCustomerWalletFromChat,
    updateAnnouncementConfig,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'banners' | 'announcement' | 'support' | 'vouchers'
  >('overview');

  // Product Modal & Image Upload
  const [productModal, setProductModal] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: '',
    brand: '',
    category: 'electronics',
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

  // Action note prompt
  const [actionAdminNote, setActionAdminNote] = useState('');
  const [activeRequestOrderId, setActiveRequestOrderId] = useState<string | null>(null);
  const [requestActionType, setRequestActionType] = useState<'cancel' | 'return' | null>(null);

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

  // File Upload Helper
  const handleProductMainImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewProd((prev) => ({
            ...prev,
            mainImage: reader.result as string,
            images: prev.images?.length ? [reader.result as string, ...prev.images.slice(1)] : [reader.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductExtraImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewProd((prev) => ({
            ...prev,
            images: [...(prev.images || []), reader.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    }
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
      if (editingProductId) {
        await updateProduct(editingProductId, newProd);
      } else {
        await addProduct({
          name: newProd.name,
          slug: newProd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          brand: newProd.brand || 'TrendPro Select',
          category: newProd.category || 'electronics',
          description: newProd.description || 'Premium quality marketplace product.',
          highlights: newProd.highlights || ['1 Year Brand Warranty'],
          mainImage: newProd.mainImage,
          images: newProd.images?.length ? newProd.images : [newProd.mainImage],
          originalPrice: newProd.originalPrice || newProd.sellingPrice * 1.25,
          sellingPrice: newProd.sellingPrice,
          discountPercent:
            Math.round(((newProd.originalPrice! - newProd.sellingPrice) / newProd.originalPrice!) * 100) || 15,
          stock: newProd.stock || 25,
          rating: 4.8,
          ratingCount: 1,
          isActive: true,
        });
      }
      setProductModal(false);
      setEditingProductId(null);
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.imageUrl) {
      alert('Please upload or provide a banner image.');
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
    } catch (err: any) {
      alert(err.message || 'Error saving banner');
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAnnouncementConfig(localAnnouncement);
      setAnnouncementSavedMsg('Top offer banner settings updated successfully!');
      setTimeout(() => setAnnouncementSavedMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating announcement');
    }
  };

  const handleSeedDatabase = async () => {
    setSeedingStatus('Synchronizing sample catalog & categories to Firestore...');
    try {
      await seedInitialDataToFirestore();
      setSeedingStatus('Catalog synchronized successfully to Cloud Firestore!');
      setTimeout(() => setSeedingStatus(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error syncing database');
      setSeedingStatus('');
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
          </div>

          {/* Granular Order Status Columns Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedStatusCol('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedStatusCol === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              All Columns ({orders.length})
            </button>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
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
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {o.customerName} &lt;{o.customerEmail}&gt; • {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold">Move Status Column:</span>
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
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-rose-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          Customer Cancellation Request Pending
                        </p>
                        <p className="text-rose-700 mt-0.5">Reason: &ldquo;{o.cancelRequest.reason}&rdquo;</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const note = prompt('Enter rejection reason note for customer:');
                            if (note !== null) handleCancelRequest(o.id, false, note);
                          }}
                          className="px-3 py-1.5 bg-white border border-rose-300 text-rose-700 font-bold rounded-xl hover:bg-rose-100"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Approve cancellation and refund ₹${o.pricing.total} to customer's wallet?`)) {
                              handleCancelRequest(o.id, true, 'Approved by store owner');
                            }
                          }}
                          className="px-3.5 py-1.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-xs"
                        >
                          Accept & Refund ₹{o.pricing.total}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Customer Return Request Pending */}
                  {o.returnRequest && o.returnRequest.status === 'pending' && (
                    <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-amber-900 flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-amber-600" />
                          Customer Return & Refund Request Pending
                        </p>
                        <p className="text-amber-800 mt-0.5">Reason: &ldquo;{o.returnRequest.reason}&rdquo;</p>
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

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const note = prompt('Enter rejection reason note for customer:');
                            if (note !== null) handleReturnRequest(o.id, false, note);
                          }}
                          className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 font-bold rounded-xl hover:bg-amber-100"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Approve return and refund ₹${o.pricing.total} to customer's wallet?`)) {
                              handleReturnRequest(o.id, true, 'Return accepted by store owner');
                            }
                          }}
                          className="px-3.5 py-1.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-xs"
                        >
                          Accept & Refund ₹{o.pricing.total}
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
                  category: 'electronics',
                  sellingPrice: 1999,
                  originalPrice: 2999,
                  stock: 25,
                  mainImage: '',
                  images: [],
                  description: '',
                });
                setProductModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Product (With File Upload)
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
                          setProductModal(true);
                        }}
                        className="text-slate-600 hover:text-indigo-600 p-1"
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

      {/* TAB 4: HERO BANNERS (FROM FILE + REDIRECT LINK) */}
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
                        await replySupportMessage(msg.userId, reply, msg.orderId);
                        setChatReplyText({ ...chatReplyText, [msg.id]: '' });
                        alert('Reply sent to customer!');
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-xl shadow-xs"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      const amt = prompt('Enter wallet amount (₹) to credit this customer:');
                      if (amt && Number(amt) > 0) {
                        const reason = prompt('Enter reason for credit:', 'Store courtesy bonus');
                        creditCustomerWalletFromChat(msg.userId, Number(amt), reason || 'Store credit');
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1"
                  >
                    <Wallet className="w-3.5 h-3.5" /> +Credit
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
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    <option value="home-kitchen">Home & Kitchen</option>
                    <option value="beauty">Beauty</option>
                    <option value="grocery">Grocery</option>
                    <option value="accessories">Accessories</option>
                    <option value="gift-cards">Gift Cards & Vouchers</option>
                  </select>
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
                  onChange={handleProductExtraImageFile}
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
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
