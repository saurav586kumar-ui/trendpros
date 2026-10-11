import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../config/firebase';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';

export const cleanCartItem = (item: Partial<CartItem>): CartItem => {
  const cleaned: CartItem = {
    productId: String(item.productId || ''),
    name: String(item.name || ''),
    price: Number(item.price) || 0,
    originalPrice: Number(item.originalPrice) || 0,
    image: String(item.image || ''),
    brand: String(item.brand || ''),
    quantity: Math.max(1, Number(item.quantity) || 1),
    stock: typeof item.stock === 'number' ? item.stock : 99,
  };
  if (item.selectedVariant) {
    cleaned.selectedVariant = item.selectedVariant;
  }
  if (item.isGiftVoucher) {
    cleaned.isGiftVoucher = true;
  }
  return cleaned;
};

interface CartContextType {
  cart: CartItem[];
  wishlist: string[];
  compareList: string[];
  addToCart: (product: Product, quantity?: number, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  moveToCartFromWishlist: (product: Product) => void;
  toggleCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  subtotal: number;
  totalDiscount: number;
  deliveryCharge: number;
  cartCount: number;
  wishlistCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'trendpro_guest_cart';
const GUEST_WISHLIST_KEY = 'trendpro_guest_wishlist';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(cleanCartItem) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_WISHLIST_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id.trim().length > 0) : [];
    } catch {
      return [];
    }
  });

  const [compareList, setCompareList] = useState<string[]>([]);

  // Sync with Firestore when user logs in
  useEffect(() => {
    if (!currentUser) return;

    const syncUserData = async () => {
      try {
        const cartRef = doc(db, 'carts', currentUser.uid);
        const wishlistRef = doc(db, 'wishlists', currentUser.uid);

        const [cartSnap, wishlistSnap] = await Promise.all([
          getDoc(cartRef),
          getDoc(wishlistRef),
        ]);

        let remoteCart: CartItem[] = [];
        if (cartSnap.exists()) {
          const rawItems = cartSnap.data().items;
          if (Array.isArray(rawItems)) {
            remoteCart = rawItems.map(cleanCartItem);
          }
        }

        // Merge guest cart with remote cart
        const mergedCartMap = new Map<string, CartItem>();
        remoteCart.forEach((item) => mergedCartMap.set(item.productId, cleanCartItem(item)));

        // Add guest cart items if not duplicate, or sum quantity up to stock
        cart.forEach((guestItem) => {
          const cleanedGuest = cleanCartItem(guestItem);
          if (mergedCartMap.has(cleanedGuest.productId)) {
            const existing = mergedCartMap.get(cleanedGuest.productId)!;
            const newQty = Math.min(existing.quantity + cleanedGuest.quantity, existing.stock);
            mergedCartMap.set(cleanedGuest.productId, cleanCartItem({ ...existing, quantity: newQty }));
          } else {
            mergedCartMap.set(cleanedGuest.productId, cleanedGuest);
          }
        });

        const mergedCart = Array.from(mergedCartMap.values()).map(cleanCartItem);
        setCart(mergedCart);
        await setDoc(cartRef, sanitizeForFirestore({ items: mergedCart, updatedAt: new Date().toISOString() }));
        localStorage.removeItem(GUEST_CART_KEY);

        // Sync wishlist
        let remoteWishlist: string[] = [];
        if (wishlistSnap.exists()) {
          const rawWishlist = wishlistSnap.data().productIds;
          if (Array.isArray(rawWishlist)) {
            remoteWishlist = rawWishlist.filter((id) => typeof id === 'string' && id.trim().length > 0);
          }
        }
        const mergedWishlist = Array.from(new Set([...remoteWishlist, ...wishlist])).filter((id) => typeof id === 'string' && id.trim().length > 0);
        setWishlist(mergedWishlist);
        await setDoc(wishlistRef, sanitizeForFirestore({ productIds: mergedWishlist, updatedAt: new Date().toISOString() }));
        localStorage.removeItem(GUEST_WISHLIST_KEY);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `carts/${currentUser.uid}`);
      }
    };

    syncUserData();
  }, [currentUser]);

  // Persist cart changes
  const saveCart = async (newCart: CartItem[]) => {
    const cleanedCart = newCart.map(cleanCartItem);
    setCart(cleanedCart);
    if (currentUser) {
      try {
        const cartRef = doc(db, 'carts', currentUser.uid);
        await setDoc(cartRef, sanitizeForFirestore({ items: cleanedCart, updatedAt: new Date().toISOString() }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `carts/${currentUser.uid}`);
      }
    } else {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cleanedCart));
    }
  };

  // Persist wishlist changes
  const saveWishlist = async (newWishlist: string[]) => {
    const cleanedWishlist = (newWishlist || []).filter((id) => typeof id === 'string' && id.trim().length > 0);
    setWishlist(cleanedWishlist);
    if (currentUser) {
      try {
        const wishlistRef = doc(db, 'wishlists', currentUser.uid);
        await setDoc(wishlistRef, sanitizeForFirestore({ productIds: cleanedWishlist, updatedAt: new Date().toISOString() }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `wishlists/${currentUser.uid}`);
      }
    } else {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(cleanedWishlist));
    }
  };

  const addToCart = (product: Product, quantity = 1, variant?: string) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    let updatedCart: CartItem[];

    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      const newQty = Math.min(existing.quantity + quantity, product.stock);
      const chosenVariant = variant || existing.selectedVariant;
      const updatedItem: Partial<CartItem> = {
        ...existing,
        quantity: newQty,
      };
      if (chosenVariant) {
        updatedItem.selectedVariant = chosenVariant;
      } else {
        delete updatedItem.selectedVariant;
      }
      updatedCart = [...cart];
      updatedCart[existingIndex] = cleanCartItem(updatedItem);
    } else {
      const newItemData: Partial<CartItem> = {
        productId: product.id,
        name: product.name,
        price: product.sellingPrice,
        originalPrice: product.originalPrice,
        image: product.mainImage,
        brand: product.brand,
        quantity: Math.min(quantity, product.stock),
        stock: product.stock,
      };
      if (variant) {
        newItemData.selectedVariant = variant;
      }
      if (product.isGiftVoucher) {
        newItemData.isGiftVoucher = true;
      }
      updatedCart = [...cart, cleanCartItem(newItemData)];
    }

    saveCart(updatedCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.min(quantity, item.stock) };
      }
      return item;
    });
    saveCart(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter((item) => item.productId !== productId);
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      saveWishlist(wishlist.filter((id) => id !== productId));
    } else {
      saveWishlist([...wishlist, productId]);
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const moveToCartFromWishlist = (product: Product) => {
    addToCart(product);
    toggleWishlist(product.id);
  };

  const toggleCompare = (productId: string) => {
    if (compareList.includes(productId)) {
      setCompareList(compareList.filter((id) => id !== productId));
    } else {
      if (compareList.length >= 4) {
        return;
      }
      setCompareList([...compareList, productId]);
    }
  };

  const isInCompare = (productId: string) => compareList.includes(productId);
  const clearCompare = () => setCompareList([]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalOriginal = cart.reduce((acc, item) => acc + item.originalPrice * item.quantity, 0);
  const totalDiscount = totalOriginal - subtotal;
  const deliveryCharge = subtotal > 999 || subtotal === 0 ? 0 : 79;
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        compareList,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isInWishlist,
        moveToCartFromWishlist,
        toggleCompare,
        isInCompare,
        clearCompare,
        subtotal,
        totalDiscount,
        deliveryCharge,
        cartCount,
        wishlistCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
