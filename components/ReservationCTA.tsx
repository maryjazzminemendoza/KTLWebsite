import Link from "next/link";
import { CalendarDays } from "lucide-react";

export default function ReservationCTA() {
  return (
    <section className="relative overflow-hidden bg-[#F7F4EF] px-6 py-20">
      <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[#C28B38]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#566B43]/10 blur-3xl" />

      <div className="container-custom relative z-10">
        <div className="rounded-[2rem] border border-[#E4D6C0] bg-[#FBF7EF] px-8 py-12 shadow-[0_24px_70px_rgba(59,39,22,0.08)] md:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="text-center lg:text-left">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
                Reserve Your Table
              </p>

              <h2 className="text-4xl font-semibold leading-tight text-[#3B2716] md:text-5xl">
                Ready to Experience
                <br className="hidden md:block" />
                Kainan sa Tabing Lawa?
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#6F675E]">
                Create new memories with your loved ones by the lake. Registered
                customers can reserve tables online and manage their bookings
                anytime.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <Link
                href="/reservations"
                className="inline-flex items-center justify-center gap-3 rounded-md bg-[#C28B38] px-8 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_26px_rgba(194,139,56,0.28)] transition hover:bg-[#B47E2F]"
              >
                <CalendarDays size={18} />
                Reserve a Table Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}