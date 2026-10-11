import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  MapPin,
  Plus,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  CheckCircle2,
  Lock,
  ArrowLeft,
  AlertCircle,
  Wallet,
  Gift,
  Tag,
  X,
  Check,
  ShoppingBag,
  Zap
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Address, OrderItem, Voucher } from '../types';

export interface BuyNowItem {
  productId: string;
  name: string;
  brand?: string;
  image: string;
  price: number;
  quantity: number;
  selectedVariant?: string;
  isGiftVoucher?: boolean;
}

interface CheckoutPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
  checkoutParams?: {
    mode?: 'cart' | 'buyNow';
    buyNowItem?: BuyNowItem;
    voucherCode?: string;
    voucherDiscount?: number;
    useWallet?: boolean;
    walletUsed?: number;
  };
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onNavigate,
  checkoutParams,
}) => {
  const { cart, clearCart } = useCart();
  const { products, vouchers, applyVoucher, createOrder } = useStore();
  const { currentUser, userProfile, signInWithGoogle } = useAuth();

  // Detect checkout mode: explicit 'buyNow' vs 'cart'
  const checkoutMode: 'cart' | 'buyNow' = useMemo(() => {
    if (checkoutParams?.mode === 'buyNow') return 'buyNow';
    try {
      const stored = sessionStorage.getItem('trendpro_checkout_mode');
      if (stored === 'buyNow') return 'buyNow';
    } catch {}
    return 'cart';
  }, [checkoutParams?.mode]);

  // Retrieve Buy Now item if in buyNow mode
  const buyNowItem: BuyNowItem | null = useMemo(() => {
    if (checkoutMode !== 'buyNow') return null;
    if (checkoutParams?.buyNowItem) return checkoutParams.buyNowItem;
    try {
      const stored = sessionStorage.getItem('trendpro_buy_now_intent');
      if (stored) {
        return JSON.parse(stored) as BuyNowItem;
      }
    } catch {}
    return null;
  }, [checkoutMode, checkoutParams?.buyNowItem]);

  // Revalidate live product price & stock for Buy Now
  const validatedBuyNowItem: BuyNowItem | null = useMemo(() => {
    if (!buyNowItem) return null;
    const liveProd = products.find((p) => p.id === buyNowItem.productId);
    if (!liveProd) return buyNowItem;
    const finalPrice = buyNowItem.isGiftVoucher ? buyNowItem.price : liveProd.sellingPrice;
    return {
      ...buyNowItem,
      name: liveProd.name,
      brand: liveProd.brand,
      price: finalPrice,
      quantity: Math.min(buyNowItem.quantity, liveProd.stock > 0 ? liveProd.stock : 1),
    };
  }, [buyNowItem, products]);

  // Checkout Items List based strictly on checkout mode
  const checkoutItems: OrderItem[] = useMemo(() => {
    if (checkoutMode === 'buyNow' && validatedBuyNowItem) {
      return [
        {
          productId: validatedBuyNowItem.productId,
          name: validatedBuyNowItem.name,
          brand: validatedBuyNowItem.brand || '',
          image: validatedBuyNowItem.image,
          price: validatedBuyNowItem.price,
          quantity: validatedBuyNowItem.quantity,
          variant: validatedBuyNowItem.selectedVariant || null,
          isGiftVoucher: Boolean(
            validatedBuyNowItem.isGiftVoucher ||
            validatedBuyNowItem.productId.includes('gift')
          ),
        },
      ];
    }

    // Default: Cart items
    return cart.map((i) => ({
      productId: i.productId,
      name: i.name,
      brand: i.brand || '',
      image: i.image,
      price: i.price,
      quantity: i.quantity,
      variant: i.selectedVariant || null,
      isGiftVoucher: Boolean(i.isGiftVoucher || i.productId.includes('gift')),
    }));
  }, [checkoutMode, validatedBuyNowItem, cart]);

  const containsGiftVoucher = useMemo(
    () =>
      checkoutItems.some(
        (i) =>
          i.isGiftVoucher ||
          i.productId.includes('gift') ||
          i.name.toLowerCase().includes('gift card') ||
          i.name.toLowerCase().includes('gift voucher')
      ),
    [checkoutItems]
  );

  // Subtotal calculated strictly from validated checkout items
  const subtotal = useMemo(
    () => checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [checkoutItems]
  );

  // Delivery charge: FREE for orders >= 499 or containing gift voucher
  const deliveryCharge = subtotal >= 499 || containsGiftVoucher || subtotal === 0 ? 0 : 49;

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    voucher?: Voucher;
  } | null>(() => {
    if (checkoutParams?.voucherCode && checkoutParams.voucherDiscount) {
      return {
        code: checkoutParams.voucherCode,
        discount: checkoutParams.voucherDiscount,
      };
    }
    return null;
  });
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Wallet State
  const walletBalance = userProfile?.walletBalance || 0;
  const [useWallet, setUseWallet] = useState<boolean>(() => Boolean(checkoutParams?.useWallet));

  // Handle Coupon Application
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    setCouponError('');
    setCouponSuccess('');
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const res = applyVoucher(code, subtotal);
    if (res.valid) {
      setAppliedCoupon({
        code,
        discount: res.discount,
        voucher: res.voucher,
      });
      setCouponSuccess(`Coupon ${code} applied! ₹${res.discount.toLocaleString()} savings.`);
      setCouponInput('');
    } else {
      setCouponError(res.message || 'Invalid coupon code for this order.');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    setCouponSuccess('');
  };

  const couponDiscount = appliedCoupon?.discount || 0;
  const amountBeforeWallet = Math.max(0, subtotal - couponDiscount + deliveryCharge);
  const walletDeduction = useWallet ? Math.min(walletBalance, amountBeforeWallet) : 0;
  const finalPayable = Math.max(0, amountBeforeWallet - walletDeduction);

  // Addresses State
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(() => {
    try {
      const key = currentUser ? `trendpro_addresses_${currentUser.uid}` : 'trendpro_guest_addresses';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    try {
      const key = currentUser ? `trendpro_addresses_${currentUser.uid}` : 'trendpro_guest_addresses';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return '';
  });

  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [addressFormError, setAddressFormError] = useState('');
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    name: currentUser?.displayName || '',
    phone: '',
    pincode: '',
    locality: '',
    addressLine: '',
    city: 'Patna',
    state: 'Bihar',
    type: 'home',
  });

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Standard 8 days delivery date calculation
  const estimatedDeliveryDate = useMemo(() => {
    return new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // If order contains gift voucher, ensure COD is not selected
  useEffect(() => {
    if (containsGiftVoucher && paymentMethod === 'cod') {
      setPaymentMethod('upi');
    }
  }, [containsGiftVoucher, paymentMethod]);

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressFormError('');
    if (!newAddress.name?.trim() || !newAddress.phone?.trim() || !newAddress.pincode?.trim() || !newAddress.addressLine?.trim()) {
      setAddressFormError('Please fill all required fields (Name, 10-digit Phone, PIN code, and Address).');
      return;
    }

    if (newAddress.phone.replace(/\D/g, '').length < 10) {
      setAddressFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const addr: Address = {
      id: `addr-${Date.now()}`,
      userId: currentUser?.uid || 'guest',
      name: newAddress.name.trim(),
      phone: newAddress.phone.trim(),
      pincode: newAddress.pincode.trim(),
      locality: newAddress.locality?.trim() || '',
      addressLine: newAddress.addressLine.trim(),
      city: newAddress.city?.trim() || 'Patna',
      state: newAddress.state?.trim() || 'Bihar',
      type: newAddress.type || 'home',
      isDefault: savedAddresses.length === 0,
    };

    const updated = [...savedAddresses, addr];
    setSavedAddresses(updated);
    setSelectedAddressId(addr.id);
    try {
      const key = currentUser ? `trendpro_addresses_${currentUser.uid}` : 'trendpro_guest_addresses';
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
    setShowNewAddressModal(false);
  };

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      signInWithGoogle();
      return;
    }

    if (checkoutItems.length === 0) {
      setPaymentError('No items in checkout. Please return to catalog.');
      return;
    }

    const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      setPaymentError('Please add and select your delivery destination address to proceed.');
      setShowNewAddressModal(true);
      return;
    }

    if (containsGiftVoucher && paymentMethod === 'cod') {
      setPaymentError('Digital Gift Vouchers require instant online payment. Cash on Delivery is disabled.');
      return;
    }

    if (paymentMethod === 'wallet' && walletBalance < finalPayable) {
      setPaymentError(
        `Insufficient TrendPro Wallet balance (Available: ₹${walletBalance.toLocaleString()}). You need ₹${finalPayable.toLocaleString()}.`
      );
      return;
    }

    // Revalidate coupon prior to final order creation
    let validatedCouponDiscount = couponDiscount;
    let validatedCouponCode = appliedCoupon?.code || null;

    if (appliedCoupon?.code) {
      const reval = applyVoucher(appliedCoupon.code, subtotal);
      if (!reval.valid) {
        setPaymentError(`Coupon ${appliedCoupon.code} is no longer valid: ${reval.message}`);
        setAppliedCoupon(null);
        return;
      }
      validatedCouponDiscount = reval.discount;
      validatedCouponCode = appliedCoupon.code;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      const finalWalletUsed = paymentMethod === 'wallet' ? finalPayable : walletDeduction;

      const orderPayload = {
        userId: currentUser.uid,
        customerEmail: currentUser.email || '',
        customerName: currentUser.displayName || selectedAddr.name,
        items: checkoutItems,
        shippingAddress: selectedAddr,
        pricing: {
          subtotal,
          discount: 0,
          deliveryCharge,
          voucherCode: validatedCouponCode,
          voucherDiscount: validatedCouponDiscount,
          walletUsed: finalWalletUsed,
          total: finalPayable,
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? ('pending' as const) : ('paid' as const),
        paymentTransactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        orderStatus: 'placed' as const,
        carrier: 'TrendPro Express Logistics',
        trackingNumber: `TP-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
        estimatedDelivery: estimatedDeliveryDate,
      };

      const orderId = await createOrder(orderPayload);

      // Clean up checkout state based on mode
      if (checkoutMode === 'cart') {
        clearCart();
      } else {
        // Buy now mode: ONLY clean up buy now intent, PRESERVE customer's cart!
        try {
          sessionStorage.removeItem('trendpro_buy_now_intent');
          sessionStorage.removeItem('trendpro_checkout_mode');
        } catch {}
      }

      setIsProcessing(false);
      onNavigate('order-confirmation', { orderId });
    } catch (err: any) {
      console.error('Checkout error:', err);
      setPaymentError(err.message || 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // Recovery empty state
  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xs">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No items ready for checkout</h2>
        <p className="text-xs text-slate-500 mt-2">
          {checkoutMode === 'buyNow'
            ? 'The Buy Now session has expired or been completed.'
            : 'Your shopping cart is currently empty.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate('products')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Explore Catalog
          </button>
          <button
            onClick={() => onNavigate('cart')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            View Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header with Mode Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(checkoutMode === 'buyNow' ? 'products' : 'cart')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h1>
              {checkoutMode === 'buyNow' ? (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                  <Zap className="w-3 h-3 text-amber-600 fill-amber-600" /> Instant Buy Now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  <ShoppingBag className="w-3 h-3" /> Cart Checkout
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure 256-Bit SSL Encrypted Order Processing
            </p>
          </div>
        </div>

        {checkoutMode === 'buyNow' && cart.length > 0 && (
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2">
            <span>🛒 Your existing cart ({cart.length} items) remains saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Address, Payment & Wallet (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: User Verification */}
          {!currentUser ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900">Sign in to complete order</p>
                <p className="text-xs text-amber-700">Sync orders with your Google account</p>
              </div>
              <button
                onClick={signInWithGoogle}
                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-indigo-700 shadow-md"
              >
                Sign In with Google
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Logged in as {currentUser.displayName || currentUser.email}
                  </p>
                  <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Delivery Address Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Select Delivery Address
              </h2>
              <button
                onClick={() => setShowNewAddressModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            </div>

            <div className="space-y-3">
              {savedAddresses.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">No delivery address saved yet</p>
                  <p className="text-[11px] text-slate-500">
                    Please provide your destination address to receive your order.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNewAddressModal(true)}
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs"
                  >
                    + Add Shipping Address
                  </button>
                </div>
              ) : (
                savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedAddressId === addr.id
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryAddress"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-indigo-600 cursor-pointer"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{addr.name}</span>
                        <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {addr.type}
                        </span>
                        <span className="text-slate-500 font-mono ml-auto">{addr.phone}</span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        {addr.addressLine}
                        {addr.locality ? `, ${addr.locality}` : ''}, {addr.city}, {addr.state} -{' '}
                        <strong className="text-slate-900">{addr.pincode}</strong>
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Step 3: Payment Method Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              Choose Payment Method
            </h2>

            <div className="space-y-3">
              {/* Option 1: Instant UPI */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="mt-1 text-indigo-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      UPI (Google Pay, PhonePe, Paytm, BHIM)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Instant & Zero Fee
                    </span>
                  </div>
                  {paymentMethod === 'upi' && (
                    <div className="mt-3 pt-3 border-t border-indigo-100 space-y-2">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Enter UPI ID / VPA
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  )}
                </div>
              </label>

              {/* Option 2: Credit / Debit Card */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="mt-1 text-indigo-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      Credit / Debit Card (Visa, MasterCard, RuPay)
                    </span>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="mt-3 pt-3 border-t border-indigo-100 space-y-2 text-xs">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="16-digit card number"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono outline-hidden"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            placeholder="3 digits"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 3: Net Banking */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'netbanking'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="netbanking"
                  checked={paymentMethod === 'netbanking'}
                  onChange={() => setPaymentMethod('netbanking')}
                  className="mt-1 text-indigo-600"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Net Banking (All Indian Commercial Banks)
                  </span>
                </div>
              </label>

              {/* Option 4: Full Wallet Payment */}
              {walletBalance >= finalPayable && finalPayable > 0 && (
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="mt-1 text-indigo-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-indigo-600" />
                        Pay 100% from TrendPro Wallet
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        Available: ₹{walletBalance.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      No card or OTP needed. Instant seamless confirmation.
                    </p>
                  </div>
                </label>
              )}

              {/* Option 5: Cash on Delivery */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  containsGiftVoucher
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                    : paymentMethod === 'cod'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 cursor-pointer bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  disabled={containsGiftVoucher}
                  checked={paymentMethod === 'cod'}
                  onChange={() => !containsGiftVoucher && setPaymentMethod('cod')}
                  className="mt-1 text-indigo-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-indigo-600" />
                      Cash on Delivery (Pay cash/UPI at doorstep)
                    </span>
                    {containsGiftVoucher && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Online Only
                      </span>
                    )}
                  </div>
                  {containsGiftVoucher && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      ⚠️ Cash on Delivery is disabled because this order includes a Digital Gift Voucher. Digital vouchers are delivered immediately online.
                    </p>
                  )}
                </div>
              </label>
            </div>

            {paymentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary, Working Coupon Field & Checkout Action (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Items in Order ({checkoutItems.length})</span>
              </h3>
              {checkoutMode === 'buyNow' && (
                <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                  Buy Now Item
                </span>
              )}
            </div>

            {/* Item Showcase List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {checkoutItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 text-xs p-2 bg-slate-50/60 rounded-xl border border-slate-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>Qty: {item.quantity}</span>
                      {item.variant && (
                        <span className="bg-slate-200/80 px-1.5 py-0.2 rounded text-[10px] font-mono">
                          {item.variant}
                        </span>
                      )}
                      {item.isGiftVoucher && (
                        <span className="text-amber-600 font-bold flex items-center gap-0.5 text-[10px]">
                          <Gift className="w-3 h-3" /> Gift Card
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* WORKING COUPON FIELD AT CHECKOUT */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  Have a Promo / Coupon Code?
                </span>
                {appliedCoupon && (
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {appliedCoupon.code} applied (-₹{appliedCoupon.discount.toLocaleString()})
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-emerald-900 hover:text-emerald-950 p-1 cursor-pointer font-bold"
                    title="Remove coupon"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME100, TREND20)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs uppercase font-mono outline-hidden focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    Apply Coupon
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {couponError}
                </p>
              )}

              {couponSuccess && !appliedCoupon && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" /> {couponSuccess}
                </p>
              )}

              {/* Quick Available Vouchers Chips */}
              {!appliedCoupon && vouchers.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Available Coupons:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {vouchers.slice(0, 4).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleApplyCoupon(v.code)}
                        className="text-[10px] font-mono font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                        title={v.description}
                      >
                        {v.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* WALLET CREDIT USAGE TOGGLE */}
            {walletBalance > 0 && paymentMethod !== 'wallet' && (
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="font-bold text-indigo-950">
                      Use TrendPro Wallet (₹{walletBalance.toLocaleString()} available)
                    </p>
                    <p className="text-[11px] text-indigo-700">
                      Deduct up to ₹{Math.min(walletBalance, amountBeforeWallet).toLocaleString()} from wallet
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                />
              </div>
            )}

            {/* Financial Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Estimated Delivery: {estimatedDeliveryDate} (Standard 8-Day Express Dispatch from Samastipur Hub)
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({checkoutItems.length} items)</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>- ₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}

              {paymentMethod === 'wallet' ? (
                <div className="flex justify-between text-indigo-600 font-bold">
                  <span>Debited from TrendPro Wallet</span>
                  <span>- ₹{amountBeforeWallet.toLocaleString()}</span>
                </div>
              ) : walletDeduction > 0 ? (
                <div className="flex justify-between text-indigo-600 font-bold">
                  <span>Wallet Credits Applied</span>
                  <span>- ₹{walletDeduction.toLocaleString()}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges</span>
                <span>
                  {deliveryCharge === 0 ? (
                    <strong className="text-emerald-600 font-bold">FREE</strong>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900">
                  {paymentMethod === 'wallet' ? 'Due at Gateway' : 'Final Total Payable'}
                </span>
                <span className="text-2xl font-black text-slate-900">
                  ₹{(paymentMethod === 'wallet' ? 0 : finalPayable).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-500/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <span>Confirming Order...</span>
              ) : paymentMethod === 'wallet' ? (
                <span>Pay ₹{amountBeforeWallet.toLocaleString()} with Wallet & Place Order</span>
              ) : (
                <span>
                  Pay ₹{finalPayable.toLocaleString()} & Confirm {checkoutMode === 'buyNow' ? 'Purchase' : 'Order'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Shipping Destination Address</h3>
              <button
                onClick={() => setShowNewAddressModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {addressFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl mb-3">
                {addressFormError}
              </div>
            )}

            <form onSubmit={handleAddNewAddress} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Flat, House no., Building, Street *</label>
                <input
                  type="text"
                  required
                  value={newAddress.addressLine}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(false)}
                  className="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-md"
                >
                  Save & Use Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
