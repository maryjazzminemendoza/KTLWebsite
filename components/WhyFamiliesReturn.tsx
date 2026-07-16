import { ChefHat, Fish, Store, Waves } from "lucide-react";

const reasons = [
  {
    icon: Fish,
    title: "Fresh Every Morning",
    description:
      "We buy fresh fish daily from local fishermen, continuing the tradition that started by the lake.",
  },
  {
    icon: Store,
    title: "58+ Years of Tradition",
    description:
      "From a humble coffee shop in 1967 to a beloved family restaurant in Tanay.",
  },
  {
    icon: Waves,
    title: "Lakeside Dining",
    description:
      "A relaxing place to enjoy good food, fresh air, and great company beside Laguna Lake.",
  },
  {
    icon: ChefHat,
    title: "Original Recipes",
    description:
      "Classic Filipino flavors prepared with the same warmth families have loved for generations.",
  },
];

export default function WhyFamiliesReturn() {
  return (
    <section className="relative overflow-hidden bg-[#F7F4EF] py-24">
      <div className="pointer-events-none absolute -left-28 top-12 h-72 w-72 rounded-full bg-[#C28B38]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-12 h-72 w-72 rounded-full bg-[#566B43]/10 blur-3xl" />

      <div className="container-custom relative z-10">
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-[#C28B38]/60" />
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
              Why Families Keep Coming Back
            </p>
            <span className="h-px w-16 bg-[#C28B38]/60" />
          </div>

          <h2 className="text-5xl font-semibold leading-tight text-[#3B2716] md:text-6xl">
            A Place Worth Returning To
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6F675E]">
            For generations, families have visited Kainan sa Tabing Lawa for
            fresh food, familiar flavors, and the comforting feeling of coming
            home.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => {
            const Icon = reason.icon;

            return (
              <article
                key={reason.title}
                className="group rounded-2xl border border-[#E4D6C0] bg-[#FBF7EF] p-8 text-center shadow-[0_18px_45px_rgba(59,39,22,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(59,39,22,0.12)]"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#C28B38]/35 bg-[#F2E6D4] text-[#2F4530] transition group-hover:bg-[#2F4530] group-hover:text-white">
                  <Icon size={28} />
                </div>

                <h3 className="mt-6 text-2xl font-semibold text-[#3B2716]">
                  {reason.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#6F675E]">
                  {reason.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
