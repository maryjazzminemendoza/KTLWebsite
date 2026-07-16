import Link from "next/link";
import { CalendarDays } from "lucide-react";

export default function ReservationCTA() {
  return (
    <section className="relative overflow-hidden bg-[#F7F4EF] py-14 sm:py-20">
      <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[#C28B38]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#566B43]/10 blur-3xl" />

      <div className="container-custom relative z-10">
        <div className="rounded-[1.5rem] border border-[#E4D6C0] bg-[#FBF7EF] px-5 py-9 shadow-[0_24px_70px_rgba(59,39,22,0.08)] sm:rounded-[2rem] sm:px-8 sm:py-12 md:px-14">
          <div className="grid items-center gap-7 sm:gap-8 lg:grid-cols-[1fr_auto]">
            <div className="text-center lg:text-left">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#C28B38] sm:mb-4 sm:text-sm sm:tracking-[0.22em]">
                Reserve Your Table
              </p>

              <h2 className="text-[2.15rem] font-semibold leading-[1.05] text-[#3B2716] sm:text-4xl md:text-5xl">
                <span className="block">Ready to Experience</span>
                <span className="block">Kainan sa Tabing Lawa?</span>
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#6F675E] sm:mt-5 sm:text-base sm:leading-7 lg:mx-0">
                Create new memories with your loved ones by the lake. Registered
                customers can reserve tables online and manage their bookings
                anytime.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <Link
                href="/reservations"
                className="inline-flex min-h-13 w-full items-center justify-center gap-3 rounded-lg bg-[#C28B38] px-5 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_26px_rgba(194,139,56,0.28)] transition hover:bg-[#B47E2F] sm:w-auto sm:px-8"
              >
                <CalendarDays size={18} />
                Reserve a Table
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
