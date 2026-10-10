import React, { useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Gift,
  Upload,
  Copy,
  Download,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';

interface OrderDetailPageProps {
  orderId: string;
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'ordered', label: 'Ordered' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'packed', label: 'Packed' },
  { status: 'dispatched', label: 'Dispatched' },
  { status: 'in_transit', label: 'In Transit' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
];

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orderId,
  onNavigate,
}) => {
  const { orders, requestCancelOrder, requestReturnOrder, redeemGiftCard } = useStore();
  const order = orders.find((o) => o.id === orderId);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Found a lower price elsewhere');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Item defective or not working');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Invoice Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Gift Card Redeem State
  const [redeemingCard, setRedeemingCard] = useState(false);
  const [redeemResult, setRedeemResult] = useState<string>('');
  const [orderNotice, setOrderNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">Could not locate order #{orderId}</p>
        <button
          onClick={() => onNavigate('orders')}
          className="mt-6 bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
        >
          View All Orders
        </button>
      </div>
    );
  }

  // Determine current timeline progress
  const stepKeys = ['ordered', 'placed', 'confirmed', 'packed', 'processing', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered'];
  const normalizedStatus = order.orderStatus === 'placed' ? 'ordered' : order.orderStatus === 'processing' ? 'packed' : order.orderStatus;
  const currentStepIdx = ORDER_STEPS.findIndex((s) => s.status === normalizedStatus);

  const isCancelled = order.orderStatus === 'cancelled';
  const isReturned = order.orderStatus === 'returned';

  // Customer can request cancel before dispatched:
  const canRequestCancel =
    ['ordered', 'placed', 'confirmed', 'packed'].includes(order.orderStatus) &&
    !order.cancelRequest &&
    !order.isGiftVoucherOrder;

  // Customer can request return after delivered:
  const canRequestReturn =
    order.orderStatus === 'delivered' &&
    !order.returnRequest &&
    !order.isGiftVoucherOrder;

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCancel(true);
    try {
      await requestCancelOrder(order.id, cancelReason);
      setShowCancelModal(false);
      setOrderNotice({ text: 'Cancellation request submitted to store owner for review.', type: 'success' });
      setTimeout(() => setOrderNotice(null), 5000);
    } catch (err: any) {
      setOrderNotice({ text: err.message || 'Error requesting cancellation', type: 'error' });
      setTimeout(() => setOrderNotice(null), 5000);
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setReturnImages([...returnImages, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReturn(true);
    try {
      await requestReturnOrder(order.id, returnReason, returnImages);
      setShowReturnModal(false);
      setOrderNotice({ text: 'Return request and inspection photos submitted to store owner!', type: 'success' });
      setTimeout(() => setOrderNotice(null), 5000);
    } catch (err: any) {
      setOrderNotice({ text: err.message || 'Error requesting return', type: 'error' });
      setTimeout(() => setOrderNotice(null), 5000);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleRedeemThisCard = async () => {
    if (!order.giftCardDetails) return;
    setRedeemingCard(true);
    setRedeemResult('');
    try {
      const res = await redeemGiftCard(order.giftCardDetails.cardNumber, order.giftCardDetails.pin);
      setRedeemResult(res.message);
    } catch (err: any) {
      setRedeemResult(err.message || 'Error redeeming card');
    } finally {
      setRedeemingCard(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* In-app Notice */}
      {orderNotice && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in ${
            orderNotice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          <span>{orderNotice.text}</span>
          <button onClick={() => setOrderNotice(null)} className="ml-2 font-black">✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('orders')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Order Details</span>
              <span className="font-mono text-indigo-600">#{order.id}</span>
            </h1>
            <p className="text-xs text-slate-500">
              Placed on {new Date(order.createdAt).toLocaleString()} • Customer ID: {order.customerId}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chat with store owner about this order button */}
          <button
            onClick={() => onNavigate('support', { orderId: order.id })}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Chat with Owner About Order</span>
          </button>

          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Invoice & Status Bill</span>
          </button>

          {canRequestCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
            >
              Request Cancellation
            </button>
          )}

          {canRequestReturn && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
            >
              Request Return & Refund
            </button>
          )}
        </div>
      </div>

      {/* DIGITAL GIFT CARD CERTIFICATE CARD (If order contains a gift card) */}
      {order.giftCardDetails && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/30 relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center font-black">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  TrendPro Official Digital Certificate
                </span>
                <h2 className="text-xl font-black">Your Purchased E-Gift Voucher</h2>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.giftCardDetails.isRedeemed
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-emerald-500 text-white shadow-md'
              }`}
            >
              {order.giftCardDetails.isRedeemed ? 'Redeemed' : 'Active — Ready to Redeem'}
            </span>
          </div>

          {/* Card Visual Plate */}
          <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-indigo-200 text-[10px] block font-bold uppercase">
                16-Digit Card Number
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base sm:text-lg font-mono font-black text-amber-300">
                  {order.giftCardDetails.cardNumber}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.giftCardDetails!.cardNumber);
                    setCopiedCard(true);
                    setTimeout(() => setCopiedCard(false), 2000);
                  }}
                  className="p-1 hover:text-amber-200 cursor-pointer flex items-center gap-1"
                  title="Copy Card Number"
                >
                  <Copy className="w-4 h-4" />
                  {copiedCard && <span className="text-[10px] text-emerald-300 font-bold">Copied!</span>}
                </button>
              </div>
            </div>

            <div>
              <span className="text-indigo-200 text-[10px] block font-bold uppercase">
                Secret 4-Digit PIN
              </span>
              <span className="text-base sm:text-lg font-mono font-black text-white mt-1 block">
                {order.giftCardDetails.pin}
              </span>
            </div>

            <div>
              <span className="text-indigo-200 text-[10px] block font-bold uppercase">
                Stored Value
              </span>
              <span className="text-xl font-black text-white mt-1 block">
                ₹{order.giftCardDetails.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {redeemResult && (
            <p className="text-xs font-bold text-amber-300 bg-white/10 p-2.5 rounded-xl">
              {redeemResult}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <p className="text-indigo-200 text-[11px] max-w-md">
              Enter this 16-digit card number in your TrendPro Wallet to add ₹{order.giftCardDetails.amount} instantly!
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Download Card
              </button>

              {!order.giftCardDetails.isRedeemed && (
                <button
                  onClick={handleRedeemThisCard}
                  disabled={redeemingCard}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {redeemingCard ? 'Redeeming...' : '1-Click Add to Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancellation / Return Request Banner Notice */}
      {order.cancelRequest && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs space-y-1">
          <p className="font-bold text-amber-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            Cancellation Request: {order.cancelRequest.status.toUpperCase()}
          </p>
          <p className="text-amber-800">Reason: {order.cancelRequest.reason}</p>
          {order.cancelRequest.adminNote && (
            <p className="text-amber-700 italic">Owner Note: {order.cancelRequest.adminNote}</p>
          )}
        </div>
      )}

      {order.returnRequest && (
        <div className="bg-purple-50 border border-purple-300 rounded-2xl p-4 text-xs space-y-2">
          <p className="font-bold text-purple-900 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-purple-600" />
            Return & Refund Request: {order.returnRequest.status.toUpperCase()}
          </p>
          <p className="text-purple-800">Reason: {order.returnRequest.reason}</p>
          {order.returnRequest.adminNote && (
            <p className="text-purple-700 italic">Owner Note: {order.returnRequest.adminNote}</p>
          )}
          {order.returnRequest.extraImages && order.returnRequest.extraImages.length > 0 && (
            <div className="flex gap-2 pt-1">
              {order.returnRequest.extraImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="Defect Inspection"
                  className="w-12 h-12 object-cover rounded-lg border border-purple-200"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Granular Order Status Timeline (ordered -> confirmed -> packed -> dispatched -> in_transit -> out_for_delivery -> delivered) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-6">
          Order Status Tracker
        </h2>

        {isCancelled ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">This order was Cancelled.</p>
              <p className="text-rose-600">Full order amount has been refunded to customer wallet.</p>
            </div>
          </div>
        ) : isReturned ? (
          <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 flex items-center gap-3 text-slate-800 text-xs">
            <RotateCcw className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold">This order was Returned & Refunded.</p>
              <p className="text-slate-600">The returned items were received and refunded to customer wallet.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[550px] grid grid-cols-7 gap-2 text-center">
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step.status} className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                        isPassed
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        isCurrent
                          ? 'text-indigo-600'
                          : isPassed
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl">
          <div>
            <span className="text-slate-400 block font-medium">Logistics Partner</span>
            <strong className="text-slate-900">{order.carrier || 'TrendPro Express'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">AWB Tracking Code</span>
            <strong className="font-mono text-slate-900">{order.trackingNumber}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Expected Delivery</span>
            <strong className="text-emerald-700 font-bold">{order.estimatedDelivery}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items in order (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Items in Order ({order.items.length})
          </h2>

          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center gap-4 text-xs">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-contain bg-slate-50 rounded-xl p-1.5 border border-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-slate-500 text-[11px]">Brand: {item.brand}</p>
                  {item.variant && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                      {item.variant}
                    </span>
                  )}
                  <p className="text-slate-500 text-[11px] mt-1">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 text-sm">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Destination & Pricing (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Delivery Address
            </h3>
            <p className="font-bold text-slate-800 text-sm">{order.shippingAddress.name}</p>
            <p className="text-slate-600 leading-relaxed">
              {order.shippingAddress.addressLine}, {order.shippingAddress.locality}
            </p>
            <p className="text-slate-600">
              {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
              <strong>{order.shippingAddress.pincode}</strong>
            </p>
            <p className="text-slate-500 pt-1 font-mono">Phone: {order.shippingAddress.phone}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Payment Summary
            </h3>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{order.pricing.subtotal.toLocaleString()}</span>
            </div>
            {order.pricing.voucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon ({order.pricing.voucherCode})</span>
                <span>- ₹{order.pricing.voucherDiscount.toLocaleString()}</span>
              </div>
            )}
            {order.pricing.walletUsed > 0 && (
              <div className="flex justify-between text-indigo-600 font-medium">
                <span>Wallet Credits</span>
                <span>- ₹{order.pricing.walletUsed.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery</span>
              <span className="text-emerald-600 font-bold">
                {order.pricing.deliveryCharge === 0 ? 'FREE' : `₹${order.pricing.deliveryCharge}`}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-black">
              <span className="text-slate-900 text-sm">Total Paid</span>
              <span className="text-xl text-slate-900">₹{order.pricing.total.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
              <span>Payment Mode:</span>
              <strong className="uppercase text-slate-900">{order.paymentMethod}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Request Order Cancellation</h3>
            <p className="text-xs text-slate-500">
              Since this order has not been dispatched yet, you can request immediate cancellation.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for cancellation *</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                >
                  <option value="Found a lower price elsewhere">Found a lower price elsewhere</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Need to change delivery address">Need to change delivery address</option>
                  <option value="Expected delivery takes too long">Expected delivery takes too long</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
                >
                  {submittingCancel ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal with Photo Upload from File */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Request Return & Refund</h3>
            <p className="text-xs text-slate-500">
              Submit your return request. The store owner will inspect the reason and approve your refund.
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Return *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                >
                  <option value="Item defective or not working">Item defective or not working</option>
                  <option value="Wrong product delivered">Wrong product delivered</option>
                  <option value="Quality not as expected">Quality not as expected</option>
                  <option value="Product damaged in transit">Product damaged in transit</option>
                  <option value="Size or fit issue">Size or fit issue</option>
                </select>
              </div>

              {/* Upload extra inspection photo from file */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Upload Product Photo (From File)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />

                {returnImages.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {returnImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Preview"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl disabled:opacity-50"
                >
                  {submittingReturn ? 'Submitting...' : 'Submit Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Customer Official Tax Invoice & Status Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <span>Official Tax Invoice & Live Status</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice (PDF)</span>
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-2 sm:p-4 space-y-6 print:p-0">
              {/* Invoice Printable Sheet */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl print:border-none print:p-0 space-y-5">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">TRENDPRO</h1>
                    <p className="text-xs text-slate-600 font-bold">Tax Invoice & Delivery Receipt</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      <strong>Dispatched From:</strong> TrendPro Central Facility, Near Station Road, Shivaji Nagar, Samastipur, Bihar - 848101
                    </p>
                    <p className="text-[10px] text-slate-400">Website: trendpro.netlify.app</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-black text-sm text-slate-900">ORDER #{order.id}</p>
                    <p className="text-[11px] text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                    <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Live Status: {order.orderStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Destination:</span>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{order.shippingAddress.name}</p>
                    <p className="text-slate-600 mt-0.5">Phone: <strong>{order.shippingAddress.phone}</strong></p>
                    <p className="text-slate-600">{order.shippingAddress.addressLine}, {order.shippingAddress.locality}</p>
                    <p className="text-slate-800 font-bold">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Customer ID: {order.customerId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shipment & Payment Info:</span>
                    <p className="text-slate-700 mt-0.5">Payment Mode: <strong className="uppercase">{order.paymentMethod}</strong> ({order.paymentStatus})</p>
                    <p className="text-slate-700">Estimated Delivery: <strong>{order.estimatedDelivery || '8 Days from Order Date'}</strong></p>
                    <p className="text-slate-700">Dispatch Location: <strong>Shivaji Nagar, Samastipur, Bihar</strong></p>
                  </div>
                </div>

                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Size / Variant</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-900">
                          {it.name}
                          <span className="block text-[10px] text-slate-400 font-normal">{it.brand}</span>
                        </td>
                        <td className="p-2.5 text-indigo-700 font-bold">{it.variant || 'Standard'}</td>
                        <td className="p-2.5 text-center font-bold text-slate-900">{it.quantity}</td>
                        <td className="p-2.5 text-right text-slate-600">₹{it.price.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          ₹{(it.price * it.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan={4} className="p-2 text-right text-slate-600">Subtotal:</td>
                      <td className="p-2 text-right text-slate-900">₹{order.pricing.subtotal.toLocaleString()}</td>
                    </tr>
                    {order.pricing.voucherDiscount > 0 && (
                      <tr>
                        <td colSpan={4} className="p-2 text-right text-emerald-600">
                          Discount ({order.pricing.voucherCode}):
                        </td>
                        <td className="p-2 text-right text-emerald-600">- ₹{order.pricing.voucherDiscount.toLocaleString()}</td>
                      </tr>
                    )}
                    {order.pricing.walletUsed > 0 && (
                      <tr>
                        <td colSpan={4} className="p-2 text-right text-indigo-600">TrendPro Wallet Credits:</td>
                        <td className="p-2 text-right text-indigo-600">- ₹{order.pricing.walletUsed.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-300">
                      <td colSpan={4} className="p-2 text-right text-slate-900 text-sm">Total Paid:</td>
                      <td className="p-2 text-right text-slate-900 text-base font-black">₹{order.pricing.total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Thank you for shopping on TrendPro! • Dispatch Samastipur Bihar</span>
                  <span>Computer Generated Tax Invoice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
