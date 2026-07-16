import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReservationForm from "@/components/reservations/ReservationForm";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function ReservationsPage() {
  const user = await getCurrentUser();
  const supabase = user ? await createSupabaseServerClient() : null;
  const { data: profile } = user && supabase
    ? await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single()
    : { data: null };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4EF] px-6 py-24 sm:py-28">
        <section className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[1fr_520px]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
              Reserve a Table
            </p>

            <h1 className="mt-4 text-6xl font-semibold leading-[1.02] text-[#3B2716]">
              Plan your visit by the lake.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#6F675E]">
              Submit your reservation request and our team will confirm your
              booking. You can also view the status of your reservation once it
              has been reviewed.
            </p>

            <div className="mt-8 rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6">
              <h2 className="text-2xl font-semibold text-[#3B2716]">
                Reservation Notes
              </h2>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#6F675E]">
                <li>• Reservations are subject to admin confirmation.</li>
                <li>• Please use an active phone number for confirmation.</li>
                <li>• Same-day reservations may depend on table availability.</li>
              </ul>
            </div>
          </div>

          {user ? (
            <ReservationForm
              userId={user.id}
              userEmail={user.email || ""}
              initialName={profile?.full_name || ""}
              initialPhone={profile?.phone || ""}
            />
          ) : (
            <div className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-8 text-center shadow-[0_24px_70px_rgba(59,39,22,0.10)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F2E6D4] text-[#2F4530]">
                <LogIn size={24} />
              </div>
              <h2 className="mt-5 text-3xl font-semibold text-[#3B2716]">
                Ready to reserve?
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#6F675E]">
                Sign in only when you are ready to submit a reservation. You
                can continue browsing the rest of the website without an
                account.
              </p>
              <Link
                href="/login?redirect=%2Freservations"
                className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#C28B38] px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F]"
              >
                Sign in to Reserve
              </Link>
              <p className="mt-5 text-sm text-[#6F675E]">
                New here?{" "}
                <Link
                  href="/register?redirect=%2Freservations"
                  className="font-semibold text-[#2F4530] underline underline-offset-4"
                >
                  Create an account
                </Link>
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
