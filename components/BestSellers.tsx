import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number | null;
  serving_note: string | null;
  price_options: { label: string; price: number }[];
  image_url: string | null;
  is_best_seller: boolean;
  is_available: boolean;
  display_order: number;
};

async function getBestSellers() {
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      "id, name, description, category, price, serving_note, price_options, image_url, is_best_seller, is_available, display_order"
    )
    .eq("is_best_seller", true)
    .eq("is_available", true)
    .order("display_order", { ascending: true })
    .limit(4);

  if (error) {
    console.error("Error fetching best sellers:", error.message);
    return [];
  }

  return data as MenuItem[];
}

export default async function BestSellers() {
  const dishes = await getBestSellers();

  return (
    <section className="bg-[#FBF7EF] py-24">
      <div className="container-custom">
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-[#C28B38]/60" />
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
              Customer Favorites
            </p>
            <span className="h-px w-16 bg-[#C28B38]/60" />
          </div>

          <h2 className="text-5xl font-semibold leading-tight text-[#3B2716] md:text-6xl">
            Best Sellers
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#6F675E]">
            Well-loved Filipino dishes prepared with fresh ingredients, local
            flavor, and decades of family tradition.
          </p>
        </div>

        {dishes.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {dishes.map((dish) => (
                <article
                  key={dish.id}
                  className="group overflow-hidden rounded-2xl border border-[#E4D6C0] bg-[#F7F0E4] shadow-[0_18px_45px_rgba(59,39,22,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(59,39,22,0.14)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={dish.image_url || "/images/food-placeholder.webp"}
                      alt={dish.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                    <span className="absolute left-4 top-4 rounded-full bg-[#2F4530] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white">
                      Best Seller
                    </span>
                  </div>

                  <div className="p-6 text-center">
                    <h3 className="text-2xl font-semibold text-[#3B2716]">
                      {dish.name}
                    </h3>

                    {dish.description && (
                      <p className="mt-3 text-sm leading-6 text-[#6F675E]">
                        {dish.description}
                      </p>
                    )}

                    {(dish.price !== null || dish.price_options.length > 0) && (
                      <p className="mt-4 text-sm font-bold text-[#C28B38]">
                        {dish.price_options.length > 0
                          ? `From ₱${Math.min(...dish.price_options.map((option) => Number(option.price))).toFixed(2)}`
                          : `₱${Number(dish.price).toFixed(2)}`}
                      </p>
                    )}

                    {dish.serving_note && (
                      <p className="mt-1 text-xs font-semibold text-[#2F4530]">
                        {dish.serving_note}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/menu"
                className="inline-flex items-center gap-3 rounded-md bg-[#2F4530] px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#253727]"
              >
                View Full Menu
                <ArrowRight size={17} />
              </Link>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#E4D6C0] bg-[#F7F0E4] p-8 text-center">
            <h3 className="text-2xl font-semibold text-[#3B2716]">
              No best sellers selected yet
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#6F675E]">
              Once the admin marks menu items as best sellers, they will appear
              here automatically.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
