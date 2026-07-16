"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn, Minus, Plus, ShoppingCart, Trash2, UserPlus } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import CheckoutForm from "@/components/cart/CheckoutForm";

export default function CartPageClient({
  userId,
  userEmail,
  initialName,
  initialPhone,
}: {
  userId?: string;
  userEmail?: string;
  initialName?: string;
  initialPhone?: string;
}) {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-10">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
          Your Cart
        </p>

        <h1 className="mt-4 text-4xl font-semibold leading-[1.02] text-[#3B2716] sm:text-5xl lg:text-6xl">
          Review your selected dishes.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-[#6F675E]">
          Review your dishes, adjust quantities, then choose restaurant pickup
          or local delivery within Tanay, Baras, and Pililla.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.line_key}
                className="grid gap-5 rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-4 shadow-[0_18px_45px_rgba(59,39,22,0.07)] sm:p-5 md:grid-cols-[130px_1fr_auto]"
              >
                <div className="relative h-44 overflow-hidden rounded-2xl bg-[#EFE3D1] sm:h-52 md:h-32">
                  <Image
                    src={item.image_url || "/images/food-placeholder.webp"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="130px"
                    unoptimized={
                      item.image_url?.startsWith("http") ||
                      item.image_url?.startsWith("blob:")
                    }
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C28B38]">
                    {item.category}
                  </p>

                  <h2 className="mt-2 font-serif text-3xl font-semibold text-[#3B2716]">
                    {item.name}
                  </h2>

                  {item.variation && (
                    <p className="mt-1 text-sm font-semibold text-[#2F4530]">
                      {item.variation}
                    </p>
                  )}

                  <p className="mt-2 text-sm font-bold text-[#C28B38]">
                    ₱{item.price.toFixed(2)}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(item.line_key)}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-700 transition hover:text-red-900"
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>

                <div className="flex items-center gap-3 md:flex-col md:items-end md:justify-between">
                  <div className="flex items-center overflow-hidden rounded-full border border-[#E4D6C0] bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.line_key, item.quantity - 1)
                      }
                      className="flex h-10 w-10 items-center justify-center text-[#3B2716] transition hover:bg-[#F7F0E4]"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="min-w-10 text-center text-sm font-bold text-[#3B2716]">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.line_key, item.quantity + 1)
                      }
                      className="flex h-10 w-10 items-center justify-center text-[#3B2716] transition hover:bg-[#F7F0E4]"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <p className="text-lg font-bold text-[#3B2716]">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-5 shadow-[0_18px_45px_rgba(59,39,22,0.08)] sm:p-7 lg:sticky lg:top-28">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F4530] text-white">
              <ShoppingCart size={24} />
            </div>

            <h2 className="text-3xl font-semibold text-[#3B2716]">
              Cart Summary
            </h2>

            <div className="mt-6 space-y-4 border-y border-[#E4D6C0] py-5">
              <div className="flex justify-between text-sm text-[#6F675E]">
                <span>Subtotal</span>
                <span className="font-bold text-[#3B2716]">
                  ₱{subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-[#6F675E]">
                <span>Delivery fee</span>
                <span className="font-bold text-[#3B2716]">Confirmed separately</span>
              </div>
            </div>

            <div className="mt-5 flex justify-between text-lg font-bold text-[#3B2716]">
              <span>Total</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>

            {userId ? (
              <CheckoutForm userId={userId} userEmail={userEmail || ""} initialName={initialName} initialPhone={initialPhone} />
            ) : (
              <div className="mt-6 rounded-2xl border border-[#E4D6C0] bg-white p-5 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#F2E6D4] text-[#2F4530]">
                  <LogIn size={20} />
                </div>
                <h3 className="mt-3 font-serif text-2xl font-semibold text-[#3B2716]">
                  Sign in to checkout
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#6F675E]">
                  Your cart will stay here while you sign in or create an account.
                </p>
                <div className="mt-4 grid gap-2">
                  <Link href="/login?redirect=%2Fcart" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C28B38] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#B47E2F]">
                    <LogIn size={16} /> Sign In
                  </Link>
                  <Link href="/register?redirect=%2Fcart" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D7C6A8] px-4 py-3 text-sm font-bold text-[#3B2716] transition hover:bg-[#F7F0E4]">
                    <UserPlus size={16} /> Create Account
                  </Link>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={clearCart}
              className="mt-3 w-full rounded-xl border border-[#E4D6C0] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#3B2716] transition hover:bg-[#F7F0E4]"
            >
              Clear Cart
            </button>
          </aside>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#D7C6A8] bg-[#FBF7EF] p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F4530] text-white">
            <ShoppingCart size={28} />
          </div>

          <h2 className="mt-6 text-3xl font-semibold text-[#3B2716]">
            Your cart is empty
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6F675E]">
            Add dishes from the menu to start building your order.
          </p>

          <Link
            href="/menu"
            className="mt-7 inline-flex rounded-xl bg-[#C28B38] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F]"
          >
            Browse Menu
          </Link>
        </div>
      )}
    </div>
  );
}
