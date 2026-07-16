"use client";

import Link from "next/link";
import {
  CheckCircle,
  ChefHat,
  Clock,
  PackageCheck,
  ShoppingBag,
  XCircle,
} from "lucide-react";

type Order = {
  id: number;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  order_type: "pickup" | "dine_in";
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  subtotal: number;
  notes: string | null;
  created_at: string;
};

type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  name: string;
  category: string | null;
  price: number;
  quantity: number;
  line_total: number;
};

const statusStyles = {
  pending: {
    label: "Pending",
    icon: Clock,
    badge: "bg-yellow-100 text-yellow-800",
    message: "Your order was submitted and is waiting for confirmation.",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    badge: "bg-green-100 text-green-800",
    message: "The restaurant has confirmed your order.",
  },
  preparing: {
    label: "Preparing",
    icon: ChefHat,
    badge: "bg-orange-100 text-orange-800",
    message: "Your order is being prepared.",
  },
  ready: {
    label: "Ready",
    icon: PackageCheck,
    badge: "bg-blue-100 text-blue-800",
    message: "Your order is ready.",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    badge: "bg-emerald-100 text-emerald-800",
    message: "This order has been completed.",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    badge: "bg-red-100 text-red-800",
    message: "This order was cancelled.",
  },
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatOrderType(value: string) {
  return value === "dine_in" ? "Dine In" : "Pickup";
}

export default function MyOrdersList({
  orders,
  orderItems,
}: {
  orders: Order[];
  orderItems: OrderItem[];
}) {
  function getItemsForOrder(orderId: number) {
    return orderItems.filter((item) => item.order_id === orderId);
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#D7C6A8] bg-[#FBF7EF] p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F4530] text-white">
          <ShoppingBag size={28} />
        </div>

        <h2 className="mt-6 text-3xl font-semibold text-[#3B2716]">
          No orders yet
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6F675E]">
          Once you submit an order from your cart, it will appear here.
        </p>

        <Link
          href="/menu"
          className="mt-7 inline-flex rounded-xl bg-[#C28B38] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F]"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const items = getItemsForOrder(order.id);
        const status = statusStyles[order.status];
        const Icon = status.icon;

        return (
          <article
            key={order.id}
            className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.07)]"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-serif text-4xl font-semibold text-[#3B2716]">
                    Order #{order.id}
                  </h2>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${status.badge}`}
                  >
                    <Icon size={14} />
                    {status.label}
                  </span>

                  <span className="rounded-full bg-[#F7F0E4] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#6F675E]">
                    {formatOrderType(order.order_type)}
                  </span>
                </div>

                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A8B7A]">
                  Ordered {formatDateTime(order.created_at)}
                </p>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6F675E]">
                  {status.message}
                </p>

                {order.notes && (
                  <div className="mt-4 rounded-2xl bg-[#F7F0E4] p-4 text-sm leading-6 text-[#6F675E]">
                    <span className="font-bold text-[#3B2716]">Notes:</span>{" "}
                    {order.notes}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white px-5 py-4 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C28B38]">
                  Subtotal
                </p>

                <p className="mt-1 text-3xl font-semibold text-[#3B2716]">
                  ₱{Number(order.subtotal).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#E4D6C0] bg-white p-5">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-[#C28B38]">
                Ordered Items
              </p>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 border-b border-[#E4D6C0] pb-3 last:border-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-[#3B2716]">
                        {item.quantity}× {item.name}
                      </p>

                      {item.category && (
                        <p className="text-xs uppercase tracking-wide text-[#9A8B7A]">
                          {item.category}
                        </p>
                      )}
                    </div>

                    <p className="font-bold text-[#C28B38]">
                      ₱{Number(item.line_total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}