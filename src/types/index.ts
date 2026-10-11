export interface Product {
  id: string;
  sku?: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  categories?: string[]; // Multiple categories support
  categoryIds?: string[]; // Consistent array of assigned category IDs
  subCategory?: string;
  description: string;
  highlights: string[];
  mainImage: string;
  images: string[];
  originalPrice: number;
  sellingPrice: number;
  discountPercent: number;
  stock: number;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  trendingOrder?: number;
  isGiftVoucher?: boolean;
  giftCardDenominations?: number[];
  variants?: {
    name?: string;
    type?: string;
    options: string[];
  }[];
  specs?: Record<string, string>;
  inTheBox?: string;
  warranty?: string;
  deliveryDays?: number;
  returnPolicyDays?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  subCategories: string[];
  description?: string;
}

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  imageUrl: string;
  link: string;
  ctaText?: string;
  order: number;
  isActive: boolean;
  backgroundColor?: string;
}

export interface UserProfile {
  id: string;
  customerId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: 'customer' | 'admin';
  walletBalance: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  pincode: string;
  locality: string;
  addressLine: string;
  city: string;
  state: string;
  landmark?: string;
  type: 'home' | 'work';
  isDefault: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  brand: string;
  quantity: number;
  stock: number;
  selectedVariant?: string;
  isGiftVoucher?: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate?: string;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  perCustomerLimit?: number;
  usedCount: number;
  restrictedCategoryIds?: string[];
  restrictedProductIds?: string[];
  allowStacking?: boolean;
}

export type OrderStatus =
  | 'ordered'
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'processing'
  | 'dispatched'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string | null;
  isGiftVoucher?: boolean;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface CancelRequest {
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  requestDate: string;
  adminNote?: string;
}

export interface ReturnRequest {
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  requestDate: string;
  extraImages?: string[];
  adminNote?: string;
}

export interface GeneratedGiftCard {
  cardNumber: string;
  pin: string;
  amount: number;
  issueDate: string;
  isRedeemed: boolean;
  redeemedAt?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: Address;
  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    voucherCode?: string | null;
    voucherDiscount: number;
    walletUsed: number;
    total: number;
  };
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  orderStatus: OrderStatus;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  timeline: OrderTimeline[];
  isGiftVoucherOrder?: boolean;
  giftCardDetails?: GeneratedGiftCard | null;
  cancelRequest?: CancelRequest | null;
  returnRequest?: ReturnRequest | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isHidden?: boolean;
  isOwnerSeeded?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreConfig {
  storeName: string;
  websiteUrl: string; // trendpro.netlify.app
  dispatchHub: {
    name: string;
    hubCode: string;
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    phone: string;
  };
  defaultDeliveryDays: number; // 8
}

export interface SupportMessage {
  id: string;
  conversationId?: string;
  customerUid?: string;
  ownerUid?: string;
  userId: string;
  senderId?: string;
  recipientId?: string;
  senderRole?: 'customer' | 'owner';
  sender: 'customer' | 'owner';
  senderName?: string;
  senderEmail?: string;
  customerId: string;
  userName: string;
  userEmail: string;
  message: string;
  imageUrl?: string;
  imageFileName?: string;
  orderId?: string;
  walletCredited?: number;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface ChatConversation {
  id: string;
  conversationId: string;
  customerUid: string;
  ownerUid: string;
  participants: string[];
  userId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSender: 'customer' | 'owner';
  orderId?: string;
  unreadByOwner?: boolean;
  unreadByCustomer?: boolean;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'wallet' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  orderId?: string;
  giftCardNumber?: string;
  createdAt: string;
}

export interface StoreAnnouncementConfig {
  isEnabled: boolean;
  badge: string;
  headline: string;
  couponCode: string;
  discountText: string;
  shippingNote: string;
}

export interface RestockSubscription {
  id: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  productId: string;
  productName?: string;
  variant?: string;
  createdAt: string;
  status: 'pending' | 'notified' | 'cancelled';
}

export interface TrendingProductItem {
  productId: string;
  priority: number;
}

export interface TrendingConfig {
  productIds: string[];
  items: TrendingProductItem[];
  updatedAt: string;
}

export interface HomepageSectionConfig {
  id: string;
  name: string;
  isVisible: boolean;
  order: number;
}

export interface WebsiteConfig {
  primaryColor: string;
  fontFamily: string;
  homepageSections: HomepageSectionConfig[];
  aboutUsContent?: string;
  privacyPolicyContent?: string;
  termsContent?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  revision: number;
  updatedAt: string;
}

export interface AssistantFAQ {
  question: string;
  answer: string;
}

export interface AIKnowledgeConfig {
  storeName: string;
  tagline: string;
  verifiedOwnerInfo: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  dispatchHubAddress: string;
  shippingPolicy: string;
  returnRefundPolicy: string;
  couponRules: string;
  walletInstructions: string;
  faqs: AssistantFAQ[];
  assistantPersonality: {
    name: string;
    tone: 'warm_friendly_female' | 'professional' | 'casual';
    languages: string;
    welcomeMessage: string;
    suggestedQuestions: string[];
    voiceEnabled: boolean;
    defaultSpeechRate: number;
    defaultSpeechPitch: number;
  };
  revision: number;
  updatedAt: string;
}

export interface MasterSetSummary {
  hasPendingChanges: boolean;
  itemsToSave: {
    section: string;
    description: string;
    count?: number;
  }[];
  revision: number;
  lastConfirmedAt?: string;
}
