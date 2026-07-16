import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MyReservationsList from "@/components/reservations/MyReservationsList";
import { requireUser } from "@/lib/auth";
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
};

async function getUserReservations(userId: string) {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("user_id", userId)
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  if (error) {
    console.error("Error fetching user reservations:", error.message);
    return [];
  }

  return data as Reservation[];
}

export default async function MyReservationsPage() {
  const user = await requireUser("/my-reservations");
  const reservations = await getUserReservations(user.id);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4EF] px-6 py-32">
        <section className="mx-auto w-full max-w-6xl">
          <div className="mb-10">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
              My Reservations
            </p>

            <h1 className="mt-4 text-6xl font-semibold leading-[1.02] text-[#3B2716]">
              Your lakeside bookings.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[#6F675E]">
              View your reservation requests and check whether they are pending,
              confirmed, cancelled, or completed.
            </p>
          </div>

          <MyReservationsList initialReservations={reservations} />
        </section>
      </main>

      <Footer />
    </>
  );
}
