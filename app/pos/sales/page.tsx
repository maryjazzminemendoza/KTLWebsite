import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import SalesHistory from "@/components/pos/SalesHistory";

export default async function PosSalesPage() {
  const { profile } = await requireStaff();
  const supabase = await createSupabaseServerClient();
  const since = new Date(); since.setDate(since.getDate() - 30);
  const { data } = await supabase.from("orders")
    .select("id, receipt_number, order_type, payment_method, payment_status, subtotal, discount_amount, total, status, created_at, voided_at, void_reason, profiles!orders_created_by_fkey(full_name), order_items(name, quantity, line_total)")
    .eq("order_source", "pos").gte("created_at", since.toISOString()).order("created_at", { ascending: false });
  return <SalesHistory cashierName={profile.full_name || "Staff"} isAdmin={profile.role === "admin"} initialSales={(data || []) as never[]}/>;
}
