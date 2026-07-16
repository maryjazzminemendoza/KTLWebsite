import AdminShell from "@/components/admin/AdminShell";
import CustomersAdminPanel from "@/components/admin/CustomersAdminPanel";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Customer = {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

type Reservation = {
  id: number;
  user_id: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

async function getCustomers() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error.message);
    return [];
  }

  return data as Customer[];
}

async function getReservations() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("id, user_id, status");

  if (error) {
    console.error("Error fetching reservations:", error.message);
    return [];
  }

  return data as Reservation[];
}

export default async function AdminCustomersPage() {
  await requireAdmin();

  const [customers, reservations] = await Promise.all([
    getCustomers(),
    getReservations(),
  ]);

  return (
    <AdminShell>
      <section>
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-5xl font-semibold text-[#3B2716]">
            Customers
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6F675E]">
            View registered customers and check their reservation activity.
          </p>
        </div>

        <CustomersAdminPanel
          initialCustomers={customers}
          reservations={reservations}
        />
      </section>
    </AdminShell>
  );
}
