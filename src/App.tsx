import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { AnnouncementBar } from './components/common/AnnouncementBar';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { WalletPage } from './pages/WalletPage';
import { WishlistPage } from './pages/WishlistPage';
import { ComparePage } from './pages/ComparePage';
import { SupportChatPage } from './pages/SupportChatPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import {
  AboutPage,
  ContactPage,
  FAQPage,
  PolicyPage
} from './pages/StaticPages';

export function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routeParams, setRouteParams] = useState<Record<string, any>>({});
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  // Ask for notification permission early so order & refund alerts can be sent
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => setShowNotifBanner(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          new Notification('TrendPro Notifications Enabled', {
            body: 'You will now receive live alerts for orders, dispatch status, cancellations, and return approvals!',
            icon: '/favicon.ico',
          });
        }
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }
    setShowNotifBanner(false);
  };

  // Synchronize route navigation
  const navigate = (route: string, params: Record<string, any> = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render current active page
  const renderPage = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'products':
        return (
          <ProductsPage
            onNavigate={navigate}
            initialCategory={routeParams.category}
            initialSearch={routeParams.search}
          />
        );
      case 'product-detail':
        return <ProductDetailPage productId={routeParams.id} onNavigate={navigate} />;
      case 'cart':
        return <CartPage onNavigate={navigate} />;
      case 'checkout':
        return <CheckoutPage onNavigate={navigate} checkoutParams={routeParams} />;
      case 'order-confirmation':
        return <OrderConfirmationPage orderId={routeParams.orderId} onNavigate={navigate} />;
      case 'orders':
        return <OrdersPage onNavigate={navigate} />;
      case 'order-detail':
        return <OrderDetailPage orderId={routeParams.id} onNavigate={navigate} />;
      case 'profile':
        return <ProfilePage onNavigate={navigate} />;
      case 'wallet':
      case 'vouchers':
        return <WalletPage onNavigate={navigate} />;
      case 'wishlist':
        return <WishlistPage onNavigate={navigate} />;
      case 'compare':
        return <ComparePage onNavigate={navigate} />;
      case 'support':
        return <SupportChatPage onNavigate={navigate} />;
      case 'notifications':
        return <NotificationsPage onNavigate={navigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigate} />;
      case 'about':
        return <AboutPage onNavigate={navigate} />;
      case 'contact':
        return <ContactPage onNavigate={navigate} />;
      case 'faq':
        return <FAQPage onNavigate={navigate} />;
      case 'privacy-policy':
        return <PolicyPage onNavigate={navigate} type="privacy" />;
      case 'terms':
        return <PolicyPage onNavigate={navigate} type="terms" />;
      case 'shipping-policy':
        return <PolicyPage onNavigate={navigate} type="shipping" />;
      case 'return-policy':
        return <PolicyPage onNavigate={navigate} type="returns" />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <AnnouncementBar />

      {/* Early Notification Permission Banner */}
      {showNotifBanner && (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white px-4 py-2.5 text-xs font-semibold shadow-md border-b border-indigo-700/50 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-indigo-500/20 text-amber-300 rounded-lg">
              <Bell className="w-4 h-4 animate-bounce" />
            </span>
            <p>
              <strong>Enable Live Order Alerts:</strong> Get instant notifications for dispatch status, returns, and cancellation approvals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnableNotifications}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3.5 py-1 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              Allow Notifications
            </button>
            <button
              onClick={() => setShowNotifBanner(false)}
              className="p-1 text-indigo-300 hover:text-white rounded-lg cursor-pointer"
              title="Later"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Header onNavigate={navigate} currentRoute={currentRoute} />
      
      <main className="flex-1">
        {renderPage()}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
