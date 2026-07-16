import AdminShell from "@/components/admin/AdminShell";
import OrdersAdminPanel from "@/components/admin/OrdersAdminPanel";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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

async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error.message);
    return [];
  }

  return data as Order[];
}

async function getOrderItems() {
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching order items:", error.message);
    return [];
  }

  return data as OrderItem[];
}

export default async function AdminOrdersPage() {
  await requireAdmin();

  const [orders, orderItems] = await Promise.all([
    getOrders(),
    getOrderItems(),
  ]);

  return (
    <AdminShell>
      <section>
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-5xl font-semibold text-[#3B2716]">
            Orders
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6F675E]">
            View customer cart orders, check ordered dishes, and update order
            status as the kitchen prepares them.
          </p>
        </div>

        <OrdersAdminPanel initialOrders={orders} orderItems={orderItems} />
      </section>
    </AdminShell>
  );
}
