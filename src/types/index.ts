export interface Product {
  id: string;
  sku?: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  categories?: string[]; // Multiple categories support
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
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
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
  variant?: string;
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
    voucherCode?: string;
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
  giftCardDetails?: GeneratedGiftCard;
  cancelRequest?: CancelRequest;
  returnRequest?: ReturnRequest;
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
  createdAt: string;
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
