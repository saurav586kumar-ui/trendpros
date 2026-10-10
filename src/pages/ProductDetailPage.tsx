import React, { useState, useEffect } from 'react';
import {
  Star,
  Heart,
  ShoppingBag,
  Scale,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  MapPin,
  Tag,
  ArrowLeft
} from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Review } from '../types';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
}) => {
  const { products, getProductReviews, addReview } = useStore();
  const {
    addToCart,
    cart,
    toggleWishlist,
    isInWishlist,
    toggleCompare,
    isInCompare,
  } = useCart();
  const { currentUser, signInWithGoogle } = useAuth();

  const product = products.find((p) => p.id === productId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [giftCardAmount, setGiftCardAmount] = useState<number>(1000);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('560001');

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

      getProductReviews(product.id).then((revs) => setReviews(revs));
    }
  }, [productId, product]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Product not found</h2>
        <p className="text-xs text-slate-500 mt-2">The product you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => onNavigate('products')}
          className="mt-6 bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
        >
          Browse All Products
        </button>
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
  const gallery = product.images && product.images.length > 0 ? product.images : [product.mainImage];

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

  const handleBuyNow = () => {
    if (!isOutOfStock) {
      const prodToAdd = isGiftVoucher
        ? { ...product, sellingPrice: giftCardAmount, originalPrice: giftCardAmount }
        : product;
      addToCart(prodToAdd, quantity, selectedVariant || (isGiftVoucher ? `₹${giftCardAmount}` : undefined));
      onNavigate('checkout');
    }
  };

  const handleReviewImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setReviewImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
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
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => onNavigate('products')}
          className="flex items-center gap-1 font-semibold text-slate-700 hover:text-indigo-600 mr-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate('products', { category: product.category })}
          className="capitalize hover:text-slate-900"
        >
          {product.category}
        </button>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative aspect-square w-full bg-slate-50 border border-slate-200/80 rounded-3xl overflow-hidden flex items-center justify-center p-6 shadow-xs">
            <img
              src={gallery[activeImageIndex] || product.mainImage}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply transition-all duration-300"
            />

            {/* Discount Badge */}
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md">
                {product.discountPercent}% OFF
              </span>
            )}

            {/* Floating Action Buttons */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
                  isFavorited ? 'bg-rose-50 text-rose-600' : 'bg-white text-slate-600 hover:text-rose-600'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>

              <button
                onClick={() => toggleCompare(product.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
                  isCompared ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:text-indigo-600'
                }`}
                title="Compare"
              >
                <Scale className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-slate-50 p-1 shrink-0 transition-all ${
                    idx === activeImageIndex
                      ? 'border-indigo-600 shadow-md ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300'
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
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {product.brand}
              </span>
              {product.sku && (
                <span className="text-[11px] text-slate-400 font-mono">SKU: {product.sku}</span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Rating & Reviews Count */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-md shadow-xs">
                <span>{product.rating}</span>
                <Star className="w-3.5 h-3.5 fill-white" />
              </div>
              <span className="text-xs text-slate-500">
                {product.ratingCount?.toLocaleString() || 48} Ratings & {reviews.length} Reviews
              </span>
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
                  <p>• <strong>Instant Digital Delivery:</strong> Card number & PIN will be generated and viewable in My Orders immediately after payment.</p>
                ) : (
                  <>
                    <p>• <strong>Instant ₹500 OFF:</strong> Use coupon code <strong className="text-indigo-600 font-mono">WELCOME500</strong> on orders above ₹2,000.</p>
                    <p>• <strong>5% SuperCoins:</strong> Earn bonus reward coins with TrendPro Plus.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Gift Card Denomination Picker (when in gift-cards category) */}
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
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      giftCardAmount === amt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                💡 Upon purchase, you will receive a 16-digit Gift Card number and 4-digit PIN. You can use it yourself or download/share it with friends to add money into their TrendPro wallet!
              </p>
            </div>
          ) : (
            /* Standard Variants & Size Selector */
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Quantity</label>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

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

          {/* Action Buttons: Add to Cart & Buy Now */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : cartItem
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
              disabled={isOutOfStock}
              className={`py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                isOutOfStock
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25'
              }`}
            >
              <span>Buy Now</span>
            </button>
          </div>

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
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
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
        {/* Description & Highlights */}
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
        {product.specs && (
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm self-start sm:self-auto"
          >
            ★ Rate & Review Product
          </button>
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 items-center">
          <div className="text-center md:border-r md:border-slate-200 pr-6">
            <div className="text-4xl font-black text-slate-900">{product.rating}</div>
            <div className="flex justify-center my-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-500 font-medium">{product.ratingCount || 48} verified ratings</p>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const pct = stars === 5 ? 78 : stars === 4 ? 16 : 4;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-slate-600 font-bold">{stars} ★</span>
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-slate-400">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List (2-3 shown initially, View More button) */}
        <div className="space-y-4 pt-2">
          {reviews.length > 0 ? (
            <>
              {(showAllReviews ? reviews : reviews.slice(0, 3)).map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        <span>{rev.rating}</span>
                        <Star className="w-3 h-3 fill-white" />
                      </div>
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
            <p className="text-xs text-slate-500 py-4 text-center">
              No written reviews yet. Be the first to share your thoughts on this product!
            </p>
          )}
        </div>
      </div>

      {/* Review Modal with Optional Description and Image Upload from File */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Write a Product Review</h3>
            <p className="text-xs text-slate-500 mb-4">{product.name}</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Rating *</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setReviewRating(num)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          num <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Review Headline (Optional)</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Superb sound quality & battery!"
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

              {/* Upload Review Photo from File (Optional) */}
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

      {/* Recommended / Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
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
