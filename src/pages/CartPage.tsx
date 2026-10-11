import React, { useState } from 'react';
import {
  Trash2,
  Heart,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  Wallet,
  ArrowLeft
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Voucher } from '../types';

interface CartPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    totalDiscount,
    deliveryCharge,
    toggleWishlist,
  } = useCart();

  const { applyVoucher, products } = useStore();
  const { currentUser, userProfile } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
    voucher?: Voucher;
  } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [useWalletBalance, setUseWalletBalance] = useState(false);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    if (!couponCode.trim()) return;

    const res = applyVoucher(couponCode, subtotal);
    if (res.valid) {
      setAppliedVoucher({
        code: couponCode.trim().toUpperCase(),
        discount: res.discount,
        voucher: res.voucher,
      });
      setVoucherError('');
    } else {
      setVoucherError(res.message);
      setAppliedVoucher(null);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setCouponCode('');
    setVoucherError('');
  };

  const voucherDiscount = appliedVoucher ? appliedVoucher.discount : 0;
  const currentWallet = userProfile?.walletBalance || 0;
  const amountBeforeWallet = Math.max(0, subtotal - voucherDiscount + deliveryCharge);
  const walletDeduction = useWalletBalance ? Math.min(currentWallet, amountBeforeWallet) : 0;
  const finalTotal = Math.max(0, amountBeforeWallet - walletDeduction);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          Explore our trending gadgets, apparel, and lifestyle collection to find something you love!
        </p>
        <button
          onClick={() => onNavigate('products')}
          className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95"
        >
          <span>Shop Trending Products</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('products')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Shopping Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-slate-500 hover:text-rose-600 font-semibold transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {cart.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <div
                key={item.productId}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex gap-4 sm:gap-6 shadow-xs hover:border-indigo-200 transition-colors"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => onNavigate('product-detail', { id: item.productId })}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-2 cursor-pointer border border-slate-100"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.brand}
                        </p>
                        <h3
                          onClick={() => onNavigate('product-detail', { id: item.productId })}
                          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-2"
                        >
                          {item.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.selectedVariant && (
                      <span className="inline-block mt-1 text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                        Option: {item.selectedVariant}
                      </span>
                    )}

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-base font-black text-slate-900">
                        ₹{item.price.toLocaleString()}
                      </span>
                      {item.originalPrice > item.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Move to Wishlist */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        toggleWishlist(item.productId);
                        removeFromCart(item.productId);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Move to Wishlist
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Coupon / Voucher Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-600" />
              Apply Coupons & Vouchers
            </h3>

            {appliedVoucher ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-emerald-800">
                    {appliedVoucher.code} Applied!
                  </p>
                  <p className="text-[11px] text-emerald-600">
                    You saved ₹{appliedVoucher.discount.toLocaleString()} on this order
                  </p>
                </div>
                <button
                  onClick={handleRemoveVoucher}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME500"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase outline-hidden focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
                >
                  Apply
                </button>
              </form>
            )}

            {voucherError && (
              <p className="text-[11px] text-rose-600 font-semibold">{voucherError}</p>
            )}

            <div className="pt-2 text-[11px] text-slate-400">
              💡 Tip: Try code <span className="font-mono text-indigo-600 font-bold">WELCOME500</span> for ₹500 off above ₹2,000!
            </div>
          </div>

          {/* Wallet Credits Redemption */}
          {currentUser && currentWallet > 0 && (
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">TrendPro Wallet Credits</p>
                  <p className="text-[11px] text-indigo-700">
                    Available Balance: ₹{currentWallet.toLocaleString()}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWalletBalance}
                  onChange={(e) => setUseWalletBalance(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-indigo-900">Use</span>
              </label>
            </div>
          )}

          {/* Price Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Price Details
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Price ({cart.length} items)</span>
                <span>₹{(subtotal + totalDiscount).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Product Discounts</span>
                <span>- ₹{totalDiscount.toLocaleString()}</span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({appliedVoucher?.code})</span>
                  <span>- ₹{voucherDiscount.toLocaleString()}</span>
                </div>
              )}

              {walletDeduction > 0 && (
                <div className="flex justify-between text-indigo-600 font-medium">
                  <span>TrendPro Wallet Credits</span>
                  <span>- ₹{walletDeduction.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges</span>
                <span>
                  {deliveryCharge === 0 ? (
                    <strong className="text-emerald-600">FREE</strong>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900">Total Amount</span>
                <span className="text-xl font-black text-slate-900">
                  ₹{finalTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('trendpro_checkout_mode', 'cart');
                  sessionStorage.removeItem('trendpro_buy_now_intent');
                } catch {}
                onNavigate('checkout', {
                  mode: 'cart',
                  voucherCode: appliedVoucher?.code,
                  voucherDiscount,
                  useWallet: useWalletBalance,
                  walletUsed: walletDeduction,
                });
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-500/25 transition-all text-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe and 100% Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
