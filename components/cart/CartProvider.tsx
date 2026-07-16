"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

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
