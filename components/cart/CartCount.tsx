"use client";

import { useCart } from "@/components/cart/CartProvider";

export default function CartCount() {
  const { totalItems } = useCart();

  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C28B38] px-1 text-[10px] font-bold text-white">
      {totalItems}
    </span>
  );
}