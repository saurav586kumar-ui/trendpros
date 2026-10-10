import React from 'react';
import { Sparkles, Truck, Tag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AnnouncementBar: React.FC = () => {
  const { announcementConfig } = useStore();

  if (!announcementConfig || !announcementConfig.isEnabled) {
    return null; // Hidden if disabled by store owner
  }

  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-indigo-100 text-xs py-2 px-4 border-b border-indigo-900/40 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {announcementConfig.badge && (
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full text-[11px] border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {announcementConfig.badge}
            </span>
          )}
          <span className="hidden sm:inline text-slate-300">
            {announcementConfig.headline}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-[11px]">
          {announcementConfig.couponCode && (
            <span className="flex items-center gap-1 text-slate-300">
              <Tag className="w-3 h-3 text-emerald-400" />
              Code:{' '}
              <strong className="text-white font-mono bg-indigo-900/80 px-1.5 py-0.5 rounded border border-indigo-700/50">
                {announcementConfig.couponCode}
              </strong>{' '}
              {announcementConfig.discountText}
            </span>
          )}
          {announcementConfig.shippingNote && (
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <Truck className="w-3 h-3 text-sky-400" />
              {announcementConfig.shippingNote}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
