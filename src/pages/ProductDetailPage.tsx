import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingBag,
  Scale,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  MapPin,
  Tag,
  ArrowLeft,
  Share2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Star
} from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { StarRating } from '../components/common/StarRating';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Review, CartItem } from '../types';
import { shareProduct } from '../utils/sharing';
import { uploadImageFile } from '../utils/storage';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
}) => {
  const {
    products,
    getProductReviews,
    addReview,
    subscribeToRestock,
    unsubscribeFromRestock,
    isSubscribedToRestock,
  } = useStore();
  const {
    addToCart,
    cart,
    toggleWishlist,
    isInWishlist,
    toggleCompare,
    isInCompare,
  } = useCart();
  const { currentUser, signInWithGoogle } = useAuth();

  // Find product by id, slug, or slug-id composite
  const cleanId = (productId || '').trim();
  const product = products.find((p) => {
    if (!cleanId) return false;
    if (p.id === cleanId) return true;
    if (p.slug && p.slug === cleanId) return true;
    if (p.slug && cleanId === `${p.slug}-${p.id}`) return true;
    if (cleanId.endsWith(p.id)) return true;
    return false;
  });

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [giftCardAmount, setGiftCardAmount] = useState<number>(1000);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('560001');
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null);

  // Standard 8 days delivery date calculation
  const deliveryDate8Days = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const [pincodeStatus, setPincodeStatus] = useState<string>(
    `Standard Delivery: By ${deliveryDate8Days} (8 Days Dispatch) | Free`
  );

  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0 && product.variants[0].options.length > 0) {
        setSelectedVariant(product.variants[0].options[0]);
      }
      setActiveImageIndex(0);
      setQuantity(1);
      if (product.isGiftVoucher || product.category === 'gift-cards') {
        setGiftCardAmount(1000);
      }

      // Check restock subscription status
      if (currentUser) {
        isSubscribedToRestock(product.id).then((sub) => setIsSubscribed(sub));
      }

      getProductReviews(product.id).then((revs) => setReviews(revs));
    }
  }, [cleanId, product, currentUser]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Product Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          The product you are trying to view does not exist or may have been unlisted by the store.
        </p>
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => onNavigate('home')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer"
          >
            Go to Homepage
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Browse All Products
          </button>
        </div>
      </div>
    );
  }

  const isGiftVoucher = Boolean(product.isGiftVoucher || product.category === 'gift-cards');
  const currentSellingPrice = isGiftVoucher ? giftCardAmount : product.sellingPrice;
  const currentOriginalPrice = isGiftVoucher ? giftCardAmount : product.originalPrice;

  const isFavorited = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const cartItem = cart.find((i) => i.productId === product.id);
  const isOutOfStock = !isGiftVoucher && product.stock <= 0;

  // Build unified, de-duplicated gallery with mainImage first
  const gallery = [product.mainImage, ...(product.images || [])]
    .filter(Boolean)
    .filter((url, idx, arr) => arr.indexOf(url) === idx);

  const activeImage = gallery[activeImageIndex] || product.mainImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';

  const handlePincodeCheck = () => {
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      setPincodeStatus(`Standard Delivery: Expected by ${deliveryDate8Days} (8 Days Dispatch from Samastipur Hub) | Free Delivery`);
    } else {
      setPincodeStatus('Please enter a valid 6-digit Indian PIN code.');
    }
  };

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      const prodToAdd = isGiftVoucher
        ? { ...product, sellingPrice: giftCardAmount, originalPrice: giftCardAmount }
        : product;
      addToCart(prodToAdd, quantity, selectedVariant || (isGiftVoucher ? `₹${giftCardAmount}` : undefined));
    }
  };

  // Requirement 6: Dedicated Buy Now flow without contaminating regular cart
  const handleBuyNow = () => {
    if (!isOutOfStock) {
      const buyNowItem: CartItem = {
        productId: product.id,
        name: product.name,
        price: currentSellingPrice,
        originalPrice: currentOriginalPrice,
        image: product.mainImage,
        brand: product.brand,
        quantity,
        stock: product.stock,
        selectedVariant: selectedVariant || (isGiftVoucher ? `₹${giftCardAmount}` : undefined),
        isGiftVoucher,
      };

      // Safely preserve in session storage for back button navigation resilience
      try {
        sessionStorage.setItem('trendpro_buynow_item', JSON.stringify(buyNowItem));
      } catch {}

      onNavigate('checkout', {
        mode: 'buy_now',
        buyNowItem,
      });
    }
  };

  const handleShare = async () => {
    const res = await shareProduct(product);
    if (res.message) {
      setShareToast(res.message);
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  const handleToggleRestockNotification = async () => {
    if (!currentUser) {
      signInWithGoogle();
      return;
    }
    setSubscribing(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromRestock(product.id);
        setIsSubscribed(false);
        setSubscribeMessage('Restock alert removed.');
      } else {
        await subscribeToRestock(product.id, product.name, selectedVariant);
        setIsSubscribed(true);
        setSubscribeMessage('Subscribed! We will alert you immediately when restocked.');
      }
      setTimeout(() => setSubscribeMessage(null), 3500);
    } catch (e: any) {
      alert(e.message || 'Error updating restock subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const handleReviewImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImageFile(file, 'reviews');
        setReviewImages((prev) => [...prev, url]);
      } catch (err: any) {
        alert(err.message || 'Failed to upload review image');
      }
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      signInWithGoogle();
      return;
    }

    setReviewSubmitting(true);
    try {
      await addReview(
        product.id,
        reviewRating,
        reviewTitle.trim() || undefined,
        reviewComment.trim() || undefined,
        reviewImages.length ? reviewImages : undefined
      );
      const updated = await getProductReviews(product.id);
      setReviews(updated);
      setShowReviewModal(false);
      setReviewTitle('');
      setReviewComment('');
      setReviewImages([]);
    } catch (err: any) {
      alert(err.message || 'Error submitting review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const relatedProducts = products
    .filter((p) => {
      if (p.id === product.id) return false;
      const sameCat =
        p.category === product.category ||
        (product.categories && p.categories && p.categories.some((c) => product.categories?.includes(c)));
      return sameCat;
    })
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* Breadcrumbs and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('products')}
            className="flex items-center gap-1 font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </button>
          <span>/</span>
          <button
            onClick={() => onNavigate('products', { category: product.category })}
            className="capitalize hover:text-slate-900 cursor-pointer"
          >
            {product.category}
          </button>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
        </div>

        {/* Share Button with Live Toast Feedback */}
        <div className="relative">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Share Product Link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="font-semibold">Share</span>
          </button>

          {shareToast && (
            <div className="absolute right-0 top-10 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-30 animate-in fade-in duration-200">
              {shareToast}
            </div>
          )}
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative aspect-square w-full bg-slate-50 border border-slate-200/80 rounded-3xl overflow-hidden flex items-center justify-center p-6 shadow-xs group">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply transition-all duration-300 cursor-zoom-in"
              onClick={() => setIsZoomOpen(true)}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
              }}
            />

            {/* Discount Badge */}
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md z-10">
                {product.discountPercent}% OFF
              </span>
            )}

            {/* Floating Action Buttons */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer ${
                  isFavorited ? 'bg-rose-50 text-rose-600' : 'bg-white text-slate-600 hover:text-rose-600'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>

              <button
                onClick={() => toggleCompare(product.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer ${
                  isCompared ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:text-indigo-600'
                }`}
                title="Compare"
              >
                <Scale className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsZoomOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors bg-white text-slate-600 hover:text-indigo-600 cursor-pointer"
                title="Zoom Preview"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Carousel Navigation Arrows */}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Gallery Thumbnails List */}
          {gallery.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-slate-50 p-1 shrink-0 transition-all cursor-pointer ${
                    idx === activeImageIndex
                      ? 'border-indigo-600 shadow-md ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Purchase Form (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {product.brand}
              </span>
              {product.categories && product.categories.length > 0 ? (
                product.categories.map((cat, i) => (
                  <span
                    key={i}
                    onClick={() => onNavigate('products', { category: cat })}
                    className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                  >
                    {cat}
                  </span>
                ))
              ) : (
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                  {product.category}
                </span>
              )}
              {product.sku && (
                <span className="text-[11px] text-slate-400 font-mono ml-auto">SKU: {product.sku}</span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Real Proportional Star Rating */}
            <div className="flex items-center gap-3 mt-3">
              <StarRating
                rating={product.rating || 0}
                reviewCount={product.ratingCount}
                showBadge={true}
                size="sm"
              />
              <span className="text-xs text-indigo-600 font-semibold">• 100% Verified Buyer Reviews</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{currentSellingPrice.toLocaleString()}
              </span>
              {!isGiftVoucher && currentOriginalPrice > currentSellingPrice && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    ₹{currentOriginalPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {product.discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isGiftVoucher ? 'Digital Value Loaded • Online Payment Only' : 'Inclusive of all taxes'}
            </p>

            {/* Bank / Voucher Offers */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                Available Offers
              </p>
              <div className="text-xs text-slate-600 space-y-1">
                {isGiftVoucher ? (
                  <p>• <strong>Instant Digital Delivery:</strong> Card number & PIN generated and redeemable in wallet immediately.</p>
                ) : (
                  <>
                    <p>• <strong>Instant ₹500 OFF:</strong> Use coupon code <strong className="text-indigo-600 font-mono">WELCOME500</strong> on orders above ₹2,000.</p>
                    <p>• <strong>5% SuperCoins:</strong> Earn bonus reward coins with TrendPro Plus.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Gift Card Denomination Picker */}
          {isGiftVoucher ? (
            <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/80">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Choose Gift Card Value: <span className="text-indigo-600 font-black">₹{giftCardAmount.toLocaleString()}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[500, 1000, 2000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setGiftCardAmount(amt)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      giftCardAmount === amt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Standard Variants & Options */
            product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                {product.variants.map((vGroup, vIdx) => (
                  <div key={vIdx} className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Choose {vGroup.name}: <span className="text-indigo-600 font-bold">{selectedVariant}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {vGroup.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedVariant(opt)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            selectedVariant === opt
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-105'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Quantity Selector & Stock Status */}
          <div className="flex items-center gap-6">
            {!isOutOfStock && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Quantity</label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-700">Stock Availability</p>
              <p className={`text-xs font-bold mt-1 ${product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {product.stock > 5
                  ? `In Stock (${product.stock} units available)`
                  : product.stock > 0
                  ? `Hurry! Only ${product.stock} left in stock`
                  : 'Currently Out of Stock'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Add to Cart & Buy Now OR Out of Stock Notify Me */}
          {isOutOfStock ? (
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-black uppercase tracking-wider">Out of Stock</span>
                </div>
                <p className="text-xs text-rose-700">
                  This product is temporarily unavailable. Subscribe below and we will automatically notify you the moment stock arrives!
                </p>
              </div>

              <button
                onClick={handleToggleRestockNotification}
                disabled={subscribing}
                className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                  isSubscribed
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Subscribed! (Click to cancel alert)</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Notify Me When Available</span>
                  </>
                )}
              </button>

              {subscribeMessage && (
                <p className="text-xs font-semibold text-emerald-600 text-center animate-in fade-in duration-200">
                  {subscribeMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
              <button
                onClick={handleAddToCart}
                className={`py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                  cartItem
                    ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-400'
                    : 'bg-white hover:bg-indigo-50 text-indigo-600 border-2 border-indigo-600'
                }`}
              >
                {cartItem ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>In Cart ({cartItem.quantity})</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                className="py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25 cursor-pointer"
              >
                <span>Buy Now</span>
              </button>
            </div>
          )}

          {/* Delivery Pincode Checker */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              Check Delivery & COD Availability
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.slice(0, 6))}
                placeholder="Enter 6-digit PIN code"
                maxLength={6}
                className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 w-48 outline-hidden focus:border-indigo-500"
              />
              <button
                onClick={handlePincodeCheck}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Check
              </button>
            </div>
            {pincodeStatus && (
              <p className="text-xs text-indigo-700 font-medium">{pincodeStatus}</p>
            )}
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs text-slate-600">
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="font-bold text-slate-800">{product.warranty || 'Brand Warranty'}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col items-center">
              <RotateCcw className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="font-bold text-slate-800">7 Days Return</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col items-center">
              <Truck className="w-5 h-5 text-amber-600 mb-1" />
              <span className="font-bold text-slate-800">Express Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Highlights Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-8 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3">Product Overview</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
            {product.description}
          </p>

          {product.highlights && product.highlights.length > 0 && (
            <div className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Key Highlights</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Specifications Table */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Specifications</h2>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-w-3xl">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 p-3 text-xs">
                  <span className="font-semibold text-slate-500">{key}</span>
                  <span className="col-span-2 text-slate-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In The Box */}
        {product.inTheBox && (
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">In The Box</h2>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 inline-block">
              {product.inTheBox}
            </p>
          </div>
        )}
      </div>

      {/* Customer Ratings & Reviews Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Ratings & Customer Reviews</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real verified feedback from TrendPro shoppers</p>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                signInWithGoogle();
              } else {
                setShowReviewModal(true);
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm self-start sm:self-auto cursor-pointer"
          >
            ★ Rate & Review Product
          </button>
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 items-center">
          <div className="text-center md:border-r md:border-slate-200 pr-6">
            <div className="text-4xl font-black text-slate-900">
              {product.rating > 0 ? product.rating.toFixed(1) : '—'}
            </div>
            <div className="flex justify-center my-1.5">
              <StarRating rating={product.rating || 0} showCount={false} size="md" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {product.ratingCount !== undefined && product.ratingCount > 0
                ? `${product.ratingCount} verified ratings`
                : 'No reviews submitted yet'}
            </p>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const countForStar = reviews.filter((r) => Math.round(r.rating) === stars).length;
              const totalRevs = reviews.length;
              const pct = totalRevs > 0 ? Math.round((countForStar / totalRevs) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-slate-600 font-bold">{stars} ★</span>
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-slate-400">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4 pt-2">
          {reviews.length > 0 ? (
            <>
              {(showAllReviews ? reviews : reviews.slice(0, 3)).map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating rating={rev.rating} showCount={false} showBadge={true} size="xs" />
                      <span className="text-xs font-bold text-slate-900">{rev.title || 'Verified Rating'}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rev.comment && <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>}

                  {/* Customer Review Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {rev.images.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt="Customer uploaded review"
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700">{rev.userName}</span>
                    {rev.isVerifiedPurchase && (
                      <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                        <Check className="w-3 h-3" /> Certified Buyer
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {reviews.length > 3 && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {showAllReviews
                      ? 'Show Fewer Reviews ↑'
                      : `View All (${reviews.length}) Customer Reviews & Photos ↓`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="text-xs text-slate-500">No written reviews yet for this product.</p>
              <button
                onClick={() => {
                  if (!currentUser) signInWithGoogle();
                  else setShowReviewModal(true);
                }}
                className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Be the first verified shopper to rate and review it!
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">Write a Product Review</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{product.name}</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Rating *</label>
                <div className="flex items-center gap-3">
                  <StarRating
                    interactive={true}
                    rating={reviewRating}
                    onRatingChange={setReviewRating}
                    size="lg"
                    showCount={false}
                  />
                  <span className="text-xs font-bold text-slate-700">{reviewRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Review Headline (Optional)</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Superb sound quality & battery life!"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Feedback (Optional)</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell other shoppers what you liked or disliked about this product..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Upload Review Photo from File */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Upload Product Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReviewImageFile}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {reviewImages.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {reviewImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Review Attachment"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {reviewSubmitting ? 'Posting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Resolution Zoom Preview Modal */}
      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-rose-400 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] p-4 flex items-center justify-center">
            <img
              src={activeImage}
              alt={product.name}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Recommended / Similar Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-slate-900">Similar Products You Might Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
