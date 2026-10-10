import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Heart,
  User as UserIcon,
  Layers,
  MapPin,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Package,
  Wallet,
  LogOut,
  Bell,
  Scale,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

interface HeaderProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
  currentRoute: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentRoute }) => {
  const { currentUser, userProfile, isAdmin, signInWithGoogle, signOut } = useAuth();
  const { cartCount, wishlistCount, compareList, subtotal } = useCart();
  const { products, categories, notifications, supportMessages } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [deliveryPincode, setDeliveryPincode] = useState('560001');
  const [editingPincode, setEditingPincode] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const unreadChatCount = isAdmin
    ? supportMessages.filter((m) => m.sender === 'customer' && !m.isRead).length
    : supportMessages.filter((m) => m.sender === 'owner' && !m.isRead).length;

  // Filtered search results
  const searchResults: Product[] = searchQuery.trim().length > 1
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      onNavigate('products', { search: searchQuery.trim() });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3 sm:gap-6">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {showMobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 group text-left cursor-pointer focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Trend<span className="text-indigo-600">Pro</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm border border-amber-300/60">
                    Plus
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Explore Plus Marketplace
                </span>
              </div>
            </button>
          </div>

          {/* Delivery Location Quick Indicator */}
          <div className="hidden xl:flex items-center text-xs text-slate-600 border-l border-slate-200 pl-4 py-1">
            <MapPin className="w-4 h-4 text-indigo-600 mr-1.5 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Deliver to</div>
              {editingPincode ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="text"
                    value={deliveryPincode}
                    onChange={(e) => setDeliveryPincode(e.target.value.slice(0, 6))}
                    className="w-16 px-1.5 py-0.5 text-xs font-semibold border rounded border-indigo-400 focus:outline-hidden"
                    maxLength={6}
                  />
                  <button
                    onClick={() => setEditingPincode(false)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingPincode(true)}
                  className="font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-0.5"
                >
                  India, {deliveryPincode}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Advanced Google-like Search Bar with Autocomplete & Trending Searches */}
          <div ref={searchRef} className="relative flex-1 max-w-2xl mx-1 sm:mx-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search products, brands, smartphones, fashion, gift cards..."
                className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 text-sm rounded-full pl-11 pr-28 py-2.5 border border-slate-200/80 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 shadow-inner transition-all outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Live Autocomplete Dropdown - Google-Style Suggestions */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
                {searchQuery.trim().length <= 1 ? (
                  /* Trending and Quick Category chips when input is empty or 1 char */
                  <div className="p-4 space-y-4 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        🔥 Trending Searches
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {['Smartphone 5G', 'Noise Cancelling', 'Cotton Shirt', 'Gift Cards', 'Running Shoes', 'Smartwatch'].map(
                          (item) => (
                            <button
                              key={item}
                              onClick={() => {
                                setSearchQuery(item);
                                setShowSearchResults(false);
                                onNavigate('products', { search: item });
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-full font-medium transition-colors cursor-pointer text-slate-700 flex items-center gap-1.5"
                            >
                              <Search className="w-3 h-3 text-slate-400" />
                              <span>{item}</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Explore Categories
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.slice(0, 6).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              onNavigate('products', { category: c.slug });
                            }}
                            className="p-2.5 bg-slate-50 hover:bg-indigo-50/60 rounded-xl text-left border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer"
                          >
                            <p className="font-bold text-slate-900 truncate">{c.name}</p>
                            <span className="text-[10px] text-indigo-600 font-medium">Browse Collection →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2 divide-y divide-slate-100">
                    <div className="px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <span>Instant Matches ({searchResults.length})</span>
                      <span className="text-indigo-600 font-bold lowercase">press Enter to view all</span>
                    </div>

                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                          onNavigate('product-detail', { id: product.id });
                        }}
                        className="flex items-center gap-3.5 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          className="w-12 h-12 object-contain rounded-xl bg-slate-50 border border-slate-100 p-1 shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-bold text-slate-700">{product.brand}</span>
                            <span>•</span>
                            <span className="capitalize">{product.category}</span>
                            {product.rating && (
                              <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                ★ {product.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-slate-900">
                            ₹{product.sellingPrice.toLocaleString()}
                          </p>
                          {product.discountPercent > 0 && (
                            <span className="text-[10px] text-emerald-600 font-bold">
                              {product.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="px-4 py-2.5 bg-slate-50 text-center">
                      <button
                        onClick={handleSearchSubmit}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        View all products matching &ldquo;{searchQuery}&rdquo; →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500 text-xs space-y-2">
                    <p className="font-bold text-slate-700">No matching products found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-slate-400 text-[11px]">Check spelling or browse all catalog products below.</p>
                    <button
                      onClick={() => {
                        setShowSearchResults(false);
                        onNavigate('products');
                      }}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Browse Complete Catalog →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Navigation: Compare, Wishlist, Notifications, Cart, Account */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            
            {/* Compare Shortcut */}
            <button
              onClick={() => onNavigate('compare')}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors hidden md:flex items-center"
              title="Compare Products"
            >
              <Scale className="w-5 h-5" />
              {compareList.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {compareList.length}
                </span>
              )}
            </button>

            {/* Wishlist Shortcut */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl transition-colors hidden sm:flex items-center"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Notifications Shortcut */}
            {currentUser && (
              <button
                onClick={() => onNavigate('notifications')}
                className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors hidden sm:flex items-center"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>
            )}

            {/* Support / Owner Chat Shortcut */}
            {currentUser && (
              <button
                onClick={() => onNavigate('support')}
                className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors flex items-center cursor-pointer"
                title={isAdmin ? 'Store Owner Support Inbox' : 'Direct Support Chat with Owner'}
              >
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors border border-transparent hover:border-indigo-100"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-indigo-600 text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Cart</span>
                <span className="text-xs font-bold text-slate-800">
                  {cartCount > 0 ? `₹${subtotal.toLocaleString()}` : 'Empty'}
                </span>
              </div>
            </button>

            {/* Account / User Menu Dropdown */}
            <div ref={userMenuRef} className="relative">
              {currentUser ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {(userProfile?.photoURL || currentUser.photoURL) ? (
                    <img
                      src={(userProfile?.photoURL || currentUser.photoURL) as string}
                      alt={currentUser.displayName || 'Profile'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-indigo-600/20 active:scale-95"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Account Dropdown Menu */}
              {showUserMenu && currentUser && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                      <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                        {userProfile?.customerId || `CUST-${currentUser.uid.slice(-6).toUpperCase()}`}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                      {currentUser.displayName || 'TrendPro Member'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-2 flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg">
                      <span className="text-slate-600 font-medium">Wallet Balance:</span>
                      <span className="font-bold text-emerald-600">
                        ₹{userProfile?.walletBalance?.toLocaleString() ?? 500}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      My Profile & Addresses
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('orders');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      Orders & Tracking
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('wallet');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Wallet className="w-4 h-4 text-slate-400" />
                      TrendPro Wallet & Vouchers
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('support');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Layers className="w-4 h-4 text-slate-400" />
                      24x7 Customer Support
                    </button>

                    {/* Admin Dashboard Protected Option */}
                    {isAdmin && (
                      <div className="mt-1 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigate('admin');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          Owner Admin Dashboard
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Sub-Header Category Navigation Bar */}
      <div className="hidden lg:block bg-slate-50/90 border-t border-slate-200/60 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-6 text-xs font-semibold text-slate-700">
            <button
              onClick={() => onNavigate('products')}
              className={`hover:text-indigo-600 transition-colors ${
                currentRoute === 'products' ? 'text-indigo-600 font-bold' : ''
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate('products', { category: cat.slug })}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
            <button
              onClick={() => onNavigate('vouchers')}
              className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1"
            >
              🔥 Hot Offers
            </button>
            <button onClick={() => onNavigate('faq')} className="hover:text-slate-800">
              Help Center
            </button>
            <button onClick={() => onNavigate('contact')} className="hover:text-slate-800">
              Contact
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {showMobileNav && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-indigo-600" />
                <span className="font-extrabold text-lg text-slate-900">TrendPro</span>
              </div>
              <button onClick={() => setShowMobileNav(false)} className="p-1 text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-4 space-y-3 flex-1 overflow-y-auto">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Categories</p>
              <button
                onClick={() => {
                  setShowMobileNav(false);
                  onNavigate('products');
                }}
                className="block w-full text-left py-1.5 text-sm font-semibold text-slate-800 hover:text-indigo-600"
              >
                All Products
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setShowMobileNav(false);
                    onNavigate('products', { category: c.slug });
                  }}
                  className="block w-full text-left py-1.5 text-sm text-slate-600 hover:text-indigo-600"
                >
                  {c.name}
                </button>
              ))}

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My Account</p>
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    onNavigate('orders');
                  }}
                  className="block w-full text-left py-1 text-sm text-slate-700"
                >
                  My Orders
                </button>
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    onNavigate('wishlist');
                  }}
                  className="block w-full text-left py-1 text-sm text-slate-700"
                >
                  Wishlist ({wishlistCount})
                </button>
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    onNavigate('compare');
                  }}
                  className="block w-full text-left py-1 text-sm text-slate-700"
                >
                  Product Comparison ({compareList.length})
                </button>
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    onNavigate('wallet');
                  }}
                  className="block w-full text-left py-1 text-sm text-slate-700"
                >
                  Wallet & Gift Cards
                </button>
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    onNavigate('support');
                  }}
                  className="block w-full text-left py-1 text-sm text-slate-700"
                >
                  Customer Support Chat
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowMobileNav(false);
                      onNavigate('admin');
                    }}
                    className="block w-full text-left py-1 text-sm font-bold text-indigo-600"
                  >
                    Owner Admin Dashboard
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              {currentUser ? (
                <button
                  onClick={async () => {
                    setShowMobileNav(false);
                    await signOut();
                  }}
                  className="w-full bg-slate-100 text-slate-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    signInWithGoogle();
                  }}
                  className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
