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
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../config/firebase';
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
  StoreConfig,
  WebsiteConfig,
  AIKnowledgeConfig,
  TrendingConfig,
  RestockSubscription,
} from '../types';
import { useAuth, OWNER_EMAIL, OWNER_UID, getConversationId } from './AuthContext';
import {
  SAMPLE_PRODUCTS,
  SAMPLE_CATEGORIES,
  SAMPLE_BANNERS,
  SAMPLE_VOUCHERS,
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_WEBSITE_CONFIG,
  DEFAULT_AI_KNOWLEDGE,
  DEFAULT_TRENDING_CONFIG,
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
  websiteConfig: WebsiteConfig;
  aiKnowledgeConfig: AIKnowledgeConfig;
  trendingConfig: TrendingConfig;
  reviews: Review[];
  restockSubscriptions: RestockSubscription[];
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
  addVoucher: (voucherData: Omit<Voucher, 'id' | 'usedCount'>) => Promise<string>;
  updateVoucher: (id: string, updates: Partial<Voucher>) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;
  addReview: (
    productId: string,
    rating: number,
    title?: string,
    comment?: string,
    images?: string[],
    reviewerName?: string,
    isOwnerSeeded?: boolean
  ) => Promise<string>;
  addBulkReviews: (
    reviews: Array<{
      productId: string;
      rating: number;
      title?: string;
      comment: string;
      reviewerName: string;
      isVerifiedPurchase?: boolean;
      isOwnerSeeded?: boolean;
    }>
  ) => Promise<{ succeeded: number; failed: number }>;
  updateReview: (id: string, updates: Partial<Review>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
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
  updateWebsiteConfig: (config: WebsiteConfig) => Promise<void>;
  updateAIKnowledge: (config: AIKnowledgeConfig) => Promise<void>;
  updateTrendingProducts: (items: { productId: string; priority: number }[]) => Promise<void>;
  saveMasterSet: (payload: {
    websiteConfig?: WebsiteConfig;
    aiKnowledge?: AIKnowledgeConfig;
    announcement?: StoreAnnouncementConfig;
    companyConfig?: StoreConfig;
    trendingItems?: { productId: string; priority: number }[];
    banners?: Banner[];
    vouchers?: Voucher[];
    categories?: Category[];
    products?: Product[];
  }) => Promise<{ success: boolean; revision: number; savedSections: string[]; errors?: string[] }>;
  subscribeRestock: (productId: string, variant?: string) => Promise<{ success: boolean; message: string; subId?: string }>;
  cancelRestockSubscription: (subscriptionId: string) => Promise<void>;
  isUserRestockSubscribed: (productId: string, variant?: string) => boolean;
  getUserRestockSubscription: (productId: string, variant?: string) => RestockSubscription | undefined;
  updateProductStockAndNotify: (productId: string, newStock: number) => Promise<void>;
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
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>(DEFAULT_WEBSITE_CONFIG);
  const [aiKnowledgeConfig, setAiKnowledgeConfig] = useState<AIKnowledgeConfig>(DEFAULT_AI_KNOWLEDGE);
  const [trendingConfig, setTrendingConfig] = useState<TrendingConfig>(DEFAULT_TRENDING_CONFIG);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [restockSubscriptions, setRestockSubscriptions] = useState<RestockSubscription[]>([]);
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

    // Website Config (layout, colors, fonts, sections) listener
    const unsubWebsiteConfig = onSnapshot(
      doc(db, 'storeSettings', 'websiteConfig'),
      (snap) => {
        if (snap.exists()) {
          setWebsiteConfig({ ...DEFAULT_WEBSITE_CONFIG, ...snap.data() } as WebsiteConfig);
        }
      },
      () => setWebsiteConfig(DEFAULT_WEBSITE_CONFIG)
    );

    // AI Knowledge & Personality listener
    const unsubAiKnowledge = onSnapshot(
      doc(db, 'storeSettings', 'aiKnowledge'),
      (snap) => {
        if (snap.exists()) {
          setAiKnowledgeConfig({ ...DEFAULT_AI_KNOWLEDGE, ...snap.data() } as AIKnowledgeConfig);
        }
      },
      () => setAiKnowledgeConfig(DEFAULT_AI_KNOWLEDGE)
    );

    // Trending Config listener
    const unsubTrending = onSnapshot(
      doc(db, 'storeSettings', 'trending'),
      (snap) => {
        if (snap.exists()) {
          setTrendingConfig({ ...DEFAULT_TRENDING_CONFIG, ...snap.data() } as TrendingConfig);
        }
      },
      () => setTrendingConfig(DEFAULT_TRENDING_CONFIG)
    );

    // Reviews collection listener
    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      (snapshot) => {
        const revList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Review[];
        setReviews(revList);
      },
      (err) => console.warn('Reviews listener notice:', err.message)
    );

    // Restock Subscriptions listener
    const unsubRestock = onSnapshot(
      collection(db, 'restockSubscriptions'),
      (snapshot) => {
        const subList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as RestockSubscription[];
        setRestockSubscriptions(subList);
      },
      (err) => console.warn('Restock subscriptions listener notice:', err.message)
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubVouchers();
      unsubAnnouncement();
      unsubWebsiteConfig();
      unsubAiKnowledge();
      unsubTrending();
      unsubReviews();
      unsubRestock();
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
        await setDoc(doc(db, 'products', prod.id), sanitizeForFirestore(prod));
      }
      for (const cat of SAMPLE_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat));
      }
      for (const ban of SAMPLE_BANNERS) {
        await setDoc(doc(db, 'banners', ban.id), sanitizeForFirestore(ban));
      }
      for (const v of SAMPLE_VOUCHERS) {
        await setDoc(doc(db, 'vouchers', v.id), sanitizeForFirestore(v));
      }
      await setDoc(doc(db, 'storeSettings', 'announcement'), sanitizeForFirestore(DEFAULT_ANNOUNCEMENT));
      await setDoc(doc(db, 'storeSettings', 'websiteConfig'), sanitizeForFirestore(DEFAULT_WEBSITE_CONFIG));
      await setDoc(doc(db, 'storeSettings', 'aiKnowledge'), sanitizeForFirestore(DEFAULT_AI_KNOWLEDGE));
      await setDoc(doc(db, 'storeSettings', 'trending'), sanitizeForFirestore(DEFAULT_TRENDING_CONFIG));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
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
      giftCardDetails: generatedCard || null,
      pricing: {
        ...orderData.pricing,
        voucherCode: orderData.pricing.voucherCode || null,
        voucherDiscount: orderData.pricing.voucherDiscount || 0,
        discount: orderData.pricing.discount || 0,
      },
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
      try {
        await runTransaction(db, async (transaction) => {
          const orderRef = doc(db, 'orders', orderId);
          transaction.set(orderRef, fullOrder);

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
        });
      } catch (txErr) {
        console.warn('Atomic inventory transaction notice, writing order direct:', txErr);
        await setDoc(doc(db, 'orders', orderId), fullOrder);
      }

      // Deduct wallet if used
      if (orderData.pricing.walletUsed > 0 && userProfile) {
        const newBalance = Math.max(0, userProfile.walletBalance - orderData.pricing.walletUsed);
        await updateProfile({ walletBalance: newBalance });

        await addDoc(collection(db, 'walletLedger'), sanitizeForFirestore({
          id: `LED-${Date.now()}`,
          userId: currentUser.uid,
          amount: orderData.pricing.walletUsed,
          type: 'debit',
          reason: `Debited for order #${orderId}`,
          orderId,
          createdAt: now,
        }));
      }

      // Add Notification
      await addDoc(collection(db, 'notifications'), sanitizeForFirestore({
        userId: currentUser.uid,
        title: hasGiftVoucher ? 'Digital Gift Card Delivered!' : 'Order Placed!',
        message: hasGiftVoucher
          ? `Your Gift Card #${generatedCard?.cardNumber} is ready in My Orders.`
          : `Your order #${orderId} for ₹${orderData.pricing.total.toLocaleString()} has been placed.`,
        type: 'order',
        link: `/orders/${orderId}`,
        isRead: false,
        createdAt: now,
      }));

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

      await updateDoc(orderRef, sanitizeForFirestore({
        orderStatus: status,
        updatedAt: now,
        timeline: newTimeline,
      }));

      if (existing) {
        await addDoc(collection(db, 'notifications'), sanitizeForFirestore({
          userId: existing.userId,
          title: `Order Status: ${status.toUpperCase()}`,
          message: `Your order #${orderId} is now ${status}. ${note || ''}`,
          type: 'order',
          link: `/orders/${orderId}`,
          isRead: false,
          createdAt: now,
        }));
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
      await updateDoc(orderRef, sanitizeForFirestore({
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
      }));

      // Notify customer
      await addDoc(collection(db, 'notifications'), sanitizeForFirestore({
        userId: existing.userId,
        title: 'Cancellation Request Submitted',
        message: `Your cancellation request for order #${orderId} is pending store review.`,
        type: 'order',
        link: `/orders/${orderId}`,
        isRead: false,
        createdAt: now,
      }));
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
      await updateDoc(orderRef, sanitizeForFirestore({
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
      }));

      await addDoc(collection(db, 'notifications'), sanitizeForFirestore({
        userId: existing.userId,
        title: 'Return Request Received',
        message: `Return request for order #${orderId} is being evaluated by customer support.`,
        type: 'order',
        link: `/orders/${orderId}`,
        isRead: false,
        createdAt: now,
      }));
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
      await updateDoc(orderRef, sanitizeForFirestore({
        'giftCardDetails.isRedeemed': true,
        'giftCardDetails.redeemedAt': now,
      }));

      // Credit wallet
      const newBalance = (userProfile.walletBalance || 0) + card.amount;
      await updateProfile({ walletBalance: newBalance });

      // Add ledger transaction
      await addDoc(collection(db, 'walletLedger'), sanitizeForFirestore({
        id: `LED-${Date.now()}`,
        userId: currentUser.uid,
        amount: card.amount,
        type: 'credit',
        reason: `Gift Card Redeemed (${cleanCard})`,
        giftCardNumber: cleanCard,
        createdAt: now,
      }));

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

  // Voucher validation and application
  const applyVoucher = (
    code: string,
    subtotal: number,
    productIds: string[] = [],
    categoryIds: string[] = []
  ): { valid: boolean; discount: number; message: string; voucher?: Voucher } => {
    const clean = code.trim().toUpperCase();
    const found = vouchers.find((v) => v.code.toUpperCase() === clean);

    if (!found || !found.isActive) {
      return { valid: false, discount: 0, message: `Coupon code '${clean}' is invalid or inactive.` };
    }

    // Expiry check
    if (found.expiryDate) {
      const expiry = new Date(found.expiryDate);
      expiry.setHours(23, 59, 59, 999);
      if (new Date() > expiry) {
        return { valid: false, discount: 0, message: `Coupon code '${clean}' expired on ${found.expiryDate}.` };
      }
    }

    // Start date check
    if (found.startDate) {
      const start = new Date(found.startDate);
      if (new Date() < start) {
        return { valid: false, discount: 0, message: `Coupon '${clean}' will become active on ${found.startDate}.` };
      }
    }

    // Min Order Value
    if (subtotal < (found.minOrderValue || 0)) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order value of ₹${(found.minOrderValue || 0).toLocaleString()} required for '${clean}'.`,
      };
    }

    // Usage limit
    if (typeof found.usageLimit === 'number' && found.usageLimit > 0) {
      if ((found.usedCount || 0) >= found.usageLimit) {
        return { valid: false, discount: 0, message: `Coupon '${clean}' has reached maximum total usage.` };
      }
    }

    // Category restriction check
    if (Array.isArray(found.restrictedCategoryIds) && found.restrictedCategoryIds.length > 0) {
      const matchesCategory = categoryIds.some((cId) => found.restrictedCategoryIds?.includes(cId));
      if (!matchesCategory && categoryIds.length > 0) {
        return { valid: false, discount: 0, message: `Coupon '${clean}' is only valid on selected categories.` };
      }
    }

    // Product restriction check
    if (Array.isArray(found.restrictedProductIds) && found.restrictedProductIds.length > 0) {
      const matchesProduct = productIds.some((pId) => found.restrictedProductIds?.includes(pId));
      if (!matchesProduct && productIds.length > 0) {
        return { valid: false, discount: 0, message: `Coupon '${clean}' is valid only for designated promotional items.` };
      }
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

    discount = Math.min(discount, subtotal);

    return {
      valid: true,
      discount,
      message: `🎉 Coupon ${found.code} applied! Saved ₹${discount.toLocaleString()}`,
      voucher: found,
    };
  };

  // Coupon CRUD
  const addVoucher = async (voucherData: Omit<Voucher, 'id' | 'usedCount'>): Promise<string> => {
    const id = `vouch-${voucherData.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newVoucher: Voucher = {
      ...voucherData,
      id,
      code: voucherData.code.toUpperCase().trim(),
      usedCount: 0,
    };
    await setDoc(doc(db, 'vouchers', id), sanitizeForFirestore(newVoucher));
    return id;
  };

  const updateVoucher = async (id: string, updates: Partial<Voucher>) => {
    const cleanUpdates = { ...updates };
    if (cleanUpdates.code) {
      cleanUpdates.code = cleanUpdates.code.toUpperCase().trim();
    }
    await updateDoc(doc(db, 'vouchers', id), sanitizeForFirestore(cleanUpdates));
  };

  const deleteVoucher = async (id: string) => {
    await deleteDoc(doc(db, 'vouchers', id));
  };

  // Product CRUD
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<string> => {
    const id = `tp-prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
      categoryIds: productData.categoryIds || (productData.category ? [productData.category] : []),
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'products', id), sanitizeForFirestore(newProduct));
    return id;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const prevProd = products.find((p) => p.id === id);
    const sanitized = sanitizeForFirestore({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'products', id), sanitized);

    // If stock transitioned from 0 to >0, trigger restock subscriber notifications
    if (typeof updates.stock === 'number' && (prevProd?.stock || 0) <= 0 && updates.stock > 0) {
      await notifyRestockSubscribers(id, updates.stock, prevProd?.name || 'Product', prevProd?.slug || id);
    }
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

  // Recalculate real ratings from published review records
  const recalculateProductRating = async (productId: string) => {
    try {
      const q = query(collection(db, 'reviews'), where('productId', '==', productId));
      const snap = await getDocs(q);
      const activeReviews = snap.docs
        .map((d) => d.data() as Review)
        .filter((r) => !r.isHidden && typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5);

      const count = activeReviews.length;
      const average = count > 0
        ? Number((activeReviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1))
        : 0;

      await updateDoc(doc(db, 'products', productId), sanitizeForFirestore({
        rating: average,
        ratingCount: count,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Rating recalculation notice:', err);
    }
  };

  // Reviews CRUD with authentic rating updates
  const addReview = async (
    productId: string,
    rating: number,
    title?: string,
    comment?: string,
    images?: string[],
    reviewerName?: string,
    isOwnerSeeded: boolean = false
  ): Promise<string> => {
    if (!currentUser && !isOwnerSeeded) throw new Error('Must be logged in to submit a review');
    const reviewId = `rev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const rawReview: Review = {
      id: reviewId,
      productId,
      userId: currentUser?.uid || 'store-owner',
      userName: reviewerName || currentUser?.displayName || 'Verified Buyer',
      userPhoto: currentUser?.photoURL || undefined,
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      title: title || 'Customer Review',
      comment: comment || '',
      images: images || [],
      isVerifiedPurchase: !isOwnerSeeded,
      isOwnerSeeded,
      isHidden: false,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'reviews', reviewId), sanitizeForFirestore(rawReview));
    await recalculateProductRating(productId);
    return reviewId;
  };

  const addBulkReviews = async (
    bulkList: Array<{
      productId: string;
      rating: number;
      title?: string;
      comment: string;
      reviewerName: string;
      isVerifiedPurchase?: boolean;
      isOwnerSeeded?: boolean;
    }>
  ): Promise<{ succeeded: number; failed: number }> => {
    let succeeded = 0;
    let failed = 0;
    const affectedProducts = new Set<string>();

    for (const r of bulkList) {
      try {
        if (!r.productId || !r.comment) {
          failed++;
          continue;
        }
        const revId = `rev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}-${succeeded}`;
        const now = new Date().toISOString();
        const docData: Review = {
          id: revId,
          productId: r.productId,
          userId: currentUser?.uid || 'store-owner',
          userName: r.reviewerName || 'Customer',
          rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
          title: r.title || 'Product Feedback',
          comment: r.comment,
          images: [],
          isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
          isOwnerSeeded: r.isOwnerSeeded !== undefined ? r.isOwnerSeeded : true,
          isHidden: false,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(doc(db, 'reviews', revId), sanitizeForFirestore(docData));
        affectedProducts.add(r.productId);
        succeeded++;
      } catch (e) {
        console.warn('Bulk review write error:', e);
        failed++;
      }
    }

    for (const prodId of affectedProducts) {
      await recalculateProductRating(prodId);
    }

    return { succeeded, failed };
  };

  const updateReview = async (id: string, updates: Partial<Review>) => {
    const existing = reviews.find((r) => r.id === id);
    await updateDoc(doc(db, 'reviews', id), sanitizeForFirestore({
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
    if (existing?.productId) {
      await recalculateProductRating(existing.productId);
    }
  };

  const deleteReview = async (id: string) => {
    const existing = reviews.find((r) => r.id === id);
    await deleteDoc(doc(db, 'reviews', id));
    if (existing?.productId) {
      await recalculateProductRating(existing.productId);
    }
  };

  const getProductReviews = async (productId: string): Promise<Review[]> => {
    try {
      const q = query(collection(db, 'reviews'), where('productId', '==', productId));
      const snap = await getDocs(q);
      const res = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Review))
        .filter((r) => !r.isHidden);
      return res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  };

  // Restock notification helpers
  const notifyRestockSubscribers = async (productId: string, newStock: number, prodTitle: string, prodSlug: string) => {
    try {
      const qSub = query(
        collection(db, 'restockSubscriptions'),
        where('productId', '==', productId),
        where('status', '==', 'pending')
      );
      const subSnap = await getDocs(qSub);
      if (!subSnap.empty) {
        const now = new Date().toISOString();
        for (const subDoc of subSnap.docs) {
          const sub = subDoc.data() as RestockSubscription;
          await addDoc(collection(db, 'notifications'), sanitizeForFirestore({
            userId: sub.userId,
            title: `🎉 Back in Stock: ${prodTitle}`,
            message: `"${prodTitle}" is now back in stock with ${newStock} units available! Grab yours before it runs out.`,
            type: 'system',
            link: `/product/${prodSlug}`,
            isRead: false,
            createdAt: now,
          }));

          await updateDoc(doc(db, 'restockSubscriptions', subDoc.id), {
            status: 'notified',
            notifiedAt: now,
          });
        }
      }
    } catch (err) {
      console.warn('Restock notifications processing notice:', err);
    }
  };

  const updateProductStockAndNotify = async (productId: string, newStock: number) => {
    const prod = products.find((p) => p.id === productId);
    await updateProduct(productId, { stock: newStock });
  };

  const subscribeRestock = async (productId: string, variant?: string): Promise<{ success: boolean; message: string; subId?: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Please sign in to subscribe to restock alerts.' };
    }
    const cleanVariant = variant || '';
    const existingSub = restockSubscriptions.find(
      (s) => s.userId === currentUser.uid && s.productId === productId && (s.variant || '') === cleanVariant && s.status === 'pending'
    );
    if (existingSub) {
      return { success: true, message: 'You are already subscribed to restock notifications for this item.', subId: existingSub.id };
    }

    const subId = `sub-${currentUser.uid.slice(-6)}-${Date.now()}`;
    const prod = products.find((p) => p.id === productId);
    const newSub: RestockSubscription = {
      id: subId,
      userId: currentUser.uid,
      customerEmail: currentUser.email || '',
      customerName: currentUser.displayName || undefined,
      productId,
      productName: prod?.name || 'Product',
      variant: cleanVariant || undefined,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    try {
      await setDoc(doc(db, 'restockSubscriptions', subId), sanitizeForFirestore(newSub));
      return { success: true, message: 'Subscribed! We will notify you immediately when this item is restocked.', subId };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `restockSubscriptions/${subId}`);
      return { success: false, message: 'Failed to subscribe. Please try again.' };
    }
  };

  const cancelRestockSubscription = async (subscriptionId: string) => {
    try {
      await deleteDoc(doc(db, 'restockSubscriptions', subscriptionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `restockSubscriptions/${subscriptionId}`);
    }
  };

  const isUserRestockSubscribed = (productId: string, variant?: string): boolean => {
    if (!currentUser) return false;
    const cleanVariant = variant || '';
    return restockSubscriptions.some(
      (s) => s.userId === currentUser.uid && s.productId === productId && (s.variant || '') === cleanVariant && s.status === 'pending'
    );
  };

  const getUserRestockSubscription = (productId: string, variant?: string): RestockSubscription | undefined => {
    if (!currentUser) return undefined;
    const cleanVariant = variant || '';
    return restockSubscriptions.find(
      (s) => s.userId === currentUser.uid && s.productId === productId && (s.variant || '') === cleanVariant && s.status === 'pending'
    );
  };

  // Trending Products Management
  const updateTrendingProducts = async (items: { productId: string; priority: number }[]) => {
    const now = new Date().toISOString();
    const pIds = items.map((i) => i.productId);
    const trendingDoc: TrendingConfig = {
      productIds: pIds,
      items,
      updatedAt: now,
    };
    await setDoc(doc(db, 'storeSettings', 'trending'), sanitizeForFirestore(trendingDoc));
    setTrendingConfig(trendingDoc);

    // Sync product flags in Firestore
    for (const prod of products) {
      const item = items.find((t) => t.productId === prod.id);
      const isTrend = Boolean(item);
      const order = item ? item.priority : 999;
      if (prod.isTrending !== isTrend || prod.trendingOrder !== order) {
        await updateDoc(doc(db, 'products', prod.id), sanitizeForFirestore({
          isTrending: isTrend,
          trendingOrder: order,
          updatedAt: now,
        }));
      }
    }
  };

  // Website Config & AI Knowledge updates
  const updateWebsiteConfig = async (config: WebsiteConfig) => {
    await setDoc(doc(db, 'storeSettings', 'websiteConfig'), sanitizeForFirestore(config));
    setWebsiteConfig(config);
  };

  const updateAIKnowledge = async (config: AIKnowledgeConfig) => {
    await setDoc(doc(db, 'storeSettings', 'aiKnowledge'), sanitizeForFirestore(config));
    setAiKnowledgeConfig(config);
  };

  // MASTER SET — CONFIRM ALL CHANGES (Owner Control Centre)
  const saveMasterSet = async (payload: {
    websiteConfig?: WebsiteConfig;
    aiKnowledge?: AIKnowledgeConfig;
    announcement?: StoreAnnouncementConfig;
    companyConfig?: StoreConfig;
    trendingItems?: { productId: string; priority: number }[];
    banners?: Banner[];
    vouchers?: Voucher[];
    categories?: Category[];
    products?: Product[];
  }): Promise<{ success: boolean; revision: number; savedSections: string[]; errors?: string[] }> => {
    if (!isAdmin) throw new Error('Unauthorized: Only store owner can execute Master Set');
    const now = new Date().toISOString();
    const newRev = (websiteConfig.revision || 1) + 1;
    const savedSections: string[] = [];
    const errors: string[] = [];

    // 1. Website Config
    if (payload.websiteConfig) {
      try {
        const updated = {
          ...payload.websiteConfig,
          revision: newRev,
          updatedAt: now,
        };
        await setDoc(doc(db, 'storeSettings', 'websiteConfig'), sanitizeForFirestore(updated));
        setWebsiteConfig(updated);
        savedSections.push('Homepage Layout, Theme & Policies');
      } catch (e: any) {
        errors.push(`Website Config: ${e.message}`);
      }
    }

    // 2. AI Knowledge
    if (payload.aiKnowledge) {
      try {
        const updated = {
          ...payload.aiKnowledge,
          revision: newRev,
          updatedAt: now,
        };
        await setDoc(doc(db, 'storeSettings', 'aiKnowledge'), sanitizeForFirestore(updated));
        setAiKnowledgeConfig(updated);
        savedSections.push('AI Assistant Knowledge & Voice Preferences');
      } catch (e: any) {
        errors.push(`AI Knowledge: ${e.message}`);
      }
    }

    // 3. Announcement
    if (payload.announcement) {
      try {
        await setDoc(doc(db, 'storeSettings', 'announcement'), sanitizeForFirestore(payload.announcement));
        setAnnouncementConfig(payload.announcement);
        savedSections.push('Announcement Bar');
      } catch (e: any) {
        errors.push(`Announcement: ${e.message}`);
      }
    }

    // 4. Company Config
    if (payload.companyConfig) {
      try {
        await setDoc(doc(db, 'storeSettings', 'companyConfig'), sanitizeForFirestore(payload.companyConfig));
        setStoreConfig(payload.companyConfig);
        savedSections.push('Store & Dispatch Details');
      } catch (e: any) {
        errors.push(`Company Details: ${e.message}`);
      }
    }

    // 5. Trending Products
    if (payload.trendingItems) {
      try {
        const pIds = payload.trendingItems.map((t) => t.productId);
        const trendingDoc: TrendingConfig = {
          productIds: pIds,
          items: payload.trendingItems,
          updatedAt: now,
        };
        await setDoc(doc(db, 'storeSettings', 'trending'), sanitizeForFirestore(trendingDoc));
        setTrendingConfig(trendingDoc);

        // Sync flags on products in Firestore
        for (const prod of products) {
          const trendingItem = payload.trendingItems.find((t) => t.productId === prod.id);
          const shouldBeTrending = Boolean(trendingItem);
          const orderNum = trendingItem ? trendingItem.priority : 999;
          if (prod.isTrending !== shouldBeTrending || prod.trendingOrder !== orderNum) {
            await updateDoc(doc(db, 'products', prod.id), sanitizeForFirestore({
              isTrending: shouldBeTrending,
              trendingOrder: orderNum,
              updatedAt: now,
            }));
          }
        }
        savedSections.push('Owner-Curated Trending Products');
      } catch (e: any) {
        errors.push(`Trending Products: ${e.message}`);
      }
    }

    // 6. Banners
    if (payload.banners) {
      try {
        for (const b of payload.banners) {
          await setDoc(doc(db, 'banners', b.id), sanitizeForFirestore(b));
        }
        savedSections.push(`Promotional Banners (${payload.banners.length})`);
      } catch (e: any) {
        errors.push(`Banners: ${e.message}`);
      }
    }

    // 7. Coupons
    if (payload.vouchers) {
      try {
        for (const v of payload.vouchers) {
          await setDoc(doc(db, 'vouchers', v.id), sanitizeForFirestore(v));
        }
        savedSections.push(`Active Coupons (${payload.vouchers.length})`);
      } catch (e: any) {
        errors.push(`Coupons: ${e.message}`);
      }
    }

    // 8. Categories
    if (payload.categories) {
      try {
        for (const c of payload.categories) {
          await setDoc(doc(db, 'categories', c.id), sanitizeForFirestore(c));
        }
        savedSections.push(`Catalog Categories (${payload.categories.length})`);
      } catch (e: any) {
        errors.push(`Categories: ${e.message}`);
      }
    }

    // 9. Products
    if (payload.products) {
      try {
        for (const p of payload.products) {
          await setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p));
        }
        savedSections.push(`Catalog Products (${payload.products.length})`);
      } catch (e: any) {
        errors.push(`Products: ${e.message}`);
      }
    }

    // Save revision snapshot for audit & backup
    try {
      await setDoc(
        doc(db, 'storeSettings', 'revisions', 'history', `rev-${newRev}-${Date.now()}`),
        sanitizeForFirestore({
          revision: newRev,
          savedBy: currentUser?.email,
          timestamp: now,
          savedSections,
          errors: errors.length > 0 ? errors : null,
        })
      );
    } catch {
      // Non-blocking history record
    }

    return {
      success: errors.length === 0,
      revision: newRev,
      savedSections,
      errors: errors.length > 0 ? errors : undefined,
    };
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
    await addDoc(collection(db, 'walletLedger'), sanitizeForFirestore({
      id: `LED-${Date.now()}`,
      userId: targetUserId,
      amount,
      type: 'credit',
      reason: `Owner Chat Credit: ${reason}`,
      createdAt: now,
    }));

    // Notify customer
    await addDoc(collection(db, 'notifications'), sanitizeForFirestore({
      userId: targetUserId,
      title: 'Wallet Balance Credited by Owner!',
      message: `₹${amount.toLocaleString()} has been added to your TrendPro wallet. Reason: ${reason}`,
      type: 'wallet',
      link: '/wallet',
      isRead: false,
      createdAt: now,
    }));

    // Send chat system message
    const custId = `CUST-${targetUserId.slice(-6).toUpperCase()}`;
    await addDoc(collection(db, 'supportMessages'), sanitizeForFirestore({
      userId: targetUserId,
      customerId: custId,
      userName: 'TrendPro Store Owner',
      userEmail: 'saurav586kumar@gmail.com',
      message: `🎉 [Wallet Credited] I have directly credited ₹${amount.toLocaleString()} to your TrendPro wallet balance! (${reason})`,
      sender: 'owner',
      walletCredited: amount,
      createdAt: now,
      isRead: false,
    }));
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
    await addDoc(collection(db, 'walletLedger'), sanitizeForFirestore({
      id: `LED-${Date.now()}`,
      userId: currentUser.uid,
      amount,
      type: 'credit',
      reason: 'Wallet Top-up via UPI / Netbanking',
      createdAt: new Date().toISOString(),
    }));
  };

  // Owner update announcement bar (text, coupon, hide/show)
  const updateAnnouncementConfig = async (config: StoreAnnouncementConfig) => {
    await setDoc(doc(db, 'storeSettings', 'announcement'), sanitizeForFirestore(config));
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
        websiteConfig,
        aiKnowledgeConfig,
        trendingConfig,
        reviews,
        restockSubscriptions,
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
        addVoucher,
        updateVoucher,
        deleteVoucher,
        addReview,
        addBulkReviews,
        updateReview,
        deleteReview,
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
        updateWebsiteConfig,
        updateAIKnowledge,
        updateTrendingProducts,
        saveMasterSet,
        subscribeRestock,
        cancelRestockSubscription,
        isUserRestockSubscribed,
        getUserRestockSubscription,
        updateProductStockAndNotify,
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
