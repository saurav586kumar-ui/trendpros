import React, { useState } from 'react';
import {
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  RotateCcw,
  Truck,
  FileText,
  ChevronDown,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

interface StaticPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const AboutPage: React.FC<StaticPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </button>

      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
          Our Story
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          About TrendPro Marketplace
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Founded in 2026, TrendPro is India&apos;s hyper-growing, verified e-commerce marketplace dedicated to delivering genuine consumer technology, designer apparel, premium kitchenware, and wellness essentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Direct Brand Sourcing</h3>
          <p className="text-xs text-slate-500">
            Every product in our catalog is authenticated directly from verified manufacturer distributors.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <Truck className="w-8 h-8 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">Express Logistics</h3>
          <p className="text-xs text-slate-500">
            Automated fulfilment nodes across metro cities ensuring 24-48 hour doorstep delivery.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <RotateCcw className="w-8 h-8 text-amber-600" />
          <h3 className="font-bold text-slate-900 text-sm">Customer-First Assurance</h3>
          <p className="text-xs text-slate-500">
            Hassle-free 7-day doorstep return pickup and instant wallet or bank account refunds.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC<StaticPageProps> = ({ onNavigate }) => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </button>

      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contact Customer Care</h1>
        <p className="text-xs text-slate-500 mt-1">We are here 24 hours a day, 7 days a week</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-indigo-600 mt-1 shrink-0" />
            <div className="text-xs">
              <strong className="text-slate-900 block text-sm">Email Us</strong>
              <span className="text-slate-500">support@trendpro.market</span>
              <p className="text-slate-400 mt-0.5">Average reply time: under 15 minutes</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
            <div className="text-xs">
              <strong className="text-slate-900 block text-sm">Toll-Free Helpline</strong>
              <span className="text-slate-500">1800-200-TREND (1800 200 8736)</span>
              <p className="text-slate-400 mt-0.5">Available 9:00 AM – 9:00 PM IST</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
            <div className="text-xs">
              <strong className="text-slate-900 block text-sm">Headquarters</strong>
              <span className="text-slate-500">
                TrendPro Retail Tech Ltd, Level 6, Prestige Tech Park, Marathahalli-Sarjapur Ring Rd, Bengaluru, Karnataka 560103
              </span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          {submitted ? (
            <div className="text-center py-8 space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">Message Received!</h3>
              <p className="text-xs text-slate-500">Our customer care specialist will get back to you shortly.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Your Name</label>
                <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject</label>
                <input required placeholder="Order inquiry, refund, partnership" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Message</label>
                <textarea rows={3} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-xs">
                Submit Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const FAQPage: React.FC<StaticPageProps> = ({ onNavigate }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How long does delivery take?',
      a: 'Standard delivery across India takes 2 to 4 business days. For Tier-1 metro cities (Bengaluru, Mumbai, Delhi-NCR), next-day express delivery is available for orders placed before 3:00 PM.'
    },
    {
      q: 'What is TrendPro&apos;s 7-Day Return Policy?',
      a: 'You can initiate an easy return within 7 calendar days of delivery directly from the "My Orders" tab. Our logistics partner will pick up the item from your doorstep at zero return fee.'
    },
    {
      q: 'How does the TrendPro Wallet work?',
      a: 'TrendPro Wallet stores your cashbacks, promotional bonus credits, and instant return refunds. You can apply your wallet credits in 1-click during checkout to reduce order total.'
    },
    {
      q: 'Are all products authentic and covered by warranty?',
      a: 'Yes, 100%. Every item is backed by official manufacturer warranties ranging from 1 to 2 years, accompanied by valid GST tax invoices.'
    },
    {
      q: 'What payment options are supported?',
      a: 'We support all major Indian payment methods: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, Net Banking across 50+ banks, TrendPro Wallet, and Cash on Delivery (COD).'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </button>

      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h1>
        <p className="text-xs text-slate-500 mt-1">Instant answers to common customer queries</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full p-4 text-left font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between gap-4"
            >
              <span>{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  openIdx === i ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIdx === i && (
              <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const PolicyPage: React.FC<StaticPageProps & { type: 'privacy' | 'terms' | 'shipping' | 'returns' }> = ({
  onNavigate,
  type,
}) => {
  const titles = {
    privacy: 'Privacy Policy',
    terms: 'Terms and Conditions',
    shipping: 'Shipping & Delivery Policy',
    returns: 'Return and Refund Policy',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </button>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight">{titles[type]}</h1>
      <p className="text-xs text-slate-400">Last updated: March 2026</p>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-700 space-y-4 leading-relaxed shadow-xs">
        {type === 'privacy' && (
          <>
            <p>
              TrendPro (&ldquo;we&rdquo;, &ldquo;our&rdquo;) takes user data privacy seriously. This Privacy Policy details how we collect, use, and protect your information when utilizing the TrendPro marketplace application.
            </p>
            <h3 className="text-sm font-bold text-slate-900 pt-2">1. Information We Collect</h3>
            <p>
              We collect your verified Google authentication email and display name to create and manage your customer profile. Delivery addresses and contact phone numbers provided during checkout are strictly utilized for logistics and shipment delivery.
            </p>
            <h3 className="text-sm font-bold text-slate-900 pt-2">2. Data Security & Storage</h3>
            <p>
              All customer transactions, cart states, and address records are stored within Google Cloud Firestore protected by Attribute-Based Access Control (ABAC) security rules. Payment information is processed via PCI-DSS compliant payment gateways; we never store raw card numbers or CVVs.
            </p>
          </>
        )}

        {type === 'terms' && (
          <>
            <p>
              By accessing or placing an order on TrendPro, you agree to comply with and be bound by the following terms of service.
            </p>
            <h3 className="text-sm font-bold text-slate-900 pt-2">1. Catalog & Pricing</h3>
            <p>
              All listed prices are displayed in Indian Rupees (INR) and include applicable taxes. We reserve the right to correct typographical pricing discrepancies prior to order dispatch.
            </p>
            <h3 className="text-sm font-bold text-slate-900 pt-2">2. Order Acceptance</h3>
            <p>
              Order placement triggers real-time stock allocation. In the event of stock unavailability or invalid delivery addresses, orders may be cancelled with immediate full refund.
            </p>
          </>
        )}

        {type === 'shipping' && (
          <>
            <h3 className="text-sm font-bold text-slate-900">1. Delivery Timelines</h3>
            <p>
              Standard orders are processed within 24 business hours. Estimated delivery timelines range from 1-2 days for metro areas to 3-5 days for other regions across India.
            </p>
            <h3 className="text-sm font-bold text-slate-900 pt-2">2. Delivery Charges</h3>
            <p>
              Orders above ₹999 qualify for Free Standard Delivery. Orders below ₹999 incur a nominal delivery fee of ₹79.
            </p>
          </>
        )}

        {type === 'returns' && (
          <>
            <h3 className="text-sm font-bold text-slate-900">1. 7-Day Window</h3>
            <p>
              Eligible items in their original condition with manufacturer seals, packaging, and accessories may be returned within 7 calendar days of receipt.
            </p>
            <h3 className="text-sm font-bold text-slate-900 pt-2">2. Instant Refund Processing</h3>
            <p>
              Once the return package is collected and verified, refunds to TrendPro Wallet are credited immediately. Bank/card refunds are processed within 3-5 business days.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
