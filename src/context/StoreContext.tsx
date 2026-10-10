import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import {
  Product,
  Category,
  Banner,
  Voucher,
  Order,
  Review,
  SupportMessage,
  ChatConversation,
  NotificationItem,
  WalletTransaction,
  StoreAnnouncementConfig,
  GeneratedGiftCard,
  OrderStatus,
  StoreConfig
} from '../types';
import { useAuth, OWNER_EMAIL, OWNER_UID, getConversationId } from './AuthContext';
import {
  SAMPLE_PRODUCTS,
  SAMPLE_CATEGORIES,
  SAMPLE_BANNERS,
  SAMPLE_VOUCHERS,
  DEFAULT_ANNOUNCEMENT
} from '../data/sampleCatalog';

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: 'TrendPro',
  websiteUrl: 'https://trendpro.netlify.app',
  dispatchHub: {
    name: 'TrendPro Central Dispatch & Packing Facility',
    hubCode: 'TP-HUB-BR01',
    address: 'Near Station Road, Shivaji Nagar',
    city: 'Shivaji Nagar',
    district: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    phone: '+91 98765 43210',
  },
  defaultDeliveryDays: 8,
};

interface StoreContextType {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  vouchers: Voucher[];
  orders: Order[];
  notifications: NotificationItem[];
  supportMessages: SupportMessage[];
  chats: ChatConversation[];
  announcementConfig: StoreAnnouncementConfig;
  storeConfig: StoreConfig;
  loading: boolean;
  seedInitialDataToFirestore: () => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'customerId'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['orderStatus'], note?: string) => Promise<void>;
  requestCancelOrder: (orderId: string, reason: string) => Promise<void>;
  requestReturnOrder: (orderId: string, reason: string, extraImages?: string[]) => Promise<void>;
  handleCancelRequest: (orderId: string, approved: boolean, adminNote?: string) => Promise<void>;
  handleReturnRequest: (orderId: string, approved: boolean, adminNote?: string) => Promise<void>;
  applyVoucher: (code: string, subtotal: number) => { valid: boolean; discount: number; message: string; voucher?: Voucher };
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<string>;
  deleteCategory: (id: string) => Promise<void>;
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<string>;
  updateBanner: (id: string, updates: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  addReview: (productId: string, rating: number, title?: string, comment?: string, images?: string[]) => Promise<void>;
  getProductReviews: (productId: string) => Promise<Review[]>;
  sendSupportMessage: (message: string, orderId?: string, imageUrl?: string, imageFileName?: string) => Promise<string>;
  replySupportMessage: (userId: string, reply: string, orderId?: string, imageUrl?: string, imageFileName?: string) => Promise<string>;
  markChatMessagesAsRead: (chatUserId: string, readerRole: 'customer' | 'owner') => Promise<void>;
  creditCustomerWalletFromChat: (targetUserId: string, amount: number, reason: string) => Promise<void>;
  redeemGiftCard: (cardNumber: string, pin: string) => Promise<{ success: boolean; amount: number; message: string }>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  topUpWallet: (amount: number) => Promise<void>;
  updateAnnouncementConfig: (config: StoreAnnouncementConfig) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isAdmin, updateProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(SAMPLE_CATEGORIES);
  const [banners, setBanners] = useState<Banner[]>(SAMPLE_BANNERS);
  const [vouchers, setVouchers] = useState<Voucher[]>(SAMPLE_VOUCHERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [announcementConfig, setAnnouncementConfig] = useState<StoreAnnouncementConfig>(DEFAULT_ANNOUNCEMENT);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [loading, setLoading] = useState(true);

  // Sync store company config & announcement config
  useEffect(() => {
    const unsubStoreConfig = onSnapshot(
      doc(db, 'storeSettings', 'companyConfig'),
      (snap) => {
        if (snap.exists()) {
          setStoreConfig(snap.data() as StoreConfig);
        } else {
          setDoc(doc(db, 'storeSettings', 'companyConfig'), DEFAULT_STORE_CONFIG).catch(() => {});
        }
      },
      () => setStoreConfig(DEFAULT_STORE_CONFIG)
    );

    return () => unsubStoreConfig();
  }, []);

  // Fetch or listen to Products from Firestore
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteProducts = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Product[];
          setProducts(remoteProducts);
        } else {
          setProducts(SAMPLE_PRODUCTS);
        }
        setLoading(false);
      },
      () => {
        setProducts(SAMPLE_PRODUCTS);
        setLoading(false);
      }
    );

    // Categories listener
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteCats = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Category[];
          setCategories(remoteCats);
        } else {
          setCategories(SAMPLE_CATEGORIES);
        }
      },
      () => setCategories(SAMPLE_CATEGORIES)
    );

    // Banners listener
    const unsubBanners = onSnapshot(
      collection(db, 'banners'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteBanners = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Banner[];
          setBanners(remoteBanners.sort((a, b) => a.order - b.order));
        } else {
          setBanners(SAMPLE_BANNERS);
        }
      },
      () => setBanners(SAMPLE_BANNERS)
    );

    // Vouchers listener
    const unsubVouchers = onSnapshot(
      collection(db, 'vouchers'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteVouchers = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Voucher[];
          setVouchers(remoteVouchers);
        } else {
          setVouchers(SAMPLE_VOUCHERS);
        }
      },
      () => setVouchers(SAMPLE_VOUCHERS)
    );

    // Announcement bar config listener
    const unsubAnnouncement = onSnapshot(
      doc(db, 'storeSettings', 'announcement'),
      (snap) => {
        if (snap.exists()) {
          setAnnouncementConfig(snap.data() as StoreAnnouncementConfig);
        }
      },
      () => setAnnouncementConfig(DEFAULT_ANNOUNCEMENT)
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubVouchers();
      unsubAnnouncement();
    };
  }, []);

  // Listen to Orders based on auth role
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }

    let q;
    if (isAdmin) {
      q = query(collection(db, 'orders'));
    } else {
      q = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid)
      );
    }

    const unsubOrders = onSnapshot(
      q,
      (snapshot) => {
        const orderList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Order[];
        orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(orderList);
      },
      (error) => {
        console.warn('Orders listener notice:', error.message);
      }
    );

    // Notifications
    const unsubNotifications = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid)
      ),
      (snapshot) => {
        const notifList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as NotificationItem[];
        notifList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifList);
      },
      (error) => {
        console.warn('Notifications listener notice:', error.message);
      }
    );

    // Support messages
    let supportQuery;
    if (isAdmin) {
      supportQuery = query(collection(db, 'supportMessages'));
    } else {
      supportQuery = query(
        collection(db, 'supportMessages'),
        where('userId', '==', currentUser.uid)
      );
    }

    const unsubSupport = onSnapshot(
      supportQuery,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as SupportMessage[];
        msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setSupportMessages(msgs);
      },
      (error) => {
        console.warn('Support listener notice:', error.message);
      }
    );

    // Chats conversations listener (deterministic conversation documents)
    let chatsQuery;
    if (isAdmin) {
      chatsQuery = query(collection(db, 'chats'));
    } else {
      chatsQuery = query(
        collection(db, 'chats'),
        where('customerUid', '==', currentUser.uid)
      );
    }

    const unsubChats = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const chatList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatConversation[];
        chatList.sort(
          (a, b) =>
            new Date(b.updatedAt || b.lastMessageAt || 0).getTime() -
            new Date(a.updatedAt || a.lastMessageAt || 0).getTime()
        );
        setChats(chatList);
      },
      (error) => {
        console.warn('Chats listener notice:', error.message);
      }
    );

    return () => {
      unsubOrders();
      unsubNotifications();
      unsubSupport();
      unsubChats();
    };
  }, [currentUser, isAdmin]);

  // Seed Initial Data to Firestore
  const seedInitialDataToFirestore = async () => {
    try {
      for (const prod of SAMPLE_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
      for (const cat of SAMPLE_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
      for (const ban of SAMPLE_BANNERS) {
        await setDoc(doc(db, 'banners', ban.id), ban);
      }
      for (const v of SAMPLE_VOUCHERS) {
        await setDoc(doc(db, 'vouchers', v.id), v);
      }
      await setDoc(doc(db, 'storeSettings', 'announcement'), DEFAULT_ANNOUNCEMENT);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  // Helper to remove any undefined fields recursively for Firestore safety
  const sanitizeForFirestore = <T,>(obj: T): T => {
    if (obj === undefined) return null as unknown as T;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
    }
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  };

  // Helper to generate a random 16-digit card number and 4-digit PIN
  const generateGiftCard = (amount: number): GeneratedGiftCard => {
    const chunk = () => Math.floor(1000 + Math.random() * 9000).toString();
    const cardNumber = `TPGC-${chunk()}-${chunk()}-${chunk()}`;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    return {
      cardNumber,
      pin,
      amount,
      issueDate: new Date().toISOString(),
      isRedeemed: false,
    };
  };

  // Create Order with Atomic Inventory & Gift Card generation
  const createOrder = async (
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'customerId'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('User must be signed in to place an order');

    const orderId = `TP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const custId = userProfile?.customerId || `CUST-${currentUser.uid.slice(-6).toUpperCase()}`;

    // Check if order has a gift voucher
    const hasGiftVoucher = orderData.items.some((i) => i.isGiftVoucher || i.productId.includes('gift'));
    let generatedCard: GeneratedGiftCard | null = null;

    if (hasGiftVoucher) {
      generatedCard = generateGiftCard(orderData.pricing.total);
    }

    // Standard e-commerce dispatch delivery time: 8 days from order
    const deliveryDate8Days = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const rawOrder: Order = {
      ...orderData,
      id: orderId,
      customerId: custId,
      orderStatus: hasGiftVoucher ? 'delivered' : 'ordered',
      isGiftVoucherOrder: hasGiftVoucher,
      giftCardDetails: generatedCard || undefined,
      estimatedDelivery: orderData.estimatedDelivery || deliveryDate8Days,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'ordered',
          timestamp: now,
          note: hasGiftVoucher
            ? 'Digital Gift Card successfully created & delivered to your account.'
            : 'Order successfully placed on TrendPro marketplace.',
        },
      ],
    };

    // Sanitize order document: recursively strip any undefined values so Firestore never rejects it
    const fullOrder = sanitizeForFirestore(rawOrder);

    try {
      await runTransaction(db, async (transaction) => {
        for (const item of orderData.items) {
          if (!item.isGiftVoucher) {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await transaction.get(productRef);
            if (productSnap.exists()) {
              const currentStock = productSnap.data().stock || 0;
              const newStock = Math.max(0, currentStock - item.quantity);
              transaction.update(productRef, { stock: newStock });
            }
          }
        }
        const orderRef = doc(db, 'orders', orderId);
        transaction.set(orderRef, fullOrder);
      });

      // Deduct wallet if used
      if (orderData.pricing.walletUsed > 0 && userProfile) {
        const newBalance = Math.max(0, userProfile.walletBalance - orderData.pricing.walletUsed);
        await updateProfile({ walletBalance: newBalance });

        await addDoc(collection(db, 'walletLedger'), {
          id: `LED-${Date.now()}`,
          userId: currentUser.uid,
          amount: orderData.pricing.walletUsed,
          type: 'debit',
          reason: `Debited for order #${orderId}`,
          orderId,
          createdAt: now,
        });
      }

      // Add Notification
      await addDoc(collection(db, 'notifications'), {
        userId: currentUser.uid,
        title: hasGiftVoucher ? 'Digital Gift Card Delivered!' : 'Order Placed!',
        message: hasGiftVoucher
          ? `Your Gift Card #${generatedCard?.cardNumber} is ready in My Orders.`
          : `Your order #${orderId} for ₹${orderData.pricing.total.toLocaleString()} has been placed.`,
        type: 'order',
        link: `/orders/${orderId}`,
        isRead: false,
        createdAt: now,
      });

      return orderId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
      return orderId;
    }
  };

  // Status updates by Admin
  const updateOrderStatus = async (
    orderId: string,
    status: Order['orderStatus'],
    note?: string
  ) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const existing = orders.find((o) => o.id === orderId);
      const now = new Date().toISOString();

      const newTimeline = existing
        ? [
            ...existing.timeline,
            {
              status,
              timestamp: now,
              note: note || `Status updated to ${status}.`,
            },
          ]
        : [{ status, timestamp: now, note: note || '' }];

      await updateDoc(orderRef, {
        orderStatus: status,
        updatedAt: now,
        timeline: newTimeline,
      });

      if (existing) {
        await addDoc(collection(db, 'notifications'), {
          userId: existing.userId,
          title: `Order Status: ${status.toUpperCase()}`,
          message: `Your order #${orderId} is now ${status}. ${note || ''}`,
          type: 'order',
          link: `/orders/${orderId}`,
          isRead: false,
          createdAt: now,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Customer asks to cancel order (before dispatched)
  const requestCancelOrder = async (orderId: string, reason: string) => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return;
    const now = new Date().toISOString();

    const allowedStatuses: OrderStatus[] = ['ordered', 'placed', 'confirmed', 'packed'];
    if (!allowedStatuses.includes(existing.orderStatus)) {
      throw new Error('Order cannot be cancelled after it has been dispatched.');
    }

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        cancelRequest: {
          status: 'pending',
          reason,
          requestDate: now,
        },
        timeline: [
          ...existing.timeline,
          {
            status: existing.orderStatus,
            timestamp: now,
            note: `Cancellation requested by customer. Reason: ${reason}`,
          },
        ],
        updatedAt: now,
      });

      // Notify customer
      await addDoc(collection(db, 'notifications'), {
        userId: existing.userId,
        title: 'Cancellation Request Submitted',
        message: `Your cancellation request for order #${orderId} is pending store review.`,
        type: 'order',
        link: `/orders/${orderId}`,
        isRead: false,
        createdAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Customer asks to return order (after delivered)
  const requestReturnOrder = async (orderId: string, reason: string, extraImages?: string[]) => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return;
    const now = new Date().toISOString();

    if (existing.orderStatus !== 'delivered') {
      throw new Error('Return requests can only be placed after the order has been delivered.');
    }

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        returnRequest: {
          status: 'pending',
          reason,
          extraImages: extraImages || [],
          requestDate: now,
        },
        timeline: [
          ...existing.timeline,
          {
            status: 'delivered',
            timestamp: now,
            note: `Return requested by customer. Reason: ${reason}`,
          },
        ],
        updatedAt: now,
      });

      await addDoc(collection(db, 'notifications'), {
        userId: existing.userId,
        title: 'Return Request Received',
        message: `Return request for order #${orderId} is being evaluated by customer support.`,
        type: 'order',
        link: `/orders/${orderId}`,
        isRead: false,
        createdAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Admin approves or rejects Cancellation Request
  const handleCancelRequest = async (orderId: string, approved: boolean, adminNote?: string) => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) throw new Error('Order not found');
    if (existing.cancelRequest?.status !== 'pending') {
      throw new Error(`This cancellation request has already been ${existing.cancelRequest?.status || 'processed'}.`);
    }
    const now = new Date().toISOString();

    try {
      const orderRef = doc(db, 'orders', orderId);
      if (approved) {
        // Change status to cancelled
        const isPaid = existing.paymentStatus === 'paid' || existing.paymentMethod === 'wallet';
        const walletUsed = existing.pricing?.walletUsed || 0;
        const refundAmount = (existing.paymentMethod === 'cod' && existing.paymentStatus !== 'paid')
          ? walletUsed
          : existing.pricing.total;

        await updateDoc(
          orderRef,
          sanitizeForFirestore({
            orderStatus: 'cancelled',
            paymentStatus: isPaid ? 'refunded' : (existing.paymentMethod === 'cod' ? 'cancelled' : 'refunded'),
            'cancelRequest.status': 'approved',
            'cancelRequest.adminNote': adminNote || 'Approved by store owner',
            'cancelRequest.processedAt': now,
            updatedAt: now,
            timeline: [
              ...existing.timeline,
              {
                status: 'cancelled',
                timestamp: now,
                note: `Cancellation approved by owner. ${adminNote || ''}`,
              },
            ],
          })
        );

        // Restore stock once
        for (const item of existing.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prod = products.find((p) => p.id === item.productId);
          if (prod) {
            await updateDoc(prodRef, { stock: prod.stock + item.quantity });
          }
        }

        // Refund to customer wallet if applicable
        if (refundAmount > 0) {
          const custUserRef = doc(db, 'users', existing.userId);
          const userSnap = await getDoc(custUserRef);
          const currentBal = userSnap.exists() ? userSnap.data().walletBalance || 0 : 0;
          await updateDoc(custUserRef, { walletBalance: currentBal + refundAmount });

          await addDoc(
            collection(db, 'walletLedger'),
            sanitizeForFirestore({
              id: `LED-${Date.now()}`,
              userId: existing.userId,
              amount: refundAmount,
              type: 'credit',
              reason: `Refund for cancelled order #${orderId}`,
              orderId,
              createdAt: now,
            })
          );
        }
      } else {
        // Rejected
        await updateDoc(
          orderRef,
          sanitizeForFirestore({
            'cancelRequest.status': 'rejected',
            'cancelRequest.adminNote': adminNote || 'Cancellation request declined by store',
            'cancelRequest.processedAt': now,
            updatedAt: now,
            timeline: [
              ...existing.timeline,
              {
                status: existing.orderStatus,
                timestamp: now,
                note: `Cancellation rejected by owner. Reason: ${adminNote || 'Store Policy'}.`,
              },
            ],
          })
        );
      }

      await addDoc(
        collection(db, 'notifications'),
        sanitizeForFirestore({
          userId: existing.userId,
          title: approved ? 'Order Cancelled & Refunded' : 'Cancellation Request Rejected',
          message: approved
            ? `Your cancellation for #${orderId} was approved. ₹${existing.pricing.total.toLocaleString()} processed for your order.`
            : `Your cancellation request for #${orderId} was rejected: ${adminNote || ''}`,
          type: 'order',
          link: `/orders/${orderId}`,
          isRead: false,
          createdAt: now,
        })
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Admin approves or rejects Return Request
  const handleReturnRequest = async (orderId: string, approved: boolean, adminNote?: string) => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) throw new Error('Order not found');
    if (existing.returnRequest?.status !== 'pending') {
      throw new Error(`This return request has already been ${existing.returnRequest?.status || 'processed'}.`);
    }
    const now = new Date().toISOString();

    try {
      const orderRef = doc(db, 'orders', orderId);
      if (approved) {
        const refundAmount = existing.pricing.total;
        await updateDoc(
          orderRef,
          sanitizeForFirestore({
            orderStatus: 'returned',
            paymentStatus: 'refunded',
            'returnRequest.status': 'approved',
            'returnRequest.adminNote': adminNote || 'Return approved',
            'returnRequest.processedAt': now,
            updatedAt: now,
            timeline: [
              ...existing.timeline,
              {
                status: 'returned',
                timestamp: now,
                note: `Return approved by owner. Refund initiated to wallet. ${adminNote || ''}`,
              },
            ],
          })
        );

        // Restore stock
        for (const item of existing.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prod = products.find((p) => p.id === item.productId);
          if (prod) {
            await updateDoc(prodRef, { stock: prod.stock + item.quantity });
          }
        }

        // Refund full amount to wallet
        if (refundAmount > 0) {
          const custUserRef = doc(db, 'users', existing.userId);
          const userSnap = await getDoc(custUserRef);
          const currentBal = userSnap.exists() ? userSnap.data().walletBalance || 0 : 0;
          await updateDoc(custUserRef, { walletBalance: currentBal + refundAmount });

          await addDoc(
            collection(db, 'walletLedger'),
            sanitizeForFirestore({
              id: `LED-${Date.now()}`,
              userId: existing.userId,
              amount: refundAmount,
              type: 'credit',
              reason: `Refund for returned order #${orderId}`,
              orderId,
              createdAt: now,
            })
          );
        }
      } else {
        await updateDoc(
          orderRef,
          sanitizeForFirestore({
            'returnRequest.status': 'rejected',
            'returnRequest.adminNote': adminNote || 'Return rejected',
            'returnRequest.processedAt': now,
            updatedAt: now,
            timeline: [
              ...existing.timeline,
              {
                status: 'delivered',
                timestamp: now,
                note: `Return request rejected by owner. Reason: ${adminNote || ''}`,
              },
            ],
          })
        );
      }

      await addDoc(
        collection(db, 'notifications'),
        sanitizeForFirestore({
          userId: existing.userId,
          title: approved ? 'Return Approved & Refunded' : 'Return Request Rejected',
          message: approved
            ? `Return for #${orderId} was approved! ₹${existing.pricing.total.toLocaleString()} credited to your TrendPro wallet.`
            : `Return for #${orderId} was rejected: ${adminNote || ''}`,
          type: 'order',
          link: `/orders/${orderId}`,
          isRead: false,
          createdAt: now,
        })
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Redeem Gift Card number and PIN into current user's wallet
  const redeemGiftCard = async (
    cardNumber: string,
    pin: string
  ): Promise<{ success: boolean; amount: number; message: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, amount: 0, message: 'Please sign in to redeem a gift card.' };
    }

    const cleanCard = cardNumber.trim().toUpperCase();
    const cleanPin = pin.trim();

    // Instant bonus promo code GIFT1000
    if (cleanCard === 'GIFT1000') {
      const amt = 1000;
      await topUpWallet(amt);
      return { success: true, amount: amt, message: `Promo code applied! ₹${amt.toLocaleString()} credited to your TrendPro wallet.` };
    }

    // Check if matching order contains this gift card in memory
    const targetOrder = orders.find(
      (o) =>
        o.giftCardDetails &&
        o.giftCardDetails.cardNumber.toUpperCase() === cleanCard
    );

    let orderDocId = targetOrder?.id;
    let card = targetOrder?.giftCardDetails;

    // Direct database query if not in local memory state
    if (!card) {
      try {
        const snap = await getDocs(
          query(collection(db, 'orders'), where('giftCardDetails.cardNumber', '==', cleanCard))
        );
        if (!snap.empty) {
          const docItem = snap.docs[0];
          orderDocId = docItem.id;
          card = docItem.data().giftCardDetails as GeneratedGiftCard;
        }
      } catch (err) {
        console.warn('Query gift card error:', err);
      }
    }

    if (!card || !orderDocId) {
      return { success: false, amount: 0, message: 'Gift card not found. Please verify the 16-digit card number.' };
    }

    if (card.isRedeemed) {
      return { success: false, amount: 0, message: 'This gift card has already been redeemed.' };
    }

    if (card.pin && cleanPin && card.pin !== cleanPin) {
      return { success: false, amount: 0, message: 'Incorrect 4-digit PIN for this gift card.' };
    }

    const now = new Date().toISOString();

    try {
      // Mark card as redeemed in Firestore
      const orderRef = doc(db, 'orders', orderDocId);
      await updateDoc(orderRef, {
        'giftCardDetails.isRedeemed': true,
        'giftCardDetails.redeemedAt': now,
      });

      // Credit wallet
      const newBalance = (userProfile.walletBalance || 0) + card.amount;
      await updateProfile({ walletBalance: newBalance });

      // Add ledger transaction
      await addDoc(collection(db, 'walletLedger'), {
        id: `LED-${Date.now()}`,
        userId: currentUser.uid,
        amount: card.amount,
        type: 'credit',
        reason: `Gift Card Redeemed (${cleanCard})`,
        giftCardNumber: cleanCard,
        createdAt: now,
      });

      return {
        success: true,
        amount: card.amount,
        message: `Success! ₹${card.amount.toLocaleString()} has been credited to your TrendPro wallet.`,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderDocId}`);
      return { success: false, amount: 0, message: 'Error redeeming card. Please try again.' };
    }
  };

  // Voucher discount
  const applyVoucher = (
    code: string,
    subtotal: number
  ): { valid: boolean; discount: number; message: string; voucher?: Voucher } => {
    const clean = code.trim().toUpperCase();
    const found = vouchers.find((v) => v.code.toUpperCase() === clean && v.isActive);

    if (!found) {
      return { valid: false, discount: 0, message: 'Invalid or expired coupon code' };
    }

    if (subtotal < found.minOrderValue) {
      return {
        valid: false,
        discount: 0,
        message: `Coupon requires a minimum cart value of ₹${found.minOrderValue.toLocaleString()}`,
      };
    }

    let discount = 0;
    if (found.discountType === 'flat') {
      discount = found.discountValue;
    } else {
      discount = Math.round((subtotal * found.discountValue) / 100);
      if (found.maxDiscount && discount > found.maxDiscount) {
        discount = found.maxDiscount;
      }
    }

    return {
      valid: true,
      discount,
      message: `Coupon ${found.code} applied! Saved ₹${discount}`,
      voucher: found,
    };
  };

  // Product CRUD
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<string> => {
    const id = `tp-prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'products', id), sanitizeForFirestore(newProduct));
    return id;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const sanitized = sanitizeForFirestore({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'products', id), sanitized);
  };

  const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
  };

  // Category CRUD
  const addCategory = async (catData: Omit<Category, 'id'>): Promise<string> => {
    const slug = catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = `cat-${slug}`;
    const newCat: Category = {
      ...catData,
      id,
      slug,
      subCategories: catData.subCategories || [],
    };
    await setDoc(doc(db, 'categories', id), sanitizeForFirestore(newCat));
    return id;
  };

  const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
  };

  // Banner CRUD
  const addBanner = async (bannerData: Omit<Banner, 'id'>): Promise<string> => {
    const id = `banner-${Date.now()}`;
    const newBanner: Banner = { ...bannerData, id };
    await setDoc(doc(db, 'banners', id), sanitizeForFirestore(newBanner));
    return id;
  };

  const updateBanner = async (id: string, updates: Partial<Banner>) => {
    await updateDoc(doc(db, 'banners', id), sanitizeForFirestore(updates));
  };

  const deleteBanner = async (id: string) => {
    await deleteDoc(doc(db, 'banners', id));
  };

  // Reviews
  const addReview = async (
    productId: string,
    rating: number,
    title?: string,
    comment?: string,
    images?: string[]
  ) => {
    if (!currentUser) throw new Error('Must be logged in to submit a review');
    const reviewId = `rev-${Date.now()}`;
    const rawReview: Review = {
      id: reviewId,
      productId,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Verified Buyer',
      userPhoto: currentUser.photoURL || undefined,
      rating,
      title: title || 'Customer Review',
      comment: comment || '',
      images: images || [],
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'reviews', reviewId), sanitizeForFirestore(rawReview));

    const prod = products.find((p) => p.id === productId);
    if (prod) {
      const newCount = (prod.ratingCount || 0) + 1;
      const newRating = Number((((prod.rating || 5) * (prod.ratingCount || 0) + rating) / newCount).toFixed(1));
      await updateProduct(productId, { rating: newRating, ratingCount: newCount });
    }
  };

  const getProductReviews = async (productId: string): Promise<Review[]> => {
    try {
      const q = query(collection(db, 'reviews'), where('productId', '==', productId));
      const snap = await getDocs(q);
      if (snap.empty) {
        return [
          {
            id: `rev-default-1`,
            productId,
            userId: 'usr-1',
            userName: 'Vikram Malhotra',
            rating: 5,
            title: 'Outstanding quality and super fast shipping!',
            comment: 'Arrived in pristine condition within 48 hours. Fits and performs exactly as described.',
            isVerifiedPurchase: true,
            createdAt: '2026-03-05T14:30:00Z',
          },
        ];
      }
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
    } catch {
      return [];
    }
  };

  // Support messages (CUSTOMER TO OWNER - NO BOTS)
  const sendSupportMessage = async (
    message: string,
    orderId?: string,
    imageUrl?: string,
    imageFileName?: string
  ): Promise<string> => {
    if (!currentUser) throw new Error('Sign in to chat with store owner');
    const customerUid = currentUser.uid;
    const custId = userProfile?.customerId || `CUST-${customerUid.slice(-6).toUpperCase()}`;
    const conversationId = getConversationId(customerUid, OWNER_UID);
    const now = new Date().toISOString();

    const newMsg = sanitizeForFirestore({
      conversationId,
      customerUid,
      ownerUid: OWNER_UID,
      userId: customerUid,
      senderId: customerUid,
      recipientId: OWNER_UID,
      senderRole: 'customer' as const,
      sender: 'customer' as const,
      senderName: currentUser.displayName || 'Customer',
      senderEmail: currentUser.email || '',
      customerId: custId,
      userName: currentUser.displayName || 'Customer',
      userEmail: currentUser.email || '',
      message: message.trim(),
      imageUrl: imageUrl || null,
      imageFileName: imageFileName || null,
      orderId: orderId || null,
      createdAt: now,
      isRead: false,
    });

    const docRef = await addDoc(collection(db, 'supportMessages'), newMsg);

    // Save and update conversation document in deterministic 'chats' collection
    try {
      await setDoc(
        doc(db, 'chats', conversationId),
        sanitizeForFirestore({
          id: conversationId,
          conversationId,
          customerUid,
          ownerUid: OWNER_UID,
          participants: [customerUid, OWNER_UID],
          userId: customerUid,
          customerId: custId,
          customerName: currentUser.displayName || 'Customer',
          customerEmail: currentUser.email || '',
          lastMessage: message.trim() || (imageUrl ? '📷 [Image Attachment]' : 'Message'),
          lastMessageAt: now,
          lastSender: 'customer',
          orderId: orderId || null,
          unreadByOwner: true,
          unreadByCustomer: false,
          updatedAt: now,
        }),
        { merge: true }
      );

      // Mirror to chats subcollection
      await setDoc(doc(db, 'chats', conversationId, 'messages', docRef.id), newMsg);
    } catch (e) {
      console.warn('Chats sync notice:', e);
    }

    // Also update legacy supportConversations
    try {
      await setDoc(
        doc(db, 'supportConversations', conversationId),
        sanitizeForFirestore({
          id: conversationId,
          conversationId,
          customerUid,
          ownerUid: OWNER_UID,
          userId: customerUid,
          customerId: custId,
          customerName: currentUser.displayName || 'Customer',
          customerEmail: currentUser.email || '',
          lastMessage: message.trim() || (imageUrl ? '📷 [Image Attachment]' : 'Message'),
          lastMessageAt: now,
          lastSender: 'customer',
          orderId: orderId || null,
          updatedAt: now,
        }),
        { merge: true }
      );
    } catch (e) {
      console.warn('Conversation sync notice:', e);
    }

    return docRef.id;
  };

  // OWNER REPLIES TO CUSTOMER DIRECTLY
  const replySupportMessage = async (
    targetUserId: string,
    reply: string,
    orderId?: string,
    imageUrl?: string,
    imageFileName?: string
  ): Promise<string> => {
    if (!isAdmin) throw new Error('Unauthorized: Only store owner can send replies');
    const customerUid = targetUserId;
    const custId = `CUST-${customerUid.slice(-6).toUpperCase()}`;
    const conversationId = getConversationId(customerUid, OWNER_UID);
    const now = new Date().toISOString();

    const prevCustMsg = supportMessages.find(
      (m) => (m.userId === customerUid || m.customerUid === customerUid) && m.sender === 'customer'
    );
    const relatedOrder = orders.find((o) => o.userId === customerUid);
    const customerName = prevCustMsg?.userName || relatedOrder?.customerName || 'Customer';
    const customerEmail = prevCustMsg?.userEmail || relatedOrder?.customerEmail || '';

    const newMsg = sanitizeForFirestore({
      conversationId,
      customerUid,
      ownerUid: OWNER_UID,
      userId: customerUid,
      senderId: currentUser?.uid || OWNER_UID,
      recipientId: customerUid,
      senderRole: 'owner' as const,
      sender: 'owner' as const,
      senderName: 'TrendPro Store Owner',
      senderEmail: OWNER_EMAIL,
      customerId: custId,
      userName: customerName,
      userEmail: customerEmail,
      message: reply.trim(),
      imageUrl: imageUrl || null,
      imageFileName: imageFileName || null,
      orderId: orderId || null,
      createdAt: now,
      isRead: false,
    });

    const docRef = await addDoc(collection(db, 'supportMessages'), newMsg);

    // Save and update conversation document in deterministic 'chats' collection
    try {
      await setDoc(
        doc(db, 'chats', conversationId),
        sanitizeForFirestore({
          id: conversationId,
          conversationId,
          customerUid,
          ownerUid: OWNER_UID,
          participants: [customerUid, OWNER_UID],
          userId: customerUid,
          customerId: custId,
          customerName,
          customerEmail,
          lastMessage: reply.trim() || (imageUrl ? '📷 [Image Attachment]' : 'Owner Reply'),
          lastMessageAt: now,
          lastSender: 'owner',
          orderId: orderId || null,
          unreadByOwner: false,
          unreadByCustomer: true,
          updatedAt: now,
        }),
        { merge: true }
      );

      // Mirror to chats subcollection
      await setDoc(doc(db, 'chats', conversationId, 'messages', docRef.id), newMsg);
    } catch (e) {
      console.warn('Chats sync notice:', e);
    }

    // Also update legacy supportConversations
    try {
      await setDoc(
        doc(db, 'supportConversations', conversationId),
        sanitizeForFirestore({
          id: conversationId,
          conversationId,
          customerUid,
          ownerUid: OWNER_UID,
          userId: customerUid,
          customerId: custId,
          customerName,
          customerEmail,
          lastMessage: reply.trim() || (imageUrl ? '📷 [Image Attachment]' : 'Owner Reply'),
          lastMessageAt: now,
          lastSender: 'owner',
          orderId: orderId || null,
          updatedAt: now,
        }),
        { merge: true }
      );
    } catch (e) {
      console.warn('Conversation sync notice:', e);
    }

    // In-app notification for the customer
    try {
      await addDoc(
        collection(db, 'notifications'),
        sanitizeForFirestore({
          userId: customerUid,
          title: 'Store Owner Replied to Your Chat',
          message: reply.trim() || 'Store owner sent an image attachment.',
          type: 'system',
          link: '/support',
          isRead: false,
          createdAt: now,
        })
      );
    } catch (e) {
      console.warn('Notification notice:', e);
    }

    return docRef.id;
  };

  // Mark chat messages as read
  const markChatMessagesAsRead = async (chatUserId: string, readerRole: 'customer' | 'owner') => {
    if (!currentUser || !chatUserId) return;
    const conversationId = getConversationId(chatUserId, OWNER_UID);
    const senderToMark = readerRole === 'customer' ? 'owner' : 'customer';
    const unreadMsgs = supportMessages.filter(
      (m) =>
        (m.userId === chatUserId || m.customerUid === chatUserId || m.conversationId === conversationId) &&
        m.sender === senderToMark &&
        !m.isRead
    );
    for (const msg of unreadMsgs) {
      try {
        await updateDoc(doc(db, 'supportMessages', msg.id), {
          isRead: true,
          readAt: new Date().toISOString(),
        });
        await updateDoc(doc(db, 'chats', conversationId, 'messages', msg.id), {
          isRead: true,
          readAt: new Date().toISOString(),
        }).catch(() => {});
      } catch (e) {
        console.warn('Error marking message read:', e);
      }
    }

    // Update conversation document read flags
    try {
      await updateDoc(
        doc(db, 'chats', conversationId),
        readerRole === 'owner' ? { unreadByOwner: false } : { unreadByCustomer: false }
      );
    } catch {}
  };

  // OWNER CREDITS WALLET OF ANY CUSTOMER DIRECTLY FROM CHAT
  const creditCustomerWalletFromChat = async (targetUserId: string, amount: number, reason: string) => {
    if (!isAdmin) throw new Error('Unauthorized');
    const now = new Date().toISOString();

    const userDocRef = doc(db, 'users', targetUserId);
    const snap = await getDoc(userDocRef);
    const currentBal = snap.exists() ? snap.data().walletBalance || 0 : 0;
    const newBal = currentBal + amount;

    await updateDoc(userDocRef, { walletBalance: newBal });

    // Ledger
    await addDoc(collection(db, 'walletLedger'), {
      id: `LED-${Date.now()}`,
      userId: targetUserId,
      amount,
      type: 'credit',
      reason: `Owner Chat Credit: ${reason}`,
      createdAt: now,
    });

    // Notify customer
    await addDoc(collection(db, 'notifications'), {
      userId: targetUserId,
      title: 'Wallet Balance Credited by Owner!',
      message: `₹${amount.toLocaleString()} has been added to your TrendPro wallet. Reason: ${reason}`,
      type: 'wallet',
      link: '/wallet',
      isRead: false,
      createdAt: now,
    });

    // Send chat system message
    const custId = `CUST-${targetUserId.slice(-6).toUpperCase()}`;
    await addDoc(collection(db, 'supportMessages'), {
      userId: targetUserId,
      customerId: custId,
      userName: 'TrendPro Store Owner',
      userEmail: 'saurav586kumar@gmail.com',
      message: `🎉 [Wallet Credited] I have directly credited ₹${amount.toLocaleString()} to your TrendPro wallet balance! (${reason})`,
      sender: 'owner',
      walletCredited: amount,
      createdAt: now,
      isRead: false,
    });
  };

  const markNotificationAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  };

  const markAllNotificationsRead = async () => {
    for (const notif of notifications) {
      if (!notif.isRead) {
        await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
      }
    }
  };

  const topUpWallet = async (amount: number) => {
    if (!currentUser || !userProfile) return;
    const newBal = (userProfile.walletBalance || 0) + amount;
    await updateProfile({ walletBalance: newBal });
    await addDoc(collection(db, 'walletLedger'), {
      id: `LED-${Date.now()}`,
      userId: currentUser.uid,
      amount,
      type: 'credit',
      reason: 'Wallet Top-up via UPI / Netbanking',
      createdAt: new Date().toISOString(),
    });
  };

  // Owner update announcement bar (text, coupon, hide/show)
  const updateAnnouncementConfig = async (config: StoreAnnouncementConfig) => {
    await setDoc(doc(db, 'storeSettings', 'announcement'), config);
    setAnnouncementConfig(config);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        banners,
        vouchers,
        orders,
        notifications,
        supportMessages,
        chats,
        announcementConfig,
        storeConfig,
        loading,
        seedInitialDataToFirestore,
        createOrder,
        updateOrderStatus,
        requestCancelOrder,
        requestReturnOrder,
        handleCancelRequest,
        handleReturnRequest,
        applyVoucher,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        deleteCategory,
        addBanner,
        updateBanner,
        deleteBanner,
        addReview,
        getProductReviews,
        sendSupportMessage,
        replySupportMessage,
        markChatMessagesAsRead,
        creditCustomerWalletFromChat,
        redeemGiftCard,
        markNotificationAsRead,
        markAllNotificationsRead,
        topUpWallet,
        updateAnnouncementConfig,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
