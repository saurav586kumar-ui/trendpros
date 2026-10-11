import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
  Tag,
  Database,
  CheckCircle
} from 'lucide-react';
import { BannerCarousel } from '../components/home/BannerCarousel';
import { CategoryRibbon } from '../components/home/CategoryRibbon';
import { ProductCard } from '../components/common/ProductCard';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';

interface HomePageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { products, categories, banners, seedInitialDataToFirestore, trendingConfig } = useStore();
  const { isAdmin } = useAuth();
  const [seeded, setSeeded] = useState(false);

  // Helper to test if product belongs to category by slug or id
  const belongsToCategory = (p: Product, target: string): boolean => {
    const t = target.toLowerCase();
    if (p.category && p.category.toLowerCase() === t) return true;
    if (p.categoryIds && p.categoryIds.some((c) => c.toLowerCase() === t)) return true;
    if (p.categories && p.categories.some((c) => c.toLowerCase() === t)) return true;
    return false;
  };

  // Dedicated Owner-Curated Trending Products
  const trendingProducts = useMemo(() => {
    // 1. If owner has curated trending list in trendingConfig
    if (trendingConfig?.items && trendingConfig.items.length > 0) {
      const sorted = [...trendingConfig.items].sort((a, b) => a.priority - b.priority);
      const list: Product[] = [];
      const seen = new Set<string>();

      for (const item of sorted) {
        const prod = products.find((p) => p.id === item.productId && p.isActive);
        if (prod && !seen.has(prod.id)) {
          seen.add(prod.id);
          list.push(prod);
        }
      }
      if (list.length > 0) return list;
    }

    // 2. Fallback only to owner-selected isTrending products (never arbitrary high rating)
    const fallbackList = products
      .filter((p) => p.isActive && Boolean(p.isTrending))
      .sort((a, b) => (a.trendingOrder ?? 999) - (b.trendingOrder ?? 999));

    // 3. Fallback to top featured if no trending curated yet
    if (fallbackList.length > 0) return fallbackList;
    return products.filter((p) => p.isActive && p.isFeatured).slice(0, 4);
  }, [products, trendingConfig]);

  // Multi-category supported Tech Deals
  const techDeals = useMemo(() => {
    const list: Product[] = [];
    const seen = new Set<string>();
    for (const p of products) {
      if (!p.isActive || seen.has(p.id)) continue;
      if (
        belongsToCategory(p, 'electronics') ||
        belongsToCategory(p, 'cat-electronics') ||
        belongsToCategory(p, 'mobiles')
      ) {
        seen.add(p.id);
        list.push(p);
      }
    }
    return list.slice(0, 4);
  }, [products]);

  // Multi-category supported Fashion Deals
  const fashionDeals = useMemo(() => {
    const list: Product[] = [];
    const seen = new Set<string>();
    for (const p of products) {
      if (!p.isActive || seen.has(p.id)) continue;
      if (
        belongsToCategory(p, 'fashion') ||
        belongsToCategory(p, 'cat-fashion') ||
        belongsToCategory(p, 'apparel')
      ) {
        seen.add(p.id);
        list.push(p);
      }
    }
    return list.slice(0, 4);
  }, [products]);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner Carousel */}
      <BannerCarousel banners={banners} onNavigate={onNavigate} />

      {/* Categories Navigation Ribbon */}
      <CategoryRibbon
        categories={categories}
        onSelectCategory={(slug) => onNavigate('products', { category: slug })}
      />

      {/* Admin Quick Catalog Seeder Notice (shown when catalog is small or if admin wants to ensure Firestore DB is fully populated) */}
      {isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-indigo-700/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Owner Quick Setup</p>
                <p className="text-sm font-semibold">Sync Sample Catalog & Banners to Cloud Firestore</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await seedInitialDataToFirestore();
                setSeeded(true);
                setTimeout(() => setSeeded(false), 4000);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              {seeded ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>Synced Successfully!</span>
                </>
              ) : (
                <span>Seed/Sync Firestore Catalog</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Trending Deals of the Day Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              Flash Deals & Trending
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trending Top Sellers
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="group flex items-center gap-1 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* Promotional Value Proposition Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-800 text-white p-8 sm:p-12 shadow-xl">
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs">
              <Tag className="w-3.5 h-3.5" /> TrendPro Plus Membership
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Enjoy Free Next-Day Delivery & Extra 5% SuperCoins on Every Purchase
            </h3>
            <p className="text-indigo-100 text-xs sm:text-sm">
              Upgrade your shopping experience with priority customer support, early festive access, and exclusive coupons.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('products')}
                className="bg-white text-indigo-900 hover:bg-slate-100 text-xs sm:text-sm font-extrabold px-6 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
              >
                Start Shopping Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Electronics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              High Performance Tech
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Top Electronics & Gadgets
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products', { category: 'electronics' })}
            className="group flex items-center gap-1 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>Explore Electronics</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {techDeals.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* Autumn Fashion & Footwear */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              Curated Wardrobe
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trending Fashion & Footwear
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products', { category: 'fashion' })}
            className="group flex items-center gap-1 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>Explore Fashion</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {fashionDeals.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>
    </div>
  );
};
