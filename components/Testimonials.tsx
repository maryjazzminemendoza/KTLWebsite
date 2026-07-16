import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import TestimonialReview from "@/components/TestimonialReview";

type Testimonial = {
  id: number;
  customer_name: string;
  review: string;
  rating: number;
  source: string | null;
  is_approved: boolean;
  is_featured: boolean;
  display_order: number;
};

async function getTestimonials() {
  const { data, error } = await supabase
    .from("testimonials")
    .select(
      "id, customer_name, review, rating, source, is_approved, is_featured, display_order"
    )
    .eq("is_approved", true)
    .or("is_featured.eq.true,source.eq.Verified Order")
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error fetching testimonials:", error.message);
    return [];
  }

  return data as Testimonial[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex justify-center gap-1 text-[#C28B38]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={18}
          className={index < rating ? "fill-current" : "opacity-25"}
        />
      ))}
    </div>
  );
}

export default async function Testimonials() {
  const testimonials = await getTestimonials();

  return (
    <section className="relative overflow-hidden bg-[#FBF7EF] py-24">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-48 bg-gradient-to-r from-[#F7F4EF] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-[#F7F4EF] to-transparent" />

      <div className="container-custom relative z-10">
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-[#C28B38]/60" />
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
              What Our Customers Say
            </p>
            <span className="h-px w-16 bg-[#C28B38]/60" />
          </div>

          <h2 className="text-5xl font-semibold leading-tight text-[#3B2716] md:text-6xl">
            Loved by Generations
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6F675E]">
            Stories from families, regular diners, and visitors who keep coming
            back to enjoy fresh food by the lake.
          </p>
        </div>

        {testimonials.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.id}
                className="rounded-2xl border border-[#E4D6C0] bg-[#F7F0E4] p-8 text-center shadow-[0_18px_45px_rgba(59,39,22,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(59,39,22,0.12)]"
              >
                <StarRating rating={testimonial.rating} />

                <TestimonialReview review={testimonial.review} />

                <div className="mt-7">
                  <p className="font-serif text-xl font-semibold text-[#3B2716]">
                    — {testimonial.customer_name}
                  </p>

                  {testimonial.source && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#C28B38]">
                      {testimonial.source}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#E4D6C0] bg-[#F7F0E4] p-8 text-center">
            <h3 className="text-2xl font-semibold text-[#3B2716]">
              No featured reviews yet
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#6F675E]">
              Once reviews are approved and marked as featured, they will appear
              here automatically.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
