import React from 'react';
import {
  CheckCircle,
  Package,
  Truck,
  ArrowRight,
  Printer,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface OrderConfirmationPageProps {
  orderId: string;
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderId,
  onNavigate,
}) => {
  const { orders } = useStore();
  const order = orders.find((o) => o.id === orderId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Success Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-lg relative overflow-hidden">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50">
          <CheckCircle className="w-10 h-10" />
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Order Confirmed & Payment Verified
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
          Thank you for your order!
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
          We&apos;ve sent a confirmation receipt and tracking updates to your registered email address.
        </p>

        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-slate-50 border border-slate-200/80 px-6 py-3 rounded-2xl text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Order ID</span>
            <strong className="text-slate-900 font-mono text-sm">{orderId}</strong>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-slate-400 block font-medium">Tracking Number</span>
            <strong className="text-slate-900 font-mono text-sm">
              {order?.trackingNumber || 'TP-TRK-84920412'}
            </strong>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-slate-400 block font-medium">Estimated Delivery</span>
            <strong className="text-emerald-700 font-bold text-sm">
              {order?.estimatedDelivery || 'In 2 Business Days'}
            </strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate('order-detail', { id: orderId })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Package className="w-4 h-4" />
            <span>Track Order & View Invoice</span>
          </button>

          <button
            onClick={() => onNavigate('products')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>

      {/* Quick Summary of items */}
      {order && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Purchased Items ({order.items.length})
          </h2>

          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center gap-4 text-xs">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 object-contain bg-slate-50 rounded-lg p-1 border border-slate-100"
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-slate-500 text-[11px]">Brand: {item.brand} | Qty: {item.quantity}</p>
                </div>
                <div className="text-right font-extrabold text-slate-900">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="font-medium text-slate-600">Total Paid ({order.paymentMethod.toUpperCase()})</span>
            <span className="text-base font-black text-slate-900">
              ₹{order.pricing.total.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
