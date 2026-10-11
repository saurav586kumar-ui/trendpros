import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Headphones,
  Paperclip,
  Image as ImageIcon,
  X,
  Clock,
  ArrowLeft,
  Check,
  CheckCheck,
  ShieldCheck,
  Wallet,
  PlusCircle,
  Package,
  Gift,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Loader2,
  Maximize2,
  Download
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth, OWNER_UID, getConversationId } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { storage } from '../config/firebase';
import { SupportMessage } from '../types';

interface SupportChatPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
  orderIdParam?: string;
  customerUserIdParam?: string;
}

interface PendingMessage {
  tempId: string;
  userId: string;
  message: string;
  imageUrl?: string;
  imageFileName?: string;
  orderId?: string;
  sender: 'customer' | 'owner';
  status: 'sending' | 'sent' | 'failed';
  error?: string;
  createdAt: string;
}

export const SupportChatPage: React.FC<SupportChatPageProps> = ({
  onNavigate,
  orderIdParam,
  customerUserIdParam,
}) => {
  const { currentUser, userProfile, isAdmin, signInWithGoogle } = useAuth();
  const {
    supportMessages,
    chats,
    orders,
    sendSupportMessage,
    replySupportMessage,
    markChatMessagesAsRead,
    creditCustomerWalletFromChat,
  } = useStore();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderIdParam || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Admin selected customer to chat with
  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>(customerUserIdParam || '');

  // Optimistic pending messages
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  // Admin Credit Wallet Modal
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(500);
  const [creditReason, setCreditReason] = useState<string>('Goodwill gesture for delay');
  const [inAppNotice, setInAppNotice] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Lightbox modal for viewing images full size
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Construct customer list for owner view
  const customerMap = new Map<
    string,
    {
      userId: string;
      customerId: string;
      userName: string;
      userEmail: string;
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
      orderId?: string;
    }
  >();

  // Extract from supportMessages
  for (const m of supportMessages) {
    const existing = customerMap.get(m.userId);
    const isFromCustomer = m.sender === 'customer';
    const isUnreadForOwner = isFromCustomer && !m.isRead;

    if (!existing) {
      customerMap.set(m.userId, {
        userId: m.userId,
        customerId: m.customerId || `CUST-${m.userId.slice(-6).toUpperCase()}`,
        userName: isFromCustomer ? m.userName : (m.userName !== 'TrendPro Store Owner' ? m.userName : 'Customer'),
        userEmail: isFromCustomer ? m.userEmail : (m.userEmail !== 'saurav586kumar@gmail.com' ? m.userEmail : ''),
        lastMessage: m.message || (m.imageUrl ? '📷 [Image Attachment]' : 'Message'),
        lastMessageAt: m.createdAt,
        unreadCount: isUnreadForOwner ? 1 : 0,
        orderId: m.orderId,
      });
    } else {
      if (isFromCustomer) {
        if (m.userName && m.userName !== 'Customer') existing.userName = m.userName;
        if (m.userEmail) existing.userEmail = m.userEmail;
      }
      if (new Date(m.createdAt).getTime() > new Date(existing.lastMessageAt).getTime()) {
        existing.lastMessage = m.message || (m.imageUrl ? '📷 [Image Attachment]' : 'Message');
        existing.lastMessageAt = m.createdAt;
        if (m.orderId) existing.orderId = m.orderId;
      }
      if (isUnreadForOwner) {
        existing.unreadCount += 1;
      }
    }
  }

  // Include conversations from Firestore 'chats' collection
  for (const c of chats) {
    if (!c.customerUid || c.customerUid === OWNER_UID) continue;
    const existing = customerMap.get(c.customerUid);
    const unreadCount = c.unreadByOwner ? 1 : 0;
    if (!existing) {
      customerMap.set(c.customerUid, {
        userId: c.customerUid,
        customerId: c.customerId || `CUST-${c.customerUid.slice(-6).toUpperCase()}`,
        userName: c.customerName || 'Customer',
        userEmail: c.customerEmail || '',
        lastMessage: c.lastMessage || 'Conversation active',
        lastMessageAt: c.lastMessageAt || c.updatedAt || new Date().toISOString(),
        unreadCount,
        orderId: c.orderId,
      });
    } else {
      if (c.customerName && c.customerName !== 'Customer') existing.userName = c.customerName;
      if (c.customerEmail) existing.userEmail = c.customerEmail;
      if (new Date(c.lastMessageAt || c.updatedAt || 0).getTime() > new Date(existing.lastMessageAt).getTime()) {
        existing.lastMessage = c.lastMessage || existing.lastMessage;
        existing.lastMessageAt = c.lastMessageAt || existing.lastMessageAt;
        if (c.orderId) existing.orderId = c.orderId;
      }
      if (c.unreadByOwner) {
        existing.unreadCount = Math.max(existing.unreadCount, 1);
      }
    }
  }

  // Also include customers who have placed orders
  for (const o of orders) {
    if (!o.userId || o.userId === 'guest') continue;
    const existing = customerMap.get(o.userId);
    if (!existing) {
      customerMap.set(o.userId, {
        userId: o.userId,
        customerId: o.customerId || `CUST-${o.userId.slice(-6).toUpperCase()}`,
        userName: o.customerName || 'Shopper',
        userEmail: o.customerEmail || '',
        lastMessage: `Placed order #${o.id}`,
        lastMessageAt: o.createdAt,
        unreadCount: 0,
        orderId: o.id,
      });
    } else {
      if (!existing.userName || existing.userName === 'Customer') {
        existing.userName = o.customerName;
      }
      if (!existing.userEmail) {
        existing.userEmail = o.customerEmail;
      }
    }
  }

  const customerList = Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  // Active chat customer ID
  const activeChatUserId = isAdmin
    ? adminSelectedUserId || customerUserIdParam || (customerList[0]?.userId ?? (currentUser?.uid || ''))
    : (currentUser?.uid || '');

  // Consistently derived conversation ID from customerUid and static OWNER_UID
  const activeConversationId = getConversationId(activeChatUserId, OWNER_UID);

  const currentChatCustomer = customerList.find((c) => c.userId === activeChatUserId);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (!currentUser || !activeChatUserId) return;
    const role = isAdmin ? 'owner' : 'customer';
    markChatMessagesAsRead(activeChatUserId, role).catch(() => {});
  }, [activeChatUserId, isAdmin, currentUser, supportMessages.length]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages, pendingMessages]);

  // Sync route params when navigation occurs
  useEffect(() => {
    if (customerUserIdParam) {
      setAdminSelectedUserId(customerUserIdParam);
    }
  }, [customerUserIdParam]);

  useEffect(() => {
    if (orderIdParam) {
      setSelectedOrderId(orderIdParam);
    }
  }, [orderIdParam]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

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
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  // Messages for active conversation, mapped via conversationId and customerUid
  const confirmedMessages = supportMessages.filter(
    (m) =>
      m.conversationId === activeConversationId ||
      m.userId === activeChatUserId ||
      m.customerUid === activeChatUserId ||
      (m.conversationId && m.conversationId.includes(activeChatUserId))
  );
  const activePending = pendingMessages.filter((m) => m.userId === activeChatUserId);

  // Combined messages
  const allMessages = [...confirmedMessages];
  for (const pm of activePending) {
    // Only include pending if not yet matched in confirmed messages
    const isAlreadyPresent = confirmedMessages.some(
      (cm) =>
        cm.message === pm.message &&
        Math.abs(new Date(cm.createdAt).getTime() - new Date(pm.createdAt).getTime()) < 5000
    );
    if (!isAlreadyPresent) {
      allMessages.push({
        id: pm.tempId,
        userId: pm.userId,
        customerId: currentChatCustomer?.customerId || 'CUST',
        userName: pm.sender === 'owner' ? 'TrendPro Store Owner' : (currentUser?.displayName || 'Customer'),
        userEmail: pm.sender === 'owner' ? 'saurav586kumar@gmail.com' : (currentUser?.email || ''),
        message: pm.message,
        imageUrl: pm.imageUrl,
        imageFileName: pm.imageFileName,
        orderId: pm.orderId,
        sender: pm.sender,
        createdAt: pm.createdAt,
        isRead: false,
        status: pm.status,
      });
    }
  }

  allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFileError('Please select a valid image format (JPEG, PNG, WEBP, GIF).');
      setTimeout(() => setFileError(null), 4000);
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Image file size must be less than 5 MB.');
      setTimeout(() => setFileError(null), 4000);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);
  };

  const handleRemoveFile = () => {
    if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image helper with Firebase Storage & robust fallback
  const uploadImageAttachment = async (file: File): Promise<string> => {
    setUploadProgress('Uploading attachment...');
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `chat_attachments/${activeChatUserId}/${Date.now()}_${cleanName}`;
      const storageRef = ref(storage, storagePath);
      const snap = await uploadBytes(storageRef, file, { contentType: file.type });
      return await getDownloadURL(snap.ref);
    } catch (storageErr) {
      console.warn('Storage upload fallback triggered:', storageErr);
      // Seamlessly fallback to high-fidelity compressed data URL so upload NEVER fails
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const raw = ev.target?.result as string;
          if (!raw) return reject(new Error('Failed to read image'));
          const img = new Image();
          img.onload = () => {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.85));
            } else {
              resolve(raw);
            }
          };
          img.onerror = () => resolve(raw);
          img.src = raw;
        };
        reader.onerror = () => reject(new Error('Failed to process image file'));
        reader.readAsDataURL(file);
      });
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || isSending) return;

    const text = inputMessage.trim();
    const fileToUpload = selectedFile;
    const filePreview = filePreviewUrl;
    const orderIdToAttach = selectedOrderId || undefined;
    const tempId = `temp_${Date.now()}`;

    // Optimistic pending message addition
    const pendingItem: PendingMessage = {
      tempId,
      userId: activeChatUserId,
      message: text,
      imageUrl: filePreview || undefined,
      imageFileName: fileToUpload?.name,
      orderId: orderIdToAttach,
      sender: isAdmin ? 'owner' : 'customer',
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    setPendingMessages((prev) => [...prev, pendingItem]);
    setInputMessage('');
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsSending(true);

    try {
      let finalImageUrl: string | undefined = undefined;
      let finalFileName: string | undefined = undefined;

      if (fileToUpload) {
        finalImageUrl = await uploadImageAttachment(fileToUpload);
        finalFileName = fileToUpload.name;
      }

      if (isAdmin) {
        await replySupportMessage(activeChatUserId, text, orderIdToAttach, finalImageUrl, finalFileName);
      } else {
        await sendSupportMessage(text, orderIdToAttach, finalImageUrl, finalFileName);
      }

      // Mark pending as sent
      setPendingMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: 'sent', imageUrl: finalImageUrl } : m))
      );

      // Clean up sent pending item after brief delay
      setTimeout(() => {
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      }, 1500);
    } catch (err: any) {
      console.error('Send error:', err);
      setPendingMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: 'failed', error: err.message || 'Delivery failed' } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = async (failedMsg: PendingMessage) => {
    setPendingMessages((prev) =>
      prev.map((m) => (m.tempId === failedMsg.tempId ? { ...m, status: 'sending', error: undefined } : m))
    );

    try {
      if (isAdmin) {
        await replySupportMessage(
          failedMsg.userId,
          failedMsg.message,
          failedMsg.orderId,
          failedMsg.imageUrl,
          failedMsg.imageFileName
        );
      } else {
        await sendSupportMessage(
          failedMsg.message,
          failedMsg.orderId,
          failedMsg.imageUrl,
          failedMsg.imageFileName
        );
      }

      setPendingMessages((prev) =>
        prev.map((m) => (m.tempId === failedMsg.tempId ? { ...m, status: 'sent' } : m))
      );
      setTimeout(() => {
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== failedMsg.tempId));
      }, 1500);
    } catch (err: any) {
      setPendingMessages((prev) =>
        prev.map((m) => (m.tempId === failedMsg.tempId ? { ...m, status: 'failed', error: err.message } : m))
      );
    }
  };

  const handleCreditWallet = async () => {
    if (!activeChatUserId || creditAmount <= 0) return;
    try {
      await creditCustomerWalletFromChat(activeChatUserId, creditAmount, creditReason);
      setShowCreditModal(false);
      setInAppNotice(`₹${creditAmount} successfully added to customer's wallet!`);
      setTimeout(() => setInAppNotice(null), 5000);
    } catch (err: any) {
      setInAppNotice(err.message || 'Error crediting wallet');
      setTimeout(() => setInAppNotice(null), 5000);
    }
  };

  const myCustomerId = userProfile?.customerId || `CUST-${currentUser.uid.slice(-6).toUpperCase()}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notice Banner */}
      {inAppNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-150">
          <span>{inAppNotice}</span>
          <button onClick={() => setInAppNotice(null)} className="text-emerald-600 hover:text-emerald-900 ml-2">✕</button>
        </div>
      )}

      {fileError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-150">
          <span>{fileError}</span>
          <button onClick={() => setFileError(null)} className="text-rose-600 hover:text-rose-900 ml-2">✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(isAdmin ? 'admin' : 'home')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
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
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Store Owner Support Portal • Full Real-time Control
                </span>
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
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-xl shadow-xs">
            <Package className="w-4 h-4 text-amber-600" />
            <span>Referencing Order #{selectedOrderId}</span>
            <button
              onClick={() => onNavigate('order-detail', { id: selectedOrderId })}
              className="text-amber-700 underline font-semibold hover:text-amber-900 ml-1 text-[11px]"
            >
              View Order
            </button>
            <button
              onClick={() => setSelectedOrderId('')}
              className="text-amber-500 hover:text-amber-800 ml-1 font-bold cursor-pointer"
              title="Remove order reference"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Owner customer selector sidebar */}
        {isAdmin && (
          <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Customer Conversations ({customerList.length})
              </h3>
            </div>
            
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {customerList.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  <p>No customer chats initiated yet.</p>
                </div>
              ) : (
                customerList.map((cust) => {
                  const isSelected = activeChatUserId === cust.userId;
                  return (
                    <button
                      key={cust.userId}
                      onClick={() => {
                        setAdminSelectedUserId(cust.userId);
                        markChatMessagesAsRead(cust.userId, 'owner');
                      }}
                      className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs truncate max-w-[160px]">{cust.userName}</p>
                        {cust.unreadCount > 0 && !isSelected && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                            {cust.unreadCount} new
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[10px] opacity-80 mt-1">
                        <span className="font-mono">{cust.customerId}</span>
                        <span className="truncate max-w-[120px]">{cust.userEmail}</span>
                      </div>

                      <p className={`text-[11px] truncate mt-1.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {cust.lastMessage}
                      </p>

                      {cust.orderId && (
                        <span className={`inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
                        }`}>
                          📦 Order #{cust.orderId}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Chat Conversation Box */}
        <div
          className={`${
            isAdmin ? 'md:col-span-8' : 'md:col-span-12'
          } bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[600px] overflow-hidden`}
        >
          {/* Chat Window Top Bar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {isAdmin ? (
                  currentChatCustomer?.userName?.[0] || 'C'
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>
                    {isAdmin
                      ? `${currentChatCustomer?.userName || 'Customer'} (${currentChatCustomer?.customerId || 'CUST'})`
                      : 'TrendPro Store Owner'}
                  </span>
                  <span
                    className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-mono"
                    title={`Firestore Conversation ID: ${activeConversationId}`}
                  >
                    Doc #{activeConversationId.slice(-14)}
                  </span>
                  {isAdmin && currentChatCustomer?.orderId && (
                    <button
                      onClick={() => onNavigate('order-detail', { id: currentChatCustomer.orderId })}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View #{currentChatCustomer.orderId}
                    </button>
                  )}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Human Chat (Direct with Owner)
                </p>
              </div>
            </div>

            {/* Admin Action: Give Money to Customer Wallet */}
            {isAdmin && (
              <button
                onClick={() => setShowCreditModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Credit Wallet ₹</span>
              </button>
            )}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
            {allMessages.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs">
                <Headphones className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No messages in this chat yet</p>
                <p className="text-[11px] mt-1 text-slate-500 max-w-sm mx-auto">
                  Send a text message or attach product photos directly below to communicate with the store owner.
                </p>
              </div>
            ) : (
              allMessages.map((msg) => {
                const isCustomerMsg = msg.sender === 'customer';
                const isMyMessage = isAdmin ? !isCustomerMsg : isCustomerMsg;
                const isPending = msg.status === 'sending';
                const isFailed = msg.status === 'failed';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-lg ${
                      isMyMessage ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-xs ${
                        isCustomerMsg ? 'bg-slate-800' : 'bg-indigo-600'
                      }`}
                    >
                      {isCustomerMsg ? 'C' : <ShieldCheck className="w-3.5 h-3.5" />}
                    </div>

                    <div className="space-y-1 max-w-[85%]">
                      <div
                        className={`p-3.5 rounded-2xl shadow-xs text-xs space-y-2 ${
                          isMyMessage
                            ? isFailed
                              ? 'bg-rose-50 border border-rose-300 text-rose-900 rounded-tr-xs'
                              : 'bg-indigo-600 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {/* Referencing order tag */}
                        {msg.orderId && (
                          <div
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                              isMyMessage ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-indigo-700'
                            }`}
                          >
                            <Package className="w-3 h-3" />
                            <span>Order #{msg.orderId}</span>
                          </div>
                        )}

                        {/* Inline Image Attachment */}
                        {msg.imageUrl && (
                          <div className="relative group rounded-xl overflow-hidden border border-black/10 bg-black/5 mt-1">
                            <img
                              src={msg.imageUrl}
                              alt={msg.imageFileName || 'Chat Attachment'}
                              className="w-full max-h-60 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => setLightboxImage({ url: msg.imageUrl!, title: msg.imageFileName })}
                            />
                            <button
                              onClick={() => setLightboxImage({ url: msg.imageUrl!, title: msg.imageFileName })}
                              className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80"
                              title="Enlarge Image"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Message text */}
                        {msg.message && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                        )}

                        {/* Wallet Credited Tag */}
                        {msg.walletCredited && (
                          <div className="bg-emerald-500/20 text-emerald-100 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1">
                            <Gift className="w-3.5 h-3.5" />
                            <span>₹{msg.walletCredited.toLocaleString()} Credited</span>
                          </div>
                        )}

                        {/* Timestamp & Delivery Status */}
                        <div
                          className={`flex items-center justify-end gap-1.5 text-[10px] ${
                            isMyMessage
                              ? isFailed
                                ? 'text-rose-600'
                                : 'text-indigo-200'
                              : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {isMyMessage && (
                            <>
                              {isPending ? (
                                <Clock className="w-3 h-3 text-indigo-200 animate-spin" />
                              ) : isFailed ? (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              ) : msg.isRead ? (
                                <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-emerald-300" /></span>
                              ) : (
                                <span title="Sent"><Check className="w-3.5 h-3.5 text-indigo-200" /></span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Error Banner with Retry button if failed */}
                      {isFailed && (
                        <div className="flex items-center gap-2 text-[11px] text-rose-600 pl-1">
                          <span>Failed to send.</span>
                          <button
                            onClick={() => {
                              const pending = pendingMessages.find((p) => p.tempId === msg.id);
                              if (pending) handleRetry(pending);
                            }}
                            className="font-bold underline flex items-center gap-1 hover:text-rose-800 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Bar (if file selected) */}
          {selectedFile && (
            <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                {filePreviewUrl ? (
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-300 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to send
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
              title="Attach an Image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Text input */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                uploadProgress
                  ? uploadProgress
                  : isAdmin
                  ? 'Type reply to customer as store owner...'
                  : 'Type your message to the store owner...'
              }
              disabled={isSending}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-indigo-500 transition-all disabled:opacity-50"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputMessage.trim() && !selectedFile) || isSending}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
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
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditWallet}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer"
              >
                Confirm Credit ₹{creditAmount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-view Lightbox Modal for Image Attachments */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-3xl max-w-3xl w-full p-4 overflow-hidden border border-slate-700 shadow-2xl relative space-y-3"
          >
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <p className="text-xs font-bold truncate max-w-sm">
                {lightboxImage.title || 'Attached Photo'}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  download={lightboxImage.title || 'chat-image.jpg'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Download / Open Full"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/40">
              <img
                src={lightboxImage.url}
                alt="Enlarged"
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
