import Image from "next/image";
import { Fish, HeartHandshake, UsersRound, Waves } from "lucide-react";

const features = [
  {
    icon: Waves,
    label: "Breathtaking Lake Views",
  },
  {
    icon: HeartHandshake,
    label: "Relaxing Ambiance",
  },
  {
    icon: UsersRound,
    label: "Perfect for Families",
  },
  {
    icon: Fish,
    label: "Proudly Local, Always Fresh",
  },
];

export default function LakesideExperience() {
  return (
    <section className="overflow-hidden bg-[#F7F4EF]">
      <div className="grid min-h-[520px] lg:grid-cols-2">
        {/* Left Image */}
        <div className="relative min-h-[360px] lg:min-h-[520px]">
          <Image
            src="/images/restaurant-view1.webp"
            alt="Lakeside dining view at Kainan sa Tabing Lawa"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
        </div>

        {/* Right Content */}
        <div className="relative flex items-center bg-[#203B2A] px-6 py-20 text-white md:px-12 lg:px-20">
          {/* Decorative lines */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-full opacity-[0.08]">
            <div className="absolute right-[-120px] top-16 h-72 w-72 rounded-full border border-white" />
            <div className="absolute right-[-60px] top-36 h-72 w-72 rounded-full border border-white" />
            <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full border border-white" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-[#D7A24A]">
              The Lakeside Experience
            </p>

            <h2 className="text-5xl font-semibold leading-[1.02] text-white md:text-6xl">
              Good Food.
              <br />
              Great View.
              <br />
              Better Together.
            </h2>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/75">
              Dine with your loved ones while enjoying the breeze, the beauty of
              Laguna Lake, and the flavors you’ve always loved.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div key={feature.label} className="text-center sm:text-left">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#D7A24A]/40 text-[#D7A24A] sm:mx-0">
                      <Icon size={22} />
                    </div>

                    <p className="mt-4 text-sm font-medium leading-5 text-white/90">
                      {feature.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
