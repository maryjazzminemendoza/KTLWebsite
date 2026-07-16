"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle,
  ChefHat,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

type Order = {
  id: number;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  order_type: "pickup" | "dine_in" | "delivery";
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "out_for_delivery"
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

const statusOptions = [
  { label: "Active", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Out for Delivery", value: "out_for_delivery" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Archived", value: "archived" },
];

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatOrderType(value: string) {
  if (value === "dine_in") return "Dine In";
  if (value === "delivery") return "Delivery";
  return "Pickup";
}

export default function OrdersAdminPanel({
  initialOrders,
  orderItems,
}: {
  initialOrders: Order[];
  orderItems: OrderItem[];
}) {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const counts = useMemo(() => {
    return {
      all: orders.filter((order) => order.status !== "completed").length,
      pending: orders.filter((order) => order.status === "pending").length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      preparing: orders.filter((order) => order.status === "preparing").length,
      ready: orders.filter((order) => order.status === "ready").length,
      out_for_delivery: orders.filter((order) => order.status === "out_for_delivery").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
      archived: orders.filter((order) => order.status === "completed").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "archived"
          ? order.status === "completed"
          : statusFilter === "all"
            ? order.status !== "completed"
            : order.status === statusFilter;

      const searchValue = search.toLowerCase();

      const matchesSearch =
        order.customer_name.toLowerCase().includes(searchValue) ||
        order.email.toLowerCase().includes(searchValue) ||
        order.phone.toLowerCase().includes(searchValue) ||
        String(order.id).includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  function getItemsForOrder(orderId: number) {
    return orderItems.filter((item) => item.order_id === orderId);
  }

  async function updateStatus(orderId: number, status: Order["status"]) {
    setNotice("");
    setUpdatingId(orderId);

    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    setUpdatingId(null);

    if (!response.ok) {
      setNotice(result.error || "Unable to update the order.");
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? (result.order as Order) : order
      )
    );

    const updateMessage = status === "completed"
      ? `Order #${orderId} completed and moved to Archived.`
      : `Order #${orderId} updated to ${status.replaceAll("_", " ")}.`;
    setNotice(result.emailSent
      ? `${updateMessage} The customer was emailed.`
      : `${updateMessage} The email was not sent: ${result.emailError}`);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-8">
        {statusOptions.map((status) => {
          const key = status.value as keyof typeof counts;

          return (
            <button
              key={status.value}
              type="button"
              onClick={() => setStatusFilter(status.value)}
              className={`rounded-3xl border p-5 text-left shadow-[0_18px_45px_rgba(59,39,22,0.06)] transition ${
                statusFilter === status.value
                  ? "border-[#C28B38] bg-[#2F4530] text-white"
                  : "border-[#E4D6C0] bg-[#FBF7EF] text-[#3B2716] hover:-translate-y-1"
              }`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-[0.14em] ${
                  statusFilter === status.value
                    ? "text-[#D7A24A]"
                    : "text-[#C28B38]"
                }`}
              >
                {status.label}
              </p>

              <p className="mt-3 text-4xl font-semibold">{counts[key]}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.08)]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-[#3B2716]">
              Customer Orders
            </h2>

            <p className="mt-1 text-sm text-[#6F675E]">
              Completed orders are automatically moved to Archived.
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A8B7A]"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#E4D6C0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#C28B38]"
              placeholder="Search order, name, email, or phone..."
            />
          </div>
        </div>

        {notice && (
          <div className="mb-5 rounded-2xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm text-[#3B2716]">
            {notice}
          </div>
        )}

        <div className="space-y-5">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const items = getItemsForOrder(order.id);

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-[#E4D6C0] bg-white p-5"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-serif text-3xl font-semibold text-[#3B2716]">
                          Order #{order.id}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                            statusStyles[order.status]
                          }`}
                        >
                          {order.status}
                        </span>

                        <span className="rounded-full bg-[#F7F0E4] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#6F675E]">
                          {formatOrderType(order.order_type)}
                        </span>
                      </div>

                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A8B7A]">
                        Placed {formatDateTime(order.created_at)}
                      </p>

                      <div className="mt-5 grid gap-3 text-sm text-[#6F675E] md:grid-cols-3">
                        <p>
                          <span className="font-bold text-[#3B2716]">
                            Customer:
                          </span>{" "}
                          {order.customer_name}
                        </p>

                        <p>
                          <span className="font-bold text-[#3B2716]">
                            Email:
                          </span>{" "}
                          {order.email}
                        </p>

                        <p>
                          <span className="font-bold text-[#3B2716]">
                            Phone:
                          </span>{" "}
                          {order.phone}
                        </p>
                      </div>

                      {order.notes && (
                        <div className="mt-4 rounded-2xl bg-[#F7F0E4] p-4 text-sm leading-6 text-[#6F675E]">
                          <span className="font-bold text-[#3B2716]">
                            Notes:
                          </span>{" "}
                          {order.notes}
                        </div>
                      )}

                      <div className="mt-5 rounded-2xl border border-[#E4D6C0] bg-[#FBF7EF] p-4">
                        <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#C28B38]">
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

                        <div className="mt-4 flex justify-between border-t border-[#E4D6C0] pt-4 text-lg font-bold text-[#3B2716]">
                          <span>Subtotal</span>
                          <span>₱{Number(order.subtotal).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {order.status === "completed" ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 xl:w-52">
                        <Archive size={16} />
                        Archived
                      </div>
                    ) : (
                    <div
                      aria-busy={updatingId === order.id}
                      className={`flex flex-wrap gap-2 xl:w-52 xl:flex-col ${
                        updatingId === order.id
                          ? "pointer-events-none opacity-60"
                          : ""
                      }`}
                    >
                      {order.status !== "confirmed" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, "confirmed")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                        >
                          <CheckCircle size={16} />
                          Confirm
                        </button>
                      )}

                      {order.status !== "preparing" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, "preparing")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                        >
                          <ChefHat size={16} />
                          Preparing
                        </button>
                      )}

                      {order.status !== "ready" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, "ready")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          <PackageCheck size={16} />
                          Ready
                        </button>
                      )}

                      {order.order_type === "delivery" && order.status !== "out_for_delivery" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, "out_for_delivery")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <Truck size={16} />
                          Out for Delivery
                        </button>
                      )}

                      <button
                          type="button"
                          onClick={() => updateStatus(order.id, "completed")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <CheckCircle size={16} />
                          Complete
                        </button>

                      {order.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, "cancelled")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          <XCircle size={16} />
                          Cancel
                        </button>
                      )}
                    </div>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D7C6A8] bg-[#F7F0E4] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F4530] text-white">
                <ShoppingBag size={24} />
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-[#3B2716]">
                No orders found
              </h3>

              <p className="mt-2 text-sm text-[#6F675E]">
                Customer cart orders will appear here after checkout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
