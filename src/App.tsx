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

export function parseLocationToRoute(loc: { pathname: string; search: string; hash: string }): {
  route: string;
  params: Record<string, any>;
} {
  // Check hash first if hash routing was passed
  let rawPath = loc.pathname;
  if (loc.hash && loc.hash.startsWith('#/')) {
    rawPath = loc.hash.slice(1);
  }

  // Normalize path
  let path = rawPath.replace(/\/+$/, '');
  if (!path) path = '/';

  const searchParams = new URLSearchParams(loc.search);

  if (path === '/' || path === '/home') {
    return { route: 'home', params: {} };
  }

  if (path.startsWith('/product/')) {
    const slugOrId = decodeURIComponent(path.slice('/product/'.length));
    return { route: 'product-detail', params: { id: slugOrId } };
  }

  if (path.startsWith('/category/')) {
    const category = decodeURIComponent(path.slice('/category/'.length));
    return { route: 'products', params: { category } };
  }

  if (path === '/trending') {
    return { route: 'products', params: { category: 'trending' } };
  }

  if (path === '/cart') {
    return { route: 'cart', params: {} };
  }

  if (path === '/checkout') {
    return { route: 'checkout', params: {} };
  }

  if (path.startsWith('/order-confirmation')) {
    const parts = path.split('/');
    const orderId = parts[2] ? decodeURIComponent(parts[2]) : (searchParams.get('orderId') || '');
    return { route: 'order-confirmation', params: { orderId } };
  }

  if (path.startsWith('/orders/')) {
    const id = decodeURIComponent(path.slice('/orders/'.length));
    return { route: 'order-detail', params: { id } };
  }

  if (path === '/orders') {
    return { route: 'orders', params: {} };
  }

  if (path === '/profile') {
    return { route: 'profile', params: {} };
  }

  if (path === '/wallet') {
    return { route: 'wallet', params: {} };
  }

  if (path === '/vouchers') {
    return { route: 'vouchers', params: {} };
  }

  if (path === '/wishlist') {
    return { route: 'wishlist', params: {} };
  }

  if (path === '/compare') {
    return { route: 'compare', params: {} };
  }

  if (path === '/support') {
    const orderId = searchParams.get('orderId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    return { route: 'support', params: { orderId, userId } };
  }

  if (path === '/notifications') {
    return { route: 'notifications', params: {} };
  }

  if (path === '/admin') {
    return { route: 'admin', params: {} };
  }

  if (path === '/products') {
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    return { route: 'products', params: { category, search } };
  }

  if (path === '/about') return { route: 'about', params: {} };
  if (path === '/contact') return { route: 'contact', params: {} };
  if (path === '/faq') return { route: 'faq', params: {} };
  if (path === '/privacy-policy') return { route: 'privacy-policy', params: {} };
  if (path === '/terms') return { route: 'terms', params: {} };
  if (path === '/shipping-policy') return { route: 'shipping-policy', params: {} };
  if (path === '/return-policy') return { route: 'return-policy', params: {} };

  return { route: 'home', params: {} };
}

export function formatRouteToUrl(route: string, params: Record<string, any> = {}): string {
  switch (route) {
    case 'home':
      return '/';
    case 'product-detail': {
      const slugOrId = params.slug || params.id || '';
      return `/product/${encodeURIComponent(slugOrId)}`;
    }
    case 'products': {
      if (params.category === 'trending') return '/trending';
      if (params.category) return `/category/${encodeURIComponent(params.category)}`;
      if (params.search) return `/products?search=${encodeURIComponent(params.search)}`;
      return '/products';
    }
    case 'cart':
      return '/cart';
    case 'checkout':
      return '/checkout';
    case 'order-confirmation':
      return params.orderId ? `/order-confirmation/${encodeURIComponent(params.orderId)}` : '/order-confirmation';
    case 'orders':
      return '/orders';
    case 'order-detail':
      return `/orders/${encodeURIComponent(params.id || '')}`;
    case 'profile':
      return '/profile';
    case 'wallet':
      return '/wallet';
    case 'vouchers':
      return '/vouchers';
    case 'wishlist':
      return '/wishlist';
    case 'compare':
      return '/compare';
    case 'support': {
      const sp = new URLSearchParams();
      if (params.orderId) sp.set('orderId', params.orderId);
      if (params.userId) sp.set('userId', params.userId);
      const q = sp.toString();
      return q ? `/support?${q}` : '/support';
    }
    case 'notifications':
      return '/notifications';
    case 'admin':
      return '/admin';
    case 'about':
      return '/about';
    case 'contact':
      return '/contact';
    case 'faq':
      return '/faq';
    case 'privacy-policy':
      return '/privacy-policy';
    case 'terms':
      return '/terms';
    case 'shipping-policy':
      return '/shipping-policy';
    case 'return-policy':
      return '/return-policy';
    default:
      return '/';
  }
}

export function AppContent() {
  const initial = typeof window !== 'undefined'
    ? parseLocationToRoute(window.location)
    : { route: 'home', params: {} };

  const [currentRoute, setCurrentRoute] = useState<string>(initial.route);
  const [routeParams, setRouteParams] = useState<Record<string, any>>(initial.params);
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  // Synchronize route navigation with browser history
  const navigate = (route: string, params: Record<string, any> = {}, options?: { replace?: boolean }) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof window !== 'undefined') {
      const targetUrl = formatRouteToUrl(route, params);
      const stateObj = { route, params };
      if (options?.replace) {
        window.history.replaceState(stateObj, '', targetUrl);
      } else {
        const currentUrl = window.location.pathname + window.location.search;
        if (currentUrl !== targetUrl) {
          window.history.pushState(stateObj, '', targetUrl);
        }
      }
    }
  };

  // Listen to popstate for browser Back & Forward navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseLocationToRoute(window.location);
      const targetUrl = formatRouteToUrl(parsed.route, parsed.params);
      window.history.replaceState({ route: parsed.route, params: parsed.params }, '', targetUrl);

      const handlePopState = (e: PopStateEvent) => {
        if (e.state && e.state.route) {
          setCurrentRoute(e.state.route);
          setRouteParams(e.state.params || {});
        } else {
          const fresh = parseLocationToRoute(window.location);
          setCurrentRoute(fresh.route);
          setRouteParams(fresh.params);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

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
        return (
          <SupportChatPage
            onNavigate={navigate}
            orderIdParam={routeParams.orderId || routeParams.id}
            customerUserIdParam={routeParams.userId || routeParams.customerId}
          />
        );
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
