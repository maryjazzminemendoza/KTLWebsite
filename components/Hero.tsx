import Link from "next/link";
import { CalendarDays, BookOpen } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/hero.webp')",
        }}
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/45" />

      <div className="container-custom relative z-10 flex justify-center pt-24 text-center">
        <div className="max-w-5xl">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-[#C28B38]/70" />
            <p className="text-sm font-medium uppercase tracking-[0.42em] text-[#D7A24A] md:text-lg">
              Since 1967
            </p>
            <span className="h-px w-12 bg-[#C28B38]/70" />
          </div>

          <h1 className="text-5xl font-semibold leading-[0.95] text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)] md:text-7xl lg:text-8xl">
            Where Fresh Catch
            <br />
            Meets Filipino Tradition
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/90 drop-shadow md:text-lg">
            For over 58 years, we’ve been serving families delicious food and
            warm memories by the shores of Laguna Lake.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/reservations"
              className="inline-flex items-center justify-center gap-3 rounded-md bg-[#C28B38] px-8 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_26px_rgba(194,139,56,0.35)] transition hover:bg-[#B47E2F]"
            >
              <CalendarDays size={18} />
              Reserve a Table
            </Link>

            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-3 rounded-md border border-white/45 bg-black/20 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-white hover:text-[#2F4530]"
            >
              <BookOpen size={18} />
              View Our Menu
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-px left-0 w-full">
        <svg
          viewBox="0 0 1440 120"
          className="block h-[71px] w-full md:h-[96px]"
          preserveAspectRatio="none"
        >
          <path
            d="M0,70 C240,125 480,20 720,70 C960,120 1200,35 1440,78 L1440,120 L0,120 Z"
            fill="#F7F4EF"
          />
        </svg>
      </div>
    </section>
  );
}
