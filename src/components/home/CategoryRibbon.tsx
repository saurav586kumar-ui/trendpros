import React from 'react';
import {
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  ShoppingBag,
  Watch,
  Grid
} from 'lucide-react';
import { Category } from '../../types';

interface CategoryRibbonProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
  selectedSlug?: string;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-6 h-6" />,
  Shirt: <Shirt className="w-6 h-6" />,
  Home: <Home className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  ShoppingBag: <ShoppingBag className="w-6 h-6" />,
  Watch: <Watch className="w-6 h-6" />,
};

export const CategoryRibbon: React.FC<CategoryRibbonProps> = ({
  categories,
  onSelectCategory,
  selectedSlug,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Explore by Category</h2>
          <p className="text-xs text-slate-500">Discover trending collections curated for you</p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const isSelected = selectedSlug === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`group flex flex-col items-center p-3 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-center ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-indigo-50/70 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                }`}
              >
                {ICONS_MAP[cat.icon] || <Grid className="w-6 h-6" />}
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {cat.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {cat.subCategories.length} Categories
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
