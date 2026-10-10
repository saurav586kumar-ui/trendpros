import React from 'react';
import {
  Bell,
  CheckCircle,
  Package,
  Tag,
  Wallet,
  ArrowLeft,
  CheckCheck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

interface NotificationsPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsRead } = useStore();
  const { currentUser, signInWithGoogle } = useAuth();

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Bell className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view notifications</h2>
        <button
          onClick={signInWithGoogle}
          className="mt-6 bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-xs text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts read'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            return (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationAsRead(notif.id);
                  if (notif.link) {
                    if (notif.link.startsWith('/orders/')) {
                      const id = notif.link.split('/orders/')[1];
                      onNavigate('order-detail', { id });
                    }
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 text-xs ${
                  notif.isRead
                    ? 'bg-white border-slate-200/80'
                    : 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-500/20'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'order'
                      ? 'bg-emerald-50 text-emerald-600'
                      : notif.type === 'wallet'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {notif.type === 'order' ? (
                    <Package className="w-5 h-5" />
                  ) : notif.type === 'wallet' ? (
                    <Wallet className="w-5 h-5" />
                  ) : (
                    <Tag className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{notif.title}</h3>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">No notifications yet</p>
            <p className="text-xs text-slate-500 mt-1">
              You will receive updates here about active orders and store announcements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
