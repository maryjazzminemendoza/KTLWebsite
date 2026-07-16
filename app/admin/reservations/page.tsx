import AdminShell from "@/components/admin/AdminShell";
import ReservationsAdminPanel from "@/components/admin/ReservationsAdminPanel";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type Reservation = {
  id: number;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  special_requests: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  ai_request_analysis: {
    summary: string;
    priority: "low" | "medium" | "high";
    categories: string[];
    staff_actions: string[];
    clarification_needed: boolean;
    clarification_question: string | null;
    safety_note: string | null;
  } | null;
  ai_analyzed_at: string | null;
  ai_analysis_model: string | null;
};

async function getReservations() {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  if (error) {
    console.error("Error fetching reservations:", error.message);
    return [];
  }

  return data as Reservation[];
}

export default async function AdminReservationsPage() {
  await requireAdmin();

  const reservations = await getReservations();

  return (
    <AdminShell>
      <section>
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-5xl font-semibold text-[#3B2716]">
            Manage Reservations
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6F675E]">
            View incoming reservation requests, confirm bookings, cancel
            unavailable schedules, and mark completed visits.
          </p>
        </div>

        <ReservationsAdminPanel initialReservations={reservations} />
      </section>
    </AdminShell>
  );
}
