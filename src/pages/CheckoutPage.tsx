import React, { useState, useEffect } from 'react';
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
  Gift
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Address, OrderItem } from '../types';

interface CheckoutPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
  checkoutParams?: {
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
  const { cart, subtotal, deliveryCharge, clearCart } = useCart();
  const { createOrder } = useStore();
  const { currentUser, userProfile, signInWithGoogle } = useAuth();

  const containsGiftVoucher = cart.some(
    (i) =>
      i.isGiftVoucher ||
      i.productId.includes('gift') ||
      i.name.toLowerCase().includes('gift card') ||
      i.name.toLowerCase().includes('gift voucher')
  );

  const walletBalance = userProfile?.walletBalance || 0;

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([
    {
      id: 'addr-default-1',
      userId: currentUser?.uid || 'guest',
      name: currentUser?.displayName || 'Saurav Kumar',
      phone: '9876543210',
      pincode: '560001',
      locality: 'Indiranagar 100ft Road',
      addressLine: 'Flat 402, Prestige Tower, 12th Main',
      city: 'Bengaluru',
      state: 'Karnataka',
      type: 'home',
      isDefault: true,
    },
  ]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr-default-1');
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    name: currentUser?.displayName || '',
    phone: '',
    pincode: '',
    locality: '',
    addressLine: '',
    city: '',
    state: '',
    type: 'home',
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'>(
    containsGiftVoucher ? 'upi' : 'upi'
  );
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const voucherDiscount = checkoutParams?.voucherDiscount || 0;
  const initialWalletUsed = checkoutParams?.walletUsed || 0;
  const totalPayable = Math.max(0, subtotal - voucherDiscount + deliveryCharge - initialWalletUsed);

  // If order contains gift voucher, ensure COD is not selected
  useEffect(() => {
    if (containsGiftVoucher && paymentMethod === 'cod') {
      setPaymentMethod('upi');
    }
  }, [containsGiftVoucher, paymentMethod]);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <button
          onClick={() => onNavigate('products')}
          className="mt-4 bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.name || !newAddress.phone || !newAddress.pincode || !newAddress.addressLine) {
      alert('Please fill all required address fields.');
      return;
    }

    const addr: Address = {
      id: `addr-${Date.now()}`,
      userId: currentUser?.uid || 'guest',
      name: newAddress.name,
      phone: newAddress.phone,
      pincode: newAddress.pincode,
      locality: newAddress.locality || '',
      addressLine: newAddress.addressLine,
      city: newAddress.city || 'Bengaluru',
      state: newAddress.state || 'Karnataka',
      type: newAddress.type || 'home',
      isDefault: false,
    };

    setSavedAddresses([...savedAddresses, addr]);
    setSelectedAddressId(addr.id);
    setShowNewAddressModal(false);
  };

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      signInWithGoogle();
      return;
    }

    const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      setPaymentError('Please select or add a delivery address.');
      return;
    }

    if (containsGiftVoucher && paymentMethod === 'cod') {
      setPaymentError('Digital Gift Vouchers require online payment. Please select UPI, Card, Net Banking, or Wallet.');
      return;
    }

    if (paymentMethod === 'wallet' && walletBalance < totalPayable) {
      setPaymentError(`Insufficient TrendPro Wallet balance (Available: ₹${walletBalance.toLocaleString()}). You need ₹${totalPayable.toLocaleString()}. Please top up your wallet or pay via UPI/Card.`);
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      const orderItems: OrderItem[] = cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        brand: i.brand,
        image: i.image,
        price: i.price,
        quantity: i.quantity,
        variant: i.selectedVariant,
        isGiftVoucher: i.isGiftVoucher || i.productId.includes('gift'),
      }));

      const finalWalletUsed = paymentMethod === 'wallet' ? totalPayable : initialWalletUsed;
      const finalAmountPaid = paymentMethod === 'wallet' ? 0 : totalPayable;

      const orderId = await createOrder({
        userId: currentUser.uid,
        customerEmail: currentUser.email || '',
        customerName: currentUser.displayName || selectedAddr.name,
        items: orderItems,
        shippingAddress: selectedAddr,
        pricing: {
          subtotal,
          discount: 0,
          deliveryCharge,
          voucherCode: checkoutParams?.voucherCode,
          voucherDiscount,
          walletUsed: finalWalletUsed,
          total: totalPayable,
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        paymentTransactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        orderStatus: 'placed',
        carrier: 'TrendPro Express Logistics',
        trackingNumber: `TP-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });

      clearCart();
      setIsProcessing(false);
      onNavigate('order-confirmation', { orderId });
    } catch (err: any) {
      console.error('Checkout error:', err);
      setPaymentError(err.message || 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <button
          onClick={() => onNavigate('cart')}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h1>
          <p className="text-xs text-slate-500">Secure 256-Bit SSL Encrypted Order Processing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Addresses & Payment Methods (7 cols) */}
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
                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Sign In with Google
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Select Delivery Address
              </h2>
              <button
                onClick={() => setShowNewAddressModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            </div>

            <div className="space-y-3">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      checked={isSelected}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-indigo-600"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-extrabold text-slate-900">{addr.name}</span>
                        <span className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">
                          {addr.type}
                        </span>
                        <span className="font-mono text-slate-500">{addr.phone}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {addr.addressLine}, {addr.locality}, {addr.city}, {addr.state} -{' '}
                        <strong>{addr.pincode}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Payment Gateway Selector (Provider Adapter Architecture) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                Payment Options (Indian Gateway Adapter)
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ⚡ Safe & Verified
              </span>
            </div>

            {/* Test Gateway Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Payment Gateway Adapter: Sandbox Test Mode</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Order creation and payment signatures are handled through secure server-side adapters. No real bank charges will be deducted during testing.
                </p>
              </div>
            </div>

            {/* Payment Method Options */}
            <div className="space-y-3">
              {/* TrendPro Wallet Option */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'wallet'
                    ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
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
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      TrendPro Wallet (Instant 1-Click Pay)
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        walletBalance >= totalPayable
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Balance: ₹{walletBalance.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {walletBalance >= totalPayable
                      ? '✓ Sufficient balance. Full order amount will be debited instantly without OTP.'
                      : `⚠️ Insufficient balance. Need ₹${(totalPayable - walletBalance).toLocaleString()} more. Top up in Wallet page or select another method.`}
                  </p>
                </div>
              </label>

              {/* UPI */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
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
                      UPI (Google Pay, PhonePe, Paytm, Any UPI ID)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">Fastest</span>
                  </div>
                  {paymentMethod === 'upi' && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis or yourname@paytm"
                        className="flex-1 bg-white border border-slate-200 text-xs rounded-xl p-2 outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </label>

              {/* Credit / Debit Card */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
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
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Credit / Debit Card (Visa, MasterCard, RuPay)
                  </span>
                </div>
              </label>

              {/* Net Banking */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'netbanking'
                    ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
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
                    Net Banking (HDFC, ICICI, SBI, Axis)
                  </span>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  containsGiftVoucher
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                    : paymentMethod === 'cod'
                    ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 cursor-pointer'
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
              <p className="text-xs text-rose-600 font-semibold">{paymentError}</p>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Items in Order ({cart.length})
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((i) => (
                <div key={i.productId} className="flex items-center gap-3 text-xs">
                  <img
                    src={i.image}
                    alt={i.name}
                    className="w-12 h-12 object-contain bg-slate-50 rounded-lg p-1 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{i.name}</p>
                    <p className="text-slate-500 text-[11px]">Qty: {i.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{(i.price * i.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({checkoutParams?.voucherCode})</span>
                  <span>- ₹{voucherDiscount.toLocaleString()}</span>
                </div>
              )}

              {paymentMethod === 'wallet' ? (
                <div className="flex justify-between text-indigo-600 font-medium">
                  <span>Debited from TrendPro Wallet</span>
                  <span>- ₹{totalPayable.toLocaleString()}</span>
                </div>
              ) : initialWalletUsed > 0 ? (
                <div className="flex justify-between text-indigo-600 font-medium">
                  <span>Wallet Balance Used</span>
                  <span>- ₹{initialWalletUsed.toLocaleString()}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span>
                  {deliveryCharge === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${deliveryCharge}`}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900">
                  {paymentMethod === 'wallet' ? 'Due at Gateway' : 'Final Total'}
                </span>
                <span className="text-2xl font-black text-slate-900">
                  ₹{(paymentMethod === 'wallet' ? 0 : totalPayable).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <span>Confirming Order...</span>
              ) : paymentMethod === 'wallet' ? (
                <span>Pay ₹{totalPayable.toLocaleString()} with Wallet & Place Order</span>
              ) : (
                <span>Pay ₹{totalPayable.toLocaleString()} & Confirm Order</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Delivery Address</h3>
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
                <label className="font-bold text-slate-700 block mb-1">Flat, House no., Building *</label>
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
                  className="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
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
