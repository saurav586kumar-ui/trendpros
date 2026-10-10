import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Headphones,
  User,
  Clock,
  ArrowLeft,
  CheckCheck,
  ShieldCheck,
  Wallet,
  PlusCircle,
  Package,
  Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

interface SupportChatPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
  orderIdParam?: string;
}

export const SupportChatPage: React.FC<SupportChatPageProps> = ({
  onNavigate,
  orderIdParam,
}) => {
  const { currentUser, userProfile, isAdmin, signInWithGoogle } = useAuth();
  const {
    supportMessages,
    sendSupportMessage,
    replySupportMessage,
    creditCustomerWalletFromChat,
  } = useStore();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderIdParam || '');
  const [isSending, setIsSending] = useState(false);

  // Admin selected customer to chat with
  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>('');

  // Admin Credit Wallet Modal
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(500);
  const [creditReason, setCreditReason] = useState<string>('Goodwill gesture for delay');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages]);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Headphones className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to contact Customer Support</h2>
        <p className="text-xs text-slate-500 mt-2">
          Connect directly with the store owner for order inquiries, returns, and wallet assistance.
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

  // Group messages by customer for the owner
  const customerList = Array.from(
    new Map(
      supportMessages.map((m) => [
        m.userId,
        {
          userId: m.userId,
          customerId: m.customerId || `CUST-${m.userId.slice(-6).toUpperCase()}`,
          userName: m.userName,
          userEmail: m.userEmail,
        },
      ])
    ).values()
  );

  const activeChatUserId = isAdmin
    ? adminSelectedUserId || (customerList[0]?.userId ?? currentUser.uid)
    : currentUser.uid;

  const currentChatCustomer = customerList.find((c) => c.userId === activeChatUserId);

  // Filter messages for current active conversation
  const displayedMessages = supportMessages.filter((m) => m.userId === activeChatUserId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const text = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      if (isAdmin) {
        await replySupportMessage(activeChatUserId, text, selectedOrderId || undefined);
      } else {
        await sendSupportMessage(text, selectedOrderId || undefined);
      }
    } catch (err: any) {
      alert(err.message || 'Error sending message');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreditWallet = async () => {
    if (!activeChatUserId || creditAmount <= 0) return;
    try {
      await creditCustomerWalletFromChat(activeChatUserId, creditAmount, creditReason);
      setShowCreditModal(false);
      alert(`₹${creditAmount} successfully added to customer's wallet!`);
    } catch (err: any) {
      alert(err.message || 'Error crediting wallet');
    }
  };

  const myCustomerId = userProfile?.customerId || `CUST-${currentUser.uid.slice(-6).toUpperCase()}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-indigo-600" />
              Direct Support Chat with Store Owner
            </h1>
            <p className="text-xs text-slate-500">
              {isAdmin ? (
                <span>Owner Support Console</span>
              ) : (
                <span>
                  Your Unique Customer ID:{' '}
                  <strong className="text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                    {myCustomerId}
                  </strong>
                </span>
              )}
            </p>
          </div>
        </div>

        {selectedOrderId && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-xl">
            <Package className="w-4 h-4 text-amber-600" />
            <span>Referencing Order #{selectedOrderId}</span>
            <button
              onClick={() => setSelectedOrderId('')}
              className="text-amber-500 hover:text-amber-800 ml-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Admin customer selector sidebar */}
        {isAdmin && customerList.length > 0 && (
          <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
              Active Customer Chats ({customerList.length})
            </h3>
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
              {customerList.map((cust) => {
                const isSelected = activeChatUserId === cust.userId;
                return (
                  <button
                    key={cust.userId}
                    onClick={() => setAdminSelectedUserId(cust.userId)}
                    className={`w-full text-left p-3 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <p className="font-bold text-xs truncate">{cust.userName}</p>
                    <div className="flex justify-between items-center text-[10px] opacity-80 mt-1">
                      <span className="font-mono">{cust.customerId}</span>
                      <span className="truncate max-w-[100px]">{cust.userEmail}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Conversation Box */}
        <div
          className={`${
            isAdmin && customerList.length > 0 ? 'md:col-span-8' : 'md:col-span-12'
          } bg-white rounded-3xl border border-slate-200/80 shadow-md flex flex-col h-[520px] overflow-hidden`}
        >
          {/* Chat Window Top Bar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {isAdmin ? (
                  currentChatCustomer?.userName?.[0] || 'C'
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {isAdmin
                    ? `${currentChatCustomer?.userName || 'Customer'} (${currentChatCustomer?.customerId || 'CUST'})`
                    : 'TrendPro Store Owner'}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Human Chat (No Bots)
                </p>
              </div>
            </div>

            {/* Admin Action: Give Money to Customer Wallet */}
            {isAdmin && (
              <button
                onClick={() => setShowCreditModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Credit Wallet ₹</span>
              </button>
            )}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
            {displayedMessages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                <Headphones className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No messages in this chat yet</p>
                <p className="text-[11px] mt-1">
                  Send a message directly to get human assistance from the store owner.
                </p>
              </div>
            ) : (
              displayedMessages.map((msg) => {
                const isCustomerMsg = msg.sender === 'customer';
                const isMyMessage = isAdmin ? !isCustomerMsg : isCustomerMsg;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-lg ${
                      isMyMessage ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white ${
                        isCustomerMsg ? 'bg-slate-800' : 'bg-indigo-600'
                      }`}
                    >
                      {isCustomerMsg ? 'C' : <ShieldCheck className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`p-3 rounded-2xl shadow-xs text-xs space-y-1 ${
                        isMyMessage
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {/* Referencing order tag */}
                      {msg.orderId && (
                        <div
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded inline-block ${
                            isMyMessage ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-indigo-600'
                          }`}
                        >
                          📦 Order #{msg.orderId}
                        </div>
                      )}

                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                      {/* Wallet Credited Tag */}
                      {msg.walletCredited && (
                        <div className="bg-emerald-500/20 text-emerald-100 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 mt-1">
                          <Gift className="w-3.5 h-3.5" />
                          <span>₹{msg.walletCredited.toLocaleString()} Credited</span>
                        </div>
                      )}

                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] ${
                          isMyMessage ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMyMessage && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-white border-t border-slate-200 flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isAdmin
                  ? 'Type reply to customer as store owner...'
                  : 'Type your message to the store owner...'
              }
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Admin Credit Wallet Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Credit Customer Wallet Directly
              </h3>
              <p className="text-xs text-slate-500">
                Crediting customer &lt;{currentChatCustomer?.userName}&gt; (
                {currentChatCustomer?.customerId})
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="e.g. Compensating delivery delay, Special bonus"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditWallet}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Confirm Credit ₹{creditAmount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
