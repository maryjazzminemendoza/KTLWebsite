"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, X } from "lucide-react";

export type CartItem = {
  id: number;
  line_key: string;
  name: string;
  variation: string | null;
  category: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

type AddToCartItem = Omit<CartItem, "quantity">;

type CartContextType = {
  items: CartItem[];
  addItem: (item: AddToCartItem) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "kainan-cart";
const CART_NOTIFICATION_DURATION = 3000;

type CartNotification = {
  id: number;
  message: string;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [notification, setNotification] = useState<CartNotification | null>(null);
  const notificationIdRef = useRef(0);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    let savedItems: CartItem[] = [];

    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart) as Partial<CartItem>[];
        savedItems = parsed.map((item) => ({
          ...item,
          line_key: item.line_key || `${item.id}:standard`,
          variation: item.variation || null,
        })) as CartItem[];
      } catch {}
    }

    queueMicrotask(() => {
      setItems(savedItems);
      setHasLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hasLoaded]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  function showAddedNotification(item: AddToCartItem) {
    notificationIdRef.current += 1;
    setNotification({
      id: notificationIdRef.current,
      message: `${item.name}${item.variation ? ` (${item.variation})` : ""} was added to your cart.`,
    });

    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(
      () => setNotification(null),
      CART_NOTIFICATION_DURATION,
    );
  }

  function addItem(item: AddToCartItem) {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (cartItem) => cartItem.line_key === item.line_key
      );

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.line_key === item.line_key
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...currentItems, { ...item, quantity: 1 }];
    });
    showAddedNotification(item);
  }

  function removeItem(lineKey: string) {
    setItems((currentItems) =>
      currentItems.filter((cartItem) => cartItem.line_key !== lineKey)
    );
  }

  function updateQuantity(lineKey: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(lineKey);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((cartItem) =>
        cartItem.line_key === lineKey ? { ...cartItem, quantity } : cartItem
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
      {notification && (
        <div
          key={notification.id}
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-24 z-[110] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-2xl border border-white/10 bg-[#203623] px-4 py-3.5 text-sm font-semibold leading-6 text-white shadow-[0_18px_50px_rgba(0,0,0,0.3)] sm:px-5"
        >
          <CheckCircle2 className="mt-0.5 shrink-0 text-[#E4B763]" size={20} />
          <span className="min-w-0 flex-1 break-words">{notification.message}</span>
          <button
            type="button"
            aria-label="Dismiss cart notification"
            onClick={() => setNotification(null)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
