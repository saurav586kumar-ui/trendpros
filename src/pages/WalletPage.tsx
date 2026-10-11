import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Plus,
  ShieldCheck,
  CheckCircle,
  Tag,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

interface WalletPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, signInWithGoogle } = useAuth();
  const { topUpWallet, vouchers, redeemGiftCard } = useStore();

  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [giftCardNumber, setGiftCardNumber] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [redeemResult, setRedeemResult] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Wallet className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to access your wallet</h2>
        <p className="text-xs text-slate-500 mt-2">
          View your store credits, redeem gift voucher cards, and buy products directly with wallet funds.
        </p>
        <button
          onClick={signInWithGoogle}
          className="mt-6 bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  const walletBalance = userProfile?.walletBalance || 0;

  const handleTopUp = async () => {
    setIsProcessing(true);
    setRedeemResult('');
    try {
      await topUpWallet(topUpAmount);
      setRedeemResult(`Successfully added ₹${topUpAmount.toLocaleString()} to your TrendPro wallet!`);
      setTimeout(() => setRedeemResult(''), 4000);
    } catch (err: any) {
      setRedeemResult(`Error: ${err.message || 'Error processing top-up'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemGift = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = giftCardNumber.trim().toUpperCase();
    if (!cleanNumber) return;

    setIsProcessing(true);
    setRedeemResult('');

    try {
      if (cleanNumber === 'GIFT1000') {
        await topUpWallet(1000);
        setRedeemResult('Promo code GIFT1000 claimed! ₹1,000 credited to wallet.');
        setGiftCardNumber('');
      } else {
        const res = await redeemGiftCard(cleanNumber, giftCardPin);
        setRedeemResult(res.message);
        if (res.success) {
          setGiftCardNumber('');
          setGiftCardPin('');
        }
      }
    } catch (err: any) {
      setRedeemResult(err.message || 'Error redeeming card');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('profile')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              TrendPro Wallet & Gift Vouchers
            </h1>
            <p className="text-xs text-slate-500">
              Instant 1-click checkout currency • Non-transferable RBI store credit
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('products')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Shop Using Wallet</span>
        </button>
      </div>

      {/* Balance Hero Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Available Wallet Balance
          </span>
          <div className="text-3xl sm:text-4xl font-black mt-1 tracking-tight text-white">
            ₹{walletBalance.toLocaleString()}
          </div>
          <p className="text-xs text-indigo-200/80 mt-2 max-w-sm">
            Spendable on all electronics, apparel, and lifestyle products with zero OTP delays.
          </p>
        </div>

        <div className="flex flex-col gap-2 bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/10">
          <span className="text-xs font-bold text-white mb-1">Add Money via Online Payment</span>
          <div className="flex gap-2">
            {[500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                onClick={() => setTopUpAmount(amt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  topUpAmount === amt
                    ? 'bg-white text-indigo-900 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                +₹{amt}
              </button>
            ))}
          </div>

          <button
            onClick={handleTopUp}
            disabled={isProcessing}
            className="mt-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black py-2 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isProcessing ? 'Crediting...' : `Add ₹${topUpAmount.toLocaleString()} to Wallet`}
          </button>
        </div>
      </div>

      {redeemResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{redeemResult}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Redeem Gift Card Number into Wallet */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-4 h-4 text-indigo-600" />
              Redeem E-Gift Card into Wallet
            </h2>
            <button
              onClick={() => onNavigate('products', { category: 'gift-cards' })}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Buy Gift Card →
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Enter the 16-digit card number and PIN from your digital gift card order to credit money to your wallet.
          </p>

          <form onSubmit={handleRedeemGift} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Gift Card Number (16 Digits)
              </label>
              <input
                type="text"
                required
                value={giftCardNumber}
                onChange={(e) => setGiftCardNumber(e.target.value.toUpperCase())}
                placeholder="e.g. TPGC-8491-3829-1920 or GIFT1000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold uppercase outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Secret PIN (4 Digits)
              </label>
              <input
                type="password"
                maxLength={4}
                value={giftCardPin}
                onChange={(e) => setGiftCardPin(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono outline-hidden focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {isProcessing ? 'Validating Card...' : 'Add Gift Card Money to Wallet'}
            </button>
          </form>

          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl space-y-1">
            <p>💡 Tip: Purchased gift cards are always available inside <strong>My Orders</strong>.</p>
            <p>Or use instant bonus promo code: <strong className="text-indigo-600 font-mono">GIFT1000</strong></p>
          </div>
        </div>

        {/* Active Store Coupons */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            Active Store Vouchers ({vouchers.length})
          </h2>

          <div className="space-y-2.5">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded text-[11px]">
                    {v.code}
                  </span>
                  <p className="text-slate-600 text-[11px] mt-1">{v.description}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(v.code);
                    setCopiedCode(v.code);
                    setTimeout(() => setCopiedCode(''), 3000);
                  }}
                  className={`text-xs font-bold transition-colors cursor-pointer ${
                    copiedCode === v.code ? 'text-emerald-600' : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  {copiedCode === v.code ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-500 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-700">Prepaid Regulatory Policy</p>
          <p className="text-[11px] mt-0.5 leading-relaxed">
            TrendPro Wallet credits represent non-interest bearing store credits strictly redeemable for goods on the TrendPro marketplace. They cannot be transferred to third-party bank accounts or redeemed for cash, ensuring regulatory compliance.
          </p>
        </div>
      </div>
    </div>
  );
};
