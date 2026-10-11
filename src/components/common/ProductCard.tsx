import React, { useState } from 'react';
import { Heart, ShoppingBag, Scale, Check, Share2, Bell } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { StarRating } from './StarRating';
import { shareProduct } from '../../utils/sharing';

interface ProductCardProps {
  product: Product;
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const {
    addToCart,
    cart,
    toggleWishlist,
    isInWishlist,
    toggleCompare,
    isInCompare,
  } = useCart();

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const isFavorited = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const cartItem = cart.find((i) => i.productId === product.id);
  const isOutOfStock = product.stock <= 0;

  const handleCardClick = () => {
    onNavigate('product-detail', { id: product.slug || product.id });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompare(product.id);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await shareProduct(product);
    if (res.message) {
      setShareFeedback(res.message);
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center p-4">
        <img
          src={!imgError && product.mainImage ? product.mainImage : fallbackImage}
          alt={product.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Discount Badge */}
        {product.discountPercent > 0 && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs tracking-wider z-10">
            {product.discountPercent}% OFF
          </span>
        )}

        {/* Out of Stock Ribbon */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-rose-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1">
              <Bell className="w-3 h-3" /> Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist, Compare & Share Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <button
            onClick={handleWishlistClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
              isFavorited
                ? 'bg-rose-50 text-rose-600'
                : 'bg-white/90 text-slate-600 hover:text-rose-600 hover:bg-white'
            }`}
            title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>

          <button
            onClick={handleCompareClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
              isCompared
                ? 'bg-indigo-600 text-white'
                : 'bg-white/90 text-slate-600 hover:text-indigo-600 hover:bg-white'
            }`}
            title={isCompared ? 'In Compare List' : 'Compare Product'}
          >
            <Scale className="w-4 h-4" />
          </button>

          <button
            onClick={handleShareClick}
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors bg-white/90 text-slate-600 hover:text-indigo-600 hover:bg-white"
            title="Share Product"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share feedback toast */}
        {shareFeedback && (
          <div className="absolute top-12 right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-30 animate-in fade-in duration-150">
            {shareFeedback}
          </div>
        )}

        {/* Stock Warning Badge */}
        {!isOutOfStock && product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-2 left-2 bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
            Only {product.stock} left!
          </span>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1 uppercase tracking-wider">
            <span>{product.brand}</span>
            <span className="capitalize truncate max-w-[120px]">{product.category}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
            {product.name}
          </h3>

          {/* Real Ratings with Proportional Stars */}
          <div className="mb-2.5">
            <StarRating
              rating={product.rating || 0}
              reviewCount={product.ratingCount}
              showBadge={true}
              size="xs"
            />
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-slate-900">
                ₹{product.sellingPrice.toLocaleString()}
              </span>
              {product.originalPrice > product.sellingPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-600 font-medium">Free Delivery</p>
          </div>

          <button
            onClick={isOutOfStock ? handleCardClick : handleAddToCart}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
              isOutOfStock
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : cartItem
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
            }`}
          >
            {cartItem ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Added ({cartItem.quantity})</span>
              </>
            ) : isOutOfStock ? (
              <span>Notify Me</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
