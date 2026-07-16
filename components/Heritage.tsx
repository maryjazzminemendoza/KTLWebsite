import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Heritage() {
  return (
    <section className="relative overflow-hidden bg-[#F7F4EF] py-24 md:py-32">
      {/* Soft decorative background */}
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#C28B38]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-[#566B43]/10 blur-3xl" />

      <div className="container-custom relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Left Content */}
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
              Our Heritage
            </p>

            <h2 className="max-w-md text-5xl font-semibold leading-[1.02] text-[#3B2716] md:text-6xl">
              More Than
              <br />a Restaurant
            </h2>

            <p className="mt-7 max-w-md text-base leading-8 text-[#4E4A45]">
              What started as a small coffee shop for fishermen in 1967 has
              grown into a restaurant cherished by generations. We continue
              this tradition with the same passion, recipes, and commitment to
              serve you the best.
            </p>

            <Link
              href="/our-story"
              className="mt-8 inline-flex items-center gap-3 rounded-md bg-[#2F4530] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#253727]"
            >
              Read Our Story
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#C28B38]/10" />

            <div className="relative overflow-hidden rounded-[1.6rem] border border-[#D7C6A8] bg-[#EFE3D1] p-3 shadow-[0_24px_70px_rgba(59,39,22,0.18)]">
              <div className="relative aspect-[16/8.5] overflow-hidden rounded-[1.15rem]">
                <Image
                  src="/images/story.webp"
                  alt="Kainan sa Tabing Lawa heritage restaurant photo"
                  fill
                  className="object-cover sepia-[0.25]"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                <span className="absolute bottom-5 right-6 font-serif text-4xl font-semibold italic text-[#3B2716]/80">
                  1967
                </span>
              </div>
            </div>

            {/* Small floating label */}
            <div className="absolute -bottom-7 left-8 hidden rounded-xl border border-[#D7C6A8] bg-[#F7F4EF] px-6 py-4 shadow-[0_18px_45px_rgba(59,39,22,0.12)] md:block">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C28B38]">
                Since 1967
              </p>
              <p className="mt-1 font-serif text-xl font-semibold text-[#3B2716]">
                A Tanay Lakeside Classic
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
