import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Users, Waves } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const values = [
  {
    icon: Heart,
    title: "Made with care",
    description:
      "We serve familiar Filipino flavors with the warmth and attention of a family meal.",
  },
  {
    icon: Users,
    title: "For every generation",
    description:
      "Our tables are a place for families and friends to slow down, reconnect, and celebrate.",
  },
  {
    icon: Waves,
    title: "Rooted by the lake",
    description:
      "The view, local character, and relaxed rhythm of Tanay remain at the heart of every visit.",
  },
];

export default function OurStoryPage() {
  return (
    <>
      <Navbar />

      <main className="bg-[#F7F4EF]">
        <section className="relative flex min-h-[72vh] items-end overflow-hidden px-6 pb-28 pt-32 text-white">
          <Image
            src="/images/story.webp"
            alt="The lakeside setting of Kainan sa Tabing Lawa"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#142418]/95 via-[#142418]/55 to-black/30" />

          <div className="relative mx-auto w-full max-w-6xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#E4B763]">
              Our Story
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] sm:text-5xl md:text-7xl">
              A lakeside tradition since 1967.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 md:text-lg">
              What began as a small coffee shop for fishermen grew into a
              gathering place cherished by generations of families.
            </p>
          </div>

          <div className="pointer-events-none absolute -bottom-px left-0 w-full">
            <svg
              viewBox="0 0 1440 100"
              className="block h-[71px] w-full md:h-[86px]"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0,60 C240,110 480,10 720,60 C960,105 1200,25 1440,65 L1440,100 L0,100 Z"
                fill="#F7F4EF"
              />
            </svg>
          </div>
        </section>

        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_24px_70px_rgba(59,39,22,0.18)]">
              <Image
                src="/images/lolo-and-lola1.webp"
                alt="Kainan sa Tabing Lawa restaurant by the water"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
                More than a restaurant
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#3B2716] sm:text-5xl">
                Food, family, and memories by the water.
              </h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-[#6F675E]">
                <p>
                  Kainan sa Tabing Lawa traces its humble beginnings to 1967,
                  when it opened as a small coffee shop called D&apos;
                  Fisherman&apos;s Hut. It gave local fishermen a place to sip a
                  hot cup of coffee before and after fishing expeditions on the
                  cool, breezy waters of Laguna Lake.
                </p>
                <p>
                  Founders Mr. Benjamin Catolos Mendoza and Mrs. Lilia San Luis
                  Mendoza soon began buying the fishermen&apos;s fresh morning
                  catch to help them earn a living. The coffee shop grew into a
                  restaurant, serving dalag, hito, kanduli, and pla-pla in
                  simple sinigang and fried dishes for diners who wanted to
                  enjoy fresh fish from the lake.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 md:pb-32">
          <div className="mx-auto grid max-w-6xl gap-10 border-y border-[#DED4C6] py-16 lg:grid-cols-[0.7fr_1.3fr] lg:py-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
                From Tanay to generations of guests
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#3B2716] md:text-5xl">
                The flavors people return for.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-[#6F675E]">
              <p>
                Through the years, Kainan sa Tabing Lawa became known not only
                in Tanay and nearby towns across the province, but as far as
                Metro Manila. Patrons continue to return for original,
                time-honored specialties such as crispy fried dalag and
                sinigang na kanduli, as well as the welcoming lakeside ambiance.
              </p>
              <p>
                The restaurant owes its decades of success to the continued
                patronage of its cherished customers. In gratitude, Kainan sa
                Tabing Lawa remains committed to the same recipes and attentive
                service that have defined it from the beginning.
              </p>
              <p>
                To this day, Kainan sa Tabing Lawa stays true to its mission:
                serving delicious, wholesome food at an affordable price, in a
                warm and friendly manner.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#EFE6D8] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
                What guides us
              </p>
              <h2 className="mt-4 text-4xl font-semibold text-[#3B2716] sm:text-5xl">
                The tradition continues.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {values.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-3xl border border-[#DCCDB6] bg-[#FBF7EF] p-8 text-center shadow-[0_18px_45px_rgba(59,39,22,0.06)]"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2F4530] text-white">
                    <Icon size={23} />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-[#3B2716]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#6F675E]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
            Come visit
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold text-[#3B2716] sm:text-5xl">
            Be part of our next chapter.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#6F675E]">
            Browse our menu freely, then sign in only when you are ready to
            reserve your table.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-xl border border-[#2F4530] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#2F4530] transition hover:bg-[#2F4530] hover:text-white"
            >
              Explore the Menu
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/reservations"
              className="rounded-xl bg-[#C28B38] px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F]"
            >
              Reserve a Table
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
