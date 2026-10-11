import React, { useState } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  RotateCcw,
  Truck,
  Headphones,
  Mail,
  ArrowRight,
  Check
} from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer className="bg-slate-950 text-slate-300 mt-20 border-t border-slate-800">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Genuine Products</h4>
              <p className="text-xs text-slate-400 mt-0.5">Sourced directly from verified brands</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">7-Day Easy Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">Instant refund to wallet or source</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Express Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">Track packages real-time to your door</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">24x7 Customer Care</h4>
              <p className="text-xs text-slate-400 mt-0.5">Dedicated live agent & in-app chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Trend<span className="text-indigo-400">Pro</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pr-4">
              TrendPro is India&apos;s fast-growing premier e-commerce marketplace offering authentic consumer electronics, curated fashion, home appliances, gourmet foods, and accessories with lightning-fast delivery and secure payments.
            </p>
            
            {/* Newsletter */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-200 mb-2">Subscribe to Secret VIP Deals</p>
              {subscribed ? (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Subscribed! You'll receive secret VIP deals.</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubscribed(true);
                  }}
                  className="flex gap-2 max-w-sm"
                >
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Join <ArrowRight className="w-3 h-3" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Categories</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('products', { category: 'electronics' })} className="hover:text-white">
                  Mobiles & Laptops
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', { category: 'fashion' })} className="hover:text-white">
                  Men & Women Fashion
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', { category: 'home-kitchen' })} className="hover:text-white">
                  Kitchen Appliances
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', { category: 'beauty' })} className="hover:text-white">
                  Beauty & Skincare
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', { category: 'grocery' })} className="hover:text-white">
                  Organic Grocery
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', { category: 'accessories' })} className="hover:text-white">
                  Travel & Accessories
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Customer Care</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('orders')} className="hover:text-white">
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('profile')} className="hover:text-white">
                  My Account
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('wallet')} className="hover:text-white">
                  TrendPro Wallet & Credits
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('support')} className="hover:text-white">
                  Customer Support Chat
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-white">
                  FAQs & Knowledge Base
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Policies & Company */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Policies & Info</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white">
                  About TrendPro
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('return-policy')} className="hover:text-white">
                  Return & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shipping-policy')} className="hover:text-white">
                  Shipping & Delivery Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy-policy')} className="hover:text-white">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="text-indigo-400 hover:text-indigo-300 font-semibold">
                  Owner Admin Console
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 TrendPro Technologies Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Safe & Secure Payments:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold">UPI</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold">VISA</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold">Mastercard</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold">RuPay</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold">NetBanking</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
