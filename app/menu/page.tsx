import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import MenuChatbot from "@/components/menu/MenuChatbot";

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number | null;
  serving_note: string | null;
  inclusions: string | null;
  price_options: { label: string; price: number }[];
  image_url: string | null;
  is_best_seller: boolean;
  is_available: boolean;
  display_order: number;
};

async function getMenuItems() {
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      "id, name, description, category, price, serving_note, inclusions, price_options, image_url, is_best_seller, is_available, display_order"
    )
    .eq("is_available", true)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching menu items:", error.message);
    return [];
  }

  return data as MenuItem[];
}

function groupMenuItems(items: MenuItem[]) {
  return items.reduce<Record<string, MenuItem[]>>((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }

    groups[item.category].push(item);
    return groups;
  }, {});
}

export default async function MenuPage() {
  const menuItems = await getMenuItems();
  const groupedItems = groupMenuItems(menuItems);
  const categories = Object.keys(groupedItems);

  return (
    <>
      <Navbar />

      <main className="bg-[#F7F4EF]">
        <section className="relative flex min-h-[75svh] items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center md:min-h-[80vh] md:pb-28">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/food-placeholder.webp')",
            }}
          />

          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 max-w-4xl">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.35em] text-[#D7A24A]">
              Our Menu
            </p>

            <h1 className="text-5xl font-semibold leading-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] md:text-7xl">
              Fresh Filipino Favorites
              <br />
              by the Lake
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/90 drop-shadow-md">
              Explore well-loved dishes prepared with fresh ingredients, local
              flavor, and the warmth of Filipino family dining.
            </p>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 w-full">
            <svg
              viewBox="0 0 1440 100"
              className="block h-[70px] w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,60 C240,110 480,10 720,60 C960,105 1200,25 1440,65 L1440,100 L0,100 Z"
                fill="#F7F4EF"
              />
            </svg>
          </div>
        </section>

        <section className="py-20">
          <div className="container-custom">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#2F4530] transition hover:text-[#C28B38]"
            >
              <ArrowLeft size={17} />
              Back to Home
            </Link>

            {categories.length > 0 ? (
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <details
                    key={category}
                    open={index === 0}
                    className="group rounded-2xl border border-[#E4D6C0] bg-[#FBF7EF]/60 p-5 shadow-[0_12px_35px_rgba(59,39,22,0.05)] md:p-7"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
                      <h2 className="text-3xl font-semibold text-[#3B2716] md:text-4xl">
                        {category}
                      </h2>

                      <div className="h-px flex-1 bg-[#DCCBB3]" />
                      <span className="rounded-full bg-[#2F4530] px-3 py-1 text-xs font-bold text-white">
                        {groupedItems[category].length}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCCBB3] text-xl text-[#2F4530] transition group-open:rotate-45">
                        +
                      </span>
                    </summary>

                    <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {groupedItems[category].map((item) => (
                        <article
                          key={item.id}
                          className="group overflow-hidden rounded-2xl border border-[#E4D6C0] bg-[#FBF7EF] shadow-[0_18px_45px_rgba(59,39,22,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(59,39,22,0.12)]"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#EFE3D1]">
                            <Image
                              src={
                                item.image_url || "/images/food-placeholder.webp"
                              }
                              alt={item.name}
                              fill
                              className="object-cover transition duration-700 group-hover:scale-110"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              unoptimized={
                                item.image_url?.startsWith("http") ||
                                item.image_url?.startsWith("blob:")
                              }
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                            {item.is_best_seller && (
                              <span className="absolute left-4 top-4 rounded-full bg-[#C28B38] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white">
                                Best Seller
                              </span>
                            )}
                          </div>

                          <div className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <h3 className="font-serif text-2xl font-semibold leading-tight text-[#3B2716]">
                                {item.name}
                              </h3>

                              {(item.price !== null || item.price_options.length > 0) && (
                                <p className="shrink-0 text-sm font-bold text-[#C28B38]">
                                  {item.price_options.length > 0
                                    ? `From ₱${Math.min(...item.price_options.map((option) => Number(option.price))).toFixed(2)}`
                                    : `₱${Number(item.price).toFixed(2)}`}
                                </p>
                              )}
                            </div>

                            {item.description && (
                              <p className="mt-3 text-sm leading-6 text-[#6F675E]">
                                {item.description}
                              </p>
                            )}

                            {item.serving_note && (
                              <p className="mt-3 inline-flex rounded-full bg-[#E8EFE5] px-3 py-1.5 text-xs font-bold text-[#2F4530]">
                                {item.serving_note}
                              </p>
                            )}

                            {item.inclusions && (
                              <div className="mt-4 rounded-xl border border-[#E4D6C0] bg-white/70 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-[#A46F22]">
                                  Includes
                                </p>
                                <ul className="mt-2 space-y-1 text-sm leading-5 text-[#6F675E]">
                                  {item.inclusions
                                    .split("\n")
                                    .map((inclusion) => inclusion.trim())
                                    .filter(Boolean)
                                    .map((inclusion) => (
                                      <li key={inclusion} className="flex gap-2">
                                        <span className="text-[#C28B38]">•</span>
                                        <span>{inclusion}</span>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}

                            <AddToCartButton
                              item={{
                                id: item.id,
                                name: item.name,
                                category: item.category,
                                price: item.price,
                                price_options: item.price_options,
                                image_url: item.image_url,
                              }}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-xl rounded-2xl border border-[#E4D6C0] bg-[#FBF7EF] p-8 text-center">
                <h2 className="text-3xl font-semibold text-[#3B2716]">
                  No menu items available yet
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6F675E]">
                  Once the admin adds available menu items, they will appear
                  here automatically.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <MenuChatbot />
    </>
  );
}
