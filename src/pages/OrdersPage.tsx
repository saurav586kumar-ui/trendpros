import React, { useState } from 'react';
import {
  Package,
  Search,
  ChevronRight,
  Truck,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  MessageSquare,
  Gift
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { OrderStatus } from '../types';

interface OrdersPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  ordered: {
    label: 'Ordered',
    bg: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  placed: {
    label: 'Ordered',
    bg: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  packed: {
    label: 'Packed',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  processing: {
    label: 'Packed',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  dispatched: {
    label: 'Dispatched',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  in_transit: {
    label: 'In Transit',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    bg: 'bg-teal-50 border-teal-200',
    text: 'text-teal-700',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  returned: {
    label: 'Returned & Refunded',
    bg: 'bg-slate-100 border-slate-300',
    text: 'text-slate-700',
    icon: <RotateCcw className="w-3.5 h-3.5" />,
  },
};

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const { orders } = useStore();
  const { currentUser, signInWithGoogle } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your orders</h2>
        <p className="text-xs text-slate-500 mt-2">
          Track packages, view digital gift cards, and chat with the owner about your orders.
        </p>
        <button
          onClick={signInWithGoogle}
          className="mt-6 bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchItem = o.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchId && !matchItem) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track deliveries, inspect gift cards, and chat directly with the store owner ({orders.length} orders total)
          </p>
        </div>

        {/* Search & Granular Status Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or item..."
              className="bg-white border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 w-56 outline-hidden focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
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

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.ordered;
            return (
              <div
                key={order.id}
                onClick={() => onNavigate('order-detail', { id: order.id })}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all p-5 cursor-pointer space-y-4"
              >
                {/* Header row: Order ID, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                      #{order.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      Ordered on {new Date(order.createdAt).toLocaleDateString()}
                    </span>

                    {order.isGiftVoucherOrder && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                        <Gift className="w-3 h-3 text-amber-700" /> Digital Gift Card
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text}`}
                    >
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </span>

                    {/* Chat about order shortcut */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('support', { orderId: order.id });
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                      title="Chat about this order"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Items preview row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 flex flex-col gap-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-contain bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-slate-500 text-[11px]">
                            Qty: {item.quantity} {item.variant ? `• ${item.variant}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-4 flex flex-col items-start md:items-end justify-center text-xs">
                    <span className="text-slate-400 font-medium">Total Paid</span>
                    <span className="text-base font-black text-slate-900">
                      ₹{order.pricing.total.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {order.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No orders found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {search ? 'Try clearing your search query.' : 'You have not placed any orders yet.'}
            </p>
            <button
              onClick={() => onNavigate('products')}
              className="mt-4 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Browse Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
