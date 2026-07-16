import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import OrderTestimonialForm from "@/components/orders/OrderTestimonialForm";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  line_total: number;
};

type Order = {
  id: number;
  customer_name: string;
  order_type: "pickup" | "delivery" | "dine_in";
  status: "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
  subtotal: number;
  total: number | null;
  discount_amount: number | null;
  order_source: "website" | "pos";
  receipt_number: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
};

const statusStyles: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};

export default async function MyOrdersPage() {
  const user = await requireUser("/my-orders");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_name, order_type, status, subtotal, total, discount_amount, order_source, receipt_number, payment_method, notes, created_at, order_items(id, name, price, quantity, line_total)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching customer orders:", error.message);
  const orders = (data || []) as Order[];
  const { data: submittedTestimonials } = await supabase
    .from("testimonials")
    .select("order_id")
    .eq("user_id", user.id);
  const reviewedOrderIds = new Set((submittedTestimonials || []).map((item) => item.order_id));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F4EF] px-6 py-32">
        <section className="mx-auto w-full max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">My Orders</p>
          <h1 className="mt-4 text-4xl font-semibold text-[#3B2716] sm:text-6xl">Track your food orders.</h1>
          <p className="mt-5 max-w-2xl leading-7 text-[#6F675E]">View your order details and follow each order from confirmation through completion.</p>

          {orders.length > 0 ? (
            <div className="mt-10 space-y-5">
              {orders.map((order) => (
                <article key={order.id} className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_16px_40px_rgba(59,39,22,0.07)]">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E4D6C0] pb-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold uppercase tracking-wider text-[#C28B38]">Order #{order.id}</p><span className="rounded-full bg-[#EDF1E9] px-2 py-1 text-[10px] font-bold uppercase text-[#2F4530]">{order.order_source === "pos" ? "Restaurant POS" : "Online order"}</span></div>
                      <p className="mt-2 text-sm text-[#6F675E]">{new Date(order.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</p>
                      {order.receipt_number && <p className="mt-1 text-xs text-[#8B8175]">Receipt {order.receipt_number}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#F0E7DA] px-3 py-1 text-xs font-bold capitalize text-[#594D42]">{order.order_type.replace("_", " ")}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[order.status]}`}>{order.status.replaceAll("_", " ")}</span>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 text-sm">
                        <span className="text-[#574F47]">{item.quantity}× {item.name}</span>
                        <span className="font-semibold text-[#3B2716]">₱{Number(item.line_total).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 space-y-2 border-t border-[#E4D6C0] pt-4 text-sm text-[#3B2716]">
                    {Number(order.discount_amount || 0) > 0 && <><div className="flex justify-between"><span>Subtotal</span><span>₱{Number(order.subtotal).toFixed(2)}</span></div><div className="flex justify-between font-semibold text-emerald-700"><span>Loyalty discount</span><span>−₱{Number(order.discount_amount).toFixed(2)}</span></div></>}
                    <div className="flex justify-between text-base font-bold"><span>Total{order.payment_method ? ` · ${order.payment_method.toUpperCase()}` : ""}</span><span>₱{Number(order.total ?? order.subtotal).toFixed(2)}</span></div>
                  </div>
                  {order.status === "completed" && (
                    <OrderTestimonialForm
                      orderId={order.id}
                      userId={user.id}
                      customerName={order.customer_name}
                      alreadySubmitted={reviewedOrderIds.has(order.id)}
                    />
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-[#D7C6A8] bg-[#FBF7EF] p-10 text-center">
              <Package className="mx-auto text-[#2F4530]" size={36} />
              <h2 className="mt-4 text-3xl font-semibold text-[#3B2716]">No orders yet</h2>
              <p className="mt-2 text-sm text-[#6F675E]">Your submitted food orders will appear here.</p>
              <Link href="/menu" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#C28B38] px-6 py-3 text-sm font-bold text-white"><ShoppingBag size={17} /> Browse Menu</Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
