import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';

interface WishlistPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const { products } = useStore();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  if (wishlistedProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Wishlist is Empty</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          Save your favourite items here so you can easily purchase them later!
        </p>
        <button
          onClick={() => onNavigate('products')}
          className="mt-6 bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('products')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              My Wishlist ({wishlistedProducts.length})
            </h1>
            <p className="text-xs text-slate-500">Saved items ready for your next order</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {wishlistedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between hover:shadow-lg transition-all"
          >
            <div className="relative aspect-square w-full bg-slate-50 rounded-xl overflow-hidden p-3 flex items-center justify-center mb-3">
              <img
                src={product.mainImage}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply"
              />
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-2 right-2 p-1.5 bg-white/90 text-rose-600 rounded-full shadow-xs hover:bg-rose-50"
                title="Remove from wishlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {product.brand}
              </p>
              <h3
                onClick={() => onNavigate('product-detail', { id: product.id })}
                className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 cursor-pointer"
              >
                {product.name}
              </h3>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-base font-black text-slate-900">
                  ₹{product.sellingPrice.toLocaleString()}
                </span>
                {product.originalPrice > product.sellingPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  addToCart(product);
                  toggleWishlist(product.id);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Move to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
