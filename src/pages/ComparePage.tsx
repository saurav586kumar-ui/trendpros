import React from 'react';
import { Scale, Trash2, ShoppingBag, Star, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';

interface ComparePageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({ onNavigate }) => {
  const { compareList, toggleCompare, clearCompare, addToCart } = useCart();
  const { products } = useStore();

  const comparedProducts = products.filter((p) => compareList.includes(p.id));

  // Collect all unique specs across compared products
  const allSpecKeys = Array.from(
    new Set(
      comparedProducts.flatMap((p) => (p.specs ? Object.keys(p.specs) : []))
    )
  );

  if (comparedProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No products in comparison</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          Add up to 4 items from the catalog to compare specifications, prices, and features side by side.
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
              Product Comparison ({comparedProducts.length}/4)
            </h1>
            <p className="text-xs text-slate-500">Side-by-side feature & price evaluation</p>
          </div>
        </div>

        <button
          onClick={clearCompare}
          className="text-xs text-rose-600 hover:text-rose-800 font-bold"
        >
          Clear All
        </button>
      </div>

      {/* Comparison Grid Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="p-4 w-48 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Product
              </th>
              {comparedProducts.map((prod) => (
                <th key={prod.id} className="p-4 min-w-[220px] max-w-[280px]">
                  <div className="space-y-3">
                    <div className="relative aspect-square w-32 mx-auto bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                      <img
                        src={prod.mainImage}
                        alt={prod.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                      <button
                        onClick={() => toggleCompare(prod.id)}
                        className="absolute top-1 right-1 p-1 bg-white/90 text-slate-400 hover:text-rose-600 rounded-full shadow-xs"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="font-bold text-slate-900 text-xs line-clamp-2">{prod.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black text-slate-900">
                        ₹{prod.sellingPrice.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-bold">
                        {prod.discountPercent}% OFF
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(prod)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {/* Rating */}
            <tr>
              <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Rating</td>
              {comparedProducts.map((p) => (
                <td key={p.id} className="p-4">
                  <div className="flex items-center gap-1 text-slate-900 font-bold">
                    <span>{p.rating}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-slate-400 font-normal">({p.ratingCount})</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Brand */}
            <tr>
              <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Brand</td>
              {comparedProducts.map((p) => (
                <td key={p.id} className="p-4 font-semibold text-slate-800">
                  {p.brand}
                </td>
              ))}
            </tr>

            {/* Category */}
            <tr>
              <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Category</td>
              {comparedProducts.map((p) => (
                <td key={p.id} className="p-4 text-slate-600 capitalize">
                  {p.category}
                </td>
              ))}
            </tr>

            {/* Warranty */}
            <tr>
              <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Warranty</td>
              {comparedProducts.map((p) => (
                <td key={p.id} className="p-4 text-slate-600">
                  {p.warranty || '1 Year Brand Warranty'}
                </td>
              ))}
            </tr>

            {/* Specifications Matrix */}
            {allSpecKeys.map((key) => (
              <tr key={key}>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">{key}</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 text-slate-700">
                    {p.specs?.[key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
